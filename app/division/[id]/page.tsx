import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import {
  getEventsByDivision,
  getEntitiesInDivision,
} from '@/lib/events-data';
import {
  DIVISIONS,
  getDivisionById,
  STAGE_COLORS,
} from '@/lib/events';
import DivisionViewClient from '@/components/DivisionViewClient';

export function generateStaticParams() {
  return DIVISIONS.map((d) => ({ id: d.id }));
}

export default async function DivisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const division = getDivisionById(id);
  if (!division) notFound();

  const events = getEventsByDivision(division.id);
  const entities = getEntitiesInDivision(division.id);

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#C5E4F0' }} />}>
      <DivisionViewClient
        division={division}
        events={events}
        entities={entities}
        stageColors={STAGE_COLORS}
      />
    </Suspense>
  );
}
