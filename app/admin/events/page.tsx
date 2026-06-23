import { EVENTS, getEventDivision } from '@/lib/events-data';
import { DIVISIONS, STAGES } from '@/lib/events';
import AdminEventsClient from '@/components/AdminEventsClient';

export const dynamic = 'force-static';

export default function AdminEventsPage() {
  // Sort events by startDate ascending for stable initial render
  const sorted = [...EVENTS].sort((a, b) => a.startDate.localeCompare(b.startDate));
  // Enrich each event with its division id (computed server-side)
  const events = sorted.map(e => ({
    ...e,
    divisionId: getEventDivision(e),
  }));
  return <AdminEventsClient events={events} divisions={DIVISIONS} stages={STAGES} />;
}
