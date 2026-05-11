// /api/submit — finalize the lead.
// Computes routing server-side (cheat-sheet logic in lib/routing.ts),
// stores the lead via the Supabase-backed store (lib/store.ts),
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

  // Diagnostic surface: if saveLead throws, we return the error in the
  // response body so we can see it from the browser/curl. Netlify's free
  // tier hides server-side stdout, so this is the only way to see what
  // actually went wrong in production.
  let stored;
  try {
    stored = await saveLead({
      id,
      lead: body.lead,
      answers: body.answers,
      routing,
      closingMessage: closing,
      receivedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({
      error: 'saveLead failed',
      message: err?.message ?? String(err),
      stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
      hasUrl: Boolean(process.env.SUPABASE_URL),
      hasKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      urlPrefix: process.env.SUPABASE_URL?.slice(0, 30),
    }, { status: 500 });
  }

  // Best-effort HubSpot push (no-op in dev unless env is configured).
  void pushToHubspotBackground(stored).catch(err => console.warn('[submit] hubspot push failed:', err));

  return NextResponse.json({
    id,
    routing,
    closingMessage: closing,
    receivedAt: stored.receivedAt,
    storedId: stored.id,
  });
}

async function pushToHubspotBackground(stored: { id: string }) {
  if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN) return;
  console.log('[hubspot] would push lead', stored.id);
}
