import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { saveMessage } from '@/src/lib/interview-service';
import { prisma } from '@/src/lib/prisma';

/**
 * POST /api/interviews/[id]/messages - Save a message to an interview
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: interviewId } = await params;
    
    // Verify interview belongs to user
    const interview = await prisma.interview.findUnique({
      where: { id: interviewId, userId: session.user.id },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role, content, isFollowUp, questionId } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    const message = await saveMessage(interviewId, role, content, {
      isFollowUp,
      questionId,
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Save message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
