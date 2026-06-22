'use client';

import { useEffect } from 'react';
import type { CCFEvent, JourneyStage } from '@/lib/events';
 import EventQRCode from './EventQRCode';

type StageColorMap = Record<JourneyStage, { bg: string; text: string; border: string }>;

function generateICS(event: CCFEvent): string {
  const formatDate = (iso: string) => iso.replace(/-/g, '') + 'T080000';
  const formatDateEnd = (iso: string) => iso.replace(/-/g, '') + 'T170000';
  const uid = `${event.id}@icorner.ccf.org.ph`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CCF iCorner//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(event.startDate)}`,
    `DTEND:${formatDateEnd(event.endDate)}`,
    `SUMMARY:${event.activity}`,
    `DESCRIPTION:${event.activityDetail}\\n\\nOrganized by: ${event.originator}${
      event.cost !== null ? `\\nCost: PHP ${event.cost.toLocaleString()}` : ''
    }${event.platform ? `\\nRegister: ${event.platform}` : ''}`,
    `LOCATION:${event.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(event: CCFEvent) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.activity.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isExternalUrl(s: string): boolean {
  return /^https?:\/\//i.test(s) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s);
}

function normalizeUrl(s: string): string {
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export default function EventDetailModal({
  event,
  onClose,
  stageColors,
}: {
  event: CCFEvent | null;
  onClose: () => void;
  stageColors: StageColorMap;
}) {
  // Close on ESC
  useEffect(() => {
    if (!event) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [event, onClose]);

  if (!event) return null;

  const c = stageColors[event.journeyStage];
  const hasRegLink = event.platform && isExternalUrl(event.platform);

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 1000,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFF',
          borderRadius: 16,
          border: `4px solid ${c.border}`,
          maxWidth: 560,
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.2s ease',
        }}
      >
        {/* Header */}
        <div style={{ background: c.bg, padding: '20px 24px', borderTopLeftRadius: 12, borderTopRightRadius: 12, position: 'relative' }}>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: '#FFF',
              border: '2px solid #000',
              borderRadius: '50%',
              width: 36,
              height: 36,
              fontSize: 18,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{ background: '#FFF', color: c.text, padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', border: `1px solid ${c.border}` }}>
              {event.journeyStage}
            </span>
            {event.regStatus !== 'N/A' && (
              <span style={{ background: event.regStatus === 'OPEN' ? '#16A34A' : '#9CA3AF', color: '#FFF', padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                {event.regStatus}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
            {event.activity}
          </h2>
          <p style={{ fontSize: 15, color: '#334155', marginTop: 8, marginBottom: 0 }}>
            {event.activityDetail}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <DetailRow icon="📅" label="When" value={`${event.dateLabel}${event.timeLabel ? ` · ${event.timeLabel}` : ''}`} />
          <DetailRow icon="📍" label="Where" value={event.location} />
          <DetailRow icon="👥" label="Organized by" value={event.originator} />
          {event.cost !== null && (
            <DetailRow icon="💰" label="Cost" value={`₱${event.cost.toLocaleString()}`} />
          )}
          {event.contactPerson && (
            <DetailRow icon="📞" label="Contact" value={`${event.contactPerson}${event.contactNumber ? ` · ${event.contactNumber}` : ''}`} />
          )}
          {event.platform && !hasRegLink && (
            <DetailRow icon="🔗" label="Register via" value={event.platform} />
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {hasRegLink && (
              <a
                href={normalizeUrl(event.platform)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1,
                  minWidth: 180,
                  background: '#C62828',
                  color: '#FFF',
                  padding: '14px 20px',
                  borderRadius: 999,
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: 15,
                  textAlign: 'center',
                  border: '3px solid #000',
                  boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
                }}
              >
                Register Now →
              </a>
            )}
            {/* <button
              onClick={() => downloadICS(event)}
              style={{
                flex: 1,
                minWidth: 180,
                background: '#FFF',
                color: '#1FA3C0',
                padding: '14px 20px',
                borderRadius: 999,
                border: '3px solid #1FA3C0',
                fontWeight: 800,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
              }}
            >
              📥 Add to Calendar
            </button> */}
          </div>

          {/* QR Code for Add to Calendar */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed #E2E8F0', display: 'flex', justifyContent: 'center' }}>
            <EventQRCode event={event} size={140} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: 22, lineHeight: 1.2 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </div>
        <div style={{ fontSize: 15, color: '#0F172A', fontWeight: 600, marginTop: 2 }}>
          {value}
        </div>
      </div>
    </div>
  );
}
