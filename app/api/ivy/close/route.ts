// /api/ivy/close — final wrap-up bubble after the lead has answered everything.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { ivyClosingPrompt, fallbackClose } from '../../../lib/ivy';
import type { Answers, Lead, RoutingResult } from '../../../lib/types';

export const runtime = 'nodejs';

interface Body { answers: Answers; routing: RoutingResult; lead: Lead }

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ bubbles: fallbackClose(body.routing), source: 'fallback' });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const { system, user } = ivyClosingPrompt(body.answers, body.routing, body.lead);
    const completion = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system,
      messages: [{ role: 'user', content: user }],
    });
    const text = completion.content.filter(c => c.type === 'text').map(c => (c as any).text as string).join('\n');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no JSON');
    const parsed = JSON.parse(m[0]);
    const first = (parsed.bubbles || [])[0];
    if (!first) throw new Error('no bubble');
    return NextResponse.json({ bubbles: [String(first).trim()], source: 'llm' });
  } catch (err) {
    console.error('[ivy/close] LLM error, using fallback:', err);
    return NextResponse.json({ bubbles: fallbackClose(body.routing), source: 'fallback' });
  }
}
