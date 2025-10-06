import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type EvaluatorPersona = 'interviewer';

// Type for the feedback response (kept for compatibility)
export interface FeedbackOutput {
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

// Type for upload response (kept for compatibility)
export interface UploadResponse {
  status: "ok" | "error";
  message: string;
  output?: Record<string, unknown>;
  reportUrl?: string;
}

interface SessionState {
  // Form data
  email: string;
  persona: EvaluatorPersona;
  topic: string;
  
  // Recording data
  audioBlob: Blob | null;
  
  // Whiteboard data
  excalidrawJSON: string | null;
  
  // Upload status
  uploadProgress: number;
  isUploading: boolean;
  
  // Upload response
  uploadResponse: UploadResponse | null;
  
  // Actions
  setEmail: (email: string) => void;
  setPersona: (persona: EvaluatorPersona) => void;
  setTopic: (topic: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setExcalidrawJSON: (json: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadResponse: (response: UploadResponse | null) => void;
  
  // Validation helpers
  isFormValid: () => boolean;
  hasAudio: () => boolean;
  hasEmail: () => boolean;
  
  // Reset
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      email: '',
      persona: 'interviewer', // Default to Interviewer Mode
      topic: '',
      audioBlob: null,
      excalidrawJSON: null,
      uploadProgress: 0,
      isUploading: false,
      uploadResponse: null,
      
      // Actions
      setEmail: (email) => set({ email }),
      setPersona: (persona) => set({ persona }),
      setTopic: (topic) => set({ topic }),
      setAudioBlob: (audioBlob) => set({ audioBlob }),
      setExcalidrawJSON: (excalidrawJSON) => set({ excalidrawJSON }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setUploadResponse: (uploadResponse) => set({ uploadResponse }),
      
      // Validation helpers
      isFormValid: () => {
        const state = get();
        return state.hasEmail() && state.hasAudio();
      },
      
      hasAudio: () => {
        const state = get();
        return state.audioBlob !== null;
      },
      
      hasEmail: () => {
        const state = get();
        return state.email.trim() !== '';
      },
      
      // Reset
      resetSession: () => set({
        email: '',
        persona: 'interviewer',
        topic: '',
        audioBlob: null,
        excalidrawJSON: null,
        uploadProgress: 0,
        isUploading: false,
        uploadResponse: null,
      }),
    }),
    {
      name: 'session-store', // For Redux DevTools
    }
  )
);

// Helper function to get persona display name
export const getPersonaDisplayName = (persona: EvaluatorPersona): string => {
  const displayNames: Record<EvaluatorPersona, string> = {
    interviewer: '💼 Interviewer Mode'
  };
  return displayNames[persona];
};

// Helper function to get session summary for uploads
export const getSessionSummary = () => {
  const state = useSessionStore.getState();
  return {
    email: state.email,
    persona: state.persona,
    topic: state.topic,
    hasAudio: state.hasAudio(),
    hasExcalidrawData: state.excalidrawJSON !== null,
  };
};
