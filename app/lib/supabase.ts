// Supabase client singleton for the portal backend.
// Uses the service_role key (server-side only) so RLS is bypassed and
// the portal can insert leads, routing rows, and storage objects directly.
//
// NEVER import this from a client component — the service key would leak
// to the browser. All Supabase access goes through API routes.

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

// Lead-intake table names. The tables live in the public schema with a
// lead_intake_ prefix because PostgREST wasn't honoring exposed-schemas
// config for a custom lead_intake schema. Functionally equivalent.
export const LEAD_INTAKE_TABLES = {
  leads: 'lead_intake_leads',
  routing: 'lead_intake_routing',
  photos: 'lead_intake_photos',
} as const;

export const LEAD_PHOTOS_BUCKET = 'lead-photos';
