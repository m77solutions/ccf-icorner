// lib/ics-generator.ts
// Generates iCalendar (.ics) content for a CCFEvent per RFC 5545.

import type { CCFEvent } from './events';

const TZID = 'Asia/Manila';
const PRODID = '-//CCF iCorner//Events//EN';

const VTIMEZONE_MANILA = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Manila',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0800',
  'TZOFFSETTO:+0800',
  'TZNAME:PST',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

function escapeICS(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  let i = 0;
  while (i < line.length) {
    chunks.push((i === 0 ? '' : ' ') + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

function parseTimeTo24h(raw: string): { hh: number; mm: number } {
  if (!raw || !raw.trim()) return { hh: 9, mm: 0 };
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return { hh: 9, mm: 0 };
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = m[3]?.toUpperCase();
  if (ampm === 'PM' && hh < 12) hh += 12;
  if (ampm === 'AM' && hh === 12) hh = 0;
  return { hh, mm };
}

function toICSDateTime(isoDate: string, hh: number, mm: number): string {
  const ymd = isoDate.replace(/-/g, '');
  const HH = String(hh).padStart(2, '0');
  const MM = String(mm).padStart(2, '0');
  return `${ymd}T${HH}${MM}00`;
}

function nowUTCStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function buildVEvent(
  event: CCFEvent,
  startISO: string,
  endISO: string,
  occurrenceSuffix: string = '',
): string {
  const { hh: startHH, mm: startMM } = parseTimeTo24h(event.timeLabel);
  let endHH = startHH + 2;
  let endMM = startMM;
  if (endHH >= 24) { endHH = 23; endMM = 59; }

  const dtStart = toICSDateTime(startISO, startHH, startMM);
  const dtEnd = toICSDateTime(endISO, endHH, endMM);
  const uid = `${event.id}${occurrenceSuffix}@icorner.ccf.org.ph`;

  const summary = escapeICS(event.activity);
  const location = escapeICS(event.location || 'CCF iCorner');
  const descParts = [
    event.activityDetail,
    event.originator ? `Organizer: ${event.originator}` : '',
    event.contactPerson ? `Contact: ${event.contactPerson}` : '',
    event.contactNumber ? `Phone: ${event.contactNumber}` : '',
    event.cost !== null ? `Cost: ${event.cost === 0 ? 'FREE' : `PHP ${event.cost}`}` : '',
  ].filter(Boolean).join('\n');

  return [
    'BEGIN:VEVENT',
    foldLine(`UID:${uid}`),
    `DTSTAMP:${nowUTCStamp()}`,
    `DTSTART;TZID=${TZID}:${dtStart}`,
    `DTEND;TZID=${TZID}:${dtEnd}`,
    foldLine(`SUMMARY:${summary}`),
    foldLine(`LOCATION:${location}`),
    foldLine(`DESCRIPTION:${escapeICS(descParts)}`),
    'STATUS:CONFIRMED',
    'END:VEVENT',
  ].join('\r\n');
}

export function generateICS(event: CCFEvent): string {
  const vevents: string[] = [];

  if (event.occurrences && event.occurrences.length > 0) {
    event.occurrences.forEach((date, i) => {
      vevents.push(buildVEvent(event, date, date, `-${i}`));
    });
  } else if (event.isContiguous && event.startDate !== event.endDate) {
    vevents.push(buildVEvent(event, event.startDate, event.endDate));
  } else {
    vevents.push(buildVEvent(event, event.startDate, event.startDate));
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE_MANILA,
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function icsSlug(event: CCFEvent): string {
  return event.id;
}
