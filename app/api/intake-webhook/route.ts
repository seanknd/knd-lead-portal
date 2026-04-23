// /api/intake-webhook — called by HubSpot workflow on new contact form submission.
// Returns a signed URL the workflow drops into the follow-up email template.

import { NextResponse } from 'next/server';
import { signLinkToken } from '../../lib/jwt';

export const runtime = 'nodejs';

interface Body {
  contactId: string;
  firstName: string;
  originalInquiry: string;
  email?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  if (!body.contactId || !body.firstName) {
    return NextResponse.json({ error: 'contactId and firstName are required' }, { status: 400 });
  }

  const token = await signLinkToken({
    hubspotContactId: body.contactId,
    firstName: body.firstName,
    originalInquiry: body.originalInquiry || 'a landscape project',
    email: body.email,
  });
  const base = process.env.PORTAL_BASE_URL || 'http://localhost:3000';
  const url = `${base.replace(/\/$/, '')}/s/${token}`;
  return NextResponse.json({ url });
}
