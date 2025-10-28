import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

// 启动A/B测试
export async function POST(request, { params }) {
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

    // 验证状态
    if (experiment.status === 'running') {
      return NextResponse.json({ error: 'Experiment is already running' }, { status: 400 })
    }

    if (experiment.status === 'completed') {
      return NextResponse.json({ error: 'Cannot restart completed experiment' }, { status: 400 })
    }

    const { data: updatedExperiment, error: updateError } = await supabase
      .from('ab_test_experiments')
      .update({
        status: 'running',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json(updatedExperiment)
  } catch (error) {
    return handleApiError(error, 'Unable to start A/B test')
  }
}
