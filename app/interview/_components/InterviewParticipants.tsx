'use client';

import { motion } from 'framer-motion';
import { Bot, User, Video, VideoOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ParticipantStatus {
  status: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected' | 'disconnected';
  isMuted?: boolean;
  isVideoOn?: boolean;
}

interface ParticipantCardProps {
  type: 'interviewer' | 'interviewee';
  name: string;
  subtitle: string;
  status: ParticipantStatus;
  avatarContent?: React.ReactNode;
  className?: string;
}

function ParticipantCard({ 
  type, 
  name, 
  subtitle, 
  status,
  avatarContent,
  className 
}: ParticipantCardProps) {
  const isActive = status.status === 'speaking' || status.status === 'thinking' || status.status === 'listening';
  const isInterviewer = type === 'interviewer';
  
  const baseColor = isInterviewer ? 'blue' : 'purple';
  const activeBorderColor = isInterviewer 
    ? 'border-blue-500 dark:border-blue-400' 
    : 'border-purple-500 dark:border-purple-400';
  const inactiveBorderColor = isInterviewer
    ? 'border-blue-200 dark:border-blue-800'
    : 'border-purple-200 dark:border-purple-800';
  
  const activeBackgroundColor = isInterviewer
    ? 'bg-blue-600'
    : 'bg-purple-600';
  
  const getStatusBadge = () => {
    if (status.status === 'speaking') {
      return { text: '🎙️ Speaking', className: `bg-${baseColor}-500 text-white border-${baseColor}-500` };
    }
    if (status.status === 'thinking') {
      return { text: '💭 Thinking', className: 'bg-yellow-500 text-white border-yellow-500' };
    }
    if (status.status === 'listening') {
      return { text: '🎤 Listening', className: `bg-${baseColor}-500 text-white border-${baseColor}-500` };
    }
    if (status.isMuted && status.status === 'connected') {
      return { text: '🔇 Muted', className: 'bg-gray-400 text-white border-gray-400' };
    }
    if (status.status === 'connected') {
      return { text: '✓ Connected', className: '' };
    }
    return { text: 'Disconnected', className: 'bg-gray-400 text-white border-gray-400' };
  };

  const badge = getStatusBadge();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn("relative", className)}
    >
      <Card 
        className={cn(
          "border-2 transition-all duration-300 overflow-hidden",
          isActive ? activeBorderColor + ' shadow-lg shadow-' + baseColor + '-500/20' : inactiveBorderColor
        )}
      >
        <CardContent className="p-0 relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          {/* Video placeholder / Avatar area */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Pulsing rings when active */}
            {isActive && (
              <>
                <motion.div
                  className={`absolute inset-0 bg-${baseColor}-500/10 rounded-lg`}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className={`absolute inset-0 bg-${baseColor}-500/20 rounded-lg`}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.5, 0.1, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
              </>
            )}

            {/* Avatar/Video */}
            <motion.div
              className={cn(
                "relative z-10 w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300",
                activeBackgroundColor,
                isActive && "scale-110"
              )}
              animate={{
                scale: isActive ? [1.1, 1.15, 1.1] : 1
              }}
              transition={{
                duration: 2,
                repeat: isActive ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              {avatarContent || (
                <div className="text-white">
                  {isInterviewer ? (
                    <Bot className="h-8 w-8" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Name and Status Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 pt-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm leading-tight truncate">{name}</h3>
                <p className="text-[10px] text-gray-300 truncate leading-tight mt-0.5">{subtitle}</p>
              </div>
              
              {/* Video indicator */}
              {!isInterviewer && (
                <div className={cn(
                  "flex-shrink-0 p-1 rounded-full",
                  status.isVideoOn ? "bg-green-500" : "bg-gray-600"
                )}>
                  {status.isVideoOn ? (
                    <Video className="h-2.5 w-2.5 text-white" />
                  ) : (
                    <VideoOff className="h-2.5 w-2.5 text-white" />
                  )}
                </div>
              )}
            </div>

            {/* Status Badge */}
            <motion.div
              className="mt-1"
              animate={{
                scale: isActive ? [1, 1.05, 1] : 1
              }}
              transition={{
                duration: 1,
                repeat: isActive ? Infinity : 0
              }}
            >
              <Badge 
                variant="outline" 
                className={cn(
                  "transition-all duration-300 border-white/30 bg-white/10 backdrop-blur-sm text-white text-[10px] px-1.5 py-0 leading-tight h-5",
                  badge.className
                )}
              >
                {badge.text}
              </Badge>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface InterviewParticipantsProps {
  interviewerStatus: ParticipantStatus;
  intervieweeStatus: ParticipantStatus;
  interviewerName?: string;
  intervieweeName?: string;
  interviewerSubtitle?: string;
  intervieweeSubtitle?: string;
  className?: string;
  layout?: 'vertical' | 'horizontal';
}

export function InterviewParticipants({
  interviewerStatus,
  intervieweeStatus,
  interviewerName = 'AI Interviewer',
  intervieweeName = 'You',
  interviewerSubtitle = 'Conducting the interview',
  intervieweeSubtitle = 'Interview candidate',
  className,
  layout = 'vertical'
}: InterviewParticipantsProps) {
  return (
    <div className={cn(
      "flex gap-4",
      layout === 'vertical' ? 'flex-col' : 'flex-row',
      className
    )}>
      <ParticipantCard
        type="interviewer"
        name={interviewerName}
        subtitle={interviewerSubtitle}
        status={interviewerStatus}
      />
      
      <ParticipantCard
        type="interviewee"
        name={intervieweeName}
        subtitle={intervieweeSubtitle}
        status={intervieweeStatus}
      />
    </div>
  );
}
