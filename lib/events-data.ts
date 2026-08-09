// lib/events-data.ts
// Server-only module: fetches events from WordPress at build time.
// Source of truth: https://m77solutions.com/icms (WordPress CMS)
// Uses top-level await — DO NOT import from client components.

import {
  EVENTS_RAW,
  type CCFEvent,
  type JourneyStage,
  type DivisionId,
} from './events';

const WP_API_BASE =
  process.env.NEXT_PUBLIC_WP_API_BASE ??
  'https://m77solutions.com/icms/wp-json/wp/v2';

// ───── helpers (unchanged from CSV era — reused where useful) ─────

function normalizeStage(s: string): JourneyStage {
  const t = (s || '').trim().toUpperCase();
  if (t === 'EDIFY') return 'Edify';
  if (t === 'EQUIP') return 'Equip';
  if (t === 'EMPOWER') return 'Empower';
  return 'Engage';
}

function isConferenceStage(s: string): boolean {
  return (s || '').trim().toUpperCase() === 'CONFERENCE';
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
  isContiguous: boolean,
  startDate: string,
  endDate: string,
  occurrences?: string[],
): string {
  if (!isContiguous && occurrences?.length) {
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

function parseCost(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === '') return null;
  const s = String(raw).trim();
  if (!s) return null;
  const t = s.toUpperCase();
  if (t === 'FREE') return 0;
  const match = s.match(/[\d,]+/);
  if (!match) return null;
  const num = parseInt(match[0].replace(/,/g, ''), 10);
  return isNaN(num) ? null : num;
}

function formatTimeLabel(raw: string): string {
  if (!raw || !raw.trim()) return '';
  const t = raw.trim();
  const match = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return t;
  const [, h, m, ampm] = match;
  return `${parseInt(h, 10)}:${m}${ampm ? ` ${ampm.toUpperCase()}` : ''}`;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#038;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// ───── WordPress types ─────

type WPMinistry = { id: number; name: string; slug: string };

type WPEvent = {
  id: number;
  slug: string;
  status: string;
  title: { rendered: string };
  ministry: number[];
  acf: {
    journey_stage?: string;
    originator?: string;
    activity?: string;
    activity_detail?: string;
    start_date?: string;
    end_date?: string;
    time_label?: string;
    location?: string;
    contact_person?: string;
    contact_number?: string;
    platform?: string;
    cost?: string | number;
    registration_status?: string;
    is_contiguous?: boolean | string | number;
    occurrences?: string | string[];
    other_info?: string;
    is_conference?: boolean | string;
  };
};

// ───── WordPress → CCFEvent mapper ─────
// Produces the exact same CCFEvent shape the rest of the app expects.
// Multi-stage events (e.g. "ENGAGE, EDIFY") split into N CCFEvent objects.

function mapWPEvent(wp: WPEvent, ministries: Map<number, WPMinistry>): CCFEvent[] {
  const acf = wp.acf ?? {};

  // ─ Dates ─
  const startDate = (acf.start_date || '').trim();
  const endDate = (acf.end_date || startDate || '').trim();
  if (!startDate) return [];

  // ─ Occurrences (may arrive as CSV string or array) ─
  let occurrences: string[] | undefined;
  let isContiguous = true;
  if (acf.is_contiguous === false || acf.is_contiguous === 'false' || acf.is_contiguous === 0) {
    isContiguous = false;
  }
  if (acf.occurrences) {
    const raw = Array.isArray(acf.occurrences)
      ? acf.occurrences
      : String(acf.occurrences).split(',');
    occurrences = raw
      .map((s) => String(s).trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort();
    if (occurrences.length > 0) isContiguous = false;
    else occurrences = undefined;
  }

  // ─ Journey stage(s) — may be comma-separated ─
  const stageRaw = acf.journey_stage || 'ENGAGE';
  const stages = String(stageRaw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // ─ Common fields ─
  const rawTitle = decodeHtml(wp.title?.rendered || '');
  const activity = (acf.activity || rawTitle || '').trim();
  const activityDetail = (acf.activity_detail || rawTitle || '').trim();
  const organizer = (acf.originator || ministries.get(wp.ministry?.[0])?.name || '').trim();
  const month = monthLabelFromISO(startDate);
  const monthSlug = monthSlugFromLabel(month);
  const dateLabel = buildDateLabel(isContiguous, startDate, endDate, occurrences);
  const timeLabel = formatTimeLabel(String(acf.time_label || ''));
  const location = String(acf.location || '').trim();
  const contactPerson = String(acf.contact_person || '').trim();
  const contactNumber = String(acf.contact_number || '').trim();
  const platform = normalizeRegLink(String(acf.platform || ''));
  const cost = parseCost(acf.cost);
  const otherInfo = String(acf.other_info || '').trim() || undefined;
  const regStatus = (String(acf.registration_status || 'N/A').toUpperCase() as
    | 'OPEN'
    | 'CLOSED'
    | 'N/A') || 'N/A';
  const isConference =
    acf.is_conference === true ||
    acf.is_conference === 'true' ||
    stages.some(isConferenceStage);

  const baseId = wp.slug; // WordPress post slug is our canonical id

  return stages.map((stageRaw) => {
    const journeyStage = normalizeStage(stageRaw);
    return {
      id: stages.length > 1 ? `${baseId}-${journeyStage.toLowerCase()}` : baseId,
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
      regStatus: (['OPEN', 'CLOSED', 'N/A'] as const).includes(regStatus) ? regStatus : 'N/A',
      isConference,
      otherInfo,
    } as CCFEvent;
  });
}

// ───── WordPress loader ─────

async function loadEventsFromWordPress(): Promise<CCFEvent[]> {
  try {
    // Fetch ministries + events in parallel
    const [minRes, evRes] = await Promise.all([
      fetch(`${WP_API_BASE}/ministry?per_page=100`, { cache: 'no-store' }),
      fetch(`${WP_API_BASE}/events?per_page=100`, { cache: 'no-store' }),
    ]);

    if (!minRes.ok) throw new Error(`WP ministry fetch failed: HTTP ${minRes.status}`);
    if (!evRes.ok) throw new Error(`WP events fetch failed: HTTP ${evRes.status}`);

    const ministriesArr: WPMinistry[] = await minRes.json();
    const ministries = new Map(ministriesArr.map((m) => [m.id, m]));
    const wpEvents: WPEvent[] = await evRes.json();

    const events: CCFEvent[] = [];
    for (const wp of wpEvents) {
      events.push(...mapWPEvent(wp, ministries));
    }

    if (events.length === 0) {
      console.warn('[events-data] WordPress returned 0 events — using EVENTS_RAW fallback');
      return EVENTS_RAW;
    }

    console.log(`[events-data] ✅ Loaded ${events.length} events from WordPress (${wpEvents.length} posts)`);
    return events;
  } catch (err) {
    console.warn('[events-data] ⚠️  WordPress fetch failed, using EVENTS_RAW fallback:', err);
    return EVENTS_RAW;
  }
}

// ───── module-level: top-level await fires at build time ─────

export const EVENTS: CCFEvent[] = await loadEventsFromWordPress();

// ═════════════════════════════════════════════════════════════════════
// Query functions — signatures IDENTICAL to prior CSV-era exports.
// Downstream files (10+ pages/components) require zero changes.
// ═════════════════════════════════════════════════════════════════════

export function getAllMonths(
  includePast: boolean = false,
): { month: string; slug: string; count: number }[] {
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
  return getActiveEvents(EVENTS)
    .filter((e) => {
      if (e.monthSlug === slug) return true;
      if (e.occurrences) {
        return e.occurrences.some((d) => monthSlugFromLabel(monthLabelFromISO(d)) === slug);
      }
      return false;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
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
  return upcoming?.slug ?? months[0]?.slug ?? 'august-2026';
}

export function getEventDivision(event: CCFEvent): DivisionId {
  if (event.isConference) return 'conference';

  const originator = (event.originator || '').trim().toUpperCase();
  const firstToken = originator.split(/[\s-]/)[0];

  // GLC (Global Leadership Center)
  if (firstToken === 'D' || firstToken === 'GLC') return 'glc';

  // Pastoral Care Department = MINISTRY (not Pastoral Area)
  if (
    firstToken === 'PCD' ||
    originator.includes('PCD') ||
    originator.includes('PASTORAL CARE')
  ) {
    return 'ministries';
  }

  // Pastoral Areas
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

  // Ministries
  if (firstToken === 'M' || firstToken === 'WOW' || firstToken === 'INTERCEDE') {
    return 'ministries';
  }

  return 'ministries';
}

export function getEventsByDivision(divisionId: DivisionId): CCFEvent[] {
  return getActiveEvents(EVENTS)
    .filter((e) => getEventDivision(e) === divisionId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
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
  return getActiveEvents(EVENTS)
    .filter((e) => e.journeyStage.toLowerCase() === target)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// ============================================
// Month-to-month filter (Pastor Ricky's request)
// Returns events whose END month is >= current month.
// ============================================
export function getActiveEvents(allEvents: CCFEvent[] = EVENTS): CCFEvent[] {
  const currentYM = getCurrentManilaYM();
  const todayISO = getTodayManilaISO();

  return allEvents
    .filter((e) => {
      const endYM = (e.endDate || e.startDate).slice(0, 7);
      return endYM >= currentYM;
    })
    .map((e) => {
      if (e.occurrences && e.occurrences.length > 0) {
        const futureOccurrences = e.occurrences.filter((d) => d >= todayISO);
        if (futureOccurrences.length === 0) return null;
        const newStartDate = futureOccurrences[0];
        const newEndDate = futureOccurrences[futureOccurrences.length - 1];
        const newMonth = monthLabelFromISO(newStartDate);
        const newMonthSlug = monthSlugFromLabel(newMonth);
        const newDateLabel = futureOccurrences.map((d) => formatMonthDay(d)).join(', ');
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
      return e;
    })
    .filter((e): e is CCFEvent => e !== null);
}

export function getTodayManilaISO(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  const d = parts.find((p) => p.type === 'day')!.value;
  return `${y}-${m}-${d}`;
}

export function getCurrentManilaYM(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')!.value;
  const m = parts.find((p) => p.type === 'month')!.value;
  return `${y}-${m}`;
}

// ============================================
// Data Quality Check (Ate Judy's request)
// Flags events with missing/invalid data.
// ============================================

export type DataQualityIssue = {
  eventId: string;
  eventTitle: string;
  originator: string;
  severity: 'error' | 'warning';
  problem: string;
};

export function getDataQualityIssues(allEvents: CCFEvent[] = EVENTS): DataQualityIssue[] {
  const issues: DataQualityIssue[] = [];
  for (const e of allEvents) {
    const title = e.activityDetail || e.activity || '(no title)';
    if (e.endDate && e.startDate && e.endDate < e.startDate) {
      issues.push({
        eventId: e.id,
        eventTitle: title,
        originator: e.originator || '(empty)',
        severity: 'error',
        problem: `End date (${e.endDate}) is BEFORE start date (${e.startDate}). Fix END DATE column.`,
      });
    }
    if (!e.startDate) {
      issues.push({
        eventId: e.id,
        eventTitle: title,
        originator: e.originator || '(empty)',
        severity: 'error',
        problem: 'Missing start date. Fix DATE or START DATE column.',
      });
    }
    if (!e.originator || e.originator.trim() === '') {
      issues.push({
        eventId: e.id,
        eventTitle: title,
        originator: '(empty)',
        severity: 'error',
        problem: 'Missing organizer. Fix ORGANIZER column.',
      });
    }
    if (!e.location || e.location.trim() === '') {
      issues.push({
        eventId: e.id,
        eventTitle: title,
        originator: e.originator || '(empty)',
        severity: 'warning',
        problem: 'Missing location. Use "TBA" if unknown.',
      });
    }
  }
  return issues.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'error' ? -1 : 1;
    return a.originator.localeCompare(b.originator);
  });
}
