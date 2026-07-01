// lib/events-data.ts
// Server-only module: fetches events from Google Sheets CSV at build time.
// Uses top-level await — DO NOT import from client components.

import Papa from 'papaparse';
import {
  EVENTS_RAW,
  DIVISIONS,
  type CCFEvent,
  type JourneyStage,
  type DivisionId,
  type Division,
} from './events';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1KahZ8fDuOj6nxTMw1FgDnx5suo2pSNSy7L4tz-eyPF4/export?format=csv&gid=1592089368';

// ───── helpers ─────

function mdyToISO(s: string): string {
  if (!s || !s.trim()) return '';
  const [m, d, y] = s.trim().split('/').map((x) => x.trim());
  if (!m || !d || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function isConferenceStage(s: string): boolean {
  return s.trim().toUpperCase() === 'CONFERENCE';
}

function normalizeStage(s: string): JourneyStage {
  const t = s.trim().toUpperCase();
  if (t === 'EDIFY') return 'Edify';
  if (t === 'EQUIP') return 'Equip';
  if (t === 'EMPOWER') return 'Empower';
  return 'Engage';
}

function monthLabelFromISO(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function monthSlugFromLabel(month: string): string {
  return month.toLowerCase().replace(' ', '-');
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

function formatMonthDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
}

function buildDateLabel(
  eventType: string,
  startDate: string,
  endDate: string,
  occurrences?: string[],
): string {
  if (eventType === 'Recurring (multiple dates)' && occurrences?.length) {
    return [...occurrences].sort().map(formatMonthDay).join(', ');
  }
  if (startDate === endDate) return formatMonthDay(startDate);
  const [, sm] = startDate.split('-').map(Number);
  const [, em] = endDate.split('-').map(Number);
  if (sm === em) {
    const sd = Number(startDate.split('-')[2]);
    const ed = Number(endDate.split('-')[2]);
    const monthName = formatMonthDay(startDate).split(' ')[0];
    return `${monthName} ${sd}–${ed}`;
  }
  return `${formatMonthDay(startDate)} – ${formatMonthDay(endDate)}`;
}

function normalizeRegLink(link: string): string {
  if (!link || !link.trim()) return '';
  const trimmed = link.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function parseCost(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.trim().toUpperCase();
  if (t === 'FREE') return 0;
  const match = raw.match(/[\d,]+/);
  if (!match) return null;
  const num = parseInt(match[0].replace(/,/g, ''), 10);
  return isNaN(num) ? null : num;
}

function formatTimeLabel(raw: string): string {
  if (!raw || !raw.trim()) return '';
  const t = raw.trim();
  // "1:00:00 PM" → "1:00 PM"
  const match = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return t;
  const [, h, m, ampm] = match;
  return `${parseInt(h, 10)}:${m}${ampm ? ` ${ampm.toUpperCase()}` : ''}`;
}

// ───── CSV row → CCFEvent[] (multi-stage rows expand to N events) ─────

type CSVRow = Record<string, string>;

function parseRow(row: CSVRow, idx: number): CCFEvent[] {
  const organizer = (row['ORGANIZER'] || '').trim();
  const eventName = (row['EVENT'] || '').trim();
  if (!organizer || !eventName) return [];

  const eventType = (row['EVENT TYPE'] || '').trim();
  const stageRaw = (row['EVENT DJ STAGE'] || 'ENGAGE').trim();
  const stages = stageRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  let startDate = '';
  let endDate = '';
  let isContiguous = true;
  let occurrences: string[] | undefined;

  if (eventType === 'Single Day') {
    startDate = mdyToISO(row['DATE'] || '');
    endDate = startDate;
  } else if (eventType === 'Multi-Day (consecutive)') {
    startDate = mdyToISO(row['START DATE'] || '');
    endDate = mdyToISO(row['END DATE'] || '');
  } else if (eventType === 'Recurring (multiple dates)') {
    const raw = (row['RECURRING DATES'] || '').trim();
    occurrences = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort();
    if (occurrences.length === 0) return [];
    startDate = occurrences[0];
    endDate = occurrences[occurrences.length - 1];
    isContiguous = false;
  } else {
    return [];
  }

  if (!startDate || !endDate) return [];

  const month = monthLabelFromISO(startDate);
  const monthSlug = monthSlugFromLabel(month);
  const dateLabel = buildDateLabel(eventType, startDate, endDate, occurrences);
  const activity = eventName;
  const activityDetail = (row['EVENT TITLE'] || '').trim();
  const timeLabel = formatTimeLabel(row['TIME'] || '');
  const location = (row['LOCATION'] || '').trim();
  const contactPerson = (row['CONTACT PERSON'] || '').trim();
  const contactNumber = (row['CONTACT NUMBER'] || '').trim();
  const platform = normalizeRegLink(row['REGISTRATION LINK'] || '');
  const cost = parseCost(row['AMOUNT'] || '');
  const baseId =
    slugify(`${organizer}-${activity}-${startDate}`) || `row-${idx}`;

  // Multi-stage rows (e.g. "ENGAGE, EDIFY, EQUIP, EMPOWER") split into N events
  return stages.map((stageRaw) => {
    const journeyStage = normalizeStage(stageRaw);
    return {
      id:
        stages.length > 1
          ? `${baseId}-${journeyStage.toLowerCase()}`
          : baseId,
      journeyStage,
      originator: organizer,
      activity,
      activityDetail,
      month,
      monthSlug,
      dateLabel,
      startDate,
      endDate,
      occurrences,
      isContiguous,
      timeLabel,
      location,
      contactPerson,
      contactNumber,
      platform,
      cost,
      regStatus: 'N/A',
      isConference: stages.some(isConferenceStage),
    };
  });
}

// ───── CSV loader ─────

async function loadEventsFromCSV(): Promise<CCFEvent[]> {
  try {
    const res = await fetch(CSV_URL, {
      // Static export: this fetch runs at build time
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`CSV fetch failed: HTTP ${res.status}`);
    const csv = await res.text();
    const parsed = Papa.parse<CSVRow>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length) {
      console.warn('[events-data] CSV parse warnings:', parsed.errors.slice(0, 3));
    }
    const events: CCFEvent[] = [];
    parsed.data.forEach((row, idx) => {
      events.push(...parseRow(row, idx));
    });
    if (events.length === 0) {
      console.warn('[events-data] CSV returned 0 events — using EVENTS_RAW fallback');
      return EVENTS_RAW;
    }
    console.log(`[events-data] Loaded ${events.length} events from CSV`);
    return events;
  } catch (err) {
    console.warn('[events-data] CSV fetch failed, using EVENTS_RAW fallback:', err);
    return EVENTS_RAW;
  }
}

// ───── module-level: top-level await fires at build time ─────

export const EVENTS: CCFEvent[] = await loadEventsFromCSV();

// ───── query functions (mirror old lib/events.ts API) ─────

export function getAllMonths(includePast: boolean = false): { month: string; slug: string; count: number }[] {
  const events = includePast ? EVENTS : getActiveEvents(EVENTS);
  const map = new Map<string, { month: string; slug: string; count: number }>();
  for (const e of events) {
    const existing = map.get(e.monthSlug);
    if (existing) existing.count++;
    else map.set(e.monthSlug, { month: e.month, slug: e.monthSlug, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => {
    const aDate = events.find((e) => e.monthSlug === a.slug)!.startDate;
    const bDate = events.find((e) => e.monthSlug === b.slug)!.startDate;
    return aDate.localeCompare(bDate);
  });
}

export function getEventsByMonth(slug: string): CCFEvent[] {
  return getActiveEvents(EVENTS).filter((e) => {
    if (e.monthSlug === slug) return true;
    if (e.occurrences) {
      return e.occurrences.some((d) => monthSlugFromLabel(monthLabelFromISO(d)) === slug);
    }
    return false;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function getEventsByStage(stage: JourneyStage): CCFEvent[] {
  return getActiveEvents(EVENTS).filter((e) => e.journeyStage === stage);
}

export function getCurrentMonthSlug(): string {
  const months = getAllMonths();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = months.find((m) => {
    const firstEvent = EVENTS.find((e) => e.monthSlug === m.slug);
    return firstEvent && firstEvent.startDate >= today;
  });
  return upcoming?.slug ?? months[0]?.slug ?? 'june-2026';
}

export function getEventDivision(event: CCFEvent): DivisionId {
  if (event.isConference) return 'conference';

  const originator = event.originator.trim().toUpperCase();
  const firstToken = originator.split(/[\s-]/)[0];

  // GLC (Global Leadership Center)
  if (firstToken === 'D' || firstToken === 'GLC') return 'glc';

  // Pastoral Areas — includes:
  //   • PA - <name> (e.g., "PA - RICKY SARTHOU")
  //   • S / satellites
  //   • LUZON (any LUZON-prefixed entity)
  //   • CCF <region> (e.g., "CCF LUZON SOUTH", "CCF LUZON CENTRAL", "CCF NORTH EDSA")
  //   • Any originator containing "LUZON", "SATELLITE", or the region tags
  if (
    firstToken === 'P' ||
    firstToken === 'PA' ||
    firstToken === 'S' ||
    firstToken === 'LUZON' ||
    firstToken === 'CCF' ||
    originator.includes('LUZON') ||
    originator.includes('SATELLITE') ||
    originator.includes('NORTH EDSA') ||
    originator.includes('PASTORAL')
  ) {
    return 'pastoral-areas';
  }

  // Ministries (WOW, Intercede, M-prefix, etc.)
  if (firstToken === 'M' || firstToken === 'WOW' || firstToken === 'INTERCEDE') {
    return 'ministries';
  }

  // Default: ministries (safe fallback)
  return 'ministries';
}

export function getEventsByDivision(divisionId: DivisionId): CCFEvent[] {
  return getActiveEvents(EVENTS).filter((e) => getEventDivision(e) === divisionId).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}

export function getEntitiesInDivision(
  divisionId: DivisionId,
): { id: string; label: string; count: number }[] {
  const map = new Map<string, { id: string; label: string; count: number }>();
  for (const e of EVENTS) {
    if (getEventDivision(e) !== divisionId) continue;
    const key = e.originator;
    const existing = map.get(key);
    if (existing) existing.count++;
    else map.set(key, { id: slugify(key), label: key, count: 1 });
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function getEventsByJourneyStage(stageId: string): CCFEvent[] {
  const target = stageId.toLowerCase();
  return EVENTS.filter((e) => e.journeyStage.toLowerCase() === target).sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
}


// ============================================
// Month-to-month filter (Pastor Ricky's request)
// Returns events whose END month is >= current month.
// Multi-day events spanning months stay visible through their end month.
// ============================================
export function getActiveEvents(allEvents: CCFEvent[] = EVENTS): CCFEvent[] {
  const currentYM = getCurrentManilaYM();
  const todayISO = getTodayManilaISO();

  return allEvents
    .filter(e => {
      // Drop event entirely if its END is before current month
      const endYM = (e.endDate || e.startDate).slice(0, 7);
      return endYM >= currentYM;
    })
    .map(e => {
      // For recurring events, filter out past occurrences
      if (e.occurrences && e.occurrences.length > 0) {
        const futureOccurrences = e.occurrences.filter(d => d >= todayISO);
        if (futureOccurrences.length === 0) return null;
        // Recompute derived fields from the remaining occurrences
        const newStartDate = futureOccurrences[0];
        const newEndDate = futureOccurrences[futureOccurrences.length - 1];
        const newMonth = monthLabelFromISO(newStartDate);
        const newMonthSlug = monthSlugFromLabel(newMonth);
        // Rebuild dateLabel: "Jul 11" or "Jul 11, Jul 25, Aug 1"
        const newDateLabel = futureOccurrences.map(d => formatMonthDay(d)).join(', ');
        return {
          ...e,
          startDate: newStartDate,
          endDate: newEndDate,
          occurrences: futureOccurrences,
          month: newMonth,
          monthSlug: newMonthSlug,
          dateLabel: newDateLabel,
        };
      }
      // For non-recurring events, keep as-is (they already passed the endYM check)
      return e;
    })
    .filter((e): e is CCFEvent => e !== null);
}

// Helper: today in Asia/Manila as YYYY-MM-DD
export function getTodayManilaISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

// Bulletproof: get current YYYY-MM in Asia/Manila regardless of build env timezone
export function getCurrentManilaYM(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  return `${y}-${m}`;
}
