// /api/submit — finalize the lead.
// Computes routing server-side (cheat-sheet logic in lib/routing.ts),
// stores the lead in the in-memory store so it shows up in /admin,
// and returns the routing result to the client.

import { NextResponse } from 'next/server';
import { computeRouting } from '../../lib/routing';
import { saveLead } from '../../lib/store';
import { fallbackClose } from '../../lib/ivy';
import type { Answers, Lead } from '../../lib/types';

export const runtime = 'nodejs';

interface Body { lead: Lead; answers: Answers }

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const routing = computeRouting(body.answers);
  const id = `L-${Date.now().toString().slice(-6)}`;
  const closing = fallbackClose(routing)[0];
  const stored = saveLead({
    id,
    lead: body.lead,
    answers: body.answers,
    routing,
    closingMessage: closing,
    receivedAt: new Date().toISOString(),
  });

  // Best-effort HubSpot push (no-op in dev unless env is configured).
  // Errors are swallowed so the lead's confirmation never depends on HubSpot being up.
  void pushToHubspotBackground(stored).catch(err => console.warn('[submit] hubspot push failed:', err));

  return NextResponse.json({
    id,
    routing,
    closingMessage: closing,
    receivedAt: stored.receivedAt,
  });
}

async function pushToHubspotBackground(stored: { id: string }) {
  if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN) return;
  // TODO: real HubSpot client call. Left as a stub to keep the build dep-free.
  console.log('[hubspot] would push lead', stored.id);
}
