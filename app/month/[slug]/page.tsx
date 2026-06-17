import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAllMonths, getEventsByMonth } from '@/lib/events-data';
import { STAGE_COLORS } from '@/lib/events';

import MonthViewClient from '@/components/MonthViewClient';

export function generateStaticParams() {
  return getAllMonths().map((m) => ({ slug: m.slug }));
}

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default async function MonthPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const events = getEventsByMonth(slug);
  const months = getAllMonths();
  const current = months.find((m) => m.slug === slug);
  if (!current) notFound();

const [monthName, yearStr] = current.month.split(' ');
const year = parseInt(yearStr, 10);
const monthIdx = new Date(`${monthName} 1, ${yearStr}`).getMonth();


  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#C5E4F0' }} />}>
      <MonthViewClient
        slug={slug}
        monthLabel={current.month}
        year={year}
        monthIdx={monthIdx}
        events={events}
        months={months}
        stageColors={STAGE_COLORS}
      />
    </Suspense>
  );
}
