'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import EvalyzeLogo from '@/components/evalyze-logo';

export type InterviewStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected' | 'disconnected' | 'recording' | 'processing';

interface InterviewNavbarProps {
  title: string;
  subtitle?: string;
  status?: InterviewStatus;
  statusText?: string;
  showTimer?: boolean;
  remainingTime?: number;
  isTimeUp?: boolean;
  onHomeClick?: () => void;
  className?: string;
  rightContent?: React.ReactNode;
}

export function InterviewNavbar({
  title,
  subtitle,
  status = 'idle',
  statusText,
  showTimer = false,
  remainingTime = 0,
  isTimeUp = false,
  onHomeClick,
  className,
  rightContent,
}: InterviewNavbarProps) {
  const router = useRouter();

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else {
      router.push('/');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (isTimeUp) return 'text-red-600 dark:text-red-400';
    if (remainingTime <= 60) return 'text-red-600 dark:text-red-400';
    if (remainingTime <= 300) return 'text-orange-600 dark:text-orange-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusBadgeColor = () => {
    const colors: Record<InterviewStatus, string> = {
      idle: 'bg-gray-500',
      listening: 'bg-green-500',
      thinking: 'bg-yellow-500',
      speaking: 'bg-blue-500',
      connected: 'bg-green-500',
      disconnected: 'bg-red-500',
      recording: 'bg-red-500',
      processing: 'bg-yellow-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getDefaultStatusText = () => {
    const texts: Record<InterviewStatus, string> = {
      idle: 'Not Started',
      listening: 'Listening',
      thinking: 'AI Thinking',
      speaking: 'AI Speaking',
      connected: 'Connected',
      disconnected: 'Disconnected',
      recording: 'Recording',
      processing: 'Processing',
    };
    return texts[status] || 'Ready';
  };

  return (
    <header className={cn(
      "border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-2.5",
      className
    )}>
      <div className="flex items-center justify-between">
        {/* Left Side: Logo and Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 h-8 px-2"
          >
            <EvalyzeLogo className="h-6 w-auto" />
          </Button>
          <div className="border-l pl-3 h-8 flex flex-col justify-center">
            <h1 className="text-base font-semibold leading-tight">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Side: Timer, Status, and Custom Content */}
        <div className="flex items-center gap-3">
          {/* Timer Display */}
          {showTimer && remainingTime > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <Clock className={`h-4 w-4 ${getTimerColor()}`} />
              <span className={`text-sm font-mono font-semibold ${getTimerColor()}`}>
                {formatTime(remainingTime)}
              </span>
              {isTimeUp && (
                <Badge variant="destructive" className="ml-1 h-5 text-xs animate-pulse">
                  Time&apos;s Up!
                </Badge>
              )}
            </motion.div>
          )}

          {/* Status Badge */}
          <Badge className={cn(
            getStatusBadgeColor(),
            "text-white text-xs px-2.5 py-0.5 h-6"
          )}>
            {statusText || getDefaultStatusText()}
          </Badge>

          {/* Custom Right Content */}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
