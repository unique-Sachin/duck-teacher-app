/**
 * Type definitions for the Proctoring System
 */

export interface ProctoringAnalysisRequest {
  image: string; // Base64 encoded image
  timestamp: string; // ISO 8601 timestamp
  sessionId?: string; // Optional interview/session ID
  userId?: string; // Optional user ID
}

export interface ProctoringDetections {
  multipleFaces: boolean;
  noFace: boolean;
  phoneDetected: boolean;
  lookingAway: boolean;
  unauthorizedPerson?: boolean;
  screenSharing?: boolean;
  audioAnomaly?: boolean;
  tabSwitch?: boolean;
  suspiciousMovement?: boolean;
}

export interface ProctoringAnalysisResponse {
  suspicious: boolean;
  reason: string | null;
  detections: ProctoringDetections;
  confidence: number; // 0-1
  timestamp: string;
  message?: string;
  details?: string[];
}

export interface ProctoringLog {
  id: string;
  interviewId: string;
  userId: string;
  timestamp: Date;
  suspicious: boolean;
  detections: ProctoringDetections;
  confidence: number;
  reason: string | null;
  imageUrl?: string;
  resolved: boolean;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraDevice {
  deviceId: string;
  kind: string;
  label: string;
  groupId: string;
}

export interface CameraConstraints {
  width: number | { ideal?: number; min?: number; max?: number };
  height: number | { ideal?: number; min?: number; max?: number };
  frameRate?: number | { ideal?: number; min?: number; max?: number };
  facingMode?: 'user' | 'environment';
}

export interface ProctoringConfig {
  captureInterval: number; // milliseconds
  imageQuality: number; // 0-1
  maxWidth: number;
  maxHeight: number;
  enableAudio: boolean;
  enableScreenCapture: boolean;
  autoStart: boolean;
  alertOnSuspicious: boolean;
  storeImages: boolean;
}

export interface ProctoringSession {
  id: string;
  interviewId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'terminated';
  totalFrames: number;
  suspiciousFrames: number;
  violations: ProctoringViolation[];
  config: ProctoringConfig;
}

export interface ProctoringViolation {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: keyof ProctoringDetections;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  details: string;
  imageUrl?: string;
  resolved: boolean;
}

export interface ProctoringStats {
  totalSessions: number;
  activeSessions: number;
  totalViolations: number;
  violationsByType: Record<keyof ProctoringDetections, number>;
  averageConfidence: number;
  mostCommonViolation: keyof ProctoringDetections;
}

// Utility types
export type ProctoringStatus = 'idle' | 'starting' | 'active' | 'paused' | 'stopping' | 'error';

export type ViolationType = keyof ProctoringDetections;

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

// Error types
export class ProctoringError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ProctoringError';
  }
}

export class CameraAccessError extends ProctoringError {
  constructor(message: string, details?: unknown) {
    super(message, 'CAMERA_ACCESS_ERROR', details);
    this.name = 'CameraAccessError';
  }
}

export class AnalysisError extends ProctoringError {
  constructor(message: string, details?: unknown) {
    super(message, 'ANALYSIS_ERROR', details);
    this.name = 'AnalysisError';
  }
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ProctoringAnalysisApiResponse = ApiResponse<ProctoringAnalysisResponse>;

// Webhook types (for real-time alerts)
export interface ProctoringWebhook {
  event: 'violation_detected' | 'session_started' | 'session_ended' | 'system_error';
  sessionId: string;
  userId: string;
  timestamp: string;
  data: unknown;
}

// Database schema types (for Prisma integration)
export interface ProctoringSessionCreateInput {
  interviewId: string;
  userId: string;
  config: ProctoringConfig;
}

export interface ProctoringLogCreateInput {
  interviewId: string;
  userId: string;
  suspicious: boolean;
  detections: ProctoringDetections;
  confidence: number;
  reason: string | null;
  imageUrl?: string;
}
