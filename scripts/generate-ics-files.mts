// scripts/generate-ics-files.mts
// Self-contained: fetches CSV directly to avoid top-level await in events-data.ts
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';
import { generateICS } from '../lib/ics-generator.js';
import type { CCFEvent, JourneyStage } from '../lib/events.js';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/1KahZ8fDuOj6nxTMw1FgDnx5suo2pSNSy7L4tz-eyPF4/export?format=csv&gid=1592089368';

function mdyToISO(s: string): string {
  if (!s || !s.trim()) return '';
  const [m, d, y] = s.trim().split('/').map((x) => x.trim());
  if (!m || !d || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function normalizeStage(s: string): JourneyStage {
  const t = s.trim().toUpperCase();
  if (t === 'EDIFY') return 'Edify';
  if (t === 'EQUIP') return 'Equip';
  if (t === 'EMPOWER') return 'Empower';
  return 'Engage';
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
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
  const match = t.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return t;
  const [, h, m, ampm] = match;
  return `${parseInt(h, 10)}:${m}${ampm ? ` ${ampm.toUpperCase()}` : ''}`;
}

type CSVRow = Record<string, string>;

function parseRow(row: CSVRow, idx: number): CCFEvent[] {
  const organizer = (row['ORGANIZER'] || '').trim();
  const eventName = (row['EVENT'] || '').trim();
  if (!organizer || !eventName) return [];

  const eventType = (row['EVENT TYPE'] || '').trim();
  const stageRaw = (row['EVENT DJ STAGE'] || 'ENGAGE').trim();
  const stages = stageRaw.split(',').map((s) => s.trim()).filter(Boolean);

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
    occurrences = raw.split(',').map((s) => s.trim()).filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s)).sort();
    if (occurrences.length === 0) return [];
    startDate = occurrences[0];
    endDate = occurrences[occurrences.length - 1];
    isContiguous = false;
  } else {
    return [];
  }
  if (!startDate || !endDate) return [];

  const events: CCFEvent[] = [];
  for (const stageStr of stages) {
    const stage = normalizeStage(stageStr);
    const id = `${slugify(eventName)}-${slugify(stage)}-${idx}`;
    events.push({
      id,
      journeyStage: stage,
      originator: organizer,
      activity: eventName,
      activityDetail: (row['EVENT DETAIL'] || row['DETAIL'] || '').trim(),
      month: '',
      monthSlug: '',
      dateLabel: '',
      startDate,
      endDate,
      occurrences,
      isContiguous,
      timeLabel: formatTimeLabel(row['TIME'] || ''),
      location: (row['LOCATION'] || '').trim(),
      contactPerson: (row['CONTACT PERSON'] || '').trim(),
      contactNumber: (row['CONTACT NUMBER'] || '').trim(),
      platform: (row['PLATFORM'] || '').trim(),
      cost: parseCost(row['COST'] || ''),
      regStatus: 'Open' as any,
    });
  }
  return events;
}

console.log('📥 Fetching events CSV...');
const res = await fetch(CSV_URL);
if (!res.ok) {
  console.error(`❌ CSV fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const csvText = await res.text();
const parsed = Papa.parse<CSVRow>(csvText, { header: true, skipEmptyLines: true });
const events: CCFEvent[] = [];
parsed.data.forEach((row, idx) => {
  events.push(...parseRow(row, idx));
});

const outDir = join(process.cwd(), 'public', 'events');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let count = 0;
for (const event of events) {
  const ics = generateICS(event);
  writeFileSync(join(outDir, `${event.id}.ics`), ics, 'utf8');
  count++;
}
console.log(`✅ Generated ${count} .ics files in public/events/`);
