// app/month/page.tsx
import Link from 'next/link';
import { getAllMonths } from '@/lib/events-data';

export default function MonthIndexPage() {
  const months = getAllMonths();

  return (
    <main style={{ minHeight: '100vh', background: '#C5E4F0', padding: '40px 20px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Welcome
        </Link>
        <h1 style={{ fontSize: 48, fontWeight: 900, color: '#1FA3C0', marginTop: 20, textAlign: 'center' }}>
          MONTHLY CALENDARS
        </h1>
        <p style={{ textAlign: 'center', color: '#2D3748', fontSize: 18, marginBottom: 40 }}>
          Browse activities month by month
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {months.map((m) => (
            <Link
              key={m.slug}
              href={`/month/${m.slug}`}
              style={{
                display: 'block',
                background: '#FFFFFF',
                border: '3px solid #000',
                borderRadius: 12,
                padding: 24,
                textAlign: 'center',
                textDecoration: 'none',
                color: '#2D3748',
                boxShadow: '4px 4px 0 rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1FA3C0' }}>{m.month}</div>
              <div style={{ marginTop: 8, fontSize: 14, color: '#666' }}>
                {m.count} {m.count === 1 ? 'activity' : 'activities'}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
