import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

// 记录A/B测试结果
export async function POST(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { supabase } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    const data = await request.json()

    // 验证必填字段
    if (!data.prompt_id) {
      return NextResponse.json({ error: 'Prompt ID is required' }, { status: 400 })
    }
    if (!data.variant_name) {
      return NextResponse.json({ error: 'Variant name is required' }, { status: 400 })
    }

    // 获取实验详情
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

    // 验证实验是否正在运行
    if (experiment.status !== 'running') {
      return NextResponse.json({ error: 'Experiment is not running' }, { status: 400 })
    }

    // 验证prompt_id是否在实验中
    const allPromptIds = [experiment.baseline_prompt_id, ...experiment.variant_prompt_ids]
    if (!allPromptIds.includes(data.prompt_id)) {
      return NextResponse.json({ error: 'Invalid prompt ID for this experiment' }, { status: 400 })
    }

    const resultPayload = {
      id: crypto.randomUUID(),
      experiment_id: id,
      prompt_id: data.prompt_id,
      variant_name: data.variant_name,
      user_id: userId,
      input_text: data.input_text || null,
      output_text: data.output_text || null,
      response_time_ms: data.response_time_ms || null,
      token_count: data.token_count || null,
      cost: data.cost || null,
      user_rating: data.user_rating || null,
      user_feedback: data.user_feedback || null,
      success: data.success !== undefined ? data.success : null,
      created_at: new Date().toISOString()
    }

    const { data: newResult, error: insertError } = await supabase
      .from('ab_test_results')
      .insert([resultPayload])
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // 更新实验的样本数量
    const { error: updateError } = await supabase
      .from('ab_test_experiments')
      .update({
        current_sample_size: experiment.current_sample_size + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Failed to update sample size:', updateError)
    }

    // 检查是否达到最小样本量
    if (experiment.current_sample_size + 1 >= experiment.min_sample_size) {
      // 可以选择自动标记为完成，或者让用户手动标记
      // 这里暂时不自动完成，让用户决定
    }

    return NextResponse.json(newResult, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'Unable to record test result')
  }
}
