// Email.jsx — intake email sent to the lead after their initial contact.
// Shown inside a browser/Gmail-style window or a phone mail view.

function IntakeEmail({ compact = false }) {
  const pad = compact ? 20 : 36;
  return (
    <div style={{ background: '#fff', minHeight: '100%', fontFamily: T.sans, color: T.ink }}>
      {/* mail chrome header */}
      <div style={{ padding: `16px ${pad}px`, borderBottom: `1px solid ${T.lineSoft}`,
        display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: T.forest,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 18 18" fill={T.clay}>
            <path d="M9 2c-3 3-3 7 0 10 3-3 3-7 0-10zM3 10c1-1 3-1 4 0-1 1-3 1-4 0zm12 0c-1-1-3-1-4 0 1 1 3 1 4 0zM9 14v2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>Moss &amp; Stone Landscape</div>
          <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 1 }}>hello@mossandstone.co · to sarah.parker@gmail.com</div>
        </div>
        <div style={{ fontSize: 11, color: T.inkFaint, fontFamily: T.mono, letterSpacing: 0.3 }}>9:14 AM</div>
      </div>

      <div style={{ padding: `${compact ? 28 : 44}px ${pad}px ${pad}px` }}>
        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.terracotta, letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 14 }}>
          Next step for your project
        </div>
        <h1 style={{ fontFamily: T.display, fontSize: compact ? 30 : 40, fontWeight: 400, letterSpacing: -1.2,
          color: T.forestDeep, margin: 0, lineHeight: 1.1 }}>
          Sarah — let's find<br/>the right fit for<br/><em style={{ fontStyle: 'italic', color: T.terracotta }}>your yard.</em>
        </h1>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.inkSoft, lineHeight: 1.55,
          marginTop: 24, marginBottom: 24 }}>
          Thanks for reaching out about your <strong style={{ color: T.ink, fontWeight: 500 }}>backyard remodel in Pleasanton</strong>.
          Before we route you to a designer, our project concierge Ivy will ask a few quick questions — should take 3–4 minutes.
        </p>
        <p style={{ fontFamily: T.sans, fontSize: 15, color: T.inkSoft, lineHeight: 1.55, marginBottom: 32 }}>
          This way, when our team calls, they already know your space, budget range, and timeline — and we don't waste your afternoon asking things you already told us.
        </p>

        {/* big CTA */}
        <a href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '16px 28px', background: T.forest, color: T.cream, borderRadius: 999,
          textDecoration: 'none', fontFamily: T.sans, fontSize: 15, fontWeight: 500, letterSpacing: -0.1 }}>
          Start prequalification
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 7h10M8 3l4 4-4 4"/>
          </svg>
        </a>
        <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.inkFaint, marginTop: 14,
          letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Secure link · expires in 7 days
        </div>

        {/* what to expect */}
        <div style={{ marginTop: 44, padding: '24px 22px', background: T.cream, borderRadius: 14 }}>
          <div style={{ fontFamily: T.sans, fontSize: 13, fontWeight: 500, color: T.ink,
            marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            What to expect
          </div>
          {[
            ['Scope & inspiration', 'What you\'re picturing — remodel, patio, fire pit, etc.'],
            ['Budget range', 'A ballpark so we route you to the right team.'],
            ['Timeline & location', 'When, and where the project lives.'],
            ['Photos (optional)', 'Snap a few of the space so we can prep.'],
          ].map(([h, d], i) => (
            <div key={h} style={{ display: 'flex', gap: 14, paddingTop: i ? 14 : 0,
              marginTop: i ? 14 : 0, borderTop: i ? `1px solid ${T.lineSoft}` : 'none' }}>
              <div style={{ fontFamily: T.display, fontSize: 22, fontWeight: 400,
                color: T.terracotta, lineHeight: 1, width: 28, letterSpacing: -0.5, fontStyle: 'italic' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.sans, fontSize: 14, fontWeight: 500, color: T.ink, lineHeight: 1.2 }}>{h}</div>
                <div style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>{d}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, paddingTop: 20, borderTop: `1px solid ${T.lineSoft}`,
          display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.clay}, ${T.terracotta})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: T.display, color: T.cream, fontSize: 18 }}>J</div>
          <div>
            <div style={{ fontFamily: T.sans, fontSize: 13, color: T.inkSoft, lineHeight: 1.55 }}>
              <em style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 15, color: T.ink }}>
                "Looking forward to seeing what you're dreaming up."
              </em>
              <br/><br/>
              — Jer, Founder<br/>
              <span style={{ color: T.inkFaint }}>Moss &amp; Stone Landscape · Design • Build • Maintain</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IntakeEmail });
