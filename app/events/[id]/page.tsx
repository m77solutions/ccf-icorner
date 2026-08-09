// app/events/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { EVENTS } from '@/lib/events-data';
import { STAGE_COLORS, type CCFEvent } from '@/lib/events';

function findEventById(id: string): CCFEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

// -------- Build-time static generation --------
export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

// -------- SEO / Open Graph meta --------
export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const event = findEventById(id);
  if (!event) return { title: 'Event Not Found — iCorner' };

  const title = `${event.activity} — ${event.dateLabel} | iCorner`;
  const description = event.activityDetail
    ? `${event.activityDetail} · ${event.dateLabel}${event.timeLabel ? ' · ' + event.timeLabel : ''}${event.location ? ' · ' + event.location : ''}`
    : `${event.activity} on ${event.dateLabel}${event.location ? ' at ' + event.location : ''}`;

  const url = `https://icorner.m77solutions.com/events/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'iCorner — CCF Welcome Center',
      type: 'article',
      locale: 'en_PH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

// -------- Page component --------
export default async function EventPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const event = findEventById(id);
  if (!event) notFound();

  const stage = STAGE_COLORS[event.journeyStage] ?? STAGE_COLORS.Engage;
  const eventUrl = `https://icorner.m77solutions.com/events/${id}`;
  const shareText = `${event.activity} — ${event.dateLabel}${event.timeLabel ? ' at ' + event.timeLabel : ''}`;

  // Related events: same journey stage, excluding self, max 4
  const related = EVENTS
    .filter((e) => e.journeyStage === event.journeyStage && e.id !== event.id)
    .slice(0, 4);

  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  const icsUrl = `/events/${event.id}/calendar.ics`;

  return (
    <div style={{ minHeight: '100vh', background: '#C5E4F0', padding: '24px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <nav style={{ fontSize: 14, marginBottom: 16, color: '#0F172A' }}>
          <Link href="/" style={{ color: '#0F172A', textDecoration: 'none' }}>← Welcome</Link>
          <span style={{ margin: '0 8px', color: '#64748B' }}>·</span>
          <Link href={`/month/${event.monthSlug}`} style={{ color: '#0F172A', textDecoration: 'none' }}>
            {event.month}
          </Link>
        </nav>

        {/* Header card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          marginBottom: 20,
        }}>
          {/* Journey stage badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: stage.bg, color: stage.text,
            padding: '6px 12px', borderRadius: 20,
            fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
            marginBottom: 12,
            border: `1px solid ${stage.border}`,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.border }} />
            {event.journeyStage.toUpperCase()} · {event.originator}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 28, fontWeight: 800, color: '#0F172A',
            margin: '0 0 6px 0', lineHeight: 1.2,
          }}>
            {event.activity}
          </h1>

          {event.activityDetail && (
            <p style={{ fontSize: 15, color: '#475569', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              {event.activityDetail}
            </p>
          )}

          {/* Date + time */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 16,
            paddingTop: 16, borderTop: '1px solid #E2E8F0',
          }}>
            <InfoItem icon="📅" label="Date" value={event.dateLabel} />
            {event.timeLabel && <InfoItem icon="🕐" label="Time" value={event.timeLabel} />}
            {event.location && (
              <InfoItem
                icon="📍"
                label="Venue"
                value={event.location}
                href={mapsUrl ?? undefined}
              />
            )}
          </div>
        </div>

        {/* Registration CTA */}
        {event.platform && (
          <a
            href={event.platform}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              background: '#1FA3C0',
              color: 'white',
              padding: '16px 20px',
              borderRadius: 12,
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: 16,
              textAlign: 'center',
              marginBottom: 20,
              boxShadow: '0 4px 12px rgba(31,163,192,0.3)',
            }}
          >
            🎟️ Register / Join Now →
          </a>
        )}

        {/* Details card */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 14, color: '#1FA3C0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
            Event Details
          </h2>

          {event.contactPerson && (
            <DetailRow label="Contact Person" value={event.contactPerson} />
          )}
          {event.contactNumber && (
            <DetailRow label="Contact Number" value={event.contactNumber} href={`tel:${event.contactNumber}`} />
          )}
          {event.cost !== null && event.cost !== undefined && (
            <DetailRow label="Cost" value={event.cost === 0 ? 'FREE' : `₱${event.cost.toLocaleString()}`} />
          )}
          {event.regStatus && event.regStatus !== 'N/A' && (
            <DetailRow label="Registration Status" value={event.regStatus} />
          )}
          {event.otherInfo && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Additional Info
              </div>
              <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {event.otherInfo}
              </p>
            </div>
          )}
        </div>

        {/* Actions: Calendar + Share */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20,
        }}>
          <a
            href={icsUrl}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'white', color: '#0F172A',
              padding: '14px 16px', borderRadius: 12,
              textDecoration: 'none', fontWeight: 600, fontSize: 14,
              border: '2px solid #0F172A',
            }}
          >
            📆 Add to Calendar
          </a>
          <ShareButton url={eventUrl} text={shareText} />
        </div>

        {/* QR code */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', marginBottom: 20,
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 14, color: '#1FA3C0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            Scan to Share
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(eventUrl)}`}
            alt={`QR code for ${event.activity}`}
            width={200}
            height={200}
            style={{ borderRadius: 8 }}
          />
          <p style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>
            Use your phone&apos;s built-in Camera app to scan
          </p>
          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, wordBreak: 'break-all' }}>
            {eventUrl}
          </p>
        </div>

        {/* Related events */}
        {related.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, color: '#0F172A', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              More {event.journeyStage} Activities
            </h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/events/${r.id}`}
                  style={{
                    background: 'white', padding: 14, borderRadius: 10,
                    textDecoration: 'none', color: '#0F172A',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{r.activity}</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      {r.dateLabel}{r.timeLabel ? ' · ' + r.timeLabel : ''}
                    </div>
                  </div>
                  <span style={{ color: '#1FA3C0', fontSize: 20 }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748B', fontSize: 12 }}>
          <Link href={`/month/${event.monthSlug}`} style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to {event.month} calendar
          </Link>
        </div>

      </div>
    </div>
  );
}

// -------- Helper components --------
function InfoItem({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const content = (
    <>
      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 15, color: '#0F172A', fontWeight: 600, marginTop: 2 }}>
        {value}
      </div>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
      {content}
    </a>
  ) : (
    <div>{content}</div>
  );
}

function DetailRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const val = href ? (
    <a href={href} style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 600 }}>{value}</a>
  ) : (
    <span style={{ color: '#0F172A' }}>{value}</span>
  );
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: 14 }}>
      <span style={{ color: '#64748B', fontWeight: 600 }}>{label}</span>
      {val}
    </div>
  );
}

function ShareButton({ url, text }: { url: string; text: string }) {
  const shareText = encodeURIComponent(`${text}\n${url}`);
  return (
    <a
      href={`viber://forward?text=${shareText}`}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        background: '#1FA3C0', color: 'white',
        padding: '14px 16px', borderRadius: 12,
        textDecoration: 'none', fontWeight: 600, fontSize: 14,
      }}
    >
      📤 Share Event
    </a>
  );
}
