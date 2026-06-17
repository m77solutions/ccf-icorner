'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ViewSwitcher, { type ViewMode } from './ViewSwitcher';
import EventDetailModal from './EventDetailModal';
import type { CCFEvent, Division, JourneyStage } from '@/lib/events';

type StageColorMap = Record<JourneyStage, { bg: string; text: string; border: string }>;

export default function DivisionViewClient({
  division,
  events,
  entities,
  stageColors,
}: {
  division: Division;
  events: CCFEvent[];
  entities: { id: string; label: string; count: number }[];
  stageColors: StageColorMap;
}) {
  const sp = useSearchParams();
  const viewParam = sp.get('view');
  const view: ViewMode =
    viewParam === 'calendar' || viewParam === 'list' || viewParam === 'timeline'
      ? viewParam
      : 'list';

  const entityFilter = sp.get('entity');
  const [selectedEvent, setSelectedEvent] = useState<CCFEvent | null>(null);

  // Filter events by selected entity
  const filtered = entityFilter
    ? events.filter((e) => e.originator.toLowerCase().replace(/[^a-z0-9]+/g, '-') === entityFilter)
    : events;

  // Group by month for display
  const byMonth = new Map<string, CCFEvent[]>();
  for (const e of filtered) {
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
          <Link href="/division" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
  All Organizers →
</Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 48 }}>{division.icon}</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: division.color, margin: '8px 0', letterSpacing: 1 }}>
            {division.label.toUpperCase()}
          </h1>
          <p style={{ color: '#2D3748', fontSize: 16 }}>{division.description}</p>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 4 }}>
            {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
            {entityFilter && ` · filtered by ${filtered[0]?.originator ?? entityFilter}`}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <ViewSwitcher current={view} />
        </div>

        {/* Entity filter pills */}
        {entities.length > 1 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textAlign: 'center', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Filter by entity
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <Link
                href={`/division/${division.id}?view=${view}`}
                style={pillStyle(!entityFilter, division.color)}
              >
                All ({events.length})
              </Link>
              {entities.map((ent) => (
                <Link
                  key={ent.id}
                  href={`/division/${division.id}?view=${view}&entity=${ent.id}`}
                  style={pillStyle(entityFilter === ent.id, division.color)}
                >
                  {ent.label} ({ent.count})
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stage legend */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          {(['Engage', 'Edify', 'Equip', 'Empower'] as const).map((stage) => {
            const c = stageColors[stage];
            return (
              <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: c.border, border: '1px solid #000' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2D3748' }}>{stage}</span>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: '#64748B', padding: 40 }}>
            No events found for this filter.
          </p>
        )}

        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {monthsInOrder.map(([month, monthEvents]) => (
              <section key={month}>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: division.color, marginBottom: 12 }}>
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

        {view === 'timeline' && (
          <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 24, boxShadow: '6px 6px 0 rgba(0,0,0,0.15)' }}>
            {monthsInOrder.map(([month, monthEvents]) => (
              <div key={month} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ background: division.color, color: '#FFF', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 800 }}>
                    {month.toUpperCase()}
                  </span>
                  <div style={{ flex: 1, height: 2, background: '#E5E7EB' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingLeft: 16, borderLeft: `3px dashed ${division.color}` }}>
                  {monthEvents.map((e) => {
                    const c = stageColors[e.journeyStage];
                    return (
                      <div
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
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
                              {e.journeyStage.toUpperCase()}
                            </span>
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

        {/* Calendar view = link out to monthly calendars */}
        {view === 'calendar' && (
          <div style={{ background: '#FFF', border: '3px solid #000', borderRadius: 12, padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#2D3748', marginBottom: 20 }}>
              Calendar view shows all CCF events. Browse by month:
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
                      background: division.color,
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

function pillStyle(active: boolean, color: string): React.CSSProperties {
  return {
    padding: '6px 14px',
    borderRadius: 999,
    border: '2px solid #000',
    background: active ? color : '#FFFFFF',
    color: active ? '#FFFFFF' : '#2D3748',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: 12,
  };
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
          {e.journeyStage}
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
