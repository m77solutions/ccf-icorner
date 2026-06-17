import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getEventsByJourneyStage } from '@/lib/events-data';
import {
  STAGES,
  getStageById,
  STAGE_COLORS,
} from '@/lib/events';
import JourneyStageClient from '@/components/JourneyStageClient';

export function generateStaticParams() {
  return STAGES.map((s) => ({ stage: s.id }));
}

export default async function JourneyStagePage({
  params,
}: {
  params: Promise<{ stage: string }>;
}) {
  const { stage: stageId } = await params;
  const stage = getStageById(stageId);
  if (!stage) notFound();

  const events = getEventsByJourneyStage(stage.id);

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#C5E4F0' }} />}>
      <JourneyStageClient stage={stage} events={events} stageColors={STAGE_COLORS} />
    </Suspense>
  );
}
