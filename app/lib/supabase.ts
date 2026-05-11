// Supabase client singleton for the portal backend.
// Uses the service_role key (server-side only) so RLS is bypassed and
// the portal can insert leads, routing rows, and storage objects directly.
//
// NEVER import this from a client component — the service key would leak
// to the browser. All Supabase access goes through API routes.
//
// We deliberately type the cached client as `any`. The strict generic
// typing in @supabase/supabase-js requires a generated Database type to
// be useful, and we haven't wired that yet. Runtime behavior is correct.

import { createClient } from '@supabase/supabase-js';

declare global {
  // eslint-disable-next-line no-var
  var __KND_SUPABASE_CLIENT: any | undefined;
}

export function supabase(): any {
  if (global.__KND_SUPABASE_CLIENT) return global.__KND_SUPABASE_CLIENT;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
      'Set them in your Netlify site settings.'
    );
  }

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  global.__KND_SUPABASE_CLIENT = client;
  return client;
}

// Schema-scoped query builder for our lead_intake tables. Use this
// instead of `supabase().from(...)` so we don't hit public by accident.
export function leadIntake(): any {
  return supabase().schema('lead_intake');
}

export const LEAD_PHOTOS_BUCKET = 'lead-photos';
