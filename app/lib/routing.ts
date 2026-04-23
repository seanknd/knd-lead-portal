// Routing engine — implements the K&D Lead Qualification Cheat Sheet.
//
// The cheat-sheet rules in plain English:
//   - DQ if budget < $15k, or under $10k for any reason
//   - DQ if scope detail describes a single trade we don't take on
//     (tree trim/removal only, lawn mowing, junk removal, cleanup only,
//      single-trade fence/electrical, design-only, insurance claims,
//      house flippers, real-estate agents on behalf of sellers, etc.)
//   - DQ if commercial/HOA project is union work
//   - DQ if "emergency" timeline (sub-1-month) AND no other strong signal
//   - Commercial/HOA maintenance contracts -> Jamie (Biz Dev)
//   - Commercial build (non-union) -> Brian / Gray (Commercial)
//   - Drainage / retaining wall only, or sub-$50k construction -> Kendel (Res Lite)
//   - Full design+build $50k+ -> Rudy / Megha (Design-Build)
//
// All logic runs server-side (in /api/submit) so it can't be tampered with
// from the client. The portal calls this from the browser only to render
// a friendly summary screen. The canonical result comes from the server.

import type { Answers, RouteTeam, RoutingCheck, RoutingResult } from './types';

// TODO(real-team-mapping): swap these placeholders for actual K&D HubSpot user IDs.
export const OWNERS = {
  designBuildLarge: 'Rudy',  // $100k+ full design+build
  designBuildMid: 'Megha',      // $50k-$100k design+build
  resLite: 'Kendel',          // $15k-$50k enhancements, drainage, retaining walls
  bizDev: 'Jamie',             // Commercial / HOA maintenance
  commercial: 'Brian',       // Non-union commercial build (Brian / Gray per cheat sheet)
} as const;


// K&D's service area, per Sean: South San Jose down through Santa Cruz, Watsonville,
// Salinas, Monterey, all the way to San Luis Obispo. We don't have geocoding wired
// up yet, so this is a text match against city / county / well-known place names.
// If the address text doesn't match either list we default to "needs human review"
// rather than auto-DQ — a typo or unusual neighborhood name shouldn't kill a lead.
export const SERVICE_AREA_DESCRIPTION =
  'South San Jose through Santa Cruz, Watsonville, Salinas, Monterey, and down to San Luis Obispo';

// Cities, neighborhoods, and counties that count as in-area.
const IN_AREA_TERMS: RegExp[] = [
  // Santa Clara County (south part only)
  /\bsouth san jose\b/i,
  /\bmorgan hill\b/i,
  /\bgilroy\b/i,
  /\bsan martin\b/i,
  // Santa Cruz County
  /\bsanta cruz\b/i,
  /\bcapitola\b/i,
  /\bsoquel\b/i,
  /\baptos\b/i,
  /\brio del mar\b/i,
  /\bla selva beach\b/i,
  /\bwatsonville\b/i,
  /\bcorralitos\b/i,
  /\bfreedom\b/i,
  /\bscotts valley\b/i,
  /\bben lomond\b/i,
  /\bfelton\b/i,
  /\bboulder creek\b/i,
  /\bdavenport\b/i,
  // San Benito County
  /\bhollister\b/i,
  /\bsan juan bautista\b/i,
  // Monterey County
  /\bmonterey\b/i,
  /\bpacific grove\b/i,
  /\bcarmel\b/i,
  /\bcarmel valley\b/i,
  /\bpebble beach\b/i,
  /\bseaside\b/i,
  /\bmarina\b/i,
  /\bsalinas\b/i,
  /\bcastroville\b/i,
  /\bmoss landing\b/i,
  /\bprunedale\b/i,
  /\bsoledad\b/i,
  /\bgreenfield\b/i,
  /\bking city\b/i,
  /\bbig sur\b/i,
  // San Luis Obispo County
  /\bsan luis obispo\b/i,
  /\bslo\b/i,
  /\bpaso robles\b/i,
  /\batascadero\b/i,
  /\btempleton\b/i,
  /\bpismo beach\b/i,
  /\barroyo grande\b/i,
  /\bnipomo\b/i,
  /\bmorro bay\b/i,
  /\bcambria\b/i,
  /\bavila beach\b/i,
  /\bcayucos\b/i,
  /\bgrover beach\b/i,
  /\boceano\b/i,
];

// Out-of-area cities that frequently get typed in by mistake and should DQ.
const OUT_OF_AREA_TERMS: RegExp[] = [
  /\boakland\b/i,
  /\bberkeley\b/i,
  /\bsan francisco\b/i,
  /\bdaly city\b/i,
  /\bsan mateo\b/i,
  /\bredwood city\b/i,
  /\bpalo alto\b/i,
  /\bmountain view\b/i,
  /\bsunnyvale\b/i,
  /\bsanta clara\b/i,        // city of Santa Clara is north; we cover South SJ only
  /\bcupertino\b/i,
  /\bfremont\b/i,
  /\bhayward\b/i,
  /\bsan ramon\b/i,
  /\bwalnut creek\b/i,
  /\bconcord\b/i,
  /\bsacramento\b/i,
  /\bmodesto\b/i,
  /\bstockton\b/i,
  /\bfresno\b/i,
  /\bsanta barbara\b/i,
  /\bventura\b/i,
  /\blos angeles\b/i,
  /\bsan diego\b/i,
];

export type ServiceAreaResult = 'in-area' | 'out-of-area' | 'unknown';

export function checkServiceArea(addressText: string | null | undefined): ServiceAreaResult {
  if (!addressText) return 'unknown';
  const text = addressText.toLowerCase();
  if (IN_AREA_TERMS.some(rx => rx.test(text))) return 'in-area';
  if (OUT_OF_AREA_TERMS.some(rx => rx.test(text))) return 'out-of-area';
  return 'unknown';
}

// DQ keyword groups (lowercase). Lifted directly from the cheat sheet's
// "Projects We Do Not Take On" list and the red-flag examples.
const DQ_PATTERNS: Array<{ rx: RegExp; reason: string }> = [
  { rx: /(tree[- ]?trim|tree[- ]?remov|just trees?|tree work)/i,           reason: 'Standalone tree work' },
  { rx: /(just mow|lawn mow|weekly maintenance|residential mow)/i,         reason: 'Residential weekly maintenance' },
  { rx: /(junk removal|cleanup only|haul(ing)? only|just cleanup)/i,       reason: 'Cleanup or hauling only' },
  { rx: /(turf only|sod only|just (sod|turf))/i,                           reason: 'Turf-only install' },
  { rx: /(fence (only|repair)|just (a )?fence)/i,                          reason: 'Single-trade fence work' },
  { rx: /(concrete patch|patch concrete|just patching)/i,                  reason: 'One-off concrete patching' },
  { rx: /(electrical only|plumbing only|just lighting)/i,                  reason: 'Single-trade electrical/plumbing' },
  { rx: /(design only|plans? only|just a design|i'?ll (build|hire))/i,     reason: 'Design-only (client will hire builder)' },
  { rx: /(materials? only|just buying materials)/i,                        reason: 'Materials-only purchase' },
  { rx: /(insurance claim)/i,                                              reason: 'Insurance claim project' },
  { rx: /(flip(ping)? (the )?house|house flipp|quick resale)/i,            reason: 'House flipper / resale project' },
  { rx: /(real ?estate agent|on behalf of (the )?seller|listing agent)/i,  reason: 'Real estate agent on behalf of seller' },
  { rx: /(christmas lights|holiday lights)/i,                              reason: 'Holiday lighting' },
  { rx: /(snow removal|snow plow)/i,                                       reason: 'Residential snow removal' },
  { rx: /(pressure wash|power wash)/i,                                     reason: 'Pressure washing only' },
  { rx: /(ecological restoration|mitigation project|public sidewalk)/i,    reason: 'Restoration / public-works only' },
  { rx: /(handyman|small repair only|one[- ]off)/i,                        reason: 'Handyman / small repair only' },
];

// Soft red flags from "From Jer" - not auto-DQ but worth surfacing for humans.
const HUMAN_REVIEW_FLAGS: Array<{ rx: RegExp; flag: string }> = [
  { rx: /(easy job|should be quick|i think it (will|should) take)/i,        flag: 'Client opining on scope/timing - sales review' },
  { rx: /(getting (multiple|several) bids|comparing contractors|other quotes)/i, flag: 'Comparison shopper - sales review' },
  { rx: /(diy|doing some of the work myself)/i,                              flag: 'DIY blend - sales review' },
];

export function computeRouting(answers: Answers): RoutingResult {
  const scope = (answers.scope || '').toLowerCase();
  const detail = (answers.scopeDetail || '').toLowerCase();
  const haystack = `${scope} ${detail}`;
  const budgetRaw = answers.budget?.raw ?? null;     // in $k
  const timeline = (answers.timeline || '').toLowerCase();
  const union = answers.union; // 'Union' | 'Non-union' | 'Not sure' | undefined

  const flags: string[] = [];
  const checks: RoutingCheck[] = [];

  // Identify commercial/HOA up front - changes how we evaluate DQ keywords.
  // (Weekly maintenance is a DQ for residential, but a valid route target
  // for commercial/HOA accounts -> Biz Dev / Jamie.)
  const isCommercial = scope.includes('commercial') || scope.includes('hoa') || /\b(hoa|commercial|municipal)\b/.test(detail);

  // -- Soft-flag (informational) --
  for (const { rx, flag } of HUMAN_REVIEW_FLAGS) {
    if (rx.test(haystack)) flags.push(flag);
  }

  // -- DQ checks (return early) --

  // 1. Single-trade / not-our-services keyword DQ.
  //    For commercial/HOA we only DQ on patterns that are truly off-limits
  //    (tree work, design-only, insurance claims, etc.). Ongoing maintenance
  //    contracts route to Biz Dev instead.
  const activeDqPatterns = isCommercial
    ? DQ_PATTERNS.filter(p => p.reason !== 'Residential weekly maintenance')
    : DQ_PATTERNS;
  const dqHit = activeDqPatterns.find(p => p.rx.test(haystack));
  checks.push({ label: 'Not a one-off / single-trade scope', pass: !dqHit, needsHuman: false });
  if (dqHit) {
    return dq(dqHit.reason, 88, checks, flags);
  }

  // 2. Budget floors
  // Cheat sheet: under $10k -> always DQ; under $15k -> "usually a DQ"
  const budgetCheck = budgetRaw === null ? { pass: true, needsHuman: true } : { pass: budgetRaw >= 15, needsHuman: false };
  checks.push({ label: 'Budget at or above $15k floor', pass: budgetCheck.pass, needsHuman: budgetCheck.needsHuman });
  if (budgetRaw !== null && budgetRaw < 10) {
    return dq('Budget under $10k - auto DQ', 95, checks, flags);
  }
  if (budgetRaw !== null && budgetRaw < 15) {
    return dq('Budget under $15k minimum', 90, checks, flags);
  }

  // 3. Commercial union check - only when scope is commercial/HOA
  //    (isCommercial is computed at the top of this function.)
  if (isCommercial) {
    checks.push({ label: 'Commercial work is non-union', pass: union !== 'Union', needsHuman: union === 'Not sure' });
    if (union === 'Union') {
      return dq('Union commercial work - K&D performs non-union only', 96, checks, flags);
    }
    if (union === 'Not sure') {
      flags.push('Confirm union/non-union before routing');
    }
  } else {
    checks.push({ label: 'Commercial union check (n/a for residential)', pass: true });
  }

  // 4. Service area check. K&D covers South San Jose down through SLO; an address
  //    that clearly falls outside that window is an auto-DQ. Unrecognized text
  //    falls through to human review rather than killing a lead over a typo.
  const areaResult = checkServiceArea(answers.address?.address);
  checks.push({
    label: `Service area (${SERVICE_AREA_DESCRIPTION})`,
    pass: areaResult !== 'out-of-area',
    needsHuman: areaResult === 'unknown',
  });
  if (areaResult === 'out-of-area') {
    return dq('Outside K&D service area (South SJ through SLO)', 92, checks, flags);
  }
  if (areaResult === 'unknown') {
    flags.push('Confirm address is within service area before routing');
  }

  // 5. Sub-1-month timeline + no other strong signal - soft flag, not DQ
  if (/(asap|this month|emergency|next week)/i.test(timeline)) {
    flags.push('Tight timeline - confirm feasibility');
  }

  // -- Routing decision tree (mirrors cheat sheet section 5) --

  // A. Commercial / HOA maintenance -> Jamie (Biz Dev)
  if (isCommercial && /(maintenance|weekly|mowing|ongoing|contract)/i.test(detail)) {
    checks.push({ label: 'Routes to Biz Dev (commercial/HOA maintenance)', pass: true });
    return ok({
      team: 'Biz Dev',
      owner: OWNERS.bizDev,
      confidence: 93,
      reason: 'Commercial/HOA ongoing maintenance contract',
      flags, checks,
    });
  }

  // B. Commercial build (non-union) -> Brian / Gray
  if (isCommercial) {
    checks.push({ label: 'Routes to Commercial team (non-union build)', pass: true });
    return ok({
      team: 'Commercial',
      owner: OWNERS.commercial,
      confidence: 89,
      reason: 'Non-union commercial build',
      flags, checks,
    });
  }

  // C. Drainage / retaining wall -> Res Lite (always Kendel, even at higher budgets)
  if (scope.includes('drainage') || scope.includes('retaining') || /\b(drainage|retaining wall|sod install)\b/.test(detail)) {
    checks.push({ label: 'Routes to Res Lite (drainage / retaining / functional)', pass: true });
    return ok({
      team: 'Res Lite',
      owner: OWNERS.resLite,
      confidence: 91,
      reason: 'Functional enhancement: drainage / retaining wall',
      flags, checks,
    });
  }

  // D. Sub-$50k construction -> Res Lite
  if (budgetRaw !== null && budgetRaw < 50) {
    checks.push({ label: 'Routes to Res Lite (sub-$50k enhancement)', pass: true });
    return ok({
      team: 'Res Lite',
      owner: OWNERS.resLite,
      confidence: 86,
      reason: 'Enhancement under Design-Build $50k threshold',
      flags, checks,
    });
  }

  // E. Design-Build default
  // $100k+ -> senior owner; $50k-$100k -> mid owner. Unknown budget -> mid + flag.
  if (budgetRaw === null) {
    flags.push('Budget unknown - confirm before routing');
    checks.push({ label: 'Routes to Design-Build (budget unknown - confirm)', pass: true, needsHuman: true });
    return ok({
      team: 'Design-Build',
      owner: OWNERS.designBuildMid,
      confidence: 72,
      reason: 'Design-build remodel - budget to be confirmed',
      flags, checks,
    });
  }
  if (budgetRaw >= 100) {
    checks.push({ label: 'Routes to Design-Build (large remodel $100k+)', pass: true });
    return ok({
      team: 'Design-Build',
      owner: OWNERS.designBuildLarge,
      confidence: 94,
      reason: 'Large design-build remodel ($100k+)',
      flags, checks,
    });
  }
  checks.push({ label: 'Routes to Design-Build ($50k-$100k)', pass: true });
  return ok({
    team: 'Design-Build',
    owner: OWNERS.designBuildMid,
    confidence: 87,
    reason: 'Mid-size design-build remodel',
    flags, checks,
  });
}

function dq(reason: string, confidence: number, checks: RoutingCheck[], flags: string[]): RoutingResult {
  return {
    team: 'DQ' as RouteTeam,
    owner: null,
    confidence,
    reason,
    flags,
    checks,
  };
}

function ok(r: { team: RouteTeam; owner: string; confidence: number; reason: string; flags: string[]; checks: RoutingCheck[] }): RoutingResult {
  return r;
}

// Used by both the chat header and the admin badges.
export function routeColor(team: RouteTeam, t: { forestThrive: string; oliveIntegrity: string; dq: string; warn: string; }): string {
  switch (team) {
    case 'DQ': return t.dq;
    case 'Design-Build': return t.oliveIntegrity;
    case 'Res Lite': return t.forestThrive;
    case 'Commercial': return t.oliveIntegrity;
    case 'Biz Dev': return t.warn;
  }
}
