// /api/ivy — proxy to Anthropic's Claude Haiku for Ivy's voice.
// The browser never sees the API key. If the call fails (or no key is set
// in dev), we fall back to scripted bubbles from lib/ivy.ts.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { SCRIPT_STEPS, ivySystemPrompt, ivyUserTurn, fallbackFor, type StepId } from '../../lib/ivy';
import type { Answers, Lead } from '../../lib/types';

export const runtime = 'nodejs';   // anthropic SDK needs node, not edge

interface Body {
  stepId: StepId;
  answers: Answers;
  lead: Lead;
  userMessage: string | null;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }
  const step = SCRIPT_STEPS.find(s => s.id === body.stepId);
  if (!step) return NextResponse.json({ error: 'unknown step' }, { status: 400 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Dev / unconfigured environment — return fallback so the UI keeps moving.
    return NextResponse.json({ bubbles: fallbackFor(step.id, body.userMessage), source: 'fallback' });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const completion = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: ivySystemPrompt(body.lead, body.answers),
      messages: [{ role: 'user', content: ivyUserTurn(step.ask, body.userMessage) }],
    });
    // Pull text from the first content block
    const text = completion.content
      .filter(c => c.type === 'text')
      .map(c => (c as any).text as string)
      .join('\n');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no JSON in model output');
    const parsed = JSON.parse(m[0]);
    if (!Array.isArray(parsed.bubbles) || parsed.bubbles.length === 0) throw new Error('no bubbles');
    const bubbles = parsed.bubbles.slice(0, 2).map((s: unknown) => String(s).trim()).filter(Boolean);
    return NextResponse.json({ bubbles, source: 'llm' });
  } catch (err) {
    console.error('[ivy] LLM error, using fallback:', err);
    return NextResponse.json({ bubbles: fallbackFor(step.id, body.userMessage), source: 'fallback' });
  }
}
