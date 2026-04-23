// /api/leads — list endpoint for the admin dashboard's refresh button.
// In production this should be authed (HubSpot SSO or basic auth).

import { NextResponse } from 'next/server';
import { listLeads } from '../../lib/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ leads: listLeads() });
}
