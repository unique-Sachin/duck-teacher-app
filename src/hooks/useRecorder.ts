import { useState, useRef, useCallback, useEffect } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';

interface UseRecorderResult {
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

export function useRecorder(): UseRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [durationMs, setDurationMs] = useState(0);
  const [sizeMB, setSizeMB] = useState(0);
  const [waveformData, setWaveformData] = useState(new Uint8Array(64));
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  // Update duration timer - simplified without status dependency
  const updateDuration = useCallback(() => {
    if (startTimeRef.current > 0) {
      const now = Date.now();
      const elapsed = now - startTimeRef.current - totalPausedTimeRef.current;
      const newDuration = Math.max(0, elapsed);
      setDurationMs(newDuration);
    }
  }, []);

  // Analyze audio for waveform
  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Downsample to 64 bars for visualization
    const bars = 64;
    const samplesPerBar = Math.floor(bufferLength / bars);
    const waveform = new Uint8Array(bars);
    
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < samplesPerBar; j++) {
        sum += dataArray[i * samplesPerBar + j];
      }
      waveform[i] = sum / samplesPerBar;
    }
    
    setWaveformData(waveform);
    
    if (status === 'recording') {
      animationRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, [status]);

  // Start recording
  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Setup Web Audio API for waveform analysis
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          // Estimate size in MB
          const totalSize = chunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
          setSizeMB(Number((totalSize / (1024 * 1024)).toFixed(2)));
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setStatus('stopped');
        
        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            audioContextRef.current.close();
          } catch (_error) {
            console.warn('Failed to close AudioContext:', _error);
          }
        }
        audioContextRef.current = null;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      const now = Date.now();
      startTimeRef.current = now;
      totalPausedTimeRef.current = 0;
      setDurationMs(0); // Reset duration
      setStatus('recording');
      
      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Start duration timer immediately and then every 100ms
      updateDuration();
      intervalRef.current = setInterval(updateDuration, 100);
      
      // Start waveform analysis
      analyzeAudio();
      
    } catch {
      setStatus('idle');
    }
  }, [updateDuration, analyzeAudio]);

  // Pause recording
  const pause = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause();
      pauseStartTimeRef.current = Date.now();
      setStatus('paused');
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [status]);

  // Resume recording
  const resume = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused' && pauseStartTimeRef.current > 0) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current;
      totalPausedTimeRef.current += pauseDuration;
      mediaRecorderRef.current.resume();
      setStatus('recording');
      
      // Restart timers
      intervalRef.current = setInterval(updateDuration, 100);
      analyzeAudio();
    }
  }, [status, updateDuration, analyzeAudio]);

  // Stop recording
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    setStatus('idle');
    setDurationMs(0);
    setSizeMB(0);
    setWaveformData(new Uint8Array(64));
    setAudioBlob(null);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    chunksRef.current = [];
    startTimeRef.current = 0;
    totalPausedTimeRef.current = 0;
    pauseStartTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (_error) {
          console.warn('Failed to close AudioContext on cleanup:', _error);
        }
      }
    };
  }, []);

  return {
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
  };
}
