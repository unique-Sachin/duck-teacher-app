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
  setAudioBlob: (blob: Blob | null) => void;
  setExcalidrawJSON: (json: string | null) => void;
  setUploadProgress: (progress: number) => void;
  setIsUploading: (uploading: boolean) => void;
  setUploadResponse: (response: UploadResponse | null) => void;
  
  // Validation helpers
  hasAudio: () => boolean;
  
  // Reset
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  devtools(
    (set, get) => ({
      // Initial state
      audioBlob: null,
      excalidrawJSON: null,
      uploadProgress: 0,
      isUploading: false,
      uploadResponse: null,
      
      // Actions
      setAudioBlob: (audioBlob) => set({ audioBlob }),
      setExcalidrawJSON: (excalidrawJSON) => set({ excalidrawJSON }),
      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setUploadResponse: (uploadResponse) => set({ uploadResponse }),
      
      // Validation helpers
      hasAudio: () => {
        const state = get();
        return state.audioBlob !== null;
      },
      
      // Reset
      resetSession: () => set({
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

// Helper function to get session summary for uploads
export const getSessionSummary = () => {
  const state = useSessionStore.getState();
  return {
    hasAudio: state.hasAudio(),
    hasExcalidrawData: state.excalidrawJSON !== null,
  };
};
