'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { defaultAbTestsTranslations } from "@/lib/translations/ab-tests";

export default function ABTestsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const abTests = t?.abTests ?? defaultAbTestsTranslations;
  const [experiments, setExperiments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadExperiments();
  }, [filter]);

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }

      const response = await fetch(`/api/ab-tests?${params}`);
      const data = await response.json();

      if (response.ok) {
        setExperiments(data.experiments);
      } else {
        throw new Error(data.error || 'Failed to load experiments');
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
      toast({
        title: abTests.common.errorTitle,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: abTests.common.status.draft, variant: 'secondary' },
      running: { label: abTests.common.status.running, variant: 'default' },
      completed: { label: abTests.common.status.completed, variant: 'outline' },
      stopped: { label: abTests.common.status.stopped, variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getGoalMetricLabel = (metric) => {
    return abTests.common.goalMetrics[metric] || metric;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{abTests.list.title}</h1>
          <p className="text-muted-foreground">
            {abTests.list.subtitle}
          </p>
        </div>
        <Button onClick={() => router.push('/ab-tests/new')}>
          <Plus className="w-4 h-4 mr-2" />
          {abTests.list.createButton}
        </Button>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-2 mb-6">
        {['all', 'draft', 'running', 'completed', 'stopped'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? abTests.list.filters.all : getStatusBadge(status).props.children}
          </Button>
        ))}
      </div>

      {/* 实验列表 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">{abTests.list.loading}</p>
        </div>
      ) : experiments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{abTests.list.empty.title}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {abTests.list.empty.description}
            </p>
            <Button onClick={() => router.push('/ab-tests/new')}>
              <Plus className="w-4 h-4 mr-2" />
              {abTests.list.empty.action}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((experiment) => (
            <Card
              key={experiment.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/ab-tests/${experiment.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg">{experiment.name}</CardTitle>
                  {getStatusBadge(experiment.status)}
                </div>
                {experiment.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {experiment.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">{abTests.list.card.goalMetric}</span>
                    <span className="ml-1 font-medium">
                      {getGoalMetricLabel(experiment.goal_metric)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">{abTests.list.card.sampleSize}</span>
                    <span className="ml-1 font-medium">
                      {experiment.current_sample_size} / {experiment.min_sample_size}
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {experiment.started_at
                        ? abTests.list.card.startedAt.replace(
                            '{date}',
                            new Date(experiment.started_at).toLocaleDateString()
                          )
                        : abTests.list.card.notStarted}
                    </span>
                  </div>

                  {/* 进度条 */}
                  {experiment.status === 'running' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{abTests.list.card.progress}</span>
                        <span className="font-medium">
                          {Math.min(
                            100,
                            Math.round(
                              (experiment.current_sample_size / experiment.min_sample_size) * 100
                            )
                          )}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              (experiment.current_sample_size / experiment.min_sample_size) * 100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
