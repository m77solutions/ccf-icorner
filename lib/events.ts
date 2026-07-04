// lib/events.ts
export type JourneyStage = 'Engage' | 'Edify' | 'Equip' | 'Empower';
export type RegStatus = 'OPEN' | 'CLOSED' | 'N/A';

export type CCFEvent = {
  id: string;
  journeyStage: JourneyStage;
  originator: string;
  activity: string;
  activityDetail: string;
  month: string;
  monthSlug: string;
  dateLabel: string;
  startDate: string;
  endDate: string;
  occurrences?: string[];     // NEW: specific dates for recurring/non-contiguous events
  isContiguous: boolean;      // NEW: true = retreat spanning days; false = recurring weekly etc.
  timeLabel: string;
  location: string;
  contactPerson: string;
  contactNumber: string;
  platform: string;
  cost: number | null;
  regStatus: RegStatus;
  isConference?: boolean;
  otherInfo?: string;
};

function normalizeStage(s: string): JourneyStage {
  const t = s.trim().toUpperCase();
  if (t === 'EDIFY') return 'Edify';
  if (t === 'EQUIP') return 'Equip';
  if (t === 'EMPOWER') return 'Empower';
  return 'Engage';
}

function monthSlug(month: string): string {
  return month.toLowerCase().replace(' ', '-');
}

type RawEvent = Omit<CCFEvent, 'monthSlug'>;

export const EVENTS_RAW: CCFEvent[] = [
  {
    id: 'unite-sarthou-jun',
    journeyStage: 'Equip',
    originator: 'P-RICKY SARTHOU',
    activity: 'UNITE',
    activityDetail: 'PTR Sarthou, Whelchel, Noel & Geronimo Pastoral Area',
    month: 'June 2026',
    monthSlug: 'june-2026',
    dateLabel: 'Jun 12–14',
    startDate: '2026-06-12',
    endDate: '2026-06-14',
    isContiguous: true,
    timeLabel: '',
    location: 'MMRC, Sto Tomas, Batangas',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 500,
    regStatus: 'N/A',
  },
  {
    id: 'pa-gathering-bert-vila',
    journeyStage: 'Equip',
    originator: 'P-BERT VILA',
    activity: 'Pastoral Area Gathering',
    activityDetail: 'PTR Bert Vila Pastoral Area Gathering',
    month: 'June 2026',
    monthSlug: 'june-2026',
    dateLabel: 'Jun 6, 20 & Jul 11',
    startDate: '2026-06-06',
    endDate: '2026-07-11',
    isContiguous: false,
    occurrences: ['2026-06-06', '2026-06-20', '2026-07-11'],
    timeLabel: '8:00 AM',
    location: '2F Annex, CCF Center',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: null,
    regStatus: 'N/A',
  },
  {
    id: 'glc2-book7-session5',
    journeyStage: 'Equip',
    originator: 'D-GLC',
    activity: 'GLC 2',
    activityDetail: 'Book 7 Session 5',
    month: 'June 2026',
    monthSlug: 'june-2026',
    dateLabel: 'Jun 14',
    startDate: '2026-06-14',
    endDate: '2026-06-14',
    isContiguous: true,
    timeLabel: '1:00 PM',
    location: 'Rm 4A, CCF Ctr',
    contactPerson: 'GLC',
    contactNumber: 'GLC',
    platform: '',
    cost: null,
    regStatus: 'N/A',
  },
  {
    id: 'wow-thursdays-jun',
    journeyStage: 'Edify',
    originator: 'M-WOW',
    activity: 'WOW Thursdays',
    activityDetail: 'Truth That Transforms',
    month: 'June 2026',
    monthSlug: 'june-2026',
    dateLabel: 'Jun 4, 11, 18',
    startDate: '2026-06-04',
    endDate: '2026-06-18',
    isContiguous: false,
    occurrences: ['2026-06-04', '2026-06-11', '2026-06-18'],
    timeLabel: '10:00 AM',
    location: 'MPH, CCF Ctr',
    contactPerson: 'PTR Jim Viber Group',
    contactNumber: 'PTR Jim Viber Group',
    platform: '',
    cost: 0,
    regStatus: 'N/A',
  },
  {
    id: 'welcome-wednesdays-jun17',
    journeyStage: 'Edify',
    originator: 'D-GLC',
    activity: 'Welcome Wednesdays',
    activityDetail: 'The Habit of a Daily Time with God',
    month: 'June 2026',
    monthSlug: 'june-2026',
    dateLabel: 'Jun 17',
    startDate: '2026-06-17',
    endDate: '2026-06-17',
    isContiguous: true,
    timeLabel: '7:00 PM',
    location: 'MPH, CCF Ctr',
    contactPerson: 'GLC',
    contactNumber: 'GLC',
    platform: '',
    cost: 0,
    regStatus: 'N/A',
  },
  {
    id: 'unite-luzon-central',
    journeyStage: 'Equip',
    originator: 'S-LUZON CENTRAL',
    activity: 'UNITE',
    activityDetail: 'Luzon Central (Malolos) — UNITE D-Leaders Retreat',
    month: 'July 2026',
    monthSlug: 'july-2026',
    dateLabel: 'Jul 10–12',
    startDate: '2026-07-10',
    endDate: '2026-07-12',
    isContiguous: true,
    timeLabel: '',
    location: 'MMRC, Sto Tomas, Batangas',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 500,
    regStatus: 'N/A',
  },
  {
    id: 'unite-north-edsa',
    journeyStage: 'Equip',
    originator: 'P-GLENN OBLIGACION / NORTH EDSA',
    activity: 'UNITE',
    activityDetail: 'North EDSA, PTR Obligacion, Valencia, North EDSA Pastoral Area',
    month: 'July 2026',
    monthSlug: 'july-2026',
    dateLabel: 'Jul 17–19',
    startDate: '2026-07-17',
    endDate: '2026-07-19',
    isContiguous: true,
    timeLabel: '',
    location: 'MMRC, Sto Tomas, Batangas',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 500,
    regStatus: 'OPEN',
  },
  {
    id: 'unite-luzon-south-b1',
    journeyStage: 'Equip',
    originator: 'S-LUZON SOUTH',
    activity: 'UNITE',
    activityDetail: 'Luzon South (Batch 1) — UNITE D-Leaders Retreat',
    month: 'July 2026',
    monthSlug: 'july-2026',
    dateLabel: 'Jul 24–26',
    startDate: '2026-07-24',
    endDate: '2026-07-26',
    isContiguous: true,
    timeLabel: '',
    location: 'MMRC, Sto Tomas, Batangas',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 500,
    regStatus: 'N/A',
  },
  {
    id: 'unite-luzon-south-b2',
    journeyStage: 'Equip',
    originator: 'S-LUZON SOUTH',
    activity: 'UNITE',
    activityDetail: 'Luzon South (Batch 2) — UNITE D-Leaders Retreat',
    month: 'August 2026',
    monthSlug: 'august-2026',
    dateLabel: 'Aug 14–16',
    startDate: '2026-08-14',
    endDate: '2026-08-16',
    isContiguous: true,
    timeLabel: '',
    location: 'MMRC, Sto Tomas, Batangas',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 500,
    regStatus: 'N/A',
  },
  {
    id: 'true-life-retreat-sep',
    journeyStage: 'Edify',
    originator: 'D-GLC',
    activity: 'True Life Retreat',
    activityDetail: "It's All About Grace — True Life Retreat: Redeemed",
    month: 'September 2026',
    monthSlug: 'september-2026',
    dateLabel: 'Sep 11–12',
    startDate: '2026-09-11',
    endDate: '2026-09-12',
    isContiguous: true,
    timeLabel: '',
    location: 'CCF Social Hall',
    contactPerson: 'CCF App',
    contactNumber: 'CCF App',
    platform: '',
    cost: 1300,
    regStatus: 'N/A',
  },
];

export function eventOccursOnDay(event: CCFEvent, dayISO: string): boolean {
  if (event.isContiguous) {
    return dayISO >= event.startDate && dayISO <= event.endDate;
  }
  return event.occurrences?.includes(dayISO) ?? false;
}

export const STAGE_COLORS: Record<JourneyStage, { bg: string; text: string; border: string }> = {
  Engage:  { bg: '#FEF3C7', text: '#92400E', border: '#F5C518' },
  Edify:   { bg: '#DCFCE7', text: '#166534', border: '#8BC34A' },
  Equip:   { bg: '#DBEAFE', text: '#1E40AF', border: '#2E9DF7' },
  Empower: { bg: '#FEE2E2', text: '#7F1D1D', border: '#8B1A1A' },
};


// ---------- DIVISION SUPPORT ----------

export type DivisionId = 'glc' | 'ministries' | 'pastoral-areas' | 'conference';

export type Division = {
  id: DivisionId;
  label: string;
  description: string;
  icon: string;
  color: string;
};

export const DIVISIONS: Division[] = [
  {
    id: 'glc',
    label: 'GLC',
    description: 'Global Leadership Center programs',
    icon: '🏛️',
    color: '#1FA3C0',
  },
  {
    id: 'ministries',
    label: 'Ministries',
    description: 'Department and ministry activities',
    icon: '⛪',
    color: '#8BC34A',
  },
  {
    id: 'pastoral-areas',
    label: 'Pastoral Areas',
    description: 'Pastoral area & satellite gatherings',
    icon: '👥',
    color: '#F5C518',
  },

  {
  id: 'conference',
  label: 'Conference',
  description: 'Conferences, summits, and special gatherings',
  icon: '🎤',
  color: '#9333EA',   // purple — distinct from existing 4 colors
}

];

export function getDivisionById(id: string): Division | undefined {
  return DIVISIONS.find((d) => d.id === id);
}

// ---------- JOURNEY STAGE SUPPORT ----------

export type StageInfo = {
  id: 'engage' | 'edify' | 'equip' | 'empower';
  label: JourneyStage;
  icon: string;
  description: string;
  audience: string;
};

export const STAGES: StageInfo[] = [
  {
    id: 'engage',
    label: 'Engage',
    icon: '🌱',
    description: 'First steps with God and the CCF community',
    audience: 'For seekers, new attendees, and first-time visitors',
  },
  {
    id: 'edify',
    label: 'Edify',
    icon: '📖',
    description: 'Grow in faith through teaching, fellowship, and worship',
    audience: 'For new believers strengthening their foundation',
  },
  {
    id: 'equip',
    label: 'Equip',
    icon: '🛠️',
    description: 'Be trained and prepared to serve and disciple others',
    audience: 'For believers ready to step into ministry and leadership',
  },
  {
    id: 'empower',
    label: 'Empower',
    icon: '🔥',
    description: 'Lead, multiply, and reach others for Christ',
    audience: 'For leaders multiplying disciples and influencing others',
  },
];

export function getStageById(id: string): StageInfo | undefined {
  return STAGES.find((s) => s.id === id);
}

