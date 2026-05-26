import { fetchEvents } from '@/lib/eventSource';
import { CCF_BRAND, type JourneyStage } from '@/lib/ccfBrand';
import { format } from 'date-fns';
import Link from 'next/link';

const STAGES: JourneyStage[] = ['Engage', 'Edify', 'Equip', 'Empower'];

export default async function JourneyPage() {
  const events = await fetchEvents();

  return (
    <main className="min-h-screen bg-[#FAFAF7] p-6 md:p-10">
      <Link href="/" className="text-blue-600 mb-4 inline-block">← Back to home</Link>

      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">🧭 Discipleship Journey Calendar</h1>
        <p className="text-lg text-slate-600 mt-2">Explore the CCF Discipleship Journey</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        {STAGES.map(stage => {
          const cfg = CCF_BRAND.journey[stage];
          const stageEvents = events.filter(e => e.journey_stage === stage);
          return (
            <div key={stage} className="bg-white rounded-2xl overflow-hidden shadow border-t-8" style={{ borderTopColor: cfg.hex }}>
              <div className="p-5 text-center" style={{ backgroundColor: `${cfg.hex}15` }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.hex }}></div>
                <h2 className="text-2xl font-bold lowercase" style={{ color: cfg.hex }}>{cfg.label}</h2>
                <p className="text-sm text-slate-600 mt-1 italic">{cfg.tagline}</p>
              </div>
              <div className="p-4 space-y-3 min-h-[300px]">
                {stageEvents.length === 0 ? (
                  <p className="text-slate-400 text-sm italic text-center pt-8">Coming soon</p>
                ) : (
                  stageEvents.map(e => (
                    <div key={e.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-slate-600 mt-1">📅 {format(new Date(e.start_datetime), 'MMM d')}</div>
                      <div className="text-xs text-slate-500 mt-1">[{e.division === 'Ministries' ? 'Min' : e.division === 'GLC' ? 'GLC' : 'PA'}]</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
