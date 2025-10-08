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
  interviewDuration?: number; // Duration in minutes (default: 30)
  onTranscriptUpdate?: (message: TranscriptMessage) => void;
  onStatusChange?: (status: AgentStatus) => void;
  onError?: (error: Error) => void;
  onInterviewComplete?: (analysis: InterviewAnalysis) => void;
  onTimeWarning?: (remainingMinutes: number) => void;
  interviewId?: string; // Optional: existing interview ID to resume
}

export function useDeepgramVoiceAgent({
  roleId,
  interviewDuration = 60, // Default 60 minutes
  onTranscriptUpdate,
  onStatusChange,
  onError,
  onInterviewComplete,
  onTimeWarning,
  interviewId: initialInterviewId
}: UseDeepgramVoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState<string>(''); // Real-time interim text
  const [isInterimFinal, setIsInterimFinal] = useState(false); // Whether interim should show as final
  
  // Timer state
  const [remainingTime, setRemainingTime] = useState(interviewDuration * 60); // in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  
  // Interview ID for database integration - using ref to avoid closure issues
  const interviewIdRef = useRef<string | null>(initialInterviewId || null);
  const [interviewId, setInterviewId] = useState<string | null>(initialInterviewId || null);
  
  // Helper to update interview ID in both ref and state
  const updateInterviewId = (id: string) => {
    interviewIdRef.current = id;
    setInterviewId(id);
  };
  
  const connectionRef = useRef<LiveClient | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ttsServiceRef = useRef<ReturnType<typeof getDeepgramTTSService> | null>(null);
  
  // Interview context
  const interviewContextRef = useRef<InterviewContext>({
    roleId,
    conversationHistory: [],
    askedQuestionIds: [],
    userResponses: [],
    followUpCount: 0,
    remainingTimeSeconds: interviewDuration * 60
  });

  // Track current utterance
  const currentUtteranceRef = useRef<string>('');
  
  // Track whether we should send audio to Deepgram (only when AI is listening)
  const shouldSendAudioRef = useRef<boolean>(false);

  /**
   * Start the interview timer
   */
  const startTimer = () => {
    startTimeRef.current = Date.now();
    
    timerIntervalRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, (interviewDuration * 60) - elapsed);
      
      setRemainingTime(remaining);
      interviewContextRef.current.remainingTimeSeconds = remaining;
      
      // Time warnings
      if (remaining === 300 && onTimeWarning) { // 5 minutes warning
        onTimeWarning(5);
      } else if (remaining === 120 && onTimeWarning) { // 2 minutes warning
        onTimeWarning(2);
      } else if (remaining === 60 && onTimeWarning) { // 1 minute warning
        onTimeWarning(1);
      }
      
      // Time's up!
      if (remaining === 0) {
        setIsTimeUp(true);
        handleTimeUp();
      }
    }, 1000);
  };

  /**
   * Stop the timer
   */
  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    startTimeRef.current = null;
  };

  /**
   * Handle interview time up
   */
  const handleTimeUp = async () => {
    console.log('⏰ Interview time is up!');
    
    // If user is currently speaking, let them finish current utterance
    // The UtteranceEnd event will handle the final response
    if (agentStatus === 'listening' && currentUtteranceRef.current.trim()) {
      // Wait a bit for utterance to complete
      setTimeout(() => {
        if (isConnected) {
          handleInterviewEnd();
        }
      }, 3000);
    } else {
      // End immediately
      handleInterviewEnd();
    }
  };

  const updateStatus = (status: AgentStatus) => {
    setAgentStatus(status);
    onStatusChange?.(status);
    
    // Only allow audio sending when status is 'listening'
    // This prevents user from interrupting AI while it's thinking or speaking
    shouldSendAudioRef.current = status === 'listening';
    
    // Update the AudioWorklet processor
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.port.postMessage({
        type: 'setShouldSend',
        value: status === 'listening'
      });
    }
    
    if (status === 'listening') {
      console.log('🎤 Microphone ENABLED - You can speak now');
    } else {
      console.log('🔇 Microphone MUTED - AI is', status);
    }
  };

  const addTranscriptMessage = async (message: TranscriptMessage) => {
    setTranscript(prev => [...prev, message]);
    onTranscriptUpdate?.(message);
    
    // Add to interview context
    interviewContextRef.current.conversationHistory.push({
      role: message.role,
      content: message.content
    });
    
    // Save message to database if interview ID exists
    const currentInterviewId = interviewIdRef.current;
    console.log('Saving message to database if interviewId exists:', { currentInterviewId });
    if (currentInterviewId) {
      try {
        const response = await fetch(`/api/interviews/${currentInterviewId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: message.role === 'agent' ? 'AGENT' : 'USER',
            content: message.content,
          }),
        });
        if (response.ok) {
          console.log('✅ Message saved successfully');
        } else {
          console.error('❌ Failed to save message:', response.statusText);
        }
      } catch (error) {
        console.error('Failed to save message:', error);
        // Don't throw - we don't want to break the interview flow
      }
    } else {
      console.warn('⚠️ No interview ID available, message not saved to database');
    }
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
      
      // Save interview completion to database if interview ID exists
      const currentInterviewId = interviewIdRef.current;
      if (currentInterviewId) {
        try {
          const elapsedMinutes = Math.ceil((interviewDuration * 60 - remainingTime) / 60);
          await fetch(`/api/interviews/${currentInterviewId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'COMPLETED',
              durationMinutes: elapsedMinutes,
              analysisScores: {
                technical: analysis.technical_knowledge,
                communication: analysis.communication,
                problemSolving: analysis.problem_solving,
                experience: analysis.experience,
              },
              strengths: analysis.strengths,
              improvements: analysis.areas_for_improvement,
              insights: analysis.key_insights,
              recommendation: analysis.hiring_recommendation,
              overallScore: analysis.overall_score,
              questionsAsked: interviewContextRef.current.askedQuestionIds,
            }),
          });
        } catch (error) {
          console.error('Failed to save interview completion:', error);
        }
      }
      
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
      // Create interview in database if not already created
      if (!interviewIdRef.current) {
        try {
          console.log('📝 Creating new interview in database...');
          const response = await fetch('/api/interviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleId }),
          });
          
          if (response.ok) {
            const interview = await response.json();
            console.log('✅ Interview created with ID:', interview.id);
            updateInterviewId(interview.id);
          } else {
            console.error('❌ Failed to create interview:', response.statusText);
          }
        } catch (error) {
          console.error('Failed to create interview in database:', error);
          // Continue anyway - the interview can work without database
        }
      } else {
        console.log('📌 Using existing interview ID:', interviewIdRef.current);
      }
      
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
        utterance_end_ms: 2500, // 2.5 second pause detection
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
        
        // Start the interview timer
        startTimer();
        
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
            // Update interim to show the full accumulated text (keeps it visible with solid border)
            setInterimTranscript(currentUtteranceRef.current.trim());
            setIsInterimFinal(false); // Keep updating until utterance ends
          } else {
            // Show interim results - Deepgram sends the full utterance so far, not incremental
            // Just replace, don't concatenate (it already contains all previous words)
            setInterimTranscript(transcriptText);
            setIsInterimFinal(false);
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
          // Mark interim as final (shows solid border)
          setIsInterimFinal(true);
          
          // After a short delay, move to transcript and clear interim
          setTimeout(() => {
            // Add user message to transcript
            const message: TranscriptMessage = {
              role: 'user',
              content: userMessage,
              timestamp: new Date()
            };
            addTranscriptMessage(message);
            
            // Store in context
            interviewContextRef.current.userResponses.push(userMessage);
            
            // Clear interim display
            setInterimTranscript('');
            setIsInterimFinal(false);
            
            // Reset for next utterance
            currentUtteranceRef.current = '';
            
            // Generate AI response
            generateAndSpeakResponse(userMessage);
          }, 300); // Short delay to show solid border transition
        } else {
          console.warn('UtteranceEnd but no text captured');
          currentUtteranceRef.current = '';
          setInterimTranscript('');
          setIsInterimFinal(false);
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
      
      // Load the AudioWorklet processor
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-stream-processor');
      
      audioWorkletNodeRef.current = workletNode;

      // Handle messages from the AudioWorklet
      workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioData' && connection && connectionRef.current) {
          // Send the audio data to Deepgram
          connection.send(event.data.data);
        }
      };

      // Connect the audio nodes
      source.connect(workletNode);
      workletNode.connect(audioContextRef.current.destination);

      // Initialize shouldSend state
      workletNode.port.postMessage({ 
        type: 'setShouldSend', 
        value: shouldSendAudioRef.current 
      });

    } catch (error) {
      console.error('Failed to start connection:', error);
      onError?.(error as Error);
      updateStatus('idle');
    }
  };

  const stopConnection = () => {
    // Stop timer
    stopTimer();
    
    // Clear interim transcript
    setInterimTranscript('');
    
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

    // Disconnect and cleanup AudioWorklet
    if (audioWorkletNodeRef.current) {
      audioWorkletNodeRef.current.disconnect();
      audioWorkletNodeRef.current = null;
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
    setInterimTranscript('');
    setRemainingTime(interviewDuration * 60);
    setIsTimeUp(false);
    interviewContextRef.current = {
      roleId,
      conversationHistory: [],
      askedQuestionIds: [],
      userResponses: [],
      followUpCount: 0,
      remainingTimeSeconds: interviewDuration * 60
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
    interimTranscript,
    isInterimFinal,
    isProcessing,
    remainingTime,
    isTimeUp,
    interviewId,
    startConnection,
    stopConnection,
    clearTranscript
  };
}

export type { InterviewAnalysis };
