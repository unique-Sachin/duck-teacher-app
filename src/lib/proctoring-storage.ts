/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from './prisma';
import type { ProctoringEvent, ProctoringMetrics } from '../hooks/useMediaPipeProctoring';

/**
 * STORAGE STRATEGY:
 * 
 * 1. ALWAYS STORE (Lightweight):
 *    - ProctoringSession (1 record per interview)
 *    - AttentionSnapshots (1 record per 10 seconds)
 * 
 * 2. CONDITIONALLY STORE (Only violations):
 *    - ProctoringEvent (only when violation detected)
 */

/**
 * Initialize proctoring session - called when interview starts
 */
export async function initializeProctoringSession(interviewId: string) {
  try {
    return await prisma.proctoringSession.create({
      data: {
        interviewId,
        startedAt: new Date(),
        totalViolations: 0,
        noFaceDetectedSeconds: 0,
        multipleFacesCount: 0,
        lookingAwayCount: 0,
        tabSwitchCount: 0,
        averageAttentionScore: 100,
        integrityScore: 100,
        riskLevel: 'VERY_LOW'
      }
    });
  } catch (error) {
    console.error('Failed to initialize proctoring session:', error);
    throw error;
  }
}

/**
 * Store attention snapshot - called every 10 seconds
 */
export async function storeAttentionSnapshot(
  sessionId: string,
  secondsElapsed: number,
  metrics: ProctoringMetrics
) {
  try {
    await prisma.attentionSnapshot.create({
      data: {
        sessionId,
        timestamp: new Date(),
        secondsElapsed,
        faceDetected: metrics.faceDetected,
        faceCount: metrics.faceCount,
        attentionScore: metrics.attentionScore,
        gazeDirection: metrics.gazeDirection,
        headYaw: metrics.headPose.yaw,
        headPitch: metrics.headPose.pitch,
        irisDeviation: 0 // Can be added to metrics if needed
      }
    });
  } catch (error) {
    console.error('Failed to store attention snapshot:', error);
  }
}

/**
 * Event buffer for batching
 */
const eventBuffer: Map<string, Array<ProctoringEvent & { questionIndex?: number }>> = new Map();
const BATCH_SIZE = 5;
const BATCH_TIMEOUT = 10000; // 10 seconds
const flushTimeouts: Map<string, NodeJS.Timeout> = new Map();

/**
 * Store proctoring event - only violations are stored
 */
export async function storeProctoringEvent(
  sessionId: string,
  event: ProctoringEvent,
  currentQuestionIndex?: number
) {
  // Only store violations
  const isViolation = ['looking_away', 'multiple_faces', 'no_face', 'tab_switch'].includes(event.type);
  
  if (!isViolation) {
    return; // Don't store normal events
  }
  
  // Add to buffer
  if (!eventBuffer.has(sessionId)) {
    eventBuffer.set(sessionId, []);
  }
  
  const buffer = eventBuffer.get(sessionId)!;
  buffer.push({ ...event, questionIndex: currentQuestionIndex });
  
  // Flush if buffer is full
  if (buffer.length >= BATCH_SIZE) {
    await flushEventBuffer(sessionId);
  } else {
    // Set timeout to flush (debounced)
    if (flushTimeouts.has(sessionId)) {
      clearTimeout(flushTimeouts.get(sessionId));
    }
    const timeout = setTimeout(() => flushEventBuffer(sessionId), BATCH_TIMEOUT);
    flushTimeouts.set(sessionId, timeout);
  }
}

/**
 * Flush event buffer to database
 */
async function flushEventBuffer(sessionId: string) {
  const buffer = eventBuffer.get(sessionId);
  if (!buffer || buffer.length === 0) return;
  
  // Clear timeout
  if (flushTimeouts.has(sessionId)) {
    clearTimeout(flushTimeouts.get(sessionId));
    flushTimeouts.delete(sessionId);
  }
  
  try {
    // Batch insert events
    await prisma.proctoringEvent.createMany({
      data: buffer.map(event => ({
        sessionId,
        type: event.type,
        timestamp: event.timestamp,
        confidence: event.confidence,
        severity: event.severity as any,
        message: event.message,
        metadata: event.metadata || {},
        questionIndex: event.questionIndex || null
      }))
    });
    
    // Update session statistics
    const violationCounts = buffer.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    await prisma.proctoringSession.update({
      where: { id: sessionId },
      data: {
        totalViolations: { increment: buffer.length },
        lookingAwayCount: { increment: violationCounts['looking_away'] || 0 },
        multipleFacesCount: { increment: violationCounts['multiple_faces'] || 0 },
        noFaceDetectedSeconds: { increment: violationCounts['no_face'] || 0 },
        tabSwitchCount: { increment: violationCounts['tab_switch'] || 0 }
      }
    });
    
    // Clear buffer
    eventBuffer.set(sessionId, []);
  } catch (error) {
    console.error('Failed to flush event buffer:', error);
  }
}

/**
 * Calculate integrity score based on violations
 */
function calculateIntegrityScore(violations: Map<string, number>): number {
  const WEIGHTS = {
    multiple_faces: 100,
    no_face: 80,
    looking_away: 60,
    tab_switch: 70
  };
  
  const THRESHOLDS = {
    multiple_faces: 1,
    no_face: 5,
    looking_away: 3,
    tab_switch: 2
  };
  
  let totalPenalty = 0;
  
  Object.entries(WEIGHTS).forEach(([type, weight]) => {
    const count = violations.get(type) || 0;
    const threshold = THRESHOLDS[type as keyof typeof THRESHOLDS];
    const exceeds = Math.max(0, count - threshold);
    totalPenalty += exceeds * weight;
  });
  
  // Normalize to 0-100 scale
  const maxPossiblePenalty = Object.values(WEIGHTS).reduce((sum, w) => sum + w * 3, 0);
  const score = Math.max(0, 100 - (totalPenalty / maxPossiblePenalty) * 100);
  
  return Math.round(score);
}

/**
 * Determine risk level from integrity score
 */
function determineRiskLevel(integrityScore: number): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (integrityScore >= 90) return 'VERY_LOW';
  if (integrityScore >= 75) return 'LOW';
  if (integrityScore >= 60) return 'MEDIUM';
  if (integrityScore >= 40) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Detect suspicious patterns
 */
function detectSuspiciousPatterns(
  events: Array<{ type: string; timestamp: Date }>,
  questionTimestamps: Date[]
): { isSuspicious: boolean; confidence: number; reason: string } {
  const LOOKAWAY_WINDOW = 10000; // 10 seconds
  
  let suspiciousCount = 0;
  
  questionTimestamps.forEach(qTime => {
    const qTimeMs = qTime.getTime();
    
    const lookAwayBeforeQuestion = events.some(event => {
      if (event.type !== 'looking_away') return false;
      const eventTimeMs = event.timestamp.getTime();
      return eventTimeMs >= (qTimeMs - LOOKAWAY_WINDOW) && eventTimeMs <= qTimeMs;
    });
    
    if (lookAwayBeforeQuestion) suspiciousCount++;
  });
  
  const suspiciousRatio = questionTimestamps.length > 0 
    ? suspiciousCount / questionTimestamps.length 
    : 0;
  
  return {
    isSuspicious: suspiciousRatio > 0.3,
    confidence: suspiciousRatio,
    reason: `User looked away before ${suspiciousCount}/${questionTimestamps.length} questions`
  };
}

/**
 * Finalize proctoring session when interview ends
 */
export async function finalizeProctoringSession(sessionId: string) {
  // Flush any remaining events
  await flushEventBuffer(sessionId);
  
  try {
    // Get all snapshots to calculate average attention
    const snapshots = await prisma.attentionSnapshot.findMany({
      where: { sessionId },
      select: { attentionScore: true }
    });
    
    const avgAttention = snapshots.length > 0
      ? snapshots.reduce((sum, s) => sum + s.attentionScore, 0) / snapshots.length
      : 100;
    
    // Get violation events
    const events = await prisma.proctoringEvent.findMany({
      where: { sessionId },
      select: { type: true, timestamp: true }
    });
    
    // Calculate integrity score
    const violationMap = new Map<string, number>();
    events.forEach(e => {
      violationMap.set(e.type, (violationMap.get(e.type) || 0) + 1);
    });
    
    const finalIntegrityScore = calculateIntegrityScore(violationMap);
    const riskLevel = determineRiskLevel(finalIntegrityScore);
    
    // Get interview data for pattern analysis
    const session = await prisma.proctoringSession.findUnique({
      where: { id: sessionId },
      include: {
        interview: {
          include: { messages: true }
        }
      }
    });
    
    const questionTimestamps = session?.interview.messages
      .filter(m => m.role === 'AGENT')
      .map(m => m.timestamp) || [];
    
    const patternAnalysis = events.length > 0 
      ? detectSuspiciousPatterns(events, questionTimestamps)
      : { isSuspicious: false, confidence: 0, reason: 'No violations detected' };
    
    const sessionDuration = session?.startedAt 
      ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
      : 0;
    
    // Update session with final data
    const updatedSession = await prisma.proctoringSession.update({
      where: { id: sessionId },
      data: {
        endedAt: new Date(),
        totalDurationSeconds: sessionDuration,
        averageAttentionScore: avgAttention,
        integrityScore: finalIntegrityScore,
        riskLevel,
        suspiciousPatterns: patternAnalysis as any
      }
    });
    
    // Update interview status if high risk
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
      await prisma.interview.update({
        where: { id: session?.interviewId },
        data: { status: 'FLAGGED' }
      });
    }
    
    return updatedSession;
  } catch (error) {
    console.error('Failed to finalize proctoring session:', error);
    throw error;
  }
}
