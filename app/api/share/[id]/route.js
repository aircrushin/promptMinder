import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/getSupabaseClient';

export async function GET(request, { params }) {
  const { id } = params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  // First, get the requested prompt
  const { data: prompt, error: promptError } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', id)
    .eq('is_public', true)
    .single();

  if (promptError) {
    return NextResponse.json({ error: promptError.message }, { status: 500 });
  }

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt not found or not public' }, { status: 404 });
  }

  // Then, get all versions of this prompt
  const { data: versions, error: versionsError } = await supabase
    .from('prompts')
    .select('id, version, created_at')
    .eq('title', prompt.title)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (versionsError) {
    // We can still return the main prompt even if versions fail
    console.error('Error fetching versions:', versionsError.message);
  }

  // Attach versions to the prompt object
  prompt.versions = versions || [];

  return NextResponse.json(prompt);
}
