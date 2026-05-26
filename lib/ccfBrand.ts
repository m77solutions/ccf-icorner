export const CCF_BRAND = {
  journey: {
    Engage:  { hex: '#F5C518', label: 'engage',  tagline: 'build relationships and share Jesus with others' },
    Edify:   { hex: '#8BC34A', label: 'edify',   tagline: 'grow together in a Discipleship Group' },
    Equip:   { hex: '#2E9DF7', label: 'equip',   tagline: 'start leading a Discipleship Group' },
    Empower: { hex: '#8B1A1A', label: 'empower', tagline: 'help others start their own Discipleship Group' },
  },
  ministry: {
    NextGen:        '#F97316',
    WOW:            '#EC4899',
    Elevate:        '#3B82F6',
    "Men's Movement": '#1E3A8A',
    ACROSS:         '#14B8A6',
    GLC:            '#10B981',
    'Couples Retreat': '#A855F7',
    Unite:          '#EAB308',
  },
} as const;

export type JourneyStage = keyof typeof CCF_BRAND.journey;
