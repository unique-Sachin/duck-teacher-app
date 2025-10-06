'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface TranscriptMessage {
  role: 'agent' | 'user';
  content: string;
  timestamp: Date;
}

export interface InterimTranscript {
  content: string;
  isFinal: boolean;
}

interface LiveTranscriptProps {
  messages: TranscriptMessage[];
  interimTranscript?: InterimTranscript | null;
  agentStatus?: 'idle' | 'listening' | 'thinking' | 'speaking' | 'connected';
  title?: string;
  emptyMessage?: string;
  showMessageCount?: boolean;
  className?: string;
  agentColor?: string;
  userColor?: string;
  autoScroll?: boolean;
}

export function LiveTranscript({
  messages,
  interimTranscript,
  agentStatus = 'idle',
  title = 'Live Transcript',
  emptyMessage = 'Transcript will appear here once the conversation starts...',
  showMessageCount = true,
  className,
  agentColor = 'blue',
  userColor = 'purple',
  autoScroll = true,
}: LiveTranscriptProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, interimTranscript, autoScroll]);

  const getAgentColorClasses = (variant: 'bg' | 'text' | 'avatar') => {
    const colors = {
      blue: {
        bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
        text: 'text-blue-600 dark:text-blue-400',
        avatar: 'bg-blue-500',
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100',
        text: 'text-green-600 dark:text-green-400',
        avatar: 'bg-green-500',
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100',
        text: 'text-orange-600 dark:text-orange-400',
        avatar: 'bg-orange-500',
      },
    };
    return colors[agentColor as keyof typeof colors]?.[variant] || colors.blue[variant];
  };

  const getUserColorClasses = (variant: 'bg' | 'text' | 'avatar') => {
    const colors = {
      purple: {
        bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100',
        text: 'text-purple-600 dark:text-purple-400',
        avatar: 'bg-purple-500',
      },
      pink: {
        bg: 'bg-pink-100 dark:bg-pink-900/30 text-pink-900 dark:text-pink-100',
        text: 'text-pink-600 dark:text-pink-400',
        avatar: 'bg-pink-500',
      },
      indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100',
        text: 'text-indigo-600 dark:text-indigo-400',
        avatar: 'bg-indigo-500',
      },
    };
    return colors[userColor as keyof typeof colors]?.[variant] || colors.purple[variant];
  };

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {title}
          {showMessageCount && (
            <Badge variant="secondary">{messages.length} messages</Badge>
          )}
        </h2>
      </div>
      
      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && !interimTranscript ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>{emptyMessage}</p>
            </div>
          ) : (
            <AnimatePresence>
              {messages.map((message: TranscriptMessage, index: number) => (
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
                      <AvatarFallback className={message.role === 'agent' ? getAgentColorClasses('avatar') : getUserColorClasses('avatar')}>
                        {message.role === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className={`flex flex-col gap-1 ${message.role === 'agent' ? 'items-start' : 'items-end'}`}>
                      <div className={`rounded-2xl px-4 py-2 ${
                        message.role === 'agent' 
                          ? getAgentColorClasses('bg')
                          : getUserColorClasses('bg')
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
              
              {/* Real-time interim transcript */}
              {interimTranscript && agentStatus === 'listening' && (
                <motion.div
                  key="interim"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="flex gap-3 justify-end"
                >
                  <div className="flex gap-3 max-w-[80%] flex-row-reverse">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className={cn(
                        getUserColorClasses('avatar'),
                        interimTranscript.isFinal ? 'opacity-100' : 'opacity-70'
                      )}>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-col gap-1 items-end">
                      <div className={cn(
                        "rounded-2xl px-4 py-2 border-2",
                        getUserColorClasses('bg'),
                        interimTranscript.isFinal 
                          ? `${getUserColorClasses('text')} border-solid` 
                          : 'border-dashed animate-pulse'
                      )}>
                        <p className={cn(
                          "text-sm",
                          !interimTranscript.isFinal && "italic"
                        )}>
                          {interimTranscript.content}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground px-2">
                        {interimTranscript.isFinal ? 'Completed' : 'Speaking...'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
