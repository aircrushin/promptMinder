import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/index.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const data = await request.json();

    const { type, description, email } = data;

    if (!type || !description) {
      return NextResponse.json(
        { error: 'Type and description are required' },
        { status: 400 }
      );
    }

    if (!['feature_request', 'bug'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    let userId = null;
    try {
      const { userId: authUserId } = await auth();
      userId = authUserId;
    } catch {
      // User not authenticated, that's okay
    }

    const newFeedback = await queries.feedback.create({
      type,
      description,
      email: email || null,
      userId,
      status: 'pending',
    });

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Unable to submit feedback');
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await queries.feedback.getAll({ 
      page, 
      limit, 
      isResolved: status === 'resolved' ? true : status === 'pending' ? false : undefined 
    });

    return NextResponse.json({
      feedback: result.feedback,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleApiError(error, 'Unable to load feedback');
  }
}

export async function PATCH(request) {
  try {
    const data = await request.json();

    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'ID and status are required' },
        { status: 400 }
      );
    }

    if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const { userId } = await auth();

    const updated = await queries.feedback.resolve(id, userId);

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, 'Unable to update feedback');
  }
}
