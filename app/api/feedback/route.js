import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabaseServer.js';
import { handleApiError } from '@/lib/handle-api-error.js';
import { auth } from '@clerk/nextjs/server';

export async function POST(request) {
  try {
    const supabase = createSupabaseServerClient();
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

    const feedbackPayload = {
      type,
      description,
      email: email || null,
      user_id: userId,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newFeedback, error } = await supabase
      .from('user_feedback')
      .insert([feedbackPayload])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(newFeedback, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'Unable to submit feedback');
  }
}

export async function GET(request) {
  try {
    const supabase = createSupabaseServerClient();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('user_feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: feedbackList, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      feedback: feedbackList || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, 'Unable to load feedback');
  }
}

export async function PATCH(request) {
  try {
    const supabase = createSupabaseServerClient();
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

    const { data: updated, error } = await supabase
      .from('user_feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, 'Unable to update feedback');
  }
}
