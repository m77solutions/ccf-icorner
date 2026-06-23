'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CCFEvent, Division, StageInfo, DivisionId } from '@/lib/events';

type EnrichedEvent = CCFEvent & { divisionId: DivisionId };
type Props = { events: EnrichedEvent[]; divisions: Division[]; stages: StageInfo[] };

const ADMIN_PASSWORD = 'CCFRefresh2026';
const SHEET_EDIT_URL = 'https://docs.google.com/spreadsheets/d/1B4nfajEszuYK0eb7yhqixmM07s0v6gJq_ZRl_p8jL0M/edit';

type SortKey = 'startDate' | 'activity' | 'originator' | 'journeyStage' | 'location';

export default function AdminEventsClient({ events, divisions, stages }: Props) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('');
  const [divisionFilter, setDivisionFilter] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = events.filter(e => {
      if (stageFilter && !e.isConference && e.journeyStage !== stageFilter) return false;
      if (stageFilter === 'Conference' && !e.isConference) return false;
      if (divisionFilter && e.divisionId !== divisionFilter) return false;
      if (q) {
        const blob = `${e.activity} ${e.activityDetail} ${e.originator} ${e.location} ${e.contactPerson}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      const av = (a[sortKey] ?? '') as string;
      const bv = (b[sortKey] ?? '') as string;
      const cmp = av.localeCompare(bv);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [events, search, stageFilter, divisionFilter, sortKey, sortAsc]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthed(true);
      setError('');
    } else {
      setError('Mali po ang password. Try again.');
    }
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  // ============== LOGIN VIEW ==============
  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F9FF', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🔒</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', textAlign: 'center', margin: 0 }}>Admin Events Viewer</h1>
          <p style={{ color: '#64748B', textAlign: 'center', marginTop: 8, marginBottom: 24, fontSize: 14 }}>
            Para po sa CCF iCorner admins lang
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              style={{ width: '100%', padding: '12px 16px', fontSize: 16, border: '2px solid #E2E8F0', borderRadius: 10, outline: 'none', boxSizing: 'border-box' }}
            />
            {error && <p style={{ color: '#DC2626', fontSize: 13, marginTop: 8, marginBottom: 0 }}>{error}</p>}
            <button type="submit" style={{ width: '100%', marginTop: 16, padding: '12px 16px', fontSize: 16, fontWeight: 700, background: '#1FA3C0', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              Log In
            </button>
          </form>
          <p style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 0 }}>
            <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none' }}>← Back to Welcome</Link>
          </p>
        </div>
      </div>
    );
  }

  // ============== AUTHED VIEW ==============
  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: 16 }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <Link href="/" style={{ color: '#1FA3C0', textDecoration: 'none', fontWeight: 700 }}>← Welcome</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={SHEET_EDIT_URL} target="_blank" rel="noopener noreferrer" style={{ padding: '8px 14px', background: '#16A34A', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              📝 Edit in Google Sheet
            </a>
            <Link href="/admin/refresh" style={{ padding: '8px 14px', background: '#1FA3C0', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              🔄 Refresh Kiosk
            </Link>
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', margin: '0 0 4px 0' }}>📋 Events Database</h1>
        <p style={{ color: '#64748B', margin: '0 0 16px 0', fontSize: 14 }}>
          Read-only view. Para mag-edit/delete, click "Edit in Google Sheet" then "Refresh Kiosk".
        </p>

        {/* Filters */}
        <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search activity, organizer, location, contact..."
              style={{ flex: '1 1 300px', padding: '10px 14px', fontSize: 14, border: '2px solid #E2E8F0', borderRadius: 8, outline: 'none' }}
            />
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{ padding: '10px 14px', fontSize: 14, border: '2px solid #E2E8F0', borderRadius: 8, background: 'white' }}>
              <option value="">All stages</option>
              {stages.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
              <option value="Conference">Conference</option>
            </select>
            <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)} style={{ padding: '10px 14px', fontSize: 14, border: '2px solid #E2E8F0', borderRadius: 8, background: 'white' }}>
              <option value="">All divisions</option>
              {divisions.map(d => <option key={d.id} value={d.id}>{d.icon} {d.label}</option>)}
            </select>
            {(search || stageFilter || divisionFilter) && (
              <button onClick={() => { setSearch(''); setStageFilter(''); setDivisionFilter(''); }} style={{ padding: '10px 14px', fontSize: 14, background: '#F1F5F9', border: '2px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Clear
              </button>
            )}
          </div>
          <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13, color: '#64748B' }}>
            Showing <strong style={{ color: '#0F172A' }}>{filtered.length}</strong> of <strong style={{ color: '#0F172A' }}>{events.length}</strong> events
          </p>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #E2E8F0' }}>
                  {[
                    { key: 'startDate' as SortKey, label: 'Date' },
                    { key: 'activity' as SortKey, label: 'Activity' },
                    { key: 'journeyStage' as SortKey, label: 'Stage' },
                    { key: 'originator' as SortKey, label: 'Organizer' },
                    { key: 'location' as SortKey, label: 'Location' },
                  ].map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                      {col.label} {sortKey === col.key ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                  ))}
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Time</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Cost</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Reg</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No events match your filters.</td></tr>
                ) : filtered.map((e, i) => {
                  const stageLabel = e.isConference ? 'CONFERENCE' : e.journeyStage.toUpperCase();
                  const stageBg = e.isConference ? '#F3E8FF' : (e.journeyStage === 'Engage' ? '#FEF3C7' : e.journeyStage === 'Edify' ? '#DCFCE7' : e.journeyStage === 'Equip' ? '#DBEAFE' : '#FEE2E2');
                  const stageFg = e.isConference ? '#9333EA' : (e.journeyStage === 'Engage' ? '#92400E' : e.journeyStage === 'Edify' ? '#166534' : e.journeyStage === 'Equip' ? '#1E40AF' : '#991B1B');
                  return (
                    <tr key={`${e.id}-${e.startDate}-${i}`} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#0F172A', fontWeight: 600 }}>{e.dateLabel}</td>
                      <td style={{ padding: '10px 14px', color: '#0F172A' }}>
                        <div style={{ fontWeight: 700 }}>{e.activity}</div>
                        {e.activityDetail && <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{e.activityDetail}</div>}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 12, background: stageBg, color: stageFg, fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap' }}>
                          {stageLabel}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#0F172A', whiteSpace: 'nowrap' }}>{e.originator}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{e.location || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{e.timeLabel || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569', whiteSpace: 'nowrap' }}>{e.cost || '—'}</td>
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: e.regStatus === 'OPEN' ? '#DCFCE7' : e.regStatus === 'CLOSED' ? '#FEE2E2' : '#F1F5F9', color: e.regStatus === 'OPEN' ? '#166534' : e.regStatus === 'CLOSED' ? '#991B1B' : '#64748B' }}>
                          {e.regStatus}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569', fontSize: 12 }}>
                        {e.contactPerson || '—'}
                        {e.contactNumber && <div style={{ color: '#94A3B8' }}>{e.contactNumber}</div>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#94A3B8', fontSize: 12, marginTop: 16 }}>
          Data source: Google Sheet (CSV). To make changes, click "Edit in Google Sheet" above, then "Refresh Kiosk".
        </p>
      </div>
    </div>
  );
}
