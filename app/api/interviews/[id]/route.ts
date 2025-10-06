import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { getInterviewWithMessages, completeInterview } from '@/src/lib/interview-service';
import { prisma } from '@/src/lib/prisma';

/**
 * GET /api/interviews/[id] - Get a specific interview with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const interview = await getInterviewWithMessages(id, session.user.id);

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Get interview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/interviews/[id] - Update interview (complete it or abandon it)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const existingInterview = await prisma.interview.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existingInterview || existingInterview.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Interview not found or unauthorized' },
        { status: 404 }
      );
    }

    // If completing interview with analysis
    if (body.status === 'COMPLETED' && body.analysisScores) {
      const interview = await completeInterview(
        id,
        {
          summary: body.summary || '',
          technical_knowledge: body.analysisScores.technical,
          communication: body.analysisScores.communication,
          problem_solving: body.analysisScores.problemSolving,
          experience: body.analysisScores.experience,
          strengths: body.strengths,
          areas_for_improvement: body.improvements,
          key_insights: body.insights,
          hiring_recommendation: body.recommendation,
          overall_score: body.overallScore,
        },
        body.durationMinutes,
        body.questionsAsked
      );
      return NextResponse.json(interview);
    }

    // For other updates (like abandoning)
    const interview = await prisma.interview.update({
      where: { id },
      data: {
        status: body.status,
      },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error('Update interview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
