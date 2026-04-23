// Tiny in-memory lead store so the admin dashboard has something to render
// during local testing. In production this should be a real DB (Postgres/Supabase)
// or a HubSpot read-back. This is intentionally NOT persisted across server restarts.

import type { Answers, Lead, RoutingResult, StoredLead } from './types';

declare global {
  // eslint-disable-next-line no-var
  var __KND_LEAD_STORE: Map<string, StoredLead> | undefined;
}

function db(): Map<string, StoredLead> {
  if (!global.__KND_LEAD_STORE) {
    global.__KND_LEAD_STORE = new Map();
    seed(global.__KND_LEAD_STORE);
  }
  return global.__KND_LEAD_STORE;
}

export function saveLead(payload: { id: string; lead: Lead; answers: Answers; routing: RoutingResult; closingMessage: string; receivedAt: string }): StoredLead {
  const stored: StoredLead = {
    id: payload.id,
    lead: payload.lead,
    answers: payload.answers,
    routing: payload.routing,
    closingMessage: payload.closingMessage,
    receivedAt: payload.receivedAt,
  };
  db().set(payload.id, stored);
  return stored;
}

export function listLeads(): StoredLead[] {
  return Array.from(db().values()).sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

export function getLead(id: string): StoredLead | undefined {
  return db().get(id);
}

// Seed with a few demo leads so /admin shows something useful on first load.
function seed(d: Map<string, StoredLead>) {
  const now = Date.now();
  const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();
  const samples: StoredLead[] = [
    {
      id: 'L-4821',
      lead: { firstName: 'Sarah Parker', originalInquiry: 'a backyard remodel in Aptos', email: 'sarah.parker@example.com' },
      answers: {
        consent: 'Sure, go ahead',
        scope: 'Full yard remodel',
        scopeDetail: 'Outdoor kitchen, fire feature, paver patio with built-in seating',
        budget: { raw: 175, label: '$175k', tier: 'Full yard remodel' },
        timeline: '1-3 months',
        address: { address: '212 Seacliff Dr, Aptos, CA' },
        photos: { files: [], skipped: false },
        phone: '(831) 555-0101',
      },
      routing: {
        team: 'Design-Build', owner: 'Rudy', confidence: 94, reason: 'Large design-build remodel ($100k+)', flags: [],
        checks: [
          { label: 'Not a one-off / single-trade scope', pass: true },
          { label: 'Budget at or above $15k floor', pass: true },
          { label: 'Service area (South San Jose through Santa Cruz, Watsonville, Salinas, Monterey, and down to San Luis Obispo)', pass: true, needsHuman: true },
          { label: 'Routes to Design-Build (large remodel $100k+)', pass: true },
        ],
      },
      closingMessage: "Perfect, you're all set. Someone from our residential team will reach out within one business day. You'll get a text before any call.",
      receivedAt: ago(9),
    },
    {
      id: 'L-4820',
      lead: { firstName: 'Marcus Chen', originalInquiry: 'side-yard drainage in Capitola', email: 'marcus@example.com' },
      answers: {
        consent: 'Sure, go ahead',
        scope: 'Drainage / retaining wall',
        scopeDetail: 'French drain plus a small retaining wall in the side yard',
        budget: { raw: 25, label: '$25k', tier: 'Small remodel' },
        timeline: '1-3 months',
        address: { address: '410 Park Ave, Capitola, CA' },
        photos: { files: [], skipped: true },
        phone: '(831) 555-0142',
      },
      routing: {
        team: 'Res Lite', owner: 'Kendel', confidence: 91, reason: 'Functional enhancement: drainage / retaining wall', flags: [],
        checks: [
          { label: 'Not a one-off / single-trade scope', pass: true },
          { label: 'Budget at or above $15k floor', pass: true },
          { label: 'Service area (South San Jose through Santa Cruz, Watsonville, Salinas, Monterey, and down to San Luis Obispo)', pass: true, needsHuman: true },
          { label: 'Routes to Res Lite (drainage / retaining / functional)', pass: true },
        ],
      },
      closingMessage: "Perfect, you're all set. Someone from our residential team will reach out within one business day. You'll get a text before any call.",
      receivedAt: ago(42),
    },
    {
      id: 'L-4819',
      lead: { firstName: 'Oakbrook HOA', originalInquiry: 'ongoing landscape maintenance for ~40 units', email: 'pm@oakbrookhoa.com' },
      answers: {
        consent: 'Sure, go ahead',
        scope: 'Commercial or HOA project',
        scopeDetail: 'Weekly maintenance contract for the common areas, ~40 unit community',
        budget: { raw: 85, label: '$85k', tier: 'Partial yard' },
        timeline: "I'm flexible",
        address: { address: '2200 Oakbrook Way, Watsonville, CA' },
        photos: { files: [], skipped: true },
        phone: '(831) 555-0177',
        union: 'Non-union',
      },
      routing: {
        team: 'Biz Dev', owner: 'Jamie', confidence: 96, reason: 'Commercial/HOA ongoing maintenance contract', flags: [],
        checks: [
          { label: 'Not a one-off / single-trade scope', pass: true },
          { label: 'Budget at or above $15k floor', pass: true },
          { label: 'Commercial work is non-union', pass: true },
          { label: 'Service area (South San Jose through Santa Cruz, Watsonville, Salinas, Monterey, and down to San Luis Obispo)', pass: true, needsHuman: true },
          { label: 'Routes to Biz Dev (commercial/HOA maintenance)', pass: true },
        ],
      },
      closingMessage: "Perfect, you're all set. Someone from our business development team will reach out within one business day.",
      receivedAt: ago(64),
    },
    {
      id: 'L-4818',
      lead: { firstName: 'David Weiss', originalInquiry: 'two trees and some mulch', email: 'dweiss@example.com' },
      answers: {
        consent: "I've only got a minute",
        scope: 'Something else',
        scopeDetail: 'Just need two trees trimmed and maybe some mulch refreshed',
        budget: { raw: 8, label: '$8k', tier: 'Enhancement size' },
        timeline: 'ASAP / this month',
        address: { address: '88 Walnut Ave, Santa Cruz, CA' },
        photos: { files: [], skipped: true },
        phone: '(831) 555-0198',
      },
      routing: {
        team: 'DQ', owner: null, confidence: 95, reason: 'Standalone tree work', flags: [],
        checks: [
          { label: 'Not a one-off / single-trade scope', pass: false },
        ],
      },
      closingMessage: "Thanks David, someone from our team will be in touch.",
      receivedAt: ago(125),
    },
  ];
  for (const s of samples) d.set(s.id, s);
}
