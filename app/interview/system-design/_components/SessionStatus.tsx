"use client";

import { useSessionStore } from "@/src/stores/session";

export function SessionStatus() {
  const { hasEmail, hasAudio, isFormValid } = useSessionStore();
  
  const getStatusColor = () => {
    if (isFormValid()) return "text-green-600";
    if (hasEmail() || hasAudio()) return "text-yellow-600";
    return "text-gray-400";
  };
  
  const getStatusText = () => {
    if (isFormValid()) return "Ready to submit";
    if (hasEmail() && !hasAudio()) return "Need audio";
    if (!hasEmail() && hasAudio()) return "Need email";
    if (hasEmail() || hasAudio()) return "In progress";
    return "Not started";
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        isFormValid() ? 'bg-green-500' : 
        (hasEmail() || hasAudio()) ? 'bg-yellow-500' : 'bg-gray-400'
      }`} />
      <span className={`text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
    </div>
  );
}
