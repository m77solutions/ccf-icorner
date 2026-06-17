// components/ViewSwitcher.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export type ViewMode = 'calendar' | 'list' | 'timeline';

const VIEWS: { id: ViewMode; label: string; icon: string }[] = [
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'list',     label: 'List',     icon: '📋' },
  { id: 'timeline', label: 'Timeline', icon: '📊' },
];

export default function ViewSwitcher({ current }: { current: ViewMode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setView = (v: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        background: '#FFFFFF',
        border: '3px solid #000',
        borderRadius: 999,
        padding: 4,
        boxShadow: '3px 3px 0 rgba(0,0,0,0.15)',
      }}
    >
      {VIEWS.map((v) => {
        const active = v.id === current;
        return (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              background: active ? '#1FA3C0' : 'transparent',
              color: active ? '#FFFFFF' : '#2D3748',
              fontWeight: 700,
              fontSize: 14,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            aria-pressed={active}
          >
            <span>{v.icon}</span>
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
}
