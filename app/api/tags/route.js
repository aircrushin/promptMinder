import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth.js'
import { getSupabaseClient } from '@/lib/getSupabaseClient';

export async function GET(request) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const { userId } = await auth()
  
  // 获取公共标签和用户私有标签
  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(tags);
}

export async function POST(request) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const { userId } = await auth();

  try {
    const { name, isPublic } = await request.json();
    
    const tagData = {
      id: crypto.randomUUID(),
      name,
      user_id: isPublic ? null : userId,
      created_at: new Date().toISOString()
    };

    const { data: newTag, error } = await supabase
      .from('tags')
      .insert([tagData])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(newTag[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const { userId } = await auth();
  
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');

    // 首先检查标签是否存在
    const { data: tag, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    // 检查是否是公共标签
    if (!tag.user_id) {
      return NextResponse.json({ error: '不能删除公共标签' }, { status: 403 });
    }

    // 检查是否是用户自己的标签
    if (tag.user_id !== userId) {
      return NextResponse.json({ error: '无权删除此标签' }, { status: 403 });
    }

    // 执行删除操作
    const { error: deleteError } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const { userId } = await auth();
  
  try {
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get('id');
    const { name } = await request.json();

    // 首先检查标签是否存在
    const { data: tag, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', tagId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: '标签不存在' }, { status: 404 });
    }

    // 检查是否是公共标签
    if (!tag.user_id) {
      return NextResponse.json({ error: '不能修改公共标签' }, { status: 403 });
    }

    // 检查是否是用户自己的标签
    if (tag.user_id !== userId) {
      return NextResponse.json({ error: '无权修改此标签' }, { status: 403 });
    }

    // 执行更新操作
    const { data: updatedTag, error: updateError } = await supabase
      .from('tags')
      .update({ name })
      .eq('id', tagId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedTag);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
