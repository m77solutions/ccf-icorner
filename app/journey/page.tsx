import Link from 'next/link';
import { getEventsByJourneyStage } from '@/lib/events-data';
import { STAGES, STAGE_COLORS } from '@/lib/events';

export default function JourneyHubPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#C5E4F0', padding: '40px 20px' }}>
      <style>{`
        .journey-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .journey-card:hover {
          transform: translateY(-6px);
          box-shadow: 10px 10px 0 rgba(0,0,0,0.18);
        }
        .stage-icon {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
          font-size: 64px;
          line-height: 1;
          display: block;
          margin-bottom: 12px;
          font-variant-emoji: emoji;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700 }}>
          ← Back to Welcome
        </Link>

        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#1FA3C0', marginTop: 20, textAlign: 'center', letterSpacing: 1 }}>
          DISCIPLESHIP JOURNEY
        </h1>
        <p style={{ textAlign: 'center', color: '#2D3748', fontSize: 18, marginBottom: 8 }}>
          Where is God leading you next?
        </p>
        <p style={{ textAlign: 'center', color: '#64748B', fontSize: 14, marginBottom: 40, fontStyle: 'italic' }}>
          Engage → Edify → Equip → Empower
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {STAGES.map((stage) => {
            const c = STAGE_COLORS[stage.label];
            const events = getEventsByJourneyStage(stage.id);
            return (
              <Link
                key={stage.id}
                href={`/journey/${stage.id}`}
                className="journey-card"
                style={{
                  display: 'block',
                  background: '#FFFFFF',
                  border: `3px solid ${c.border}`,
                  borderRadius: 16,
                  padding: 24,
                  textDecoration: 'none',
                  color: '#2D3748',
                  boxShadow: '6px 6px 0 rgba(0,0,0,0.15)',
                }}
              >
                <span
                  className="stage-icon"
                  style={{
                    background: c.bg,
                    width: 88,
                    height: 88,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 14,
                    border: `3px solid ${c.border}`,
                  }}
                >
                  {stage.icon}
                </span>
                <h2 style={{ fontSize: 26, fontWeight: 900, color: c.text, margin: 0, letterSpacing: 0.5 }}>
                  {stage.label.toUpperCase()}
                </h2>
                <p style={{ fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 1.5 }}>
                  {stage.description}
                </p>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 10, fontStyle: 'italic', lineHeight: 1.4 }}>
                  {stage.audience}
                </p>
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14,
                    borderTop: `2px solid ${c.bg}`,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>
                    {events.length} {events.length === 1 ? 'activity' : 'activities'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#C62828' }}>
                    Explore →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <p style={{ textAlign: 'center', color: '#64748B', fontSize: 13, marginTop: 40, fontStyle: 'italic' }}>
          💡 Not sure which stage you&apos;re in? Ask the Welcome Center Assistant 💬
        </p>
      </div>
    </main>
  );
}
