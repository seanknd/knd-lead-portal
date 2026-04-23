// AdminDashboard.jsx — Internal view for the team: leads inbox with
// AI routing recs, DQ flags, and HubSpot-ready summary drawer.

const LEADS = [
  {
    id: 'L-4821', name: 'Sarah Parker', loc: 'Pleasanton, CA',
    scope: 'Full backyard remodel — outdoor kitchen, fire feature',
    budget: '$100–250k', timeline: '1–3 months', status: 'new',
    route: { team: 'Design-Build', owner: 'Rudy Alvarez', confidence: 94 },
    priority: 'high', source: 'HubSpot form', receivedAgo: '9 min',
    flags: [], photos: 6, initial: 'SP', color: T.forest,
  },
  {
    id: 'L-4820', name: 'Marcus Chen', loc: 'Dublin, CA',
    scope: 'Drainage fix + small retaining wall in side yard',
    budget: '$15–50k', timeline: '1–3 months', status: 'new',
    route: { team: 'Res Lite', owner: 'Kendel Okafor', confidence: 88 },
    priority: 'med', source: 'Email', receivedAgo: '42 min',
    flags: [], photos: 3, initial: 'MC', color: T.moss,
  },
  {
    id: 'L-4819', name: 'Oakbrook HOA', loc: 'Livermore, CA',
    scope: 'Ongoing landscape maintenance, ~40 units',
    budget: '$50–100k / yr', timeline: 'Flexible', status: 'new',
    route: { team: 'Biz Dev', owner: 'Jamie Reyes', confidence: 97 },
    priority: 'high', source: 'HubSpot form', receivedAgo: '1h',
    flags: ['Commercial — needs union check'], photos: 0, initial: 'OH', color: T.terracotta,
  },
  {
    id: 'L-4818', name: 'David Weiss', loc: 'Walnut Creek, CA',
    scope: 'Just need two trees trimmed, maybe mulch',
    budget: 'Under $10k', timeline: 'ASAP', status: 'review',
    route: { team: 'DQ', owner: null, confidence: 91 },
    priority: 'low', source: 'Email', receivedAgo: '2h',
    flags: ['Tree work only', 'Under $10k', 'DQ per cheat sheet'],
    photos: 2, initial: 'DW', color: T.stone,
  },
  {
    id: 'L-4817', name: 'Priya Shah', loc: 'Fremont, CA',
    scope: 'Pool deck + pavers + seating area',
    budget: '$50–100k', timeline: '3–6 months', status: 'routed',
    route: { team: 'Design-Build', owner: 'Megha Iyer', confidence: 85 },
    priority: 'med', source: 'HubSpot form', receivedAgo: '3h',
    flags: [], photos: 11, initial: 'PS', color: T.forestDeep,
  },
  {
    id: 'L-4816', name: 'Crane Properties', loc: 'San Ramon, CA',
    scope: 'Non-union commercial build — mixed use courtyard',
    budget: '$250k+', timeline: '6+ months', status: 'routed',
    route: { team: 'Commercial', owner: 'Brian Wallace', confidence: 92 },
    priority: 'high', source: 'HubSpot form', receivedAgo: '1d',
    flags: [], photos: 0, initial: 'CP', color: T.forest,
  },
];

const routeColor = (team) => team === 'DQ' ? T.dq : team === 'Design-Build' ? T.forest
  : team === 'Res Lite' ? T.moss : team === 'Biz Dev' ? T.terracotta : T.forestDeep;

function Pill({ children, bg, fg, outline }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 999,
      fontFamily: T.sans, fontSize: 11.5, fontWeight: 500,
      background: bg || 'transparent', color: fg || T.ink,
      border: outline ? `1px solid ${outline}` : 'none',
      letterSpacing: 0.1, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function LeadRow({ lead, active, onClick }) {
  const rc = routeColor(lead.route.team);
  return (
    <button onClick={onClick} style={{
      display: 'flex', width: '100%', textAlign: 'left', cursor: 'pointer',
      padding: '16px 20px', gap: 14, alignItems: 'flex-start',
      background: active ? T.cream : 'transparent',
      border: 'none', borderBottom: `1px solid ${T.lineSoft}`,
      borderLeft: active ? `3px solid ${T.forest}` : '3px solid transparent',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0,
        background: lead.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.cream, letterSpacing: 0.3 }}>
        {lead.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.ink }}>{lead.name}</span>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.4 }}>{lead.id}</span>
          {lead.priority === 'high' && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.terracotta }}/>}
        </div>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, marginBottom: 6, lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.scope}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <Pill bg={lead.route.team === 'DQ' ? 'rgba(162,61,44,.10)' : `${rc}15`} fg={rc}>
            {lead.route.team === 'DQ' ? '✕ ' : '→ '}{lead.route.team === 'DQ' ? 'Likely DQ' : lead.route.owner}
          </Pill>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.3 }}>
            {lead.route.confidence}% · {lead.budget} · {lead.timeline}
          </span>
        </div>
      </div>
      <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.4,
        textTransform: 'uppercase', flexShrink: 0, paddingTop: 4 }}>
        {lead.receivedAgo}
      </div>
    </button>
  );
}

function RouteLogic({ lead }) {
  const steps = [
    { t: 'Not a one-off (tree, cleanup, turf-only)?', pass: !lead.flags.some(f => /Tree|cleanup|turf/i.test(f)), auto: true },
    { t: `Budget ≥ $15k?`, pass: !/Under \$10k|Under \$15k/i.test(lead.budget), auto: true },
    { t: `Service area (< 1h drive)?`, pass: true, auto: true },
    { t: `Commercial? → union check`, pass: !lead.flags.some(f => /union/i.test(f)), auto: !/HOA|Commercial/i.test(lead.scope) },
    { t: `Fits Design-Build scope ($50k+)`, pass: /\$50|\$100|\$250/.test(lead.budget), auto: true },
  ];
  return (
    <div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0',
          borderBottom: i < steps.length - 1 ? `1px dashed ${T.lineSoft}` : 'none' }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, flexShrink: 0, marginTop: 1,
            background: s.pass ? `${T.ok}20` : `${T.dq}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={s.pass ? T.ok : T.dq} strokeWidth="2" strokeLinecap="round">
              {s.pass ? <path d="M2 5l2 2 4-4"/> : <path d="M2 2l6 6M8 2l-6 6"/>}
            </svg>
          </div>
          <div style={{ flex: 1, fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.35 }}>
            {s.t}
            {!s.auto && <span style={{ fontFamily: T.mono, fontSize: 10, color: T.warn,
              marginLeft: 8, letterSpacing: 0.4, textTransform: 'uppercase' }}>needs human</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeadDrawer({ lead }) {
  const rc = routeColor(lead.route.team);
  return (
    <div style={{ background: '#fff', height: '100%', overflowY: 'auto',
      borderLeft: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>

      {/* header */}
      <div style={{ padding: '22px 28px 18px', borderBottom: `1px solid ${T.line}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6 }}>
            {lead.id} · {lead.source}
          </span>
          <span style={{ color: T.inkFaint }}>·</span>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6 }}>
            {lead.receivedAgo} ago
          </span>
        </div>
        <h2 style={{ fontFamily: T.display, fontSize: 30, fontWeight: 400, letterSpacing: -0.8,
          color: T.forestDeep, margin: 0, lineHeight: 1 }}>
          {lead.name}
        </h2>
        <div style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, marginTop: 6 }}>
          {lead.loc}
        </div>

        {/* AI routing recommendation card */}
        <div style={{ marginTop: 18, padding: '16px 18px', background: T.cream, borderRadius: 12,
          border: `1px solid ${T.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: rc,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T.cream} strokeWidth="2" strokeLinecap="round">
                <path d="M2 5l2 2 4-4"/>
              </svg>
            </div>
            <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint,
              letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 500 }}>
              AI routing
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: T.mono, fontSize: 11,
              color: T.ok, fontWeight: 600 }}>
              {lead.route.confidence}% confident
            </span>
          </div>
          <div style={{ fontFamily: T.display, fontSize: 20, fontWeight: 400, color: T.forestDeep,
            letterSpacing: -0.4, lineHeight: 1.1 }}>
            {lead.route.team === 'DQ' ? 'Likely disqualify' : `Route to ${lead.route.owner}`}
          </div>
          <div style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, marginTop: 4 }}>
            {lead.route.team === 'DQ' ? 'Flag for human review' : `${lead.route.team} team`}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={{ flex: 1, padding: '9px', background: T.forest, color: T.cream,
              border: 'none', borderRadius: 8, fontFamily: T.sans, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              {lead.route.team === 'DQ' ? 'Confirm DQ' : 'Accept & route'}
            </button>
            <button style={{ padding: '9px 14px', background: 'transparent', color: T.ink,
              border: `1px solid ${T.line}`, borderRadius: 8, fontFamily: T.sans, fontSize: 13,
              fontWeight: 500, cursor: 'pointer' }}>
              Override
            </button>
          </div>
        </div>

        {lead.flags.length > 0 && (
          <div style={{ marginTop: 14, padding: '12px 14px', background: `${T.warn}15`,
            borderLeft: `3px solid ${T.warn}`, borderRadius: '0 8px 8px 0' }}>
            <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.warn, letterSpacing: 0.6,
              textTransform: 'uppercase', fontWeight: 600, marginBottom: 6 }}>
              Flags
            </div>
            {lead.flags.map(f => (
              <div key={f} style={{ fontFamily: T.sans, fontSize: 13, color: T.ink, lineHeight: 1.4 }}>
                · {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* body */}
      <div style={{ padding: '20px 28px', flex: 1 }}>
        <SectionTitle>Project summary</SectionTitle>
        <div style={{ fontFamily: T.sans, fontSize: 14, color: T.ink, lineHeight: 1.55, marginBottom: 22 }}>
          {lead.scope}. Client indicated {lead.budget.toLowerCase()} budget with a {lead.timeline.toLowerCase()} timeline.
          {lead.photos > 0 && ` Attached ${lead.photos} photos of the existing space.`}
        </div>

        <SectionTitle>Key facts</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
          {[
            ['Scope', lead.scope.split(' — ')[0]],
            ['Budget', lead.budget],
            ['Timeline', lead.timeline],
            ['Location', lead.loc],
            ['Photos', lead.photos ? `${lead.photos} attached` : 'None'],
            ['Priority', lead.priority],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6,
                textTransform: 'uppercase', marginBottom: 3 }}>{k}</div>
              <div style={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, fontWeight: 450 }}>{v}</div>
            </div>
          ))}
        </div>

        <SectionTitle>Routing logic applied</SectionTitle>
        <div style={{ marginBottom: 22 }}>
          <RouteLogic lead={lead} />
        </div>

        <SectionTitle>HubSpot note (auto-generated)</SectionTitle>
        <div style={{ background: T.cream, borderRadius: 10, padding: '14px 16px',
          fontFamily: T.mono, fontSize: 12, color: T.ink, lineHeight: 1.6,
          border: `1px solid ${T.line}`, whiteSpace: 'pre-wrap' }}>
{`[Prequal · ${new Date().toISOString().slice(0,10)}]
scope:    ${lead.scope}
budget:   ${lead.budget}
timeline: ${lead.timeline}
location: ${lead.loc}
photos:   ${lead.photos}
route →   ${lead.route.team}${lead.route.owner ? ' / ' + lead.route.owner : ''}
confidence: ${lead.route.confidence}%
${lead.flags.length ? 'flags: ' + lead.flags.join('; ') : ''}`}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button style={{ flex: 1, padding: '10px', background: 'transparent', color: T.forest,
            border: `1px solid ${T.forest}`, borderRadius: 8, fontFamily: T.sans, fontSize: 13,
            fontWeight: 500, cursor: 'pointer' }}>
            Sync to HubSpot
          </button>
          <button style={{ flex: 1, padding: '10px', background: 'transparent', color: T.ink,
            border: `1px solid ${T.line}`, borderRadius: 8, fontFamily: T.sans, fontSize: 13,
            fontWeight: 500, cursor: 'pointer' }}>
            Email owner
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.8,
      textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
      {children}
    </div>
  );
}

function AdminDashboard({ compact = false }) {
  const [activeId, setActiveId] = React.useState(LEADS[0].id);
  const active = LEADS.find(l => l.id === activeId) || LEADS[0];

  const [filter, setFilter] = React.useState('all');
  const shown = LEADS.filter(l => {
    if (filter === 'new') return l.status === 'new';
    if (filter === 'flagged') return l.flags.length > 0;
    if (filter === 'dq') return l.route.team === 'DQ';
    return true;
  });

  return (
    <div style={{ display: 'flex', height: '100%', background: '#fff', fontFamily: T.sans, color: T.ink,
      minHeight: 0 }}>
      {/* sidebar nav */}
      <div style={{ width: 220, borderRight: `1px solid ${T.line}`, padding: '22px 18px',
        background: T.cream, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <div style={{ width: 28, height: 28, borderRadius: 14, background: T.forest,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 18 18" fill={T.clay}>
              <path d="M9 2c-3 3-3 7 0 10 3-3 3-7 0-10zM3 10c1-1 3-1 4 0-1 1-3 1-4 0zm12 0c-1-1-3-1-4 0 1 1 3 1 4 0zM9 14v2"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: T.display, fontSize: 16, color: T.forestDeep, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1 }}>Moss &amp; Stone</div>
            <div style={{ fontFamily: T.mono, fontSize: 9.5, color: T.inkFaint, letterSpacing: 0.6, marginTop: 2, textTransform: 'uppercase' }}>Lead Ops</div>
          </div>
        </div>

        {[
          ['Inbox', '6', true],
          ['Routed today', '12', false],
          ['Awaiting client', '3', false],
          ['Disqualified', '2', false],
          ['Archive', '—', false],
        ].map(([l, c, a]) => (
          <div key={l} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '9px 12px', borderRadius: 8, marginBottom: 2,
            background: a ? '#fff' : 'transparent',
            border: a ? `1px solid ${T.line}` : 'none',
            fontFamily: T.sans, fontSize: 13.5, color: a ? T.ink : T.inkSoft,
            fontWeight: a ? 500 : 400, cursor: 'pointer',
          }}>
            <span>{l}</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkFaint }}>{c}</span>
          </div>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: `1px solid ${T.line}`,
          display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: T.moss,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.sans, fontSize: 12, fontWeight: 600, color: T.cream }}>J</div>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 12.5, fontWeight: 500, lineHeight: 1 }}>Jer Thompson</div>
            <div style={{ fontFamily: T.mono, fontSize: 10, color: T.inkFaint, marginTop: 3, letterSpacing: 0.4 }}>Founder</div>
          </div>
        </div>
      </div>

      {/* inbox list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* top bar */}
        <div style={{ padding: '22px 28px 14px', borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
            <h1 style={{ fontFamily: T.display, fontSize: 32, fontWeight: 400, letterSpacing: -0.8,
              color: T.forestDeep, margin: 0, lineHeight: 1 }}>
              Inbox
            </h1>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.inkFaint, letterSpacing: 0.5 }}>
              6 new · AI-routed
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all', 'All'], ['new', 'New'], ['flagged', 'Flagged'], ['dq', 'DQ']].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                style={{ padding: '6px 12px', border: `1px solid ${filter === k ? T.forest : T.line}`,
                  background: filter === k ? T.forest : 'transparent',
                  color: filter === k ? T.cream : T.ink,
                  borderRadius: 999, fontFamily: T.sans, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {shown.map(l => (
            <LeadRow key={l.id} lead={l} active={l.id === activeId} onClick={() => setActiveId(l.id)} />
          ))}
        </div>
      </div>

      {/* drawer */}
      {!compact && (
        <div style={{ width: 440, flexShrink: 0 }}>
          <LeadDrawer lead={active} />
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AdminDashboard, LeadDrawer, LEADS });
