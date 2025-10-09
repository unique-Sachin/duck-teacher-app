'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { ProctoringVideoPreview } from './ProctoringVideoPreview';
import type { ProctoringEvent, ProctoringMetrics } from '../src/hooks/useMediaPipeProctoring';

interface ProctoringMonitorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  metrics: ProctoringMetrics;
  isActive: boolean;
  onEvent?: (event: ProctoringEvent) => void;
}

export function ProctoringMonitor({
  videoRef,
  metrics,
  isActive,
  onEvent
}: ProctoringMonitorProps) {
  const lastToastRef = useRef<{ [key: string]: number }>({});

  // Show toast for violations (debounced)
  useEffect(() => {
    if (!onEvent) return;

    const handleEvent = (event: ProctoringEvent) => {
      const now = Date.now();
      const lastTime = lastToastRef.current[event.type] || 0;
      
      // Debounce: Don't show same toast type within 5 seconds
      if (now - lastTime < 5000) return;
      
      lastToastRef.current[event.type] = now;

      const severityConfig = {
        LOW: { icon: 'ℹ️' },
        MEDIUM: { icon: '⚠️' },
        HIGH: { icon: '🚨' },
        CRITICAL: { icon: '🛑' }
      };

      const config = severityConfig[event.severity as keyof typeof severityConfig] || severityConfig.MEDIUM;

      toast.warning(`${config.icon} ${event.message}`, {
        description: 'Please maintain your focus on the interview',
        duration: 3000,
      });
    };

    // Store reference to handler
    const eventHandler = handleEvent;
    return () => {
      // Cleanup if needed
    };
  }, [onEvent]);

  return (
    <ProctoringVideoPreview
      videoRef={videoRef}
      metrics={metrics}
      isActive={isActive}
    />
  );
}
