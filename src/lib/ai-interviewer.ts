import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { getRandomQuestion, getFollowUpQuestion, getInterviewGreeting } from './interview-questions';

// Initialize Gemini LLM
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  temperature: 0.8,
  maxOutputTokens: 500,
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
});

export interface InterviewContext {
  roleId: string;
  conversationHistory: Array<{ role: 'user' | 'agent'; content: string }>;
  currentQuestionId?: string;
  askedQuestionIds: string[];
  userResponses: string[];
  followUpCount?: number; // Track follow-ups for current question
  remainingTimeSeconds?: number; // Track remaining interview time
}

export interface InterviewerResponse {
  message: string;
  questionId?: string;
  isFollowUp: boolean;
  shouldContinue: boolean;
}

/**
 * Generate the next interviewer response based on context
 */
export async function generateInterviewerResponse(
  context: InterviewContext,
  latestUserResponse?: string
): Promise<InterviewerResponse> {
  try {
    // First interview message - start with greeting
    if (context.conversationHistory.length === 0) {
      const greeting = getInterviewGreeting(context.roleId);
      const firstQuestion = getRandomQuestion(context.roleId, context.askedQuestionIds);
      
      if (!firstQuestion) {
        return {
          message: greeting,
          shouldContinue: false,
          isFollowUp: false
        };
      }

      return {
        message: `${greeting}\n\nLet's start with our first question: ${firstQuestion.question}`,
        questionId: firstQuestion.id,
        shouldContinue: true,
        isFollowUp: false
      };
    }

    // If we have a latest response, analyze it and decide next action
    if (latestUserResponse && context.currentQuestionId) {
      // Check remaining time - if less than 2 minutes, gracefully conclude
      const remainingTimeMinutes = Math.floor((context.remainingTimeSeconds || 0) / 60);
      
      if (remainingTimeMinutes < 1) {
        return {
          message: "Thank you for that answer. I see we're running low on time, so let's conclude the interview here. You've provided great insights today. We'll analyze your responses and get back to you soon with feedback.",
          shouldContinue: false,
          isFollowUp: false
        };
      }
      
      // Initialize follow-up counter if not exists
      const currentFollowUpCount = context.followUpCount || 0;
      
      // Strict limit: Only allow 1 follow-up per question
      // Also check if response is too short (less than 50 words)
      const responseWordCount = latestUserResponse.trim().split(/\s+/).length;
      const shouldConsiderFollowUp = currentFollowUpCount < 1 && responseWordCount < 50;
      
      // Default acknowledgment
      let acknowledgment = "Thank you for that answer.";
      
      if (shouldConsiderFollowUp) {
        // Use LLM to analyze the response and decide whether to ask follow-up
        const decision = await decideNextAction(context, latestUserResponse);
        acknowledgment = decision.acknowledgment;
        
        if (decision.shouldAskFollowUp) {
          // Get a follow-up question
          const followUp = getFollowUpQuestion(context.currentQuestionId, context.roleId);
          
          if (followUp) {
            // Increment follow-up counter
            context.followUpCount = currentFollowUpCount + 1;
            
            return {
              message: `${acknowledgment} ${followUp}`,
              questionId: context.currentQuestionId,
              shouldContinue: true,
              isFollowUp: true
            };
          }
        }
      }

      // Reset follow-up counter for next question
      context.followUpCount = 0;

      // Move to next question
      const nextQuestion = getRandomQuestion(context.roleId, context.askedQuestionIds);
      
      if (!nextQuestion) {
        return {
          message: `${acknowledgment} That concludes our technical interview. Thank you for your thoughtful responses! We'll analyze your performance and get back to you soon.`,
          shouldContinue: false,
          isFollowUp: false
        };
      }

      return {
        message: `${acknowledgment} Let's move on to the next topic. ${nextQuestion.question}`,
        questionId: nextQuestion.id,
        shouldContinue: true,
        isFollowUp: false
      };
    }

    // Fallback
    return {
      message: "I'm processing your response. Please continue.",
      shouldContinue: true,
      isFollowUp: false
    };

  } catch (error) {
    console.error('Failed to generate interviewer response:', error);
    return {
      message: "I apologize, I'm having trouble processing that. Could you please rephrase your answer?",
      shouldContinue: true,
      isFollowUp: false
    };
  }
}

/**
 * Decide whether to ask follow-up or move to next question
 */
async function decideNextAction(
  context: InterviewContext,
  userResponse: string
): Promise<{ shouldAskFollowUp: boolean; acknowledgment: string }> {
  try {
    const prompt = PromptTemplate.fromTemplate(`You are an experienced technical interviewer conducting an efficient interview.

The candidate just answered: "{userResponse}"

DECISION CRITERIA FOR FOLLOW-UP:
- Ask follow-up ONLY if the answer is extremely brief (less than 2-3 sentences) OR completely off-topic
- If the candidate gave any reasonable attempt at answering, move on
- If the answer shows ANY depth or examples, move on
- You can only ask 2 follow-up per question maximum (currently at {followUpCount})

Provide:
1. should_ask_followup: true ONLY if answer is too brief or unclear (be strict!)
2. acknowledgment: Brief, encouraging (1 sentence only)

Respond ONLY in this JSON format:
{{
  "should_ask_followup": false,
  "acknowledgment": "Your acknowledgment here"
}}
`);

    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ 
      userResponse, 
      followUpCount: context.followUpCount || 0,
    });
    console.log('LLM decision result:', result);
    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      shouldAskFollowUp: parsed.should_ask_followup === true,
      acknowledgment: parsed.acknowledgment || "Thank you for that explanation."
    };

  } catch (error) {
    console.error('Failed to decide next action:', error);
    // Default behavior: DON'T ask follow-up, move to next question
    return {
      shouldAskFollowUp: false,
      acknowledgment: "Thank you for that answer."
    };
  }
}

/**
 * Analyze the complete interview performance
 */
export async function analyzeInterviewPerformance(
  context: InterviewContext
): Promise<InterviewAnalysis> {
  try {
    const prompt = PromptTemplate.fromTemplate(`You are an expert technical interviewer analyzing a candidate's complete interview performance.

ROLE: {roleId}

CONVERSATION HISTORY:
{conversationHistory}

Provide a comprehensive analysis of the candidate's interview performance.

Evaluate on these criteria (score 1-10):
- TECHNICAL_KNOWLEDGE: Depth and accuracy of technical knowledge
- COMMUNICATION: Clarity and effectiveness of communication
- PROBLEM_SOLVING: Analytical thinking and problem-solving approach
- EXPERIENCE: Demonstrated practical experience

Respond in this EXACT JSON format:
{{
  "technical_knowledge": [score 1-10],
  "communication": [score 1-10],
  "problem_solving": [score 1-10],
  "experience": [score 1-10],
  "overall_score": [average of all scores],
  "summary": "[3-4 sentences overall assessment]",
  "strengths": ["[3-4 key strengths]"],
  "areas_for_improvement": ["[2-3 areas to improve]"],
  "key_insights": ["[3-4 notable observations]"],
  "hiring_recommendation": "strong_yes|yes|maybe|no|strong_no"
}}
`);

    const chain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const conversationText = context.conversationHistory
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n');

    const result = await chain.invoke({
      roleId: context.roleId,
      conversationHistory: conversationText
    });

    const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleaned);

    return {
      technical_knowledge: ensureValidScore(analysis.technical_knowledge),
      communication: ensureValidScore(analysis.communication),
      problem_solving: ensureValidScore(analysis.problem_solving),
      experience: ensureValidScore(analysis.experience),
      overall_score: ensureValidScore(analysis.overall_score),
      summary: analysis.summary || 'Interview completed successfully.',
      strengths: ensureArray(analysis.strengths, 3),
      areas_for_improvement: ensureArray(analysis.areas_for_improvement, 2),
      key_insights: ensureArray(analysis.key_insights, 3),
      hiring_recommendation: analysis.hiring_recommendation || 'maybe'
    };

  } catch (error) {
    console.error('Failed to analyze interview:', error);
    return createFallbackAnalysis();
  }
}

export interface InterviewAnalysis {
  technical_knowledge: number;
  communication: number;
  problem_solving: number;
  experience: number;
  overall_score: number;
  summary: string;
  strengths: string[];
  areas_for_improvement: string[];
  key_insights: string[];
  hiring_recommendation: string;
}

function ensureValidScore(score: unknown): number {
  const num = typeof score === 'number' ? score : parseFloat(String(score)) || 7;
  return Math.max(1, Math.min(10, num));
}

function ensureArray(arr: unknown, minLength: number = 3): string[] {
  if (Array.isArray(arr) && arr.length >= minLength) {
    return arr.slice(0, 5);
  }
  return ['Performance was satisfactory'];
}

function createFallbackAnalysis(): InterviewAnalysis {
  return {
    technical_knowledge: 0,
    communication: 0,
    problem_solving: 0,
    experience: 0,
    overall_score: 0,
    summary: 'Failed to analyze interview performance.',
    strengths: [],
    areas_for_improvement: [],
    key_insights: [],
    hiring_recommendation: 'N/A'
  };
}
