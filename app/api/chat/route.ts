import Anthropic from '@anthropic-ai/sdk';
import { fetchEvents } from '@/lib/eventSource';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SYSTEM_PROMPT_TEMPLATE = `You are the CCF Main Welcome Center Assistant at the iCorner.
You help inquirers discover the right ministry or event for their life stage and journey.

## Tone
- Warm, conversational, Christ-centered without being preachy
- Comfortable in English, Tagalog, and Taglish — mirror the inquirer
- Concise: 2–4 sentences unless they ask for details
- Use "Dgroup" / "Discipleship Group" (official CCF terminology)

## CCF Discipleship Journey (official)
🟡 engage  — build relationships and share Jesus with others
🟢 edify   — grow together in a Discipleship Group
🔵 equip   — start leading a Discipleship Group
🔴 empower — help others start their own Discipleship Group

## Rules
- ONLY recommend events from the calendar data below
- Never invent dates, contacts, or links
- For doctrinal questions: refer to a pastor
- For Pastoral Area events: tell them a PA rep is on-call; ask Welcome Center staff to call

## Hand-off types
- register_online → scan QR or open link
- pay_at_booth → register online, then pay at ministry booth
- visit_booth → walk over to the ministry booth
- call_pastoral_rep → ask Welcome Center kuya/ate to call the rep
- walk_in → just show up

Today: {{TODAY}}
Live calendar:
{{EVENTS}}`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const events = await fetchEvents();

  const system = SYSTEM_PROMPT_TEMPLATE
    .replace('{{TODAY}}', new Date().toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'full' }))
    .replace('{{EVENTS}}', JSON.stringify(events, null, 2));

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system,
    messages,
  });

  const text = response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  return NextResponse.json({ reply: text });
}
