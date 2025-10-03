import { createClient } from '@deepgram/sdk';

// Lazy initialization of Deepgram client
let deepgramClient: ReturnType<typeof createClient> | null = null;

function getDeepgramClient() {
  if (!deepgramClient) {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error('NEXT_PUBLIC_DEEPGRAM_API_KEY is not set');
    }
    deepgramClient = createClient(apiKey);
  }
  return deepgramClient;
}

export interface TranscriptionOptions {
  model?: string;
  language?: string;
  punctuate?: boolean;
  smart_format?: boolean;
  utterances?: boolean;
  diarize?: boolean;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  error?: string;
}

/**
 * Transcribe audio file using Deepgram SDK
 * @param audioBuffer - Audio file as Buffer
 * @param options - Transcription options
 * @returns Transcription result with text and metadata
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options: TranscriptionOptions = {}
): Promise<TranscriptionResult> {
  try {
    // Default transcription options optimized for teaching analysis
    const transcriptionOptions = {
      model: 'nova-2', // Latest and most accurate model
      language: 'en-US',
      punctuate: true,
      smart_format: true,
      utterances: true,
      diarize: false, // Single speaker assumed
      filler_words: false, // Remove "um", "uh" etc.
      profanity_filter: false,
      redact: [],
      search: [],
      replace: [],
      keywords: [],
      ...options
    };

    console.log('🎙️ Starting audio transcription with Deepgram...');
    const startTime = Date.now();

    // Get Deepgram client and transcribe the audio
    const deepgram = getDeepgramClient();
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioBuffer,
      transcriptionOptions
    );

    if (error) {
      console.error('❌ Deepgram transcription error:', error);
      throw new Error(`Transcription failed: ${error.message || 'Unknown error'}`);
    }

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Extract transcript data
    const transcript = result?.results?.channels?.[0]?.alternatives?.[0];
    
    if (!transcript) {
      throw new Error('No transcription result found');
    }

    // Calculate overall confidence
    const words = transcript.words || [];
    const avgConfidence = words.length > 0 
      ? words.reduce((sum: number, word: { word: string; start: number; end: number; confidence: number }) => sum + (word.confidence || 0), 0) / words.length 
      : 0;

    // Get metadata
    const metadata = result?.metadata;
    const duration = metadata?.duration || 0;

    const transcriptionResult: TranscriptionResult = {
      text: transcript.transcript || '',
      confidence: Math.round(avgConfidence * 100) / 100,
      duration: Math.round(duration * 100) / 100,
      words: words.map((word: { word: string; start: number; end: number; confidence: number }) => ({
        word: word.word,
        start: Math.round(word.start * 100) / 100,
        end: Math.round(word.end * 100) / 100,
        confidence: Math.round((word.confidence || 0) * 100) / 100
      }))
    };

    console.log(`✅ Transcription completed in ${processingTime}ms`);
    console.log(`📊 Text length: ${transcriptionResult.text.length} chars`);
    console.log(`📊 Confidence: ${transcriptionResult.confidence}`);
    console.log(`📊 Duration: ${transcriptionResult.duration}s`);

    return transcriptionResult;

  } catch (error) {
    console.error('❌ Audio transcription failed:', error);
    
    return {
      text: '',
      confidence: 0,
      duration: 0,
      error: error instanceof Error ? error.message : 'Transcription failed'
    };
  }
}

/**
 * Helper function to validate audio file
 * @param file - File object from form data
 * @returns Whether the file is a valid audio format
 */
export function isValidAudioFile(file: File): boolean {
  const validTypes = [
    'audio/webm',
    'audio/wav', 
    'audio/mp3',
    'audio/mp4',
    'audio/mpeg',
    'audio/ogg',
    'audio/flac'
  ];
  
  return validTypes.includes(file.type);
}

/**
 * Helper function to convert File to Buffer
 * @param file - File object from form data
 * @returns Buffer representation of the file
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}