// app/events/[slug]/page.tsx
// Individual event pages, one per active CCF event.
// URL pattern: /events/<event.id>  (matches the existing .ics route)

import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EVENTS, getActiveEvents } from '@/lib/events-data';
import { STAGE_COLORS, type CCFEvent } from '@/lib/events';
import { NativeShareButton } from './ShareButton';

export const dynamic = 'force-static';
export const dynamicParams = false;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://icorner.m77solutions.com';

// ───── Static params: one page per active event ─────
export async function generateStaticParams() {
  return getActiveEvents(EVENTS).map((event) => ({ slug: event.id }));
}

// ───── SEO / social metadata ─────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = EVENTS.find((e) => e.id === slug);

  if (!event) {
    return { title: 'Event Not Found — iCorner' };
  }

  const title = `${event.activity} — ${event.dateLabel} | iCorner`;
  const description =
    event.activityDetail ||
    `${event.activity} on ${event.dateLabel} at ${event.location}`;
  const url = `${SITE_URL}/events/${event.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'iCorner — CCF Welcome Center',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

// ───── Small helpers ─────
function formatFullDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPeso(cost: number | null): string {
  if (cost === null || cost === undefined) return 'To be announced';
  if (cost === 0) return 'FREE';
  return `₱${cost.toLocaleString('en-PH')}`;
}

function regStatusBadge(status: CCFEvent['regStatus']) {
  const map = {
    OPEN: { bg: '#DCFCE7', text: '#166534', label: '🟢 Registration OPEN' },
    CLOSED: { bg: '#FEE2E2', text: '#7F1D1D', label: '🔴 Registration CLOSED' },
    'N/A': { bg: '#F3F4F6', text: '#4B5563', label: '⚪ No Registration Required' },
  } as const;
  return map[status] ?? map['N/A'];
}

// ───── Related events: same journey stage, exclude current ─────
function getRelatedEvents(current: CCFEvent, limit = 3): CCFEvent[] {
  return getActiveEvents(EVENTS)
    .filter((e) => e.id !== current.id && e.journeyStage === current.journeyStage)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, limit);
}

// ───── Page component ─────
export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = EVENTS.find((e) => e.id === slug);

  if (!event) notFound();

  const stage = STAGE_COLORS[event.journeyStage];
  const reg = regStatusBadge(event.regStatus);
  const related = getRelatedEvents(event);
  const eventUrl = `${SITE_URL}/events/${event.id}`;
  const icsUrl = `/events/${event.id}/calendar.ics`;
  const mapsQuery = encodeURIComponent(event.location);
  const shareText = `${event.activity} — ${event.dateLabel} | ${event.location}`;

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#C5E4F0',
        padding: '3vh 4vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Breadcrumb */}
      <nav
        style={{
          width: '100%',
          maxWidth: 900,
          marginBottom: 16,
          fontSize: 14,
          color: '#2D3748',
        }}
      >
        <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none' }}>
          iCorner
        </Link>
        {' › '}
        <Link
          href={`/month/${event.monthSlug}`}
          style={{ color: '#1FA3C0', textDecoration: 'none' }}
        >
          {event.month}
        </Link>
        {' › '}
        <span style={{ color: '#4A5568' }}>{event.activity}</span>
      </nav>

      {/* Card */}
      <article
        style={{
          background: 'white',
          borderRadius: 20,
          border: '3px solid #1A202C',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          width: '100%',
          maxWidth: 900,
          padding: '2rem 1.75rem',
        }}
      >
        {/* Stage badge */}
        <div style={{ marginBottom: 16 }}>
          <span
            style={{
              display: 'inline-block',
              background: stage.bg,
              color: stage.text,
              border: `2px solid ${stage.border}`,
              padding: '4px 12px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.5,
            }}
          >
            {event.journeyStage.toUpperCase()}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(1.75rem, 4.5vw, 2.75rem)',
            fontWeight: 900,
            color: '#1A202C',
            lineHeight: 1.1,
            marginBottom: 8,
          }}
        >
          {event.activity}
        </h1>

        {event.activityDetail && (
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: '#4A5568',
              marginBottom: 20,
              lineHeight: 1.4,
            }}
          >
            {event.activityDetail}
          </p>
        )}

        {/* Reg badge */}
        <div style={{ marginBottom: 24 }}>
          <span
            style={{
              display: 'inline-block',
              background: reg.bg,
              color: reg.text,
              padding: '6px 14px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {reg.label}
          </span>
        </div>

        {/* Info grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: 28,
          }}
        >
          <InfoBox label="📅 Date" value={event.dateLabel} />
          {event.timeLabel && <InfoBox label="🕒 Time" value={event.timeLabel} />}
          <InfoBox label="📍 Location" value={event.location} />
          {event.platform && <InfoBox label="💻 Platform" value={event.platform} />}
          <InfoBox label="💰 Cost" value={formatPeso(event.cost)} />
          <InfoBox label="👤 Organizer" value={event.originator} />
          {event.contactPerson &&
            event.contactPerson !== 'CCF App' &&
            event.contactPerson !== 'GLC' && (
              <InfoBox label="📞 Contact" value={event.contactPerson} />
            )}
        </div>

        {/* Full-date range */}
        {event.startDate && (
          <div
            style={{
              background: '#F7FAFC',
              borderLeft: `4px solid ${stage.border}`,
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 24,
              fontSize: 15,
              color: '#2D3748',
            }}
          >
            <strong>{formatFullDate(event.startDate)}</strong>
            {event.endDate && event.endDate !== event.startDate && (
              <>
                {' → '}
                <strong>{formatFullDate(event.endDate)}</strong>
              </>
            )}
          </div>
        )}

        {/* Occurrences (recurring events) */}
        {!event.isContiguous && event.occurrences?.length ? (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#2D3748' }}>
              Meeting Dates
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#4A5568' }}>
              {event.occurrences.map((iso) => (
                <li key={iso}>{formatFullDate(iso)}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {event.otherInfo && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#2D3748' }}>
              Additional Info
            </h3>
            <p style={{ color: '#4A5568', lineHeight: 1.5, margin: 0 }}>{event.otherInfo}</p>
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          <a
            href={icsUrl}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#1A202C',
              color: 'white',
              padding: '14px 16px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            📅 Add to Calendar
          </a>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: '#4285F4',
              color: 'white',
              padding: '14px 16px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            🗺️ Open in Maps
          </a>

          <NativeShareButton url={eventUrl} text={shareText} />
        </div>

        {/* Social share row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          <ShareLink
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              eventUrl,
            )}`}
            label="Facebook"
            color="#1877F2"
          />
          <ShareLink
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              eventUrl,
            )}&text=${encodeURIComponent(shareText)}`}
            label="X / Twitter"
            color="#000000"
          />
          <ShareLink
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `${shareText} — ${eventUrl}`,
            )}`}
            label="WhatsApp"
            color="#25D366"
          />
          <ShareLink
            href={`viber://forward?text=${encodeURIComponent(
              `${shareText} — ${eventUrl}`,
            )}`}
            label="Viber"
            color="#7360F2"
          />
        </div>
      </article>

      {/* Related events */}
      {related.length > 0 && (
        <section style={{ width: '100%', maxWidth: 900, marginTop: 32 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#1A202C',
              marginBottom: 12,
            }}
          >
            More {event.journeyStage} events
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {related.map((r) => {
              const rStage = STAGE_COLORS[r.journeyStage];
              return (
                <Link
                  key={r.id}
                  href={`/events/${r.id}`}
                  style={{
                    background: 'white',
                    border: `2px solid ${rStage.border}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: rStage.text,
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    {r.dateLabel}
                  </div>
                  <div style={{ fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                    {r.activity}
                  </div>
                  <div style={{ fontSize: 13, color: '#4A5568' }}>{r.location}</div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        style={{
          marginTop: 40,
          fontSize: 13,
          color: '#2D3748',
          textAlign: 'center',
        }}
      >
        <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none' }}>
          ← Back to iCorner
        </Link>
      </footer>
    </main>
  );
}

// ───── Sub-components ─────
function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: '#F7FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontSize: 12,
          color: '#718096',
          fontWeight: 600,
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 15, color: '#1A202C', fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function ShareLink({
  href,
  label,
  color,
}: {
  href: string;
  label: string;
  color: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        background: color,
        color: 'white',
        padding: '8px 14px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  );
}
