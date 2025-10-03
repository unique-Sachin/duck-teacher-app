/**
 * Question Bank for Different Interview Roles
 */

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  followUps?: string[];
  expectedTopics?: string[];
}

export const GENAI_DEVELOPER_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'genai-1',
    question: "Can you explain what a Large Language Model is and how it differs from traditional machine learning models?",
    category: 'Fundamentals',
    difficulty: 'easy',
    followUps: [
      "What is the significance of the 'transformer' architecture in LLMs?",
      "How does attention mechanism work in transformers?",
      "What are some limitations of current LLMs?"
    ],
    expectedTopics: ['transformers', 'neural networks', 'attention mechanism', 'training data', 'parameters']
  },
  {
    id: 'genai-2',
    question: "Describe your experience with prompt engineering. What techniques have you found most effective?",
    category: 'Practical Experience',
    difficulty: 'medium',
    followUps: [
      "Can you give an example of a complex prompt you've designed?",
      "How do you handle prompt injection or jailbreaking attempts?",
      "What's your approach to testing and iterating on prompts?"
    ],
    expectedTopics: ['few-shot learning', 'chain-of-thought', 'system prompts', 'temperature', 'top-p sampling']
  },
  {
    id: 'genai-3',
    question: "Walk me through how you would implement a RAG (Retrieval-Augmented Generation) system for a production application.",
    category: 'System Design',
    difficulty: 'hard',
    followUps: [
      "How would you handle vector embeddings and similarity search?",
      "What strategies would you use for chunking documents?",
      "How would you evaluate the quality of retrieved context?"
    ],
    expectedTopics: ['vector databases', 'embeddings', 'semantic search', 'chunking strategies', 'context window']
  },
  {
    id: 'genai-4',
    question: "What are the main differences between GPT-4, Claude, and Gemini? When would you choose one over the others?",
    category: 'Model Knowledge',
    difficulty: 'medium',
    followUps: [
      "How do you evaluate model performance for your specific use case?",
      "What factors do you consider when choosing an LLM provider?",
      "Have you used any open-source models like Llama or Mistral?"
    ],
    expectedTopics: ['model comparison', 'context length', 'reasoning capabilities', 'cost optimization', 'API features']
  },
  {
    id: 'genai-5',
    question: "Explain how you would fine-tune a language model for a specific domain. What are the key considerations?",
    category: 'Advanced Topics',
    difficulty: 'hard',
    followUps: [
      "What's the difference between fine-tuning and few-shot learning?",
      "How do you prevent catastrophic forgetting?",
      "What datasets and compute resources would you need?"
    ],
    expectedTopics: ['transfer learning', 'LoRA', 'QLoRA', 'training data', 'evaluation metrics', 'overfitting']
  },
  {
    id: 'genai-6',
    question: "How do you handle hallucinations and ensure factual accuracy in AI-generated content?",
    category: 'Reliability & Safety',
    difficulty: 'medium',
    followUps: [
      "What validation techniques do you implement?",
      "How do you handle citations and source verification?",
      "What's your approach to testing edge cases?"
    ],
    expectedTopics: ['verification', 'grounding', 'citations', 'confidence scores', 'human-in-the-loop']
  },
  {
    id: 'genai-7',
    question: "Describe a project where you integrated AI capabilities into an existing application. What challenges did you face?",
    category: 'Project Experience',
    difficulty: 'medium',
    followUps: [
      "How did you handle API rate limits and costs?",
      "What was your approach to error handling and fallbacks?",
      "How did you measure the success of the AI integration?"
    ],
    expectedTopics: ['API integration', 'cost management', 'latency', 'error handling', 'user experience']
  },
  {
    id: 'genai-8',
    question: "What are embeddings and how are they used in modern AI applications?",
    category: 'Fundamentals',
    difficulty: 'easy',
    followUps: [
      "How do you choose the right embedding model?",
      "What's the difference between sparse and dense embeddings?",
      "How do you handle embedding drift over time?"
    ],
    expectedTopics: ['vector representations', 'semantic similarity', 'dimensionality', 'cosine similarity', 'embedding models']
  },
  {
    id: 'genai-9',
    question: "Explain the concept of function calling or tool use in LLMs. How have you implemented this?",
    category: 'Advanced Topics',
    difficulty: 'hard',
    followUps: [
      "How do you design effective function schemas?",
      "What's your error handling strategy for function calls?",
      "How do you chain multiple function calls together?"
    ],
    expectedTopics: ['JSON schemas', 'API integration', 'function descriptions', 'multi-step reasoning', 'agents']
  },
  {
    id: 'genai-10',
    question: "What ethical considerations and safety measures do you implement when building AI-powered features?",
    category: 'Ethics & Safety',
    difficulty: 'medium',
    followUps: [
      "How do you handle bias in AI outputs?",
      "What's your approach to content moderation?",
      "How do you ensure user privacy and data security?"
    ],
    expectedTopics: ['bias mitigation', 'fairness', 'content filtering', 'GDPR', 'responsible AI', 'transparency']
  }
];

export const SYSTEM_DESIGN_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'sd-1',
    question: "Design a URL shortening service like bit.ly. How would you handle millions of requests per day?",
    category: 'System Design',
    difficulty: 'medium',
    followUps: [
      "How would you generate unique short URLs?",
      "How do you handle analytics and tracking?",
      "What's your caching strategy?"
    ],
    expectedTopics: ['hashing', 'database design', 'caching', 'load balancing', 'scalability']
  },
  {
    id: 'sd-2',
    question: "How would you design a distributed rate limiter that works across multiple servers?",
    category: 'Distributed Systems',
    difficulty: 'hard',
    followUps: [
      "What algorithms would you use (token bucket, leaky bucket)?",
      "How do you ensure consistency across servers?",
      "How do you handle clock skew?"
    ],
    expectedTopics: ['distributed algorithms', 'Redis', 'consistency', 'race conditions', 'sliding window']
  },
  {
    id: 'sd-3',
    question: "Design a real-time chat application that supports millions of concurrent users.",
    category: 'Real-time Systems',
    difficulty: 'hard',
    followUps: [
      "How would you handle message persistence?",
      "What's your strategy for presence detection?",
      "How do you handle offline message delivery?"
    ],
    expectedTopics: ['WebSockets', 'message queues', 'database sharding', 'CDN', 'push notifications']
  }
];

/**
 * Get questions for a specific role
 */
export function getQuestionsForRole(roleId: string): InterviewQuestion[] {
  switch (roleId) {
    case 'genai-developer':
      return GENAI_DEVELOPER_QUESTIONS;
    case 'system-design':
      return SYSTEM_DESIGN_QUESTIONS;
    default:
      return GENAI_DEVELOPER_QUESTIONS;
  }
}

/**
 * Get a random question from the question bank
 */
export function getRandomQuestion(roleId: string, excludeIds: string[] = []): InterviewQuestion | null {
  const questions = getQuestionsForRole(roleId).filter(q => !excludeIds.includes(q.id));
  
  if (questions.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

/**
 * Get a follow-up question based on the current question
 */
export function getFollowUpQuestion(questionId: string, roleId: string): string | null {
  const questions = getQuestionsForRole(roleId);
  const question = questions.find(q => q.id === questionId);
  
  if (!question || !question.followUps || question.followUps.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * question.followUps.length);
  return question.followUps[randomIndex];
}

/**
 * Get initial greeting for the interview
 */
export function getInterviewGreeting(roleId: string): string {
  const greetings: Record<string, string> = {
    'genai-developer': "Hello! I'm your AI interviewer for the Gen AI Developer position. I'll be asking you a series of questions about generative AI, large language models, and practical implementation. Feel free to take your time with your answers, and I'll provide follow-up questions based on your responses. Are you ready to begin?",
    'system-design': "Hello! I'm your AI interviewer for the System Design position. We'll be discussing various system design scenarios, scalability challenges, and architectural decisions. Feel free to think out loud and ask clarifying questions. Are you ready to start?"
  };
  
  return greetings[roleId] || "Hello! I'm your AI interviewer. Let's begin the interview.";
}
