import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

// 获取单个A/B测试详情
export async function GET(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { supabase } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const { data: experiment, error } = await supabase
      .from('ab_test_experiments')
      .select(`
        *,
        baseline_prompt:prompts!baseline_prompt_id(id, title, content, version),
        variant_prompts:prompts!inner(id, title, content, version)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
      }
      throw error
    }

    // 验证权限
    if (experiment.team_id) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', experiment.team_id)
        .eq('user_id', userId)
        .single()

      if (!membership) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (experiment.created_by !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 获取变体提示词详情
    const { data: variantPrompts } = await supabase
      .from('prompts')
      .select('id, title, content, version')
      .in('id', experiment.variant_prompt_ids)

    experiment.variant_prompts = variantPrompts || []

    return NextResponse.json(experiment)
  } catch (error) {
    return handleApiError(error, 'Unable to load A/B test')
  }
}

// 更新A/B测试
export async function PATCH(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { supabase } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const data = await request.json()

    // 获取现有实验
    const { data: experiment, error: fetchError } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
      }
      throw fetchError
    }

    // 验证权限
    if (experiment.team_id) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', experiment.team_id)
        .eq('user_id', userId)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (experiment.created_by !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // 不允许修改运行中的实验
    if (experiment.status === 'running') {
      return NextResponse.json({ error: 'Cannot update running experiment' }, { status: 400 })
    }

    const updatePayload = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: updatedExperiment, error: updateError } = await supabase
      .from('ab_test_experiments')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedExperiment)
  } catch (error) {
    return handleApiError(error, 'Unable to update A/B test')
  }
}

// 删除A/B测试
export async function DELETE(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { supabase } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const { data: experiment, error: fetchError } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
      }
      throw fetchError
    }

    // 验证权限
    if (experiment.team_id) {
      const { data: membership } = await supabase
        .from('team_members')
        .select('role')
        .eq('team_id', experiment.team_id)
        .eq('user_id', userId)
        .single()

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    } else if (experiment.created_by !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error: deleteError } = await supabase
      .from('ab_test_experiments')
      .delete()
      .eq('id', id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Unable to delete A/B test')
  }
}
