import { fetchEvents } from '@/lib/eventSource';
import { NextResponse } from 'next/server';

export async function GET() {
  const events = await fetchEvents();
  return NextResponse.json({ events });
}

export const revalidate = 60;
