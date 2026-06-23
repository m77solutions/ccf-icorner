'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ViewSwitcher, { type ViewMode } from './ViewSwitcher';
import EventDetailModal from './EventDetailModal';
import type { CCFEvent, JourneyStage } from '@/lib/events';
import { eventOccursOnDay } from '@/lib/events';

type StageColorMap = Record<JourneyStage, { bg: string; text: string; border: string }>;

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parseISO(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function sameYearMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function buildGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function eventsOnDay(events: CCFEvent[], day: Date): CCFEvent[] {
  const y = day.getFullYear();
  const m = String(day.getMonth() + 1).padStart(2, '0');
  const d = String(day.getDate()).padStart(2, '0');
  const dayISO = `${y}-${m}-${d}`;
  return events.filter((e) => eventOccursOnDay(e, dayISO));
}

function weekOfMonth(date: Date): number {
  return Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
}

function formatExtra(e: CCFEvent): string {
  const parts: string[] = [`📍 ${e.location}`];
  if (e.timeLabel) parts.push(`⏰ ${e.timeLabel}`);
  if (e.cost !== null) parts.push(`₱${e.cost.toLocaleString()}`);
  return parts.join(' · ');
}

export default function MonthViewClient({
  slug,
  monthLabel,
  year,
  monthIdx,
  events,
  months,
  stageColors,
}: {
  slug: string;
  monthLabel: string;
  year: number;
  monthIdx: number;
  events: CCFEvent[];
  months: { month: string; slug: string; count: number }[];
  stageColors: StageColorMap;
}) {
  const sp = useSearchParams();
  const viewParam = sp.get('view');
  const view: ViewMode =
    viewParam === 'calendar' || viewParam === 'list' || viewParam === 'timeline'
      ? viewParam
      : 'calendar';
  const [selectedEvent, setSelectedEvent] = useState<CCFEvent | null>(null);
  const monthDate = new Date(year, monthIdx, 1);

  return (
    <main style={{ minHeight: '100vh', background: '#C5E4F0', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>← Welcome</Link>
          <Link href="/month" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>All Months →</Link>
        </div>

        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#1FA3C0', textAlign: 'center', margin: '8px 0', letterSpacing: 1 }}>
          {monthLabel.toUpperCase()}
        </h1>
        <p style={{ textAlign: 'center', color: '#2D3748', fontSize: 16, marginBottom: 16 }}>
          {events.length} {events.length === 1 ? 'activity' : 'activities'} this month
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <ViewSwitcher current={view} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
          {months.map((m) => (
            <Link
              key={m.slug}
              href={`/month/${m.slug}?view=${view}`}
              style={{
                padding: '8px 18px',
                borderRadius: 999,
                border: '2px solid #000',
                background: m.slug === slug ? '#1FA3C0' : '#FFFFFF',
                color: m.slug === slug ? '#FFFFFF' : '#2D3748',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {m.month}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {(['Engage', 'Edify', 'Equip', 'Empower'] as const).map((stage) => {
            const c = stageColors[stage];
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: c.border, border: '1px solid #000' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2D3748' }}>{stage}</span>
              </div>
            );
          })}
        </div>

        {view === 'calendar' && (
          <CalendarView year={year} monthIdx={monthIdx} monthDate={monthDate} events={events} stageColors={stageColors} onEventClick={setSelectedEvent} />
        )}
        {view === 'list' && (
          <ListView events={events} stageColors={stageColors} onEventClick={setSelectedEvent} />
        )}
        {view === 'timeline' && (
          <TimelineView events={events} monthLabel={monthLabel} stageColors={stageColors} onEventClick={setSelectedEvent} />
        )}

        <EventDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          stageColors={stageColors}
        />
      </div>
    </main>
  );
}

function CalendarView({
  year,
  monthIdx,
  monthDate,
  events,
  stageColors,
  onEventClick,
}: {
  year: number;
  monthIdx: number;
  monthDate: Date;
  events: CCFEvent[];
  stageColors: StageColorMap;
  onEventClick: (e: CCFEvent) => void;
}) {
  const grid = buildGrid(year, monthIdx);
  return (
    <div style={{ background: '#FFFFFF', border: '3px solid #000', borderRadius: 12, overflow: 'hidden', boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#1FA3C0' }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ padding: '12px 8px', textAlign: 'center', color: '#FFF', fontWeight: 800, fontSize: 14, letterSpacing: 1, borderRight: '1px solid rgba(255,255,255,0.3)' }}>
            {w}
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(120px, auto)' }}>
        {grid.map((day, idx) => {
          const inMonth = sameYearMonth(day, monthDate);
          const dayEvents = inMonth ? eventsOnDay(events, day) : [];
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div
              key={idx}
              style={{
                borderTop: '1px solid #E5E7EB',
                borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #E5E7EB',
                background: !inMonth ? '#F3F4F6' : isWeekend ? '#FAFCFE' : '#FFFFFF',
                padding: 6,
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                minWidth: 0,
                overflow: 'hidden',
                opacity: inMonth ? 1 : 0.45,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: inMonth ? '#0F172A' : '#94A3B8', textAlign: 'right', padding: '2px 4px' }}>
                {day.getDate()}
              </div>
              {dayEvents.slice(0, 3).map((e) => {
                const c = e.isConference
                  ? { bg: '#F3E8FF', text: '#9333EA', border: '#9333EA' }
                  : stageColors[e.journeyStage];
                return (
                  <div
                    key={`${e.id}-${e.startDate}`}
                    title={`${e.activity} — ${e.activityDetail}`}
                    onClick={() => onEventClick(e)}
                    style={{
                      background: c.bg,
                      borderLeft: `4px solid ${c.border}`,
                      color: c.text,
                      padding: '4px 6px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                    }}
                  >
                    {e.activity}
                  </div>
                );
              })}
              {dayEvents.length > 3 && (
                <div style={{ fontSize: 10, color: '#64748B', fontWeight: 700, padding: '0 4px' }}>
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ListView({
  events,
  stageColors,
  onEventClick,
}: {
  events: CCFEvent[];
  stageColors: StageColorMap;
  onEventClick: (e: CCFEvent) => void;
}) {
  if (events.length === 0) {
    return <p style={{ textAlign: 'center', color: '#64748B' }}>No activities this month.</p>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      {events.map((e) => {
        const c = e.isConference
                  ? { bg: '#F3E8FF', text: '#9333EA', border: '#9333EA' }
                  : stageColors[e.journeyStage];
        const timeBit = e.timeLabel ? ` · ${e.timeLabel}` : '';
        return (
          <div
            key={`${e.id}-${e.startDate}`}
            onClick={() => onEventClick(e)}
            style={{
              background: '#FFF',
              border: `3px solid ${c.border}`,
              borderRadius: 12,
              padding: 18,
              boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ background: c.bg, color: c.text, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                {e.isConference ? 'CONFERENCE' : e.journeyStage}
              </span>
              {e.regStatus !== 'N/A' && (
                <span style={{ background: e.regStatus === 'OPEN' ? '#16A34A' : '#9CA3AF', color: '#FFF', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                  {e.regStatus}
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 12 }}>{e.activity}</h3>
            <p style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>{e.activityDetail}</p>
            <div style={{ marginTop: 14, fontSize: 14, color: '#2D3748', lineHeight: 1.8 }}>
              <div>📅 <strong>{e.dateLabel}</strong>{timeBit}</div>
              <div>📍 {e.location}</div>
              <div>👥 {e.originator}</div>
              {e.cost !== null && <div>💰 ₱{e.cost.toLocaleString()}</div>}
              {e.platform && <div>🔗 {e.platform}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({
  events,
  monthLabel,
  stageColors,
  onEventClick,
}: {
  events: CCFEvent[];
  monthLabel: string;
  stageColors: StageColorMap;
  onEventClick: (e: CCFEvent) => void;
}) {
  if (events.length === 0) {
    return <p style={{ textAlign: 'center', color: '#64748B' }}>No activities this month.</p>;
  }
  const byWeek = new Map<number, CCFEvent[]>();
  for (const e of events) {
    const w = weekOfMonth(parseISO(e.startDate));
    if (!byWeek.has(w)) byWeek.set(w, []);
    byWeek.get(w)!.push(e);
  }
  const weeks = Array.from(byWeek.entries()).sort(([a], [b]) => a - b);

  return (
    <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 24, boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
      {weeks.map(([weekNum, weekEvents]) => (
        <div key={weekNum} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ background: '#1FA3C0', color: '#FFF', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
              WEEK {weekNum}
            </span>
            <div style={{ flex: 1, height: 2, background: '#E5E7EB' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 16, borderLeft: '3px dashed #1FA3C0' }}>
            {weekEvents.map((e) => {
              const c = e.isConference
                  ? { bg: '#F3E8FF', text: '#9333EA', border: '#9333EA' }
                  : stageColors[e.journeyStage];
              return (
                <div
                  key={`${e.id}-${e.startDate}`}
                  onClick={() => onEventClick(e)}
                  style={{
                    display: 'flex',
                    gap: 14,
                    alignItems: 'flex-start',
                    background: c.bg,
                    borderLeft: `5px solid ${c.border}`,
                    padding: 12,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ minWidth: 90, fontWeight: 800, color: c.text, fontSize: 14 }}>{e.dateLabel}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ color: '#0F172A', fontSize: 16 }}>{e.activity}</strong>
                      <span style={{ background: '#FFF', color: c.text, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                        {e.isConference ? 'CONFERENCE' : e.journeyStage.toUpperCase()}
                      </span>
                      {e.regStatus !== 'N/A' && (
                        <span style={{ background: e.regStatus === 'OPEN' ? '#16A34A' : '#9CA3AF', color: '#FFF', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                          {e.regStatus}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{e.activityDetail}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>{formatExtra(e)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 20 }}>
        Timeline view · {monthLabel} · grouped by week
      </p>
    </div>
  );
}
