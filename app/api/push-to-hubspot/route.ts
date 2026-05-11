// /api/push-to-hubspot — pushes a stored lead's data to HubSpot.
// Dry-run mode when HUBSPOT_PRIVATE_APP_TOKEN is not set.
// In production: update contact properties + create a note + assign owner.

import { NextResponse } from 'next/server';
import { getLead } from '../../lib/store';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { leadId } = await req.json();
  const lead = await getLead(leadId);
  if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 });

  if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN) {
    console.log('[hubspot] DRY RUN — would push:', JSON.stringify({
      contactId: lead.lead.hubspotContactId,
      properties: {
        firstname: lead.lead.firstName,
        phone: lead.answers.phone,
        address: lead.answers.address?.address,
        project_scope: lead.answers.scope,
        project_detail: lead.answers.scopeDetail,
        project_budget: lead.answers.budget?.label,
        project_timeline: lead.answers.timeline,
        lead_owner_recommended: lead.routing.owner,
        lead_team: lead.routing.team,
        lead_dq_reason: lead.routing.team === 'DQ' ? lead.routing.reason : '',
      },
    }, null, 2));
    return NextResponse.json({ ok: true, dryRun: true });
  }

  // TODO: real HubSpot calls.
  // 1) PATCH /crm/v3/objects/contacts/{contactId} with the property mapping.
  // 2) POST /crm/v3/objects/notes with markdown body + association to contact.
  // 3) PUT /crm/v3/owners ... or update hubspot_owner_id on the contact.
  return NextResponse.json({ ok: true, dryRun: false });
}
