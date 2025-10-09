'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeepgramVoiceAgent, type TranscriptMessage, type InterviewAnalysis } from '@/src/hooks/useDeepgramVoiceAgent';
import { toast } from 'sonner';
import { InterviewAnalysisDialog } from '@/components/InterviewAnalysisDialog';
import { LiveTranscript } from '../_components/LiveTranscript';
import { InterviewNavbar } from '../_components/InterviewNavbar';
import { ProctoringVideoPreview } from '@/components/ProctoringVideoPreview';

export default function GenAIDeveloperInterview() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [interviewAnalysis, setInterviewAnalysis] = useState<InterviewAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  
  const {
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
    proctoring
  } = useDeepgramVoiceAgent({
    roleId: 'genai-developer',
    interviewDuration: 60, // 60 minutes
    enableProctoring: true, // Enable video proctoring
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
    setShowEndConfirmation(true);
  };

  const confirmEndInterview = () => {
    const currentId = interviewId;
    stopConnection();
    setShowEndConfirmation(false);
    toast.info('Interview ended');
    
    // Redirect to interview detail page after a short delay
    if (currentId) {
      setTimeout(() => {
        router.push(`/interview/${currentId}`);
      }, 1000);
    }
  };

  const cancelEndInterview = () => {
    setShowEndConfirmation(false);
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
          {/* AI Interviewer Card */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardContent className="p-0 relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative z-10 w-16 h-16 rounded-xl flex items-center justify-center bg-blue-600">
                  <Bot className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 pt-6">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm leading-tight">AI Interviewer</h3>
                  <p className="text-[10px] text-gray-300 leading-tight mt-0.5">Conducting the interview</p>
                </div>
                <div className="mt-1">
                  <Badge variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm text-white text-[10px] px-1.5 py-0 leading-tight h-5">
                    {agentStatus === 'listening' && '🎤 Listening'}
                    {agentStatus === 'thinking' && '💭 Thinking'}
                    {agentStatus === 'speaking' && '🎙️ Speaking'}
                    {agentStatus === 'idle' && 'Idle'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Candidate's Proctoring Video Preview */}
          {proctoring && (
            <ProctoringVideoPreview
              videoRef={proctoring.videoRef}
              metrics={proctoring.metrics}
              isActive={proctoring.isActive}
              name="You"
              subtitle="Interviewee"
            />
          )}

           {/* Control Buttons */}
          <Card className="p-3">
            <CardContent className="p-0 space-y-2">
              {!isConnected ? (
                <Button
                  onClick={handleStartInterview}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Start Interview
                </Button>
              ) : (
                <Button
                  onClick={handleEndInterview}
                  variant="destructive"
                  className="w-full"
                  size="sm"
                >
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Interview
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={toggleMute}
                  variant={isMuted ? 'destructive' : 'outline'}
                  className="flex-1"
                  disabled={!isConnected}
                  size="sm"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={toggleSpeaker}
                  variant={!isSpeakerOn ? 'destructive' : 'outline'}
                  className="flex-1"
                  disabled={!isConnected}
                  size="sm"
                >
                  {isSpeakerOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
              </div>
              {/* Processing Indicator */}
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse py-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Interview Info */}
          <Card className="p-3">
            <CardContent className="p-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-semibold">60 minutes</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Focus:</span>
                  <span className="font-semibold">Gen AI</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Messages:</span>
                  <span className="font-semibold">{transcript.length}</span>
                </div>
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

      {/* End Interview Confirmation Dialog */}
      <Dialog open={showEndConfirmation} onOpenChange={setShowEndConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Interview?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this interview? Your progress will be saved and you&apos;ll be able to view the full details.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelEndInterview}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmEndInterview}>
              End Interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
