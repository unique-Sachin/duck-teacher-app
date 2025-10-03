import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route to proxy Deepgram TTS requests
 * This is needed to avoid CORS issues when calling Deepgram from the browser
 */
export async function POST(request: NextRequest) {
  try {
    const { text, model = 'aura-asteria-en' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Get API key from environment (server-side only)
    const apiKey = process.env.DEEPGRAM_API_KEY || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    
    if (!apiKey) {
      console.error('Deepgram API key not found');
      return NextResponse.json(
        { error: 'Deepgram API key not configured' },
        { status: 500 }
      );
    }

    // Create Deepgram client
    const deepgram = createClient(apiKey);

    // Generate speech
    const response = await deepgram.speak.request(
      { text },
      {
        model,
        encoding: 'linear16',
        sample_rate: 24000,
        container: 'wav'
      }
    );

    // Get audio stream
    const stream = await response.getStream();
    
    if (!stream) {
      throw new Error('Failed to get audio stream from Deepgram');
    }

    // Collect audio chunks
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }

    // Combine chunks into single buffer
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const audioData = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      audioData.set(chunk, offset);
      offset += chunk.length;
    }

    // Return audio data with proper headers
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioData.length.toString(),
      },
    });

  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
