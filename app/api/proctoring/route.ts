import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { 
  initializeProctoringSession, 
  storeAttentionSnapshot, 
  storeProctoringEvent,
  finalizeProctoringSession 
} from '@/src/lib/proctoring-storage';

// POST /api/proctoring - Initialize or store data
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'initialize': {
        const { interviewId } = data;
        const proctoringSession = await initializeProctoringSession(interviewId);
        return NextResponse.json(proctoringSession);
      }

      case 'storeSnapshot': {
        const { sessionId, secondsElapsed, metrics } = data;
        await storeAttentionSnapshot(sessionId, secondsElapsed, metrics);
        return NextResponse.json({ success: true });
      }

      case 'storeEvent': {
        const { sessionId, event, questionIndex } = data;
        await storeProctoringEvent(sessionId, event, questionIndex);
        return NextResponse.json({ success: true });
      }

      case 'finalize': {
        const { sessionId } = data;
        const finalSession = await finalizeProctoringSession(sessionId);
        return NextResponse.json(finalSession);
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Proctoring API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
