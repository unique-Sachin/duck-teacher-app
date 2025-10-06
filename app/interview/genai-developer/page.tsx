'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDeepgramVoiceAgent, type TranscriptMessage, type InterviewAnalysis } from '@/src/hooks/useDeepgramVoiceAgent';
import { toast } from 'sonner';
import { InterviewAnalysisDialog } from '@/components/InterviewAnalysisDialog';
import { InterviewParticipants } from '../_components/InterviewParticipants';
import { LiveTranscript } from '../_components/LiveTranscript';
import { InterviewNavbar } from '../_components/InterviewNavbar';

export default function GenAIDeveloperInterview() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [interviewAnalysis, setInterviewAnalysis] = useState<InterviewAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const {
    isConnected,
    agentStatus,
    transcript,
    interimTranscript,
    isInterimFinal,
    isProcessing,
    remainingTime,
    isTimeUp,
    startConnection,
    stopConnection,
  } = useDeepgramVoiceAgent({
    roleId: 'genai-developer',
    interviewDuration: 60, // 60 minutes
    onStatusChange: (_status: string) => {
      console.log('Agent status changed:', _status);
    },
    onTranscriptUpdate: (_message: TranscriptMessage) => {
      console.log('New transcript message:', _message);
    },
    onError: (error: Error) => {
      console.error('Voice agent error:', error);
      toast.error('Voice agent error: ' + error.message);
    },
    onInterviewComplete: (analysis: InterviewAnalysis) => {
      console.log('Interview completed with analysis:', analysis);
      setInterviewAnalysis(analysis);
      setShowAnalysis(true);
      toast.success('Interview completed! Check out your analysis.');
    },
    onTimeWarning: (minutes: number) => {
      if (minutes === 5) {
        toast.warning('⏰ 5 minutes remaining in the interview!', {
          duration: 5000
        });
      } else if (minutes === 2) {
        toast.warning('⚠️ Only 2 minutes left!', {
          duration: 5000
        });
      } else if (minutes === 1) {
        toast.error('⚠️ Final minute! Interview will end soon.', {
          duration: 5000
        });
      }
    }
  });

  const handleStartInterview = async () => {
    try {
      await startConnection();
      toast.success('Voice interview started!');
    } catch (error) {
      console.error('Failed to start interview:', error);
      toast.error('Failed to start interview. Please check your microphone permissions.');
    }
  };

  const handleEndInterview = () => {
    stopConnection();
    toast.info('Interview ended');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.info(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    toast.info(isSpeakerOn ? 'Speaker muted' : 'Speaker unmuted');
  };

  const getStatusText = () => {
    switch (agentStatus) {
      case 'listening':
        return 'Listening...';
      case 'thinking':
        return 'Thinking...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Idle';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Interview Navbar */}
      <InterviewNavbar
        title="Gen AI Developer Interview"
        subtitle="Voice-based interview with AI"
        status={agentStatus}
        statusText={getStatusText()}
        showTimer={isConnected}
        remainingTime={remainingTime}
        isTimeUp={isTimeUp}
        onHomeClick={() => router.push('/')}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6 flex gap-6">
        {/* Left Side: Participant Cards & Controls */}
        <div className="w-80 flex flex-col gap-3 overflow-y-auto">
          {/* Participant Cards */}
          <InterviewParticipants
            interviewerStatus={{
              status: agentStatus,
              isMuted: false,
              isVideoOn: false
            }}
            intervieweeStatus={{
              status: isConnected ? (isMuted ? 'connected' : agentStatus === 'listening' ? 'listening' : 'connected') : 'disconnected',
              isMuted: isMuted,
              isVideoOn: false
            }}
            layout="vertical"
          />

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {!isConnected ? (
                  <Button
                    onClick={handleStartInterview}
                    size="lg"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Start Interview
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndInterview}
                    size="lg"
                    variant="destructive"
                    className="w-full"
                  >
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Interview
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "secondary"}
                    className="flex-1"
                    disabled={!isConnected}
                  >
                    {isMuted ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                    {isMuted ? 'Unmute' : 'Mute'}
                  </Button>

                  <Button
                    onClick={toggleSpeaker}
                    variant={!isSpeakerOn ? "destructive" : "secondary"}
                    className="flex-1"
                    disabled={!isConnected}
                  >
                    {isSpeakerOn ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                    {isSpeakerOn ? 'Speaker' : 'Unmuted'}
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground py-2 border-t">
                  {!isConnected ? (
                    <p>Click &quot;Start Interview&quot; to begin</p>
                  ) : (
                    <p>Interview in progress</p>
                  )}
                </div>
                
                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse py-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Live Transcript */}
        <div className="flex-1">
          <LiveTranscript
            messages={transcript}
            interimTranscript={interimTranscript ? {
              content: interimTranscript,
              isFinal: isInterimFinal
            } : null}
            agentStatus={agentStatus}
            title="Live Transcript"
            emptyMessage="Transcript will appear here once the interview starts..."
            showMessageCount={true}
            agentColor="blue"
            userColor="purple"
            autoScroll={true}
          />
        </div>
      </div>
      
      {/* Interview Analysis Dialog */}
      <InterviewAnalysisDialog 
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
        analysis={interviewAnalysis}
      />
    </div>
  );
}
