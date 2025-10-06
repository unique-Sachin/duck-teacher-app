"use client";

import { useSessionStore } from "@/src/stores/session";

export function SessionStatus() {
  const { hasAudio } = useSessionStore();
  
  const getStatusColor = () => {
    if (hasAudio()) return "text-green-600";
    return "text-gray-400";
  };
  
  const getStatusText = () => {
    if (hasAudio()) return "Ready to submit";
    return "Record audio to begin";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        hasAudio() ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      <span className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}
