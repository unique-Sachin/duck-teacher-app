"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Play, Pause, Square, RotateCcw } from "lucide-react";
import { useRecorderContext } from "@/src/context/RecorderContext";

export function RecorderPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    status, 
    durationMs, 
    sizeMB, 
    waveformData, 
    audioBlob,
    start, 
    pause, 
    resume, 
    stop, 
    reset 
  } = useRecorderContext();

  // Format duration as hh:mm:ss
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Draw waveform visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    
    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform bars
    const barWidth = width / waveformData.length;
    const barGap = 1;
    
    for (let i = 0; i < waveformData.length; i++) {
      const barHeight = (waveformData[i] / 255) * height * 0.8;
      const x = i * barWidth;
      const y = height - barHeight;
      
      // Create gradient based on amplitude
      const intensity = waveformData[i] / 255;
      const hue = 120 - (intensity * 60); // Green to yellow to red
      const saturation = 70 + (intensity * 30);
      const lightness = 40 + (intensity * 20);
      
      ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.fillRect(x, y, barWidth - barGap, barHeight);
      
      // Add glow effect for active recording
      if (status === 'recording' && intensity > 0.1) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 4;
        ctx.fillRect(x, y, barWidth - barGap, barHeight);
        ctx.shadowBlur = 0;
      }
    }
    
    // Add recording indicator
    if (status === 'recording') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(width - 20, 20, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Animate pulse effect
      const pulseOpacity = 0.5 + 0.5 * Math.sin(Date.now() / 300);
      ctx.fillStyle = `rgba(239, 68, 68, ${pulseOpacity})`;
      ctx.beginPath();
      ctx.arc(width - 20, 20, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformData, status]);

  // Get status color
  const getStatusColor = () => {
    switch (status) {
      case 'recording': return 'text-red-600';
      case 'paused': return 'text-yellow-600';
      case 'stopped': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'recording': return 'Recording...';
      case 'paused': return 'Paused';
      case 'stopped': return 'Stopped';
      default: return 'Ready to record';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Audio Recorder</h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
        💡 You can control recording from the navbar while using the whiteboard
      </div>

      {/* Waveform Visualization */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={80}
          className="w-full h-20 border rounded bg-black"
        />
        {status === 'idle' && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Click record to start
          </div>
        )}
      </div>

      {/* Timer and Size Info */}
      <div className="flex justify-between items-center text-sm">
        <div className="font-mono text-lg">
          {formatDuration(durationMs)}
        </div>
        <div className="text-muted-foreground">
          {sizeMB > 0 && `${sizeMB} MB`}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <Button
            onClick={start}
            className="flex items-center gap-2"
            variant="default"
          >
            <Mic className="w-4 h-4" />
            Start Recording
          </Button>
        )}

        {status === 'recording' && (
          <Button
            onClick={pause}
            className="flex items-center gap-2"
            variant="secondary"
          >
            <Pause className="w-4 h-4" />
            Pause
          </Button>
        )}

        {status === 'paused' && (
          <Button
            onClick={resume}
            className="flex items-center gap-2"
            variant="default"
          >
            <Play className="w-4 h-4" />
            Resume
          </Button>
        )}

        {(status === 'recording' || status === 'paused') && (
          <Button
            onClick={stop}
            className="flex items-center gap-2"
            variant="destructive"
          >
            <Square className="w-4 h-4" />
            Stop
          </Button>
        )}

        {(status === 'stopped' || durationMs > 0) && (
          <Button
            onClick={reset}
            className="flex items-center gap-2"
            variant="outline"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>

      {/* Recording Info */}
      {audioBlob && (
        <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
          Recording complete: {(audioBlob.size / (1024 * 1024)).toFixed(2)} MB audio file ready
        </div>
      )}
    </div>
  );
}
