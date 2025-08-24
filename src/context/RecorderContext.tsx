"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useRecorder, type RecorderStatus } from '@/src/hooks/useRecorder';
import { useSessionStore } from '@/src/stores/session';

interface RecorderContextType {
  status: RecorderStatus;
  durationMs: number;
  sizeMB: number;
  waveformData: Uint8Array;
  audioBlob: Blob | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

const RecorderContext = createContext<RecorderContextType | undefined>(undefined);

export function RecorderProvider({ children }: { children: React.ReactNode }) {
  const recorder = useRecorder();
  const setAudioBlob = useSessionStore(state => state.setAudioBlob);

  // Sync audioBlob with session store when recording stops
  useEffect(() => {
    if (recorder.audioBlob) {
      setAudioBlob(recorder.audioBlob);
    }
  }, [recorder.audioBlob, setAudioBlob]);

  return (
    <RecorderContext.Provider value={recorder}>
      {children}
    </RecorderContext.Provider>
  );
}

export function useRecorderContext() {
  const context = useContext(RecorderContext);
  if (context === undefined) {
    throw new Error('useRecorderContext must be used within a RecorderProvider');
  }
  return context;
}
