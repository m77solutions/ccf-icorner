import { MOCK_EVENTS, MOCK_PA_REPS } from './mockData';
import type { CCFEvent, PastoralRep } from './types';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

export async function fetchEvents(): Promise<CCFEvent[]> {
  if (USE_MOCK) {
    return MOCK_EVENTS.filter(e => e.status === 'Published');
  }

  // LIVE MODE: read from CCF Main Event System via Microsoft Graph
  // Implementation goes here once Wax provides the API endpoint + schema
  // const token = await getEntraIdToken();
  // const res = await fetch(process.env.CCF_EVENTS_API_URL!, {
  //   headers: { Authorization: `Bearer ${token}` },
  // });
  // return normalizeEvents(await res.json());

  throw new Error('Live mode not yet wired — set NEXT_PUBLIC_USE_MOCK_DATA=true');
}

export async function fetchPaReps(): Promise<PastoralRep[]> {
  if (USE_MOCK) return MOCK_PA_REPS;
  // LIVE MODE: read from SharePoint List
  return MOCK_PA_REPS;
}
