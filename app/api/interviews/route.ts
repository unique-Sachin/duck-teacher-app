import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { createInterview, getUserInterviews, getUserInterviewStats } from '@/src/lib/interview-service';

/**
 * GET /api/interviews - Get all interviews for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getUserInterviewStats(session.user.id);
      return NextResponse.json(stats);
    }

    const interviews = await getUserInterviews(session.user.id);
    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Get interviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/interviews - Create a new interview
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const interview = await createInterview(session.user.id, roleId);
    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('Create interview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
