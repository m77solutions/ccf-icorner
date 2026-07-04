// app/events/[id]/calendar.ics/route.ts
// Static .ics generation. URL: /events/<id>/calendar.ics
// The .ics extension in the URL ensures phones recognize it as a calendar file.
import { EVENTS, getActiveEvents } from '@/lib/events-data';
import { generateICS } from '@/lib/ics-generator';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return getActiveEvents(EVENTS).map((event) => ({ id: event.id }));
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const event = EVENTS.find((e) => e.id === id);

  if (!event) {
    return new Response('Event not found', { status: 404 });
  }

  const ics = generateICS(event);

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${id}.ics"`,
    },
  });
}
