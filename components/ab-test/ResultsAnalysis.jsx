'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Trophy, AlertCircle } from "lucide-react";

export default function ResultsAnalysis({ results }) {
  if (!results) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">暂无测试结果</p>
      </div>
    );
  }

  const { experiment, baseline, variants, winner, isComplete } = results;

  const getMetricLabel = (metric) => {
    const labels = {
      user_rating: '平均评分',
      cost: '平均成本',
      success_rate: '成功率',
      response_time: '响应时间'
    };
    return labels[metric] || metric;
  };

  const getMetricValue = (stats, metric) => {
    switch (metric) {
      case 'user_rating':
        return stats.avgRating.toFixed(2);
      case 'cost':
        return `$${stats.avgCost.toFixed(4)}`;
      case 'success_rate':
        return `${stats.successRate.toFixed(1)}%`;
      case 'response_time':
        return `${stats.avgResponseTime.toFixed(0)}ms`;
      default:
        return 'N/A';
    }
  };

  const getImprovementIcon = (improvement) => {
    if (improvement > 5) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (improvement < -5) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 5) return 'text-green-600';
    if (improvement < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* 整体状态 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>测试概况</CardTitle>
            {isComplete ? (
              <Badge variant="default">测试完成</Badge>
            ) : (
              <Badge variant="secondary">进行中</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">目标指标</div>
              <div className="text-lg font-semibold">{getMetricLabel(experiment.goalMetric)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">样本量</div>
              <div className="text-lg font-semibold">
                {experiment.currentSampleSize} / {experiment.minSampleSize}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">完成度</div>
              <div className="text-lg font-semibold">
                {Math.min(100, Math.round((experiment.currentSampleSize / experiment.minSampleSize) * 100))}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">目标提升</div>
              <div className="text-lg font-semibold">
                {experiment.targetImprovement ? `${experiment.targetImprovement}%` : 'N/A'}
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{
                  width: `${Math.min(100, (experiment.currentSampleSize / experiment.minSampleSize) * 100)}%`
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 获胜者 */}
      {winner && isComplete && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <CardTitle>获胜版本</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{winner.name.toUpperCase()}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  在 {getMetricLabel(experiment.goalMetric)} 指标上表现最佳
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {getMetricValue(winner.stats, experiment.goalMetric)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 详细对比 */}
      <Card>
        <CardHeader>
          <CardTitle>详细对比</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 基准版本 */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">基准版本 (Baseline)</div>
                  <div className="text-sm text-muted-foreground">样本数: {baseline.stats.count}</div>
                </div>
                {winner && winner.name === 'baseline' && (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">平均评分</div>
                  <div className="text-lg font-semibold">{baseline.stats.avgRating.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">平均成本</div>
                  <div className="text-lg font-semibold">${baseline.stats.avgCost.toFixed(4)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">成功率</div>
                  <div className="text-lg font-semibold">{baseline.stats.successRate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">响应时间</div>
                  <div className="text-lg font-semibold">{baseline.stats.avgResponseTime.toFixed(0)}ms</div>
                </div>
              </div>
            </div>

            {/* 变体版本 */}
            {variants.map((variant, index) => {
              const calculateImprovement = (baseValue, variantValue, metric) => {
                if (baseValue === 0) return 0;
                // 对于cost和response_time，降低是改进
                if (metric === 'cost' || metric === 'response_time') {
                  return ((baseValue - variantValue) / baseValue) * 100;
                }
                // 对于其他指标，增加是改进
                return ((variantValue - baseValue) / baseValue) * 100;
              };

              const improvement = calculateImprovement(
                experiment.goalMetric === 'user_rating' ? baseline.stats.avgRating :
                experiment.goalMetric === 'cost' ? baseline.stats.avgCost :
                experiment.goalMetric === 'success_rate' ? baseline.stats.successRate :
                baseline.stats.avgResponseTime,
                experiment.goalMetric === 'user_rating' ? variant.stats.avgRating :
                experiment.goalMetric === 'cost' ? variant.stats.avgCost :
                experiment.goalMetric === 'success_rate' ? variant.stats.successRate :
                variant.stats.avgResponseTime,
                experiment.goalMetric
              );

              return (
                <div key={variant.name} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        变体 {variant.name.replace('variant_', '').toUpperCase()}
                        {improvement !== 0 && (
                          <div className={`flex items-center gap-1 ${getImprovementColor(improvement)}`}>
                            {getImprovementIcon(improvement)}
                            <span className="text-sm font-medium">
                              {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">样本数: {variant.stats.count}</div>
                    </div>
                    {winner && winner.name === variant.name && (
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">平均评分</div>
                      <div className="text-lg font-semibold">{variant.stats.avgRating.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">平均成本</div>
                      <div className="text-lg font-semibold">${variant.stats.avgCost.toFixed(4)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">成功率</div>
                      <div className="text-lg font-semibold">{variant.stats.successRate.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">响应时间</div>
                      <div className="text-lg font-semibold">{variant.stats.avgResponseTime.toFixed(0)}ms</div>
                    </div>
                  </div>

                  {/* 显著性提示 */}
                  {variant.significance && (
                    <div className={`mt-3 text-xs p-2 rounded ${
                      variant.significance.isSignificant 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {variant.significance.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 建议 */}
      {!isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>测试建议</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500" />
                <span>
                  还需要 <strong>{experiment.minSampleSize - experiment.currentSampleSize}</strong> 个样本才能得出可靠结论
                </span>
              </p>
              <p className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500" />
                <span>建议在不同时间段和用户群体中进行测试，以获得更全面的数据</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
