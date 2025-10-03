import { useEffect, useRef, useState } from 'react';
import { createClient, LiveClient } from '@deepgram/sdk';
import { generateInterviewerResponse, analyzeInterviewPerformance, type InterviewContext, type InterviewAnalysis } from '@/src/lib/ai-interviewer';
import { getDeepgramTTSService, disposeTTSService } from '@/src/lib/deepgram-tts';

export type AgentStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface TranscriptMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

interface UseDeepgramVoiceAgentProps {
  roleId: string;
  onTranscriptUpdate?: (message: TranscriptMessage) => void;
  onStatusChange?: (status: AgentStatus) => void;
  onError?: (error: Error) => void;
  onInterviewComplete?: (analysis: InterviewAnalysis) => void;
}

export function useDeepgramVoiceAgent({
  roleId,
  onTranscriptUpdate,
  onStatusChange,
  onError,
  onInterviewComplete
}: UseDeepgramVoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const connectionRef = useRef<LiveClient | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ttsServiceRef = useRef<ReturnType<typeof getDeepgramTTSService> | null>(null);
  
  // Interview context
  const interviewContextRef = useRef<InterviewContext>({
    roleId,
    conversationHistory: [],
    askedQuestionIds: [],
    userResponses: []
  });

  // Track current utterance
  const currentUtteranceRef = useRef<string>('');
  
  // Track whether we should send audio to Deepgram (only when AI is listening)
  const shouldSendAudioRef = useRef<boolean>(false);

  const updateStatus = (status: AgentStatus) => {
    setAgentStatus(status);
    onStatusChange?.(status);
    
    // Only allow audio sending when status is 'listening'
    // This prevents user from interrupting AI while it's thinking or speaking
    shouldSendAudioRef.current = status === 'listening';
    
    if (status === 'listening') {
      console.log('🎤 Microphone ENABLED - You can speak now');
    } else {
      console.log('🔇 Microphone MUTED - AI is', status);
    }
  };

  const addTranscriptMessage = (message: TranscriptMessage) => {
    setTranscript(prev => [...prev, message]);
    onTranscriptUpdate?.(message);
    
    // Add to interview context
    interviewContextRef.current.conversationHistory.push({
      role: message.role,
      content: message.content
    });
  };

  /**
   * Generate and speak AI response
   */
  const generateAndSpeakResponse = async (userMessage?: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      updateStatus('thinking');

      // Generate AI response
      const response = await generateInterviewerResponse(
        interviewContextRef.current,
        userMessage
      );

      // Update context
      if (response.questionId) {
        if (!response.isFollowUp) {
          interviewContextRef.current.askedQuestionIds.push(response.questionId);
        }
        interviewContextRef.current.currentQuestionId = response.questionId;
      }

      // Add to transcript
      const agentMessage: TranscriptMessage = {
        role: 'agent',
        content: response.message,
        timestamp: new Date()
      };
      addTranscriptMessage(agentMessage);

      // Speak the response
      if (ttsServiceRef.current) {
        updateStatus('speaking');
        await ttsServiceRef.current.speak(
          response.message,
          () => updateStatus('speaking'),
          () => updateStatus('listening')
        );
      } else {
        updateStatus('listening');
      }

      // Check if interview should end
      if (!response.shouldContinue) {
        setTimeout(() => {
          handleInterviewEnd();
        }, 2000);
      }

    } catch (error) {
      console.error('Failed to generate AI response:', error);
      onError?.(error as Error);
      updateStatus('listening');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle interview completion and analysis
   */
  const handleInterviewEnd = async () => {
    try {
      updateStatus('thinking');
      
      // Generate final analysis
      const analysis = await analyzeInterviewPerformance(interviewContextRef.current);
      
      onInterviewComplete?.(analysis);
      
      // Stop the connection
      stopConnection();
    } catch (error) {
      console.error('Failed to analyze interview:', error);
      onError?.(error as Error);
      stopConnection();
    }
  };

  const startConnection = async () => {
    try {
      // Get API key from environment
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error('Deepgram API key not found');
      }

      // Initialize TTS service (no API key needed - uses server proxy)
      ttsServiceRef.current = getDeepgramTTSService();

      // Create Deepgram client for STT
      const deepgram = createClient(apiKey);

      // Establish WebSocket connection
      const connection = deepgram.listen.live({
        model: 'nova-3',
        language: 'en-US',
        encoding: 'linear16',
        sample_rate: 24000,
        channels: 1,
        interim_results: true,
        utterance_end_ms: 1500, // 1.5 second pause detection
        vad_events: true
      });

      connectionRef.current = connection;

      // Set up event listeners
      connection.on('open', () => {
        console.log('Deepgram connection opened');
        setIsConnected(true);
        
        // Initialize utterance tracking
        currentUtteranceRef.current = '';
        
        // Initialize audio sending as disabled (AI will speak first)
        shouldSendAudioRef.current = false;
        
        // Start keep-alive mechanism
        keepAliveIntervalRef.current = setInterval(() => {
          if (connection) {
            connection.keepAlive();
          }
        }, 5000);

        // Start interview with greeting and first question
        generateAndSpeakResponse();
      });

      connection.on('close', () => {
        console.log('Deepgram connection closed');
        setIsConnected(false);
        updateStatus('idle');
        
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
      });

      connection.on('error', (error) => {
        console.error('Deepgram error:', error);
        onError?.(error as Error);
        updateStatus('idle');
      });

      // Handle transcription results
      connection.on('Results', (data) => {
        const transcriptText = data.channel?.alternatives?.[0]?.transcript;
        const isFinal = data.is_final;
        
        if (transcriptText && transcriptText.trim()) {
          if (isFinal) {
            // Accumulate all final transcript chunks
            console.log('Final transcript chunk:', transcriptText);
            currentUtteranceRef.current += transcriptText + ' ';
          } else {
            // Log interim results for debugging
            console.log('Interim transcript:', transcriptText);
          }
        }
      });

      // Handle speech events
      connection.on('SpeechStarted', () => {
        console.log('User started speaking');
        updateStatus('listening');
        // Don't reset here - wait for UtteranceEnd
        // This ensures we capture the complete utterance
      });

      connection.on('UtteranceEnd', () => {
        console.log('Utterance ended, captured text:', currentUtteranceRef.current);
        
        const userMessage = currentUtteranceRef.current.trim();
        
        if (userMessage) {
          // Add user message to transcript
          const message: TranscriptMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date()
          };
          addTranscriptMessage(message);
          
          // Store in context
          interviewContextRef.current.userResponses.push(userMessage);
          
          // Reset for next utterance
          currentUtteranceRef.current = '';
          
          // Generate AI response
          generateAndSpeakResponse(userMessage);
        } else {
          console.warn('UtteranceEnd but no text captured');
          currentUtteranceRef.current = '';
        }
      });

      // Get user media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // Send audio data to Deepgram
      processor.onaudioprocess = (e) => {
        // Only send audio when AI is listening (not thinking or speaking)
        // This prevents user from interrupting the AI interviewer
        if (connection && connectionRef.current && shouldSendAudioRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          // Convert Float32Array to Int16Array for Deepgram
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          connection.send(pcmData.buffer);
        }
      };

    } catch (error) {
      console.error('Failed to start connection:', error);
      onError?.(error as Error);
      updateStatus('idle');
    }
  };

  const stopConnection = () => {
    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

    // Close Deepgram connection
    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Dispose TTS service
    if (ttsServiceRef.current) {
      disposeTTSService();
      ttsServiceRef.current = null;
    }

    setIsConnected(false);
    updateStatus('idle');
  };

  const clearTranscript = () => {
    setTranscript([]);
    interviewContextRef.current = {
      roleId,
      conversationHistory: [],
      askedQuestionIds: [],
      userResponses: []
    };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopConnection();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected,
    agentStatus,
    transcript,
    isProcessing,
    startConnection,
    stopConnection,
    clearTranscript
  };
}

export type { InterviewAnalysis };
