import { prisma } from './prisma';
import { QuestionDifficulty } from '@prisma/client';

export interface QuestionWithFollowUps {
  id: string;
  question: string;
  answer: string | null;
  category: string;
  difficulty: QuestionDifficulty;
  expectedTopics: string[];
  timeEstimate: number | null;
  followUps: {
    id: string;
    followUp: string;
    answer: string | null;
    order: number;
  }[];
}

export interface RoleWithQuestions {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  topics: string[];
  questions: QuestionWithFollowUps[];
}

/**
 * Get all active questions for a specific role with follow-ups
 */
export async function getQuestionsForRole(roleId: string): Promise<QuestionWithFollowUps[]> {
  const questions = await prisma.interviewQuestion.findMany({
    where: {
      roleId,
      isActive: true,
    },
    include: {
      followUps: {
        orderBy: { order: 'asc' },
      },
    },
    orderBy: { order: 'asc' },
  });

  return questions;
}

/**
 * Get a random question from the question bank (excluding already asked questions)
 */
export async function getRandomQuestion(
  roleId: string,
  excludeIds: string[] = []
): Promise<QuestionWithFollowUps | null> {
  const questions = await prisma.interviewQuestion.findMany({
    where: {
      roleId,
      isActive: true,
      id: { notIn: excludeIds },
    },
    include: {
      followUps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (questions.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

/**
 * Get a specific question by ID
 */
export async function getQuestionById(questionId: string): Promise<QuestionWithFollowUps | null> {
  const question = await prisma.interviewQuestion.findUnique({
    where: { id: questionId },
    include: {
      followUps: {
        orderBy: { order: 'asc' },
      },
    },
  });

  return question;
}

/**
 * Get role information with all questions
 */
export async function getRoleWithQuestions(roleId: string): Promise<RoleWithQuestions | null> {
  const role = await prisma.interviewRole.findUnique({
    where: { id: roleId, isActive: true },
    include: {
      questions: {
        where: { isActive: true },
        include: {
          followUps: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  return role;
}

/**
 * Get all active interview roles
 */
export async function getAllRoles() {
  return await prisma.interviewRole.findMany({
    where: { isActive: true },
    orderBy: { title: 'asc' },
  });
}

/**
 * Get interview greeting for a role
 */
export async function getInterviewGreeting(roleId: string): Promise<string> {
  const role = await prisma.interviewRole.findUnique({
    where: { id: roleId },
  });

  if (!role) {
    return "Hello! I'm your AI interviewer. Let's begin the interview. Are you ready to start?";
  }

  // Default greeting template
  return `Hello! I'm your AI interviewer for the ${role.title} position. Are you ready to start?`;
}

/**
 * Get a random follow-up for a specific question
 */
export async function getRandomFollowUp(questionId: string): Promise<string | null> {
  const followUps = await prisma.questionFollowUp.findMany({
    where: { questionId },
  });

  if (followUps.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * followUps.length);
  return followUps[randomIndex].followUp;
}

// ============================================
// ADMIN FUNCTIONS (for future admin dashboard)
// ============================================

/**
 * Create a new interview role
 */
export async function createRole(data: {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  topics: string[];
}) {
  return await prisma.interviewRole.create({
    data,
  });
}

/**
 * Update an interview role
 */
export async function updateRole(
  roleId: string,
  data: Partial<{
    title: string;
    description: string;
    duration: string;
    difficulty: string;
    topics: string[];
    isActive: boolean;
  }>
) {
  return await prisma.interviewRole.update({
    where: { id: roleId },
    data,
  });
}

/**
 * Create a new question
 */
export async function createQuestion(data: {
  roleId: string;
  question: string;
  answer?: string;
  category: string;
  difficulty: QuestionDifficulty;
  expectedTopics: string[];
  timeEstimate?: number;
  order?: number;
}) {
  return await prisma.interviewQuestion.create({
    data,
  });
}

/**
 * Update a question
 */
export async function updateQuestion(
  questionId: string,
  data: Partial<{
    question: string;
    answer: string;
    category: string;
    difficulty: QuestionDifficulty;
    expectedTopics: string[];
    timeEstimate: number;
    order: number;
    isActive: boolean;
  }>
) {
  return await prisma.interviewQuestion.update({
    where: { id: questionId },
    data,
  });
}

/**
 * Delete a question (soft delete by setting isActive to false)
 */
export async function deleteQuestion(questionId: string) {
  return await prisma.interviewQuestion.update({
    where: { id: questionId },
    data: { isActive: false },
  });
}

/**
 * Create a follow-up question
 */
export async function createFollowUp(data: {
  questionId: string;
  followUp: string;
  answer?: string;
  order?: number;
}) {
  return await prisma.questionFollowUp.create({
    data,
  });
}

/**
 * Update a follow-up question
 */
export async function updateFollowUp(
  followUpId: string,
  data: Partial<{
    followUp: string;
    answer: string;
    order: number;
  }>
) {
  return await prisma.questionFollowUp.update({
    where: { id: followUpId },
    data,
  });
}

/**
 * Delete a follow-up question
 */
export async function deleteFollowUp(followUpId: string) {
  return await prisma.questionFollowUp.delete({
    where: { id: followUpId },
  });
}
