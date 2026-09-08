'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTeam } from '@/contexts/team-context';
import { EvaluationWorkspace } from '@/components/evaluation/EvaluationWorkspace';

function Evaluations() {
  const { activeTeamId } = useTeam();
  const query = useSearchParams();
  const promptId = query.get('promptId') || '', changeRequestId = query.get('changeRequestId') || '', reportId = query.get('reportId') || '';
  return <EvaluationWorkspace key={`${activeTeamId}:${promptId}:${changeRequestId}:${reportId}`} teamId={activeTeamId} promptId={promptId} changeRequestId={changeRequestId} reportId={reportId} />;
}

export default function EvaluationPage() {
  return <Suspense><Evaluations /></Suspense>;
}
