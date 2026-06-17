import Link from 'next/link';
import { getEventsByDivision } from '@/lib/events-data';
import { DIVISIONS } from '@/lib/events';

export default function DivisionIndexPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#C5E4F0', padding: '40px 20px' }}>
      <style>{`
        .division-card {
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .division-card:hover {
          transform: translateY(-6px);
          box-shadow: 10px 10px 0 rgba(0,0,0,0.18);
        }
        .division-icon {
  font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
  font-size: 64px;
  line-height: 1;
  display: block;
  margin-bottom: 12px;
  font-variant-emoji: emoji;
  text-rendering: optimizeLegibility;
}

      `}</style>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700 }}>
          ← Back to Welcome
        </Link>

        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#1FA3C0', marginTop: 20, textAlign: 'center', letterSpacing: 1 }}>
  ORGANIZERS&apos; CALENDAR
</h1>

        <p style={{ textAlign: 'center', color: '#2D3748', fontSize: 18, marginBottom: 40 }}>
          What is each part of CCF doing next?
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {DIVISIONS.map((d) => {
            const events = getEventsByDivision(d.id);
            return (
              <Link
                key={d.id}
                href={`/division/${d.id}`}
                className="division-card"
                style={{
                  display: 'block',
                  background: '#FFFFFF',
                  border: `3px solid #000`,
                  borderRadius: 16,
                  padding: 28,
                  textDecoration: 'none',
                  color: '#2D3748',
                  boxShadow: '6px 6px 0 rgba(0,0,0,0.15)',
                }}
              >
                <span className="division-icon">{d.icon}</span>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: d.color, margin: 0 }}>
                  {d.label}
                </h2>
                <p style={{ fontSize: 14, color: '#475569', marginTop: 6 }}>
                  {d.description}
                </p>
                <div
                  style={{
                    marginTop: 18,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 14,
                    borderTop: '2px solid #E5E7EB',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                    {events.length} {events.length === 1 ? 'event' : 'events'}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#C62828' }}>
                    Explore →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
