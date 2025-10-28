import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

// 获取A/B测试列表
export async function GET(request) {
  try {
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    if (teamId) {
      await teamService.requireMembership(teamId, userId)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const offset = (page - 1) * limit

    let query = supabase
      .from('ab_test_experiments')
      .select('*, baseline_prompt:prompts!baseline_prompt_id(id, title)')

    if (teamId) {
      query = query.eq('team_id', teamId)
    } else {
      query = query.eq('created_by', userId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: experiments, error } = await query

    if (error) {
      throw error
    }

    let countQuery = supabase
      .from('ab_test_experiments')
      .select('*', { count: 'exact', head: true })

    if (teamId) {
      countQuery = countQuery.eq('team_id', teamId)
    } else {
      countQuery = countQuery.eq('created_by', userId)
    }

    if (status) {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      throw countError
    }

    return NextResponse.json({
      experiments: experiments || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    return handleApiError(error, 'Unable to load A/B tests')
  }
}

// 创建A/B测试
export async function POST(request) {
  try {
    const userId = await requireUserId()
    const { teamId, supabase, teamService } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    let targetTeamId = null
    if (teamId) {
      await teamService.requireMembership(teamId, userId)
      targetTeamId = teamId
    }

    const data = await request.json()
    
    // 验证必填字段
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!data.baseline_prompt_id) {
      return NextResponse.json({ error: 'Baseline prompt is required' }, { status: 400 })
    }
    if (!data.variant_prompt_ids || data.variant_prompt_ids.length === 0) {
      return NextResponse.json({ error: 'At least one variant is required' }, { status: 400 })
    }
    if (!data.goal_metric) {
      return NextResponse.json({ error: 'Goal metric is required' }, { status: 400 })
    }

    // 验证所有提示词是否存在且用户有权限
    const allPromptIds = [data.baseline_prompt_id, ...data.variant_prompt_ids]
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id, team_id, created_by')
      .in('id', allPromptIds)

    if (promptsError) {
      throw promptsError
    }

    if (prompts.length !== allPromptIds.length) {
      return NextResponse.json({ error: 'One or more prompts not found' }, { status: 404 })
    }

    // 验证权限
    const unauthorizedPrompt = prompts.find(p => {
      if (targetTeamId) {
        return p.team_id !== targetTeamId
      }
      return p.created_by !== userId
    })

    if (unauthorizedPrompt) {
      return NextResponse.json({ error: 'Unauthorized to use one or more prompts' }, { status: 403 })
    }

    const timestamp = new Date().toISOString()

    // 默认流量分配
    const defaultTrafficAllocation = {
      baseline: 50,
      ...data.variant_prompt_ids.reduce((acc, _, index) => {
        acc[`variant_${String.fromCharCode(97 + index)}`] = Math.floor(50 / data.variant_prompt_ids.length)
        return acc
      }, {})
    }

    const experimentPayload = {
      id: crypto.randomUUID(),
      team_id: targetTeamId,
      name: data.name.trim(),
      description: data.description || null,
      baseline_prompt_id: data.baseline_prompt_id,
      variant_prompt_ids: data.variant_prompt_ids,
      goal_metric: data.goal_metric,
      target_improvement: data.target_improvement || null,
      traffic_allocation: data.traffic_allocation || defaultTrafficAllocation,
      status: 'draft',
      min_sample_size: data.min_sample_size || 100,
      current_sample_size: 0,
      created_by: userId,
      created_at: timestamp,
      updated_at: timestamp
    }

    const { data: newExperiment, error } = await supabase
      .from('ab_test_experiments')
      .insert([experimentPayload])
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(newExperiment, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to create A/B test')
  }
}
