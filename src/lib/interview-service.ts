import { prisma } from './prisma';
import { InterviewAnalysis } from './ai-interviewer';

/**
 * Create a new interview session
 */
export async function createInterview(userId: string, roleId: string) {
  return await prisma.interview.create({
    data: {
      userId,
      roleId,
      status: 'IN_PROGRESS',
    },
  });
}

/**
 * Save a message to the database
 */
export async function saveMessage(
  interviewId: string,
  role: 'USER' | 'AGENT',
  content: string,
  metadata?: {
    isFollowUp?: boolean;
    questionId?: string;
  }
) {
  return await prisma.message.create({
    data: {
      interviewId,
      role,
      content,
      isFollowUp: metadata?.isFollowUp || false,
      questionId: metadata?.questionId,
    },
  });
}

/**
 * Complete an interview and save analysis results
 */
export async function completeInterview(
  interviewId: string,
  analysis: InterviewAnalysis,
  durationMinutes: number,
  questionsAsked: string[]
) {
  return await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      durationMinutes,
      totalQuestions: questionsAsked.length,
      questionsAsked,
      analysisScores: {
        technical: analysis.technical_knowledge,
        communication: analysis.communication,
        problemSolving: analysis.problem_solving,
        experience: analysis.experience,
      },
      strengths: analysis.strengths,
      improvements: analysis.areas_for_improvement,
      insights: analysis.key_insights,
      recommendation: analysis.hiring_recommendation,
      overallScore: analysis.overall_score,
    },
  });
}

/**
 * Get all interviews for a user
 */
export async function getUserInterviews(userId: string) {
  return await prisma.interview.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });
}

/**
 * Get a specific interview with all messages
 */
export async function getInterviewWithMessages(interviewId: string, userId?: string) {
  const where: { id: string; userId?: string } = { id: interviewId };
  if (userId) {
    where.userId = userId;
  }

  return await prisma.interview.findUnique({
    where,
    include: {
      messages: {
        orderBy: { timestamp: 'asc' },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get interview statistics for a user
 */
export async function getUserInterviewStats(userId: string) {
  const totalInterviews = await prisma.interview.count({
    where: { userId },
  });

  const completedInterviews = await prisma.interview.count({
    where: { userId, status: 'COMPLETED' },
  });

  const averageScore = await prisma.interview.aggregate({
    where: { userId, status: 'COMPLETED' },
    _avg: {
      overallScore: true,
    },
  });

  const recentInterviews = await prisma.interview.findMany({
    where: { userId },
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      roleId: true,
      status: true,
      startedAt: true,
      overallScore: true,
    },
  });

  return {
    totalInterviews,
    completedInterviews,
    averageScore: averageScore._avg.overallScore || 0,
    recentInterviews,
  };
}

/**
 * Mark an interview as abandoned
 */
export async function abandonInterview(interviewId: string) {
  return await prisma.interview.update({
    where: { id: interviewId },
    data: {
      status: 'ABANDONED',
    },
  });
}
