"use client";

import { Button } from "@/components/ui/button";
import { Mic, Play, Pause, Square, RotateCcw } from "lucide-react";
import { useRecorderContext } from "@/src/context/RecorderContext";
import { useSessionStore } from "@/src/stores/session";

export function NavbarRecorderControls() {
  const { status, durationMs, start, pause, resume, stop, reset } = useRecorderContext();
  const { audioBlob, setAudioBlob } = useSessionStore();

  // Handle reset - clear both recorder and session store
  const handleReset = () => {
    reset(); // Reset the recorder state
    setAudioBlob(null); // Clear from session store
  };

  // Format duration as hh:mm:ss
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get status color for recording indicator
  const getStatusColor = () => {
    switch (status) {
      case 'recording': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      case 'stopped': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Recording Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${status === 'recording' ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-mono min-w-[60px]">
          {formatDuration(durationMs)}
        </span>
      </div>

      {/* Recording Controls */}
      <div className="flex gap-1">
        {(status === 'idle' || status === 'stopped') && (
          <Button
            onClick={start}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            title="Start recording"
          >
            <Mic className="w-3 h-3" />
          </Button>
        )}

        {status === 'recording' && (
          <Button
            onClick={pause}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Pause className="w-3 h-3" />
          </Button>
        )}

        {status === 'paused' && (
          <Button
            onClick={resume}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Play className="w-3 h-3" />
          </Button>
        )}

        {(status === 'recording' || status === 'paused') && (
          <Button
            onClick={stop}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
          >
            <Square className="w-3 h-3" />
          </Button>
        )}

        {(status === 'stopped' || audioBlob) && (
          <Button
            onClick={handleReset}
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            title="Reset recording"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
