import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth.js'
import { resolveTeamContext } from '@/lib/team-request.js'
import { handleApiError } from '@/lib/handle-api-error.js'

// 计算统计指标
function calculateStatistics(results, promptId) {
  const promptResults = results.filter(r => r.prompt_id === promptId)
  
  if (promptResults.length === 0) {
    return {
      count: 0,
      avgRating: 0,
      avgCost: 0,
      avgResponseTime: 0,
      successRate: 0,
      totalTokens: 0
    }
  }

  const ratings = promptResults.filter(r => r.user_rating).map(r => r.user_rating)
  const costs = promptResults.filter(r => r.cost).map(r => parseFloat(r.cost))
  const responseTimes = promptResults.filter(r => r.response_time_ms).map(r => r.response_time_ms)
  const successes = promptResults.filter(r => r.success !== null).map(r => r.success)
  const tokens = promptResults.filter(r => r.token_count).map(r => r.token_count)

  return {
    count: promptResults.length,
    avgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
    avgResponseTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
    successRate: successes.length > 0 ? successes.filter(s => s).length / successes.length * 100 : 0,
    totalTokens: tokens.length > 0 ? tokens.reduce((a, b) => a + b, 0) : 0
  }
}

// 计算统计显著性（简化版）
function calculateSignificance(baselineStats, variantStats) {
  // 这是一个简化的显著性检测
  // 实际应用中应该使用更严格的统计检验（如t-test）
  
  if (baselineStats.count < 30 || variantStats.count < 30) {
    return {
      isSignificant: false,
      message: 'Need at least 30 samples per variant for statistical significance'
    }
  }

  const improvement = ((variantStats.avgRating - baselineStats.avgRating) / baselineStats.avgRating) * 100
  
  // 简单规则：改进超过10%且样本量足够
  if (Math.abs(improvement) > 10) {
    return {
      isSignificant: true,
      improvement: improvement,
      message: `${improvement > 0 ? 'Positive' : 'Negative'} impact detected`
    }
  }

  return {
    isSignificant: false,
    improvement: improvement,
    message: 'No significant difference detected'
  }
}

// 获取A/B测试结果
export async function GET(request, { params }) {
  try {
    const userId = await requireUserId()
    const { id } = await params
    const { supabase } = await resolveTeamContext(request, userId, {
      requireMembership: false,
      allowMissingTeam: true
    })

    // 获取实验详情
    const { data: experiment, error: experimentError } = await supabase
      .from('ab_test_experiments')
      .select('*')
      .eq('id', id)
      .single()

    if (experimentError) {
      if (experimentError.code === 'PGRST116') {
        return NextResponse.json({ error: 'A/B test not found' }, { status: 404 })
      }
      throw experimentError
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

    // 获取所有测试结果
    const { data: results, error: resultsError } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('experiment_id', id)
      .order('created_at', { ascending: false })

    if (resultsError) {
      throw resultsError
    }

    // 计算每个变体的统计数据
    const baselineStats = calculateStatistics(results, experiment.baseline_prompt_id)
    
    const variantStats = experiment.variant_prompt_ids.map((variantId, index) => {
      const stats = calculateStatistics(results, variantId)
      const variantName = `variant_${String.fromCharCode(97 + index)}`
      const significance = calculateSignificance(baselineStats, stats)
      
      return {
        promptId: variantId,
        name: variantName,
        stats,
        significance
      }
    })

    // 确定获胜者
    let winner = null
    const goalMetric = experiment.goal_metric

    if (baselineStats.count > 0 && variantStats.length > 0) {
      const allVariants = [
        { promptId: experiment.baseline_prompt_id, name: 'baseline', stats: baselineStats },
        ...variantStats
      ]

      // 根据目标指标排序
      allVariants.sort((a, b) => {
        switch (goalMetric) {
          case 'user_rating':
            return b.stats.avgRating - a.stats.avgRating
          case 'cost':
            return a.stats.avgCost - b.stats.avgCost // 成本越低越好
          case 'success_rate':
            return b.stats.successRate - a.stats.successRate
          case 'response_time':
            return a.stats.avgResponseTime - b.stats.avgResponseTime // 时间越短越好
          default:
            return 0
        }
      })

      winner = allVariants[0]
    }

    const analysisResults = {
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        goalMetric: experiment.goal_metric,
        currentSampleSize: experiment.current_sample_size,
        minSampleSize: experiment.min_sample_size,
        targetImprovement: experiment.target_improvement
      },
      baseline: {
        promptId: experiment.baseline_prompt_id,
        name: 'baseline',
        stats: baselineStats
      },
      variants: variantStats,
      winner: winner,
      totalResults: results.length,
      isComplete: experiment.current_sample_size >= experiment.min_sample_size
    }

    return NextResponse.json(analysisResults)
  } catch (error) {
    return handleApiError(error, 'Unable to load A/B test results')
  }
}
