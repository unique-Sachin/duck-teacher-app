// AudioWorklet processor for Deepgram audio streaming
class AudioStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.shouldSend = false;
    
    // Listen for messages from the main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'setShouldSend') {
        this.shouldSend = event.data.value;
      }
    };
  }

  process(inputs, _outputs, _parameters) {
    const input = inputs[0];
    
    // Only process if we have input and should send
    if (input && input.length > 0 && this.shouldSend) {
      const inputData = input[0]; // Get first channel
      
      if (inputData && inputData.length > 0) {
        // Convert Float32Array to Int16Array for Deepgram
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        
        // Send the audio data to the main thread
        this.port.postMessage({
          type: 'audioData',
          data: pcmData.buffer
        }, [pcmData.buffer]); // Transfer the buffer for efficiency
      }
    }
    
    // Return true to keep the processor alive
    return true;
  }
}

registerProcessor('audio-stream-processor', AudioStreamProcessor);
