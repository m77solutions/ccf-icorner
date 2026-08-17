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

/**
 * Normalizes an ACF Date Picker value to ISO `YYYY-MM-DD`.
 * Handles all common ACF/WP formats defensively:
 *   • "2026-09-06"    → "2026-09-06"  (already ISO)
 *   • "20260906"      → "2026-09-06"  (ACF raw Ymd storage)
 *   • "09/06/2026"    → "2026-09-06"  (m/d/Y)
 *   • ""              → ""            (empty stays empty)
 *   • anything else   → ""            (invalid, caller can flag)
 *
 * This makes the pipeline resilient to ACF Return Format misconfiguration.
 */
function normalizeACFDate(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw).trim();
  if (!s) return '';

  // Already ISO (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Compact Ymd (YYYYMMDD) — ACF's raw storage format
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  // m/d/Y (US locale, which is what WP defaults to)
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, a, b, y] = slashMatch;
    const mm = a.padStart(2, '0');
    const dd = b.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }

  // Fallback: try Date.parse (handles "September 6, 2026" etc.)
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  console.warn(`[events-data] ⚠️  Could not normalize date value: "${s}"`);
  return '';
}

function monthLabelFromISO(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Invalid Date';
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return 'Invalid Date';
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
  if (!startDate) return 'Invalid Date';
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
    is_recurring?: boolean | string | number;   // renamed from is_contiguous (2026-08-15)
    is_contiguous?: boolean | string | number;  // legacy — kept for backward compat
    occurrences?: string | string[];
    other_info?: string;
    share_intro?: string;
    share_hashtags?: string;
    reg_link?: string;
    registration_link?: string;
    registration_qr?: string;
    is_conference?: boolean | string;
  };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: {
          large?: { source_url?: string };
          medium_large?: { source_url?: string };
          full?: { source_url?: string };
        };
      };
    }>;
  };
};

// ───── WordPress → CCFEvent mapper ─────
// Produces the exact same CCFEvent shape the rest of the app expects.
// Multi-stage events (e.g. "ENGAGE, EDIFY") split into N CCFEvent objects.

function mapWPEvent(wp: WPEvent, ministries: Map<number, WPMinistry>): CCFEvent[] {
  const acf = wp.acf ?? {};

  // ─ Featured image (poster) — prefer 'large' size (~819x1024), fallback to full ─
  const media = wp._embedded?.['wp:featuredmedia']?.[0];
  const posterUrl =
    media?.media_details?.sizes?.large?.source_url ||
    media?.media_details?.sizes?.medium_large?.source_url ||
    media?.media_details?.sizes?.full?.source_url ||
    media?.source_url ||
    undefined;

  // ─ Dates (defensively normalized — handles Y-m-d, Ymd, m/d/Y, etc.) ─
  const startDate = normalizeACFDate(acf.start_date);
  const endDate = normalizeACFDate(acf.end_date) || startDate;
  if (!startDate) {
    console.warn(
      `[events-data] ⚠️  Event "${wp.slug}" (id=${wp.id}) has no valid start_date — skipping.`,
    );
    return [];
  }

  // ─ Occurrences (may arrive newline-separated, comma-separated, or array) ─
  let occurrences: string[] | undefined;
  let isContiguous = true;

  // Parse occurrences first — accepts \n, comma, or array input.
  if (acf.occurrences) {
    const raw = Array.isArray(acf.occurrences)
      ? acf.occurrences
      : String(acf.occurrences).split(/[\n,]+/);
    const parsed = raw
      .map((s) => normalizeACFDate(s))
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort();
    if (parsed.length > 0) {
      occurrences = parsed;
      isContiguous = false;
    }
  }

  // Read "Recurring Event?" flag (new field name = is_recurring).
  // Fall back to legacy is_contiguous for backward compat during migration.
  // Semantics: is_recurring = true  → non-contiguous (separate dates)
  //            is_recurring = false → contiguous (single day or spanning range)
  const isRecurringFlag =
    acf.is_recurring === true ||
    acf.is_recurring === 'true' ||
    acf.is_recurring === 1 ||
    acf.is_recurring === '1';

  const legacyIsContiguousFalse =
    acf.is_contiguous === false ||
    acf.is_contiguous === 'false' ||
    acf.is_contiguous === 0 ||
    acf.is_contiguous === '0';

  // Only treat as non-contiguous when explicitly recurring AND we have occurrences.
  // A "recurring" flag with no occurrences listed is nonsensical — render as
  // single-range contiguous instead (fixes Ate Judy's BOOK 1 bug).
  if (occurrences && (isRecurringFlag || legacyIsContiguousFalse)) {
    isContiguous = false;
  } else {
    isContiguous = true;
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
  const shareIntro = String(acf.share_intro || '').trim() || undefined;
  const shareHashtags = String(acf.share_hashtags || '').trim() || undefined;
  const regLink = String(acf.reg_link || acf.registration_link || '').trim() || undefined;
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
      shareIntro,
      shareHashtags,
      regLink,
      posterUrl,
    } as CCFEvent;
  });
}

// ───── WordPress loader ─────

async function loadEventsFromWordPress(): Promise<CCFEvent[]> {
  try {
    // Fetch ministries + events in parallel
    const [minRes, evRes] = await Promise.all([
      fetch(`${WP_API_BASE}/ministry?per_page=100`, { cache: 'no-store' }),
      fetch(`${WP_API_BASE}/events?per_page=100&_embed=wp:featuredmedia`, { cache: 'no-store' }),
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

    console.log(
      `[events-data] ✅ Loaded ${events.length} events from WordPress (${wpEvents.length} posts)`,
    );
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
