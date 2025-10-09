/**
 * Client-side API wrapper for proctoring operations
 * Calls server-side API routes instead of direct Prisma access
 */

import type { ProctoringEvent, ProctoringMetrics } from '../hooks/useMediaPipeProctoring';

/**
 * Initialize proctoring session via API
 */
export async function initializeProctoringSession(interviewId: string) {
  const response = await fetch('/api/proctoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'initialize',
      interviewId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to initialize proctoring session');
  }

  return await response.json();
}

/**
 * Store attention snapshot via API
 */
export async function storeAttentionSnapshot(
  sessionId: string,
  secondsElapsed: number,
  metrics: ProctoringMetrics
) {
  const response = await fetch('/api/proctoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'storeSnapshot',
      sessionId,
      secondsElapsed,
      metrics
    })
  });

  if (!response.ok) {
    console.error('Failed to store attention snapshot');
  }
}

/**
 * Store proctoring event via API
 */
export async function storeProctoringEvent(
  sessionId: string,
  event: ProctoringEvent,
  currentQuestionIndex?: number
) {
  const response = await fetch('/api/proctoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'storeEvent',
      sessionId,
      event: {
        type: event.type,
        timestamp: event.timestamp.toISOString(), // Convert Date to string for JSON
        confidence: event.confidence,
        severity: event.severity,
        message: event.message,
        metadata: event.metadata
      },
      questionIndex: currentQuestionIndex
    })
  });

  if (!response.ok) {
    console.error('Failed to store proctoring event');
  }
}

/**
 * Finalize proctoring session via API
 */
export async function finalizeProctoringSession(sessionId: string) {
  const response = await fetch('/api/proctoring', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'finalize',
      sessionId
    })
  });

  if (!response.ok) {
    throw new Error('Failed to finalize proctoring session');
  }

  return await response.json();
}
