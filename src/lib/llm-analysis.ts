import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

// Initialize Gemini LLM
const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash',
  temperature: 0.7,
  maxOutputTokens: 2048,
  apiKey: process.env.GOOGLE_API_KEY,
});

export interface TeachingAnalysisInput {
  transcript: string;
  whiteboardData?: string;
  persona: 'student' | 'interviewer' | 'peer';
  topic: string;
  duration: number;
  confidence: number;
}

export interface TeachingAnalysisOutput {
  role: string;
  clarity: number;
  simplicity: number;
  helpfulness: number;
  overall_score: number;
  quick_feedback: string;
  strengths: string[];
  weaknesses: string[];
  questions: string[];
}

// Persona-specific prompt templates
const PERSONA_PROMPTS = {
  student: `You are an AI teaching assistant analyzing a learning session from a STUDENT'S perspective. 

The student explained the topic "{topic}" in their own words over {duration} seconds. Audio confidence: {confidence}%.

TRANSCRIPT:
{transcript}

WHITEBOARD DATA:
{whiteboardData}

As a supportive learning companion, provide constructive feedback that encourages continued learning and growth.

Evaluate on these criteria (score 1-10):
- CLARITY: How well did they articulate their understanding?
- SIMPLICITY: Did they break down complex ideas appropriately?
- HELPFULNESS: How useful would this explanation be for their own learning?

Provide your analysis in this EXACT JSON format:
{{
  "role": "Student Learning Experience",
  "clarity": [score 1-10],
  "simplicity": [score 1-10], 
  "helpfulness": [score 1-10],
  "overall_score": [average of the three scores],
  "quick_feedback": "[2-3 sentences of encouraging feedback focusing on learning progress]",
  "strengths": ["[3-4 specific strengths in their explanation]"],
  "weaknesses": ["[2-3 areas for improvement, framed positively]"],
  "questions": ["[3-4 questions to deepen their understanding of {topic}]"]
}}`,

  interviewer: `You are an AI interview coach analyzing a candidate's explanation from an INTERVIEWER'S perspective.

The candidate explained "{topic}" during a technical interview over {duration} seconds. Audio confidence: {confidence}%.

TRANSCRIPT:
{transcript}

WHITEBOARD DATA:
{whiteboardData}

As a professional interviewer, evaluate their communication skills, technical knowledge, and interview performance.

Evaluate on these criteria (score 1-10):
- CLARITY: How clearly did they communicate their knowledge?
- SIMPLICITY: Could they explain complex concepts in simple terms?
- HELPFULNESS: How well would this explanation help in a real work scenario?

Provide your analysis in this EXACT JSON format:
{{
  "role": "Interview Performance Analysis",
  "clarity": [score 1-10],
  "simplicity": [score 1-10],
  "helpfulness": [score 1-10], 
  "overall_score": [average of the three scores],
  "quick_feedback": "[2-3 sentences of professional feedback on their interview performance]",
  "strengths": ["[3-4 specific strengths that impressed you as an interviewer]"],
  "weaknesses": ["[2-3 areas that need improvement for interviews]"],
  "questions": ["[3-4 follow-up questions an interviewer might ask about {topic}]"]
}}`,

  peer: `You are an AI peer collaborator analyzing a teaching session from a PEER'S perspective.

Your peer explained "{topic}" to help you understand it better over {duration} seconds. Audio confidence: {confidence}%.

TRANSCRIPT:
{transcript}

WHITEBOARD DATA:
{whiteboardData}

As a learning peer, evaluate how well they taught you and how effective their explanation was for collaborative learning.

Evaluate on these criteria (score 1-10):
- CLARITY: How easy was it to follow their explanation?
- SIMPLICITY: Did they make complex ideas accessible?
- HELPFULNESS: How much did this help your understanding?

Provide your analysis in this EXACT JSON format:
{{
  "role": "Peer Learning Experience",
  "clarity": [score 1-10],
  "simplicity": [score 1-10],
  "helpfulness": [score 1-10],
  "overall_score": [average of the three scores],
  "quick_feedback": "[2-3 sentences of peer feedback on their teaching style]",
  "strengths": ["[3-4 things they did really well in explaining {topic}]"],
  "weaknesses": ["[2-3 gentle suggestions for improvement in peer teaching]"],
  "questions": ["[3-4 questions you'd ask to explore {topic} together]"]
}}`
};

/**
 * Analyze teaching performance using LangChain + Gemini
 * @param input - Teaching session data including transcript and context
 * @returns Detailed analysis with scores and feedback
 */
export async function analyzeTeachingPerformance(
  input: TeachingAnalysisInput
): Promise<TeachingAnalysisOutput> {
  try {
    console.log(`🧠 Starting LLM analysis for ${input.persona} persona...`);
    console.log(`📊 Transcript length: ${input.transcript.length} chars`);
    
    // Get the appropriate prompt template for the persona
    const promptTemplate = PERSONA_PROMPTS[input.persona];
    
    // Create the prompt
    const prompt = PromptTemplate.fromTemplate(promptTemplate);
    
    // Create the analysis chain
    const analysisChain = RunnableSequence.from([
      prompt,
      model,
      new StringOutputParser(),
    ]);

    const startTime = Date.now();
    
    // Run the analysis
    const result = await analysisChain.invoke({
      transcript: input.transcript || 'No transcript available.',
      whiteboardData: input.whiteboardData || 'No whiteboard data available.',
      persona: input.persona,
      topic: input.topic,
      duration: input.duration,
      confidence: Math.round(input.confidence * 100)
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    console.log(`✅ LLM analysis completed in ${processingTime}ms`);
    
    // Parse the JSON response
    let analysis: TeachingAnalysisOutput;
    try {
      // Clean the response in case there are markdown code blocks
      const cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error('❌ Failed to parse LLM response as JSON:', parseError);
      console.log('Raw LLM response:', result);
      
      // Fallback analysis
      analysis = createFallbackAnalysis(input);
    }

    // Validate and sanitize the analysis
    analysis = validateAnalysis(analysis, input);
    
    console.log(`📊 Analysis complete - Overall score: ${analysis.overall_score}`);
    
    return analysis;

  } catch (error) {
    console.error('❌ LLM analysis failed:', error);
    
    // Return fallback analysis in case of error
    return createFallbackAnalysis(input);
  }
}

/**
 * Create a fallback analysis when LLM fails
 */
function createFallbackAnalysis(input: TeachingAnalysisInput): TeachingAnalysisOutput {
  const roleMap = {
    student: 'Student Learning Experience',
    interviewer: 'Interview Performance Analysis', 
    peer: 'Peer Learning Experience'
  };

  return {
    role: roleMap[input.persona],
    clarity: 7.5,
    simplicity: 7.0,
    helpfulness: 8.0,
    overall_score: 7.5,
    quick_feedback: `Thank you for explaining ${input.topic}! Your session showed good understanding and communication skills. The AI analysis encountered an issue, but your effort to teach and learn is commendable.`,
    strengths: [
      'Clear communication attempt',
      'Good topic selection',
      'Willingness to explain concepts',
      'Use of visual aids'
    ],
    weaknesses: [
      'Could use more detailed examples',
      'Consider checking understanding more frequently',
      'Try varying explanation methods'
    ],
    questions: [
      `What real-world applications does ${input.topic} have?`,
      `How would you explain ${input.topic} to someone completely new?`,
      'What was the most challenging part to understand?',
      'How could this concept be improved or extended?'
    ]
  };
}

/**
 * Validate and sanitize the analysis response
 */
function validateAnalysis(analysis: unknown, input: TeachingAnalysisInput): TeachingAnalysisOutput {
  // Ensure scores are within valid range
  const ensureValidScore = (score: unknown): number => {
    const num = typeof score === 'number' ? score : parseFloat(String(score)) || 7;
    return Math.max(1, Math.min(10, num));
  };

  // Ensure arrays exist and have reasonable length
  const ensureArray = (arr: unknown, minLength: number = 3): string[] => {
    if (Array.isArray(arr) && arr.length >= minLength) {
      return arr.slice(0, 5); // Max 5 items
    }
    return [`Analysis of ${input.topic} shows positive aspects`];
  };

  const analysisObj = analysis as Record<string, unknown>;

  return {
    role: String(analysisObj.role || 'Teaching Performance Analysis'),
    clarity: ensureValidScore(analysisObj.clarity),
    simplicity: ensureValidScore(analysisObj.simplicity),
    helpfulness: ensureValidScore(analysisObj.helpfulness),
    overall_score: ensureValidScore(analysisObj.overall_score),
    quick_feedback: String(analysisObj.quick_feedback || `Great work explaining ${input.topic}!`),
    strengths: ensureArray(analysisObj.strengths),
    weaknesses: ensureArray(analysisObj.weaknesses, 2),
    questions: ensureArray(analysisObj.questions)
  };
}