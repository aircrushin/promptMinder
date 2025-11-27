import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/getSupabaseClient';

// 获取单个贡献详情
export async function GET(request, { params }) {
  const { id } = params;
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });

  try {
    const { data: contribution, error } = await supabase
      .from('prompt_contributions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    return NextResponse.json(contribution);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 更新贡献状态（审核）
export async function PATCH(request, { params }) {
  const { id } = params;

  // 从请求头获取管理员邮箱（由前端发送）
  const adminEmail = request.headers.get('x-admin-email');

  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });

  try {
    const { status, adminNotes, publishToPrompts } = await request.json();

    // 验证状态值
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // 检查贡献是否存在
    const { data: existingContribution, error: fetchError } = await supabase
      .from('prompt_contributions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingContribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // 准备更新数据
    const updateData = {
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminEmail || 'admin',
      updated_at: new Date().toISOString()
    };

    // 如果状态是approved且需要发布到公共提示词库
    let publishedPromptId = null;
    if (status === 'approved' && publishToPrompts) {
      // 创建新的公共提示词
      const promptData = {
        id: crypto.randomUUID(),
        title: existingContribution.title,
        content: existingContribution.content,
        description: `Contributed by community. Category: ${existingContribution.role_category}`,
        tags: existingContribution.role_category,
        version: '1.0.0',
        is_public: true,
        user_id: null, // 公共提示词没有特定用户
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newPrompt, error: promptError } = await supabase
        .from('prompts')
        .insert([promptData])
        .select()
        .single();

      if (promptError) {
        console.error('Failed to create prompt:', promptError);
        return NextResponse.json({ error: 'Failed to publish prompt' }, { status: 500 });
      }

      publishedPromptId = newPrompt.id;
      updateData.published_prompt_id = publishedPromptId;
    }

    // 更新贡献状态
    const { data: updatedContribution, error: updateError } = await supabase
      .from('prompt_contributions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Contribution updated successfully',
      contribution: updatedContribution,
      publishedPromptId
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 删除贡献
export async function DELETE(request, { params }) {
  const { id } = params;
  const supabase = getSupabaseClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });

  try {
    // 检查贡献是否存在
    const { data: contribution, error: fetchError } = await supabase
      .from('prompt_contributions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !contribution) {
      return NextResponse.json({ error: 'Contribution not found' }, { status: 404 });
    }

    // 删除贡献
    const { error: deleteError } = await supabase
      .from('prompt_contributions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete contribution' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contribution deleted successfully' });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
