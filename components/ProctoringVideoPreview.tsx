'use client';

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ProctoringMetrics } from '../src/hooks/useMediaPipeProctoring';

interface ProctoringVideoPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  metrics: ProctoringMetrics;
  isActive: boolean;
  name?: string;
  subtitle?: string;
}

export function ProctoringVideoPreview({
  videoRef,
  metrics,
  isActive,
  name = 'You',
  subtitle = 'Interviewee'
}: ProctoringVideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Setup video stream
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;

    // Only append if not already a child
    if (video.parentElement !== container) {
      // Remove from old parent if exists
      if (video.parentElement) {
        video.parentElement.removeChild(video);
      }
      
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.transform = 'scaleX(-1)'; // Mirror the video
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      container.appendChild(video);
      
      // Ensure video plays
      video.play().catch(err => console.log('Video play failed:', err));
    }

    return () => {
      // Cleanup handled by hook
    };
  }, [videoRef, isActive]);

  // Note: Canvas overlay (face landmarks) is NOT shown to candidate
  // It's only used internally for detection processing

  const getStatusColor = () => {
    if (!isActive) return 'bg-gray-500';
    if (!metrics.faceDetected) return 'bg-red-500';
    if (metrics.faceCount > 1) return 'bg-orange-500';
    if (metrics.gazeDirection !== 'center') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isActive) return 'Inactive';
    if (!metrics.faceDetected) return 'No face detected';
    if (metrics.faceCount > 1) return `${metrics.faceCount} faces detected`;
    if (metrics.gazeDirection !== 'center') return `Looking ${metrics.gazeDirection}`;
    return 'All good';
  };

  return (
    <Card className="relative overflow-hidden bg-black border-2 border-purple-200 dark:border-purple-800">
      {/* Video Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-gray-900"
      >
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📹</div>
              <div className="text-sm">Camera inactive</div>
            </div>
          </div>
        )}
      </div>

      {/* Status Overlay */}
      {isActive && (
        <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-2">
          {/* Status Badge */}
          <Badge
            className={`${getStatusColor()} text-white border-0`}
            variant="default"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-medium">{getStatusText()}</span>
            </div>
          </Badge>

          {/* Attention Score */}
          <Badge
            className="bg-black/60 text-white border border-white/20"
            variant="outline"
          >
            <span className="text-xs">
              Attention: {metrics.attentionScore}%
            </span>
          </Badge>
        </div>
      )}

      {/* Name and Subtitle Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2.5 pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm leading-tight truncate">{name}</h3>
            <p className="text-[10px] text-gray-300 truncate leading-tight mt-0.5">{subtitle}</p>
          </div>
        </div>

        {/* Monitoring Indicator */}
        {isActive && (
          <div className="mt-1">
            <Badge 
              variant="outline" 
              className="transition-all duration-300 border-white/30 bg-white/10 backdrop-blur-sm text-white text-[10px] px-1.5 py-0 leading-tight h-5"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span>Monitoring Active</span>
              </div>
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
}
