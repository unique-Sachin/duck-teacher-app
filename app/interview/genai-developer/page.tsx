'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Bot, User, Home, Phone, PhoneOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDeepgramVoiceAgent, type TranscriptMessage, type InterviewAnalysis } from '@/src/hooks/useDeepgramVoiceAgent';
import { toast } from 'sonner';
import { InterviewAnalysisDialog } from '@/components/InterviewAnalysisDialog';

export default function GenAIDeveloperInterview() {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [interviewAnalysis, setInterviewAnalysis] = useState<InterviewAnalysis | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  const {
    isConnected,
    agentStatus,
    transcript,
    isProcessing,
    startConnection,
    stopConnection,
  } = useDeepgramVoiceAgent({
    roleId: 'genai-developer',
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
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [transcript]);

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
          
          <Badge className={`${getStatusBadgeColor()} text-white`}>
            {getStatusText()}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6 flex gap-6">
        {/* Left Side: Persona Cards & Controls */}
        <div className="w-1/3 flex flex-col gap-4">
          {/* AI Interviewer Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`border-2 transition-all duration-300 ${
              agentStatus === 'speaking' || agentStatus === 'thinking' 
                ? 'border-blue-500 dark:border-blue-400 shadow-lg shadow-blue-500/20' 
                : 'border-blue-200 dark:border-blue-800'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* Avatar with pulsing ring animation */}
                  <div className="relative">
                    {(agentStatus === 'speaking' || agentStatus === 'thinking') && (
                      <>
                        {/* Outer pulsing ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-blue-500/30"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        {/* Inner pulsing ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-blue-500/50"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 0.2, 0.7]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />
                      </>
                    )}
                    <Avatar className="h-16 w-16 relative z-10">
                      <AvatarFallback className={`transition-all duration-300 ${
                        agentStatus === 'speaking' || agentStatus === 'thinking'
                          ? 'bg-blue-600 text-white scale-105'
                          : 'bg-blue-500 text-white'
                      }`}>
                        <Bot className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">AI Interviewer</h3>
                    <p className="text-sm text-muted-foreground">
                      Conducting the interview
                    </p>
                    <motion.div
                      animate={{
                        scale: agentStatus === 'speaking' || agentStatus === 'thinking' ? [1, 1.05, 1] : 1
                      }}
                      transition={{
                        duration: 1,
                        repeat: agentStatus === 'speaking' || agentStatus === 'thinking' ? Infinity : 0
                      }}
                    >
                      <Badge 
                        variant="outline" 
                        className={`mt-2 transition-all duration-300 ${
                          agentStatus === 'speaking' 
                            ? 'bg-blue-500 text-white border-blue-500' 
                            : agentStatus === 'thinking'
                            ? 'bg-yellow-500 text-white border-yellow-500'
                            : ''
                        }`}
                      >
                        {agentStatus === 'speaking' ? '🎙️ Speaking' : agentStatus === 'thinking' ? '💭 Thinking' : 'Ready'}
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* User Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className={`border-2 transition-all duration-300 ${
              agentStatus === 'listening' && isConnected
                ? 'border-purple-500 dark:border-purple-400 shadow-lg shadow-purple-500/20' 
                : 'border-purple-200 dark:border-purple-800'
            }`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {/* Avatar with pulsing ring animation when listening */}
                  <div className="relative">
                    {agentStatus === 'listening' && isConnected && (
                      <>
                        {/* Outer pulsing ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-purple-500/30"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.5, 0, 0.5]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        {/* Inner pulsing ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-purple-500/50"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.7, 0.2, 0.7]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />
                      </>
                    )}
                    <Avatar className="h-16 w-16 relative z-10">
                      <AvatarFallback className={`transition-all duration-300 ${
                        agentStatus === 'listening' && isConnected
                          ? 'bg-purple-600 text-white scale-105'
                          : 'bg-purple-500 text-white'
                      }`}>
                        <User className="h-8 w-8" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">You</h3>
                    <p className="text-sm text-muted-foreground">
                      Interview candidate
                    </p>
                    <motion.div
                      animate={{
                        scale: agentStatus === 'listening' && isConnected ? [1, 1.05, 1] : 1
                      }}
                      transition={{
                        duration: 1,
                        repeat: agentStatus === 'listening' && isConnected ? Infinity : 0
                      }}
                    >
                      <Badge 
                        variant="outline" 
                        className={`mt-2 transition-all duration-300 ${
                          agentStatus === 'listening' && isConnected
                            ? 'bg-purple-500 text-white border-purple-500' 
                            : isMuted
                            ? 'bg-gray-400 text-white border-gray-400'
                            : ''
                        }`}
                      >
                        {isConnected ? (isMuted ? '🔇 Muted' : agentStatus === 'listening' ? '🎤 Listening' : '✓ Connected') : 'Disconnected'}
                      </Badge>
                    </motion.div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex-1 flex flex-col gap-4"
          >
            <Card className="flex-1">
              <CardContent className="pt-6 h-full flex flex-col gap-4">
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
                </div>

                <div className="flex-1 flex items-center justify-center text-center text-sm text-muted-foreground px-4">
                  {!isConnected ? (
                    <p>Click &quot;Start Interview&quot; to begin the voice-based interview session</p>
                  ) : (
                    <p>Interview in progress. Speak naturally and the AI will respond.</p>
                  )}
                </div>
                
                {/* Processing Indicator */}
                {isProcessing && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Side: Live Transcript */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Live Transcript
                <Badge variant="secondary">{transcript.length} messages</Badge>
              </h2>
            </div>
            
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-4">
                {transcript.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <p>Transcript will appear here once the interview starts...</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {transcript.map((message: TranscriptMessage, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-3 ${message.role === 'agent' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`flex gap-3 max-w-[80%] ${message.role === 'agent' ? 'flex-row' : 'flex-row-reverse'}`}>
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className={message.role === 'agent' ? 'bg-blue-500' : 'bg-purple-500'}>
                              {message.role === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className={`flex flex-col gap-1 ${message.role === 'agent' ? 'items-start' : 'items-end'}`}>
                            <div className={`rounded-2xl px-4 py-2 ${
                              message.role === 'agent' 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100' 
                                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <span className="text-xs text-muted-foreground px-2">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </Card>
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
