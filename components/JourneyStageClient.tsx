'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ViewSwitcher, { type ViewMode } from './ViewSwitcher';
import EventDetailModal from './EventDetailModal';
import type { CCFEvent, JourneyStage, StageInfo } from '@/lib/events';

type StageColorMap = Record<JourneyStage, { bg: string; text: string; border: string }>;

export default function JourneyStageClient({
  stage,
  events,
  stageColors,
}: {
  stage: StageInfo;
  events: CCFEvent[];
  stageColors: StageColorMap;
}) {
  const sp = useSearchParams();
  const viewParam = sp.get('view');
  const view: ViewMode =
    viewParam === 'calendar' || viewParam === 'list' || viewParam === 'timeline'
      ? viewParam
      : 'list';

  const [selectedEvent, setSelectedEvent] = useState<CCFEvent | null>(null);
  const c = stageColors[stage.label];

  // Group events by month
  const byMonth = new Map<string, CCFEvent[]>();
  for (const e of events) {
    if (!byMonth.has(e.month)) byMonth.set(e.month, []);
    byMonth.get(e.month)!.push(e);
  }
  const monthsInOrder = Array.from(byMonth.entries()).sort(([, a], [, b]) =>
    a[0].startDate.localeCompare(b[0].startDate)
  );

  return (
    <main style={{ minHeight: '100vh', background: '#C5E4F0', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
            ← Welcome
          </Link>
          <Link href="/journey" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
            All Stages →
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: c.bg,
              width: 96,
              height: 96,
              borderRadius: '50%',
              border: `4px solid ${c.border}`,
              fontSize: 56,
              fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif',
            }}
          >
            {stage.icon}
          </span>
          <h1 style={{ fontSize: 52, fontWeight: 900, color: c.text, margin: '12px 0 4px', letterSpacing: 1 }}>
            {stage.label.toUpperCase()}
          </h1>
          <p style={{ color: '#2D3748', fontSize: 17, maxWidth: 640, margin: '0 auto' }}>
            {stage.description}
          </p>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 6, fontStyle: 'italic' }}>
            {stage.audience}
          </p>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 8 }}>
            {events.length} {events.length === 1 ? 'activity' : 'activities'} in this stage
          </p>
        </div>

        {/* Stage progression breadcrumb */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {(['Engage', 'Edify', 'Equip', 'Empower'] as const).map((label, idx) => {
            const sc = stageColors[label];
            const id = label.toLowerCase();
            const isActive = stage.label === label;
            return (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Link
                  href={`/journey/${id}?view=${view}`}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: `2px solid ${isActive ? sc.border : '#CBD5E1'}`,
                    background: isActive ? sc.bg : '#FFFFFF',
                    color: isActive ? sc.text : '#64748B',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {label}
                </Link>
                {idx < 3 && <span style={{ color: '#94A3B8', fontWeight: 800 }}>→</span>}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <ViewSwitcher current={view} />
        </div>

        {events.length === 0 && (
          <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 40, textAlign: 'center', boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize: 18, color: '#475569', margin: 0 }}>
              No activities scheduled for the <strong>{stage.label}</strong> stage right now.
            </p>
            <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 12 }}>
              Check back soon or explore other stages above.
            </p>
          </div>
        )}

        {/* LIST VIEW */}
        {view === 'list' && events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {monthsInOrder.map(([month, monthEvents]) => (
              <section key={month}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: c.text, marginBottom: 12 }}>
                  {month}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                  {monthEvents.map((e) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      stageColors={stageColors}
                      onClick={() => setSelectedEvent(e)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* TIMELINE VIEW */}
        {view === 'timeline' && events.length > 0 && (
          <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 24, boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
            {monthsInOrder.map(([month, monthEvents]) => (
              <div key={month} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ background: c.border, color: '#FFF', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
                    {month.toUpperCase()}
                  </span>
                  <div style={{ flex: 1, height: 2, background: '#E5E7EB' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 16, borderLeft: `3px dashed ${c.border}` }}>
                  {monthEvents.map((e) => {
                    const ec = e.isConference
                    ? { bg: '#F3E8FF', fg: '#9333EA', border: '#9333EA' }
                    : stageColors[e.journeyStage];
                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        style={{
                          display: 'flex',
                          gap: 14,
                          alignItems: 'flex-start',
                          background: ec.bg,
                          borderLeft: `5px solid ${ec.border}`,
                          padding: 12,
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ minWidth: 90, fontWeight: 800, color: ec.text, fontSize: 14 }}>{e.dateLabel}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <strong style={{ color: '#0F172A', fontSize: 16 }}>{e.activity}</strong>
                            {e.regStatus !== 'N/A' && (
                              <span style={{ background: e.regStatus === 'OPEN' ? '#16A34A' : '#9CA3AF', color: '#FFF', padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 800 }}>
                                {e.regStatus}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#334155', marginTop: 4 }}>{e.activityDetail}</div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>👥 {e.originator} · 📍 {e.location}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CALENDAR VIEW — redirect to monthly calendar */}
        {view === 'calendar' && events.length > 0 && (
          <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 32, textAlign: 'center', boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
            <p style={{ fontSize: 16, color: '#2D3748', marginBottom: 20 }}>
              Calendar view shows all CCF events. Pick a month to see {stage.label} activities in context:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
              {monthsInOrder.map(([month, monthEvents]) => {
                const slug = month.toLowerCase().replace(' ', '-');
                return (
                  <Link
                    key={month}
                    href={`/month/${slug}?view=calendar`}
                    style={{
                      padding: '12px 24px',
                      background: c.border,
                      color: '#FFF',
                      borderRadius: 999,
                      textDecoration: 'none',
                      fontWeight: 700,
                      border: '2px solid #000',
                      boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                    }}
                  >
                    {month} ({monthEvents.length})
                  </Link>
                );
              })}
            </div>
          </div>
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

function EventCard({
  event: e,
  stageColors,
  onClick,
}: {
  event: CCFEvent;
  stageColors: StageColorMap;
  onClick: () => void;
}) {
  const c = stageColors[e.journeyStage];
  const timeBit = e.timeLabel ? ` · ${e.timeLabel}` : '';
  return (
    <div
      onClick={onClick}
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
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginTop: 10 }}>{e.activity}</h3>
      <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>{e.activityDetail}</p>
      <div style={{ marginTop: 12, fontSize: 13, color: '#2D3748', lineHeight: 1.7 }}>
        <div>📅 <strong>{e.dateLabel}</strong>{timeBit}</div>
        <div>📍 {e.location}</div>
        <div>👥 {e.originator}</div>
        {e.cost !== null && <div>💰 ₱{e.cost.toLocaleString()}</div>}
      </div>
    </div>
  );
}
