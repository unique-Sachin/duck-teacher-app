/**
 * Service for converting text to speech using Deepgram's TTS API via proxy
 * Uses Next.js API route to avoid CORS issues
 */
export class DeepgramTTSService {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioBuffer[] = [];
  private isPlaying = false;
  private model: string;

  constructor(_apiKey?: string, model = 'aura-asteria-en') {
    // API key no longer needed on client side - handled by server proxy
    this.model = model;
  }

  /**
   * Initialize audio context
   */
  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
    return this.audioContext;
  }

  /**
   * Convert text to speech and return audio buffer
   * Uses Next.js API proxy to avoid CORS
   */
  async textToSpeech(text: string): Promise<AudioBuffer> {
    try {
      // Call our Next.js API route instead of Deepgram directly
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model: this.model,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate speech');
      }

      // Get audio data as ArrayBuffer
      const audioData = await response.arrayBuffer();

      // Decode audio data
      const audioContext = this.initAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);

      return audioBuffer;

    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error('Failed to generate speech: ' + (error as Error).message);
    }
  }

  /**
   * Play audio buffer
   */
  async playAudio(audioBuffer: AudioBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const audioContext = this.initAudioContext();
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        
        source.onended = () => {
          this.isPlaying = false;
          resolve();
        };

        source.start(0);
        this.isPlaying = true;

      } catch (error) {
        this.isPlaying = false;
        reject(error);
      }
    });
  }

  /**
   * Speak text (convert and play)
   */
  async speak(text: string, onStart?: () => void, onEnd?: () => void): Promise<void> {
    try {
      onStart?.();
      const audioBuffer = await this.textToSpeech(text);
      await this.playAudio(audioBuffer);
      onEnd?.();
    } catch (error) {
      console.error('Failed to speak:', error);
      onEnd?.();
      throw error;
    }
  }

  /**
   * Queue multiple text segments to be spoken in sequence
   */
  async speakQueue(texts: string[], onStart?: () => void, onEnd?: () => void): Promise<void> {
    try {
      onStart?.();
      
      for (const text of texts) {
        const audioBuffer = await this.textToSpeech(text);
        await this.playAudio(audioBuffer);
      }
      
      onEnd?.();
    } catch (error) {
      console.error('Failed to speak queue:', error);
      onEnd?.();
      throw error;
    }
  }

  /**
   * Stop current playback
   */
  stop() {
    if (this.audioContext) {
      // Suspend audio context to stop all playback
      this.audioContext.suspend();
      this.isPlaying = false;
      
      // Resume after a short delay for next playback
      setTimeout(() => {
        this.audioContext?.resume();
      }, 100);
    }
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.audioQueue = [];
  }
}

/**
 * Singleton instance for easy access
 * Note: API key is no longer needed - handled by server-side proxy
 */
let ttsServiceInstance: DeepgramTTSService | null = null;

export function getDeepgramTTSService(model = 'aura-asteria-en'): DeepgramTTSService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new DeepgramTTSService(undefined, model);
  }
  return ttsServiceInstance;
}

export function disposeTTSService() {
  if (ttsServiceInstance) {
    ttsServiceInstance.dispose();
    ttsServiceInstance = null;
  }
}
