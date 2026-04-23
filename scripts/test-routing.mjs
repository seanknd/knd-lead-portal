// Routing smoke test — exercises lib/routing.ts against the K&D cheat-sheet matrix.
// Run with:  node --experimental-strip-types scripts/test-routing.mjs
//
// Compiles TypeScript on the fly via the TS loader already pulled in by Next.

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

// Use the TypeScript compiler from the installed tsc to transpile
// then dynamic-import the built JS. Simpler than maintaining a test harness.
const tmp = '/tmp/knd-routing-build';
mkdirSync(tmp, { recursive: true });
execSync(
  `npx tsc --module es2020 --target es2020 --moduleResolution node --esModuleInterop true --outDir ${tmp} app/lib/types.ts app/lib/routing.ts`,
  { stdio: 'inherit', cwd: '/tmp/knd-portal' },
);

const { computeRouting } = await import(`${tmp}/routing.js`);

const cases = [
  {
    name: 'Full yard remodel $150k (design + build)',
    answers: {
      scope: 'Full yard remodel',
      scopeDetail: 'Full design and build of the entire backyard — patio, planting, irrigation',
      budget: { raw: 150, label: '$150k', tier: 'Full yard' },
      timeline: '1-3 months',
    },
    expect: { team: 'Design-Build', owner: 'Rudy' },
  },
  {
    name: 'Patio build $75k (mid tier)',
    answers: {
      scope: 'Patio or outdoor living build',
      scopeDetail: 'Outdoor kitchen with seating area',
      budget: { raw: 75, label: '$75k', tier: 'Mid yard' },
      timeline: '1-3 months',
    },
    expect: { team: 'Design-Build', owner: 'Megha' },
  },
  {
    name: 'Drainage / retaining wall $20k',
    answers: {
      scope: 'Drainage / retaining wall',
      scopeDetail: 'Retaining wall behind house for a sloped yard',
      budget: { raw: 20, label: '$20k', tier: 'Enhancement' },
      timeline: '3-6 months',
    },
    expect: { team: 'Res Lite', owner: 'Kendel' },
  },
  {
    name: 'Commercial / HOA non-union maintenance',
    answers: {
      scope: 'Commercial or HOA project',
      scopeDetail: 'HOA weekly maintenance contract for a 40-unit community',
      budget: { raw: 40, label: '$40k/yr', tier: 'Commercial maintenance' },
      timeline: 'I\'m flexible',
      union: 'Non-union',
    },
    expect: { team: 'Biz Dev', owner: 'Jamie' },
  },
  {
    name: 'Commercial union build → DQ',
    answers: {
      scope: 'Commercial or HOA project',
      scopeDetail: 'Commercial landscape build for a new office park',
      budget: { raw: 60, label: '$60k', tier: 'Commercial' },
      timeline: '3-6 months',
      union: 'Union',
    },
    expect: { team: 'DQ' },
  },
  {
    name: 'Tree work only $8k → DQ (scope + budget)',
    answers: {
      scope: 'Something else',
      scopeDetail: 'Tree removal and trim work only',
      budget: { raw: 8, label: '$8k', tier: 'Small' },
      timeline: 'ASAP / this month',
    },
    expect: { team: 'DQ' },
  },
  {
    name: 'Sub-$15k remodel → DQ',
    answers: {
      scope: 'Patio or outdoor living build',
      scopeDetail: 'Small paver patio',
      budget: { raw: 12, label: '$12k', tier: 'Small' },
      timeline: '3-6 months',
    },
    expect: { team: 'DQ' },
  },
  {
    name: 'Drainage at $50k still stays in Res Lite',
    answers: {
      scope: 'Drainage / retaining wall',
      scopeDetail: 'French drain plus retaining wall',
      budget: { raw: 50, label: '$50k', tier: 'Mid enhancement' },
      timeline: 'Later this year',
    },
    expect: { team: 'Res Lite', owner: 'Kendel' },
  },
  {
    name: 'Design-only request → DQ',
    answers: {
      scope: 'Full yard remodel',
      scopeDetail: 'I just need plans drawn up — I will hire the contractor myself',
      budget: { raw: 20, label: '$20k', tier: 'Design' },
      timeline: 'I\'m flexible',
    },
    expect: { team: 'DQ' },
  },
  {
    name: 'Commercial non-union build $60k',
    answers: {
      scope: 'Commercial or HOA project',
      scopeDetail: 'New landscape build for an office campus',
      budget: { raw: 60, label: '$60k', tier: 'Commercial build' },
      timeline: '3-6 months',
      union: 'Non-union',
    },
    expect: { team: 'Commercial', owner: 'Brian' },
  },
  {
    name: 'Service area: Salinas address — in-area, routes normally',
    answers: {
      scope: 'Full yard remodel',
      scopeDetail: 'Full backyard redesign with patio and planting',
      budget: { raw: 120, label: '$120k', tier: 'Full yard' },
      timeline: '1-3 months',
      address: { address: '1450 N Main St, Salinas, CA' },
    },
    expect: { team: 'Design-Build', owner: 'Rudy' },
  },
  {
    name: 'Service area: San Luis Obispo address — in-area, routes normally',
    answers: {
      scope: 'Patio or outdoor living build',
      scopeDetail: 'Outdoor kitchen and pergola',
      budget: { raw: 75, label: '$75k', tier: 'Mid yard' },
      timeline: 'Later this year',
      address: { address: '900 Higuera St, San Luis Obispo, CA' },
    },
    expect: { team: 'Design-Build', owner: 'Megha' },
  },
  {
    name: 'Service area: Oakland address — out-of-area DQ',
    answers: {
      scope: 'Full yard remodel',
      scopeDetail: 'Full backyard with kitchen and fire feature',
      budget: { raw: 150, label: '$150k', tier: 'Full yard' },
      timeline: '1-3 months',
      address: { address: '1234 Lakeshore Ave, Oakland, CA' },
    },
    expect: { team: 'DQ' },
  },
];

let pass = 0;
let fail = 0;
const failures = [];

for (const c of cases) {
  const result = computeRouting(c.answers);
  const teamOk = result.team === c.expect.team;
  const ownerOk = c.expect.owner ? result.owner === c.expect.owner : true;
  const ok = teamOk && ownerOk;

  if (ok) {
    pass++;
    console.log(`  PASS  ${c.name}  →  ${result.team}${result.owner ? ' / ' + result.owner : ''} (${result.confidence}%)`);
  } else {
    fail++;
    failures.push({ name: c.name, expect: c.expect, got: { team: result.team, owner: result.owner, reason: result.reason } });
    console.log(`  FAIL  ${c.name}`);
    console.log(`        expected: ${JSON.stringify(c.expect)}`);
    console.log(`        got:      team=${result.team}, owner=${result.owner}, reason=${result.reason}`);
  }
}

console.log(`\n${pass}/${cases.length} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
