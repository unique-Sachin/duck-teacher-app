'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Home, Phone, PhoneOff, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDeepgramVoiceAgent, type TranscriptMessage, type InterviewAnalysis } from '@/src/hooks/useDeepgramVoiceAgent';
import { toast } from 'sonner';
import { InterviewAnalysisDialog } from '@/components/InterviewAnalysisDialog';
import { InterviewParticipants } from '../_components/InterviewParticipants';
import { LiveTranscript } from '../_components/LiveTranscript';

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

  const getStatusBadgeColor = () => {
    switch (agentStatus) {
      case 'listening':
        return 'bg-green-500';
      case 'thinking':
        return 'bg-yellow-500';
      case 'speaking':
        return 'bg-blue-500';
      default:
        return 'bg-gray-400';
    }
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

  // Format remaining time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get timer color based on remaining time
  const getTimerColor = () => {
    const minutes = Math.floor(remainingTime / 60);
    if (minutes < 2) return 'text-red-600 dark:text-red-400';
    if (minutes < 5) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/')}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Gen AI Developer Interview</h1>
              <p className="text-sm text-muted-foreground">Voice-based interview with AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Timer Display */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <Clock className={`h-5 w-5 ${getTimerColor()}`} />
                <span className={`text-lg font-mono font-bold ${getTimerColor()}`}>
                  {formatTime(remainingTime)}
                </span>
                {isTimeUp && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    Time&apos;s Up!
                  </Badge>
                )}
              </motion.div>
            )}
            
            <Badge className={`${getStatusBadgeColor()} text-white`}>
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </header>

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
