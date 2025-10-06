import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio, fileToBuffer, isValidAudioFile } from '@/src/lib/transcription';
import { analyzeTeachingPerformance } from '@/src/lib/llm-analysis';

export async function GET() {
  // Simulate processing delay (like a real AI analysis)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Sample Evalyze analysis data
  const sampleAnalysis = {
    status: "ok",
    message: "Evalyze analysis completed successfully! �",
    output: {
      role: "Teaching Performance Analysis",
      clarity: 8.5,
      simplicity: 7.8,
      helpfulness: 9.2,
      overall_score: 8.5,
      quick_feedback: "Great explanation! Your passion for the topic really comes through. You broke down complex concepts into digestible pieces and used good examples. Consider adding more interactive elements to boost engagement even further.",
      strengths: [
        "Clear and confident delivery",
        "Good use of analogies and examples", 
        "Logical flow and structure",
        "Appropriate pacing for the topic",
        "Engaging visual elements on whiteboard"
      ],
      weaknesses: [
        "Could use more interactive questions",
        "Some technical terms need simpler explanations",
        "Transition between topics could be smoother"
      ],
      questions: [
        "How might you check student understanding during the lesson?",
        "What would you do if students looked confused?",
        "How could you make this topic more interactive?",
        "What real-world applications could you add?"
      ]
    }
  };

  return NextResponse.json(sampleAnalysis);
}

export async function POST(request: NextRequest) {
  console.log('� Evalyze Analysis API called');
  
  try {
    // Parse the uploaded form data
    const formData = await request.formData();
    
    // Extract session data
    const audio = formData.get('audio') as File;
    const whiteboard = formData.get('whiteboard') as File | null; // Fixed typo: was 'whiteeboard'
    const persona = formData.get('persona') as string;
    const topic = formData.get('topic') as string;

    // Validate required fields
    if (!audio || !persona || !topic) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields: audio, persona, and topic are required",
        },
        { status: 400 }
      );
    }

    // Validate persona
    if (persona !== 'interviewer') {
      return NextResponse.json(
        {
          status: "error", 
          message: "Invalid persona. Must be 'interviewer'",
        },
        { status: 400 }
      );
    }

    // Validate audio file
    if (!isValidAudioFile(audio)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid audio file format. Please upload a valid audio file.",
        },
        { status: 400 }
      );
    }

    // Process whiteboard image if provided
    let whiteboardData: string | null = null;
    if (whiteboard && whiteboard.size > 0) {
      // Convert image to base64 for LLM processing
      const imageBuffer = await whiteboard.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      whiteboardData = `data:${whiteboard.type};base64,${base64Image}`;
      
      console.log('🎨 Whiteboard image processed:', {
        type: whiteboard.type,
        size: `${(whiteboard.size / (1024 * 1024)).toFixed(2)} MB`,
        hasContent: whiteboard.size > 0
      });
    }

    console.log('📊 Processing session data:', {
      audioSize: `${(audio.size / (1024 * 1024)).toFixed(2)} MB`,
      audioType: audio.type,
      hasWhiteboard: !!whiteboardData,
      whiteboardSize: whiteboard ? `${(whiteboard.size / 1024).toFixed(1)} KB` : 'No whiteboard',
      persona,
      topic
    });

    // Step 1: Transcribe audio using Deepgram
    console.log('🎙️ Starting audio transcription...');
    const audioBuffer = await fileToBuffer(audio);
    const transcriptionResult = await transcribeAudio(audioBuffer, {
      model: 'nova-2',
      language: 'en-US',
      punctuate: true,
      smart_format: true,
      utterances: true
    });

    if (transcriptionResult.error) {
      console.error('❌ Transcription failed:', transcriptionResult.error);
      return NextResponse.json(
        {
          status: "error",
          message: `Audio transcription failed: ${transcriptionResult.error}`,
        },
        { status: 500 }
      );
    }

    console.log('✅ Transcription completed:', {
      textLength: transcriptionResult.text.length,
      confidence: transcriptionResult.confidence,
      duration: transcriptionResult.duration
    });

    // Step 2: Analyze teaching performance using LangChain + Gemini
    console.log('🧠 Starting LLM analysis...');
    const analysisInput = {
      transcript: transcriptionResult.text,
      whiteboardData: whiteboardData || undefined, // Convert null to undefined for type compatibility
      persona: persona as 'interviewer',
      topic,
      duration: transcriptionResult.duration,
      confidence: transcriptionResult.confidence
    };

    const analysisResult = await analyzeTeachingPerformance(analysisInput);

    console.log('✅ Analysis completed:', {
      overallScore: analysisResult.overall_score,
      feedbackLength: analysisResult.quick_feedback.length
    });

    // Step 3: Return comprehensive analysis
    const response = {
      status: "ok",
      message: `🦆 ${getPersonaGreeting(persona)} Your "${topic}" session has been analyzed!`,
      output: analysisResult,
      metadata: {
        transcription: {
          text: transcriptionResult.text,
          confidence: transcriptionResult.confidence,
          duration: transcriptionResult.duration,
          wordCount: transcriptionResult.text.split(' ').length
        },
        session: {
          audioSize: audio.size,
          audioType: audio.type,
          hasWhiteboard: !!whiteboardData,
          whiteboardSize: whiteboard?.size || 0,
          whiteboardType: whiteboard?.type || null,
          persona,
          topic
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Evalyze analysis error:', error);
    
    // Return user-friendly error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      {
        status: "error",
        message: `Analysis failed: ${errorMessage}. Please try again!`,
      },
      { status: 500 }
    );
  }
}

function getPersonaGreeting(persona: string): string {
  return persona === 'interviewer' ? "Great interview practice!" : "Analysis complete!";
}