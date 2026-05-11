// Supabase-backed lead store. Reads/writes to lead_intake.leads and
// lead_intake.routing in the K&D Database. Replaces the in-memory Map
// that was used during development.

import { supabase, LEAD_INTAKE_TABLES } from './supabase';
import type { Answers, Lead, RoutingResult, StoredLead } from './types';

interface SaveLeadInput {
  id: string;
  lead: Lead;
  answers: Answers;
  routing: RoutingResult;
  closingMessage: string;
  receivedAt: string;
}

// Reverse of buildAnswers — flatten the structured chat answers into the
// flat columns we store in lead_intake.leads. Keeps the schema queryable
// from K&D OS without JSON-poking.
function answersToRow(lead: Lead, answers: Answers, receivedAt: string) {
  return {
    hubspot_contact_id: lead.hubspotContactId ?? null,
    first_name: lead.firstName ?? null,
    email: lead.email ?? null,
    phone: answers.phone ?? null,
    original_inquiry: lead.originalInquiry ?? null,
    consent: answers.consent ?? null,
    scope: answers.scope ?? null,
    scope_detail: answers.scopeDetail ?? null,
    budget_raw: answers.budget?.raw ?? null,
    budget_label: answers.budget?.label ?? null,
    budget_tier: answers.budget?.tier ?? null,
    timeline: answers.timeline ?? null,
    address: answers.address?.address ?? null,
    address_lat: answers.address?.lat ? Number(answers.address.lat) : null,
    address_lon: answers.address?.lon ? Number(answers.address.lon) : null,
    union_status: answers.union ?? null,
    completed: true,
    last_step: 'completed',
    received_at: receivedAt,
  };
}

// Hydrate back to the StoredLead shape the admin UI expects.
function rowToStored(leadRow: any, routingRow: any | null): StoredLead {
  const answers: Answers = {
    consent: leadRow.consent ?? undefined,
    scope: leadRow.scope ?? undefined,
    scopeDetail: leadRow.scope_detail ?? undefined,
    budget: leadRow.budget_label
      ? { raw: leadRow.budget_raw != null ? Number(leadRow.budget_raw) : null, label: leadRow.budget_label, tier: leadRow.budget_tier ?? '' }
      : undefined,
    timeline: leadRow.timeline ?? undefined,
    address: leadRow.address ? { address: leadRow.address, lat: leadRow.address_lat ?? undefined, lon: leadRow.address_lon ?? undefined } : undefined,
    photos: { files: [], skipped: true },  // TODO populate from lead_intake.photos when we wire that up
    phone: leadRow.phone ?? undefined,
    union: leadRow.union_status ?? undefined,
  };
  const lead: Lead = {
    firstName: leadRow.first_name ?? undefined,
    originalInquiry: leadRow.original_inquiry ?? undefined,
    email: leadRow.email ?? undefined,
    hubspotContactId: leadRow.hubspot_contact_id ?? undefined,
  };
  const routing: RoutingResult = routingRow
    ? {
        team: routingRow.team,
        owner: routingRow.owner ?? null,
        confidence: routingRow.confidence,
        reason: routingRow.reason,
        flags: routingRow.flags ?? [],
        checks: routingRow.checks ?? [],
      }
    : { team: 'DQ', owner: null, confidence: 0, reason: 'Routing data missing', flags: [], checks: [] };
  return {
    id: leadRow.id,
    lead,
    answers,
    routing,
    closingMessage: routingRow?.closing_message ?? '',
    receivedAt: leadRow.received_at,
  };
}

export async function saveLead(input: SaveLeadInput): Promise<StoredLead> {
  const sb: any = supabase();
  const row = answersToRow(input.lead, input.answers, input.receivedAt);

  const { data: leadData, error: leadErr } = await sb
    .from(LEAD_INTAKE_TABLES.leads)
    .insert(row)
    .select()
    .single();

  if (leadErr || !leadData) {
    throw new Error(`Supabase insert leads failed: ${leadErr?.message ?? 'unknown'}`);
  }

  const { error: routingErr } = await sb
    .from(LEAD_INTAKE_TABLES.routing)
    .insert({
      lead_id: leadData.id,
      team: input.routing.team,
      owner: input.routing.owner,
      confidence: input.routing.confidence,
      reason: input.routing.reason,
      flags: input.routing.flags,
      checks: input.routing.checks,
      closing_message: input.closingMessage,
    });

  if (routingErr) {
    throw new Error(`Supabase insert routing failed: ${routingErr.message}`);
  }

  return rowToStored(leadData, {
    team: input.routing.team,
    owner: input.routing.owner,
    confidence: input.routing.confidence,
    reason: input.routing.reason,
    flags: input.routing.flags,
    checks: input.routing.checks,
    closing_message: input.closingMessage,
  });
}

export async function listLeads(): Promise<StoredLead[]> {
  const sb: any = supabase();
  const { data, error } = await sb
    .from(LEAD_INTAKE_TABLES.leads)
    .select('*, lead_intake_routing(*)')
    .order('received_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[store] listLeads failed:', error);
    return [];
  }
  return (data ?? []).map((row: any) => rowToStored(row, row.lead_intake_routing));
}

export async function getLead(id: string): Promise<StoredLead | undefined> {
  const sb: any = supabase();
  const { data, error } = await sb
    .from(LEAD_INTAKE_TABLES.leads)
    .select('*, lead_intake_routing(*)')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) return undefined;
  return rowToStored(data, data.lead_intake_routing);
}
