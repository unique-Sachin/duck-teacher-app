/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface ProctoringEvent {
  type: string;
  timestamp: Date;
  confidence: number;
  severity: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ProctoringMetrics {
  faceDetected: boolean;
  faceCount: number;
  attentionScore: number;
  gazeDirection: string;
  headPose: { pitch: number; yaw: number; roll: number };
  faceDistance: string;
  lightingQuality: string;
}

export interface ProctoringStats {
  totalViolations: number;
  noFaceDetectedDuration: number;
  multipleFacesCount: number;
  lookingAwayCount: number;
  averageAttentionScore: number;
  sessionDuration: number;
  integrityScore: number;
}

interface UseMediaPipeProctoringProps {
  onEvent?: (event: ProctoringEvent) => void;
  onMetricsUpdate?: (metrics: ProctoringMetrics) => void;
  enableLogging?: boolean;
  detectionInterval?: number;
}

export function useMediaPipeProctoring(props: UseMediaPipeProctoringProps = {}) {
  const { onEvent, onMetricsUpdate, enableLogging = true, detectionInterval = 200 } = props;
  
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [metrics, setMetrics] = useState<ProctoringMetrics>({
    faceDetected: false,
    faceCount: 0,
    attentionScore: 100,
    gazeDirection: 'center',
    headPose: { pitch: 0, yaw: 0, roll: 0 },
    faceDistance: 'optimal',
    lightingQuality: 'good'
  });
  const [stats, setStats] = useState<ProctoringStats>({
    totalViolations: 0,
    noFaceDetectedDuration: 0,
    multipleFacesCount: 0,
    lookingAwayCount: 0,
    averageAttentionScore: 100,
    sessionDuration: 0,
    integrityScore: 100
  });
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastFaceDetectedTimeRef = useRef<number>(Date.now());
  const eventsRef = useRef<ProctoringEvent[]>([]);
  const attentionScoresRef = useRef<number[]>([]);
  const eventDebounceRef = useRef<{ [key: string]: number }>({});

  const log = useCallback((message: string, ...args: any[]) => {
    if (enableLogging) console.log(`[Proctoring] ${message}`, ...args);
  }, [enableLogging]);

  const initializeMediaPipe = async () => {
    try {
      log('Initializing MediaPipe...');
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      const landmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 3
      });
      faceLandmarkerRef.current = landmarker;
      setIsInitialized(true);
      log('✅ MediaPipe initialized successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize';
      setError(errorMsg);
      log('❌ MediaPipe initialization error:', err);
      return false;
    }
  };

  const calculateHeadPose = (matrix: number[]) => {
    const pitch = Math.atan2(matrix[6], matrix[10]) * (180 / Math.PI);
    const yaw = Math.atan2(-matrix[2], Math.sqrt(matrix[6] * matrix[6] + matrix[10] * matrix[10])) * (180 / Math.PI);
    const roll = Math.atan2(matrix[1], matrix[0]) * (180 / Math.PI);
    return { pitch, yaw, roll };
  };

  const determineGazeDirection = (headPose: { pitch: number; yaw: number }): string => {
    const { pitch, yaw } = headPose;
    if (Math.abs(yaw) < 20 && Math.abs(pitch) < 15) return 'center';
    if (yaw > 20) return 'left';
    if (yaw < -20) return 'right';
    if (pitch > 15) return 'down';
    if (pitch < -15) return 'up';
    return 'away';
  };

  const sendEvent = useCallback((event: Omit<ProctoringEvent, 'timestamp'>) => {
    const now = Date.now();
    const lastTime = eventDebounceRef.current[event.type] || 0;
    if (now - lastTime < 3000) return;
    eventDebounceRef.current[event.type] = now;
    const fullEvent: ProctoringEvent = { ...event, timestamp: new Date() };
    eventsRef.current.push(fullEvent);
    onEvent?.(fullEvent);
    if (event.type !== 'face_detected') {
      setStats(prev => ({ ...prev, totalViolations: prev.totalViolations + 1 }));
    }
  }, [onEvent]);

  const runDetection = useCallback(async () => {
    if (!videoRef.current || !faceLandmarkerRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx || video.readyState < 2) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
    const faceCount = results.faceLandmarks?.length || 0;
    
    const newMetrics: ProctoringMetrics = {
      faceDetected: faceCount > 0,
      faceCount,
      attentionScore: 100,
      gazeDirection: 'center',
      headPose: { pitch: 0, yaw: 0, roll: 0 },
      faceDistance: 'optimal',
      lightingQuality: 'good'
    };

    if (faceCount === 0) {
      const timeSince = (Date.now() - lastFaceDetectedTimeRef.current) / 1000;
      if (timeSince > 2) {
        sendEvent({ type: 'no_face', confidence: 1, severity: 'HIGH', message: 'No face detected' });
        newMetrics.attentionScore = Math.max(0, 100 - timeSince * 5);
      }
    } else if (faceCount > 1) {
      sendEvent({ type: 'multiple_faces', confidence: 1, severity: 'HIGH', message: `${faceCount} faces` });
      lastFaceDetectedTimeRef.current = Date.now();
    } else {
      lastFaceDetectedTimeRef.current = Date.now();
      const matrix = results.facialTransformationMatrixes?.[0];
      if (matrix) {
        const matrixData = matrix.data as unknown as number[];
        const headPose = calculateHeadPose(matrixData);
        newMetrics.headPose = headPose;
        const gaze = determineGazeDirection(headPose);
        newMetrics.gazeDirection = gaze;
        if (gaze !== 'center') {
          sendEvent({ type: 'looking_away', confidence: 0.8, severity: 'MEDIUM', message: `Looking ${gaze}` });
        }
      }
      const landmarks = results.faceLandmarks[0];
      ctx.strokeStyle = '#00ff00';
      landmarks.forEach((lm: any) => {
        ctx.beginPath();
        ctx.arc(lm.x * canvas.width, lm.y * canvas.height, 1, 0, 2 * Math.PI);
        ctx.stroke();
      });
    }

    setMetrics(newMetrics);
    onMetricsUpdate?.(newMetrics);
    attentionScoresRef.current.push(newMetrics.attentionScore);
    if (attentionScoresRef.current.length > 100) attentionScoresRef.current.shift();
  }, [sendEvent, onMetricsUpdate]);

  const start = async (): Promise<boolean> => {
    try {
      log('Starting proctoring...');
      
      if (!isInitialized) {
        log('MediaPipe not initialized, initializing now...');
        const success = await initializeMediaPipe();
        if (!success) {
          log('❌ Failed to initialize MediaPipe');
          return false;
        }
      }
      
      log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      log('✅ Camera access granted');
      streamRef.current = mediaStream;
      setStream(mediaStream);
      
      if (!videoRef.current) {
        videoRef.current = document.createElement('video');
      }
      videoRef.current.srcObject = mediaStream;
      videoRef.current.autoplay = true;
      videoRef.current.playsInline = true;
      videoRef.current.muted = true;
      
      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              log('✅ Video playing');
              resolve();
            });
          };
        }
      });
      
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      
      sessionStartTimeRef.current = Date.now();
      lastFaceDetectedTimeRef.current = Date.now();
      
      log('Starting detection loop...');
      detectionIntervalRef.current = setInterval(runDetection, detectionInterval);
      
      setIsActive(true);
      setError(null);
      log('✅ Proctoring started successfully');
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start';
      setError(errorMsg);
      log('❌ Failed to start proctoring:', err);
      return false;
    }
  };

  const stop = () => {
    log('Stopping proctoring...');
    if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsActive(false);
    log('✅ Proctoring stopped');
  };

  const getEvents = () => eventsRef.current;
  const clearEvents = () => {
    eventsRef.current = [];
    setStats(prev => ({ ...prev, totalViolations: 0 }));
  };

  useEffect(() => {
    return () => { 
      if (detectionIntervalRef.current) clearInterval(detectionIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { isActive, isInitialized, metrics, stats, error, stream, videoRef, canvasRef, start, stop, getEvents, clearEvents };
}
