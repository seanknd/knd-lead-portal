'use client';

import React, { useMemo, useState } from 'react';
import { T } from '../lib/tokens';
import { routeColor } from '../lib/routing';
import type { StoredLead, RouteTeam } from '../lib/types';
import { KDLogo } from '../../components/KDLogo';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function initialsFor(name?: string): string {
  if (!name) return '??';
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function Pill({ children, bg, fg, outline }: { children: React.ReactNode; bg?: string; fg?: string; outline?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap" style={{ background: bg || 'transparent', color: fg || T.ink, border: outline ? `1px solid ${outline}` : 'none', letterSpacing: 0.1 }}>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono uppercase font-semibold mb-2.5" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.8 }}>
      {children}
    </div>
  );
}

function noteTemplate(l: StoredLead): string {
  const a = l.answers;
  const photos = a.photos?.files?.length || 0;
  return `[Prequal · ${l.receivedAt.slice(0, 10)}]
scope:    ${a.scope || '—'}
detail:   ${a.scopeDetail || '—'}
budget:   ${a.budget?.label || '—'}
timeline: ${a.timeline || '—'}
location: ${a.address?.address || '—'}
photos:   ${photos}
phone:    ${a.phone || '—'}${a.union ? `\nunion:    ${a.union}` : ''}
route ->  ${l.routing.team}${l.routing.owner ? ' / ' + l.routing.owner : ''}
confidence: ${l.routing.confidence}%
reason:   ${l.routing.reason}${l.routing.flags.length ? '\nflags:    ' + l.routing.flags.join('; ') : ''}`;
}

function LeadRow({ lead, active, onClick }: { lead: StoredLead; active: boolean; onClick: () => void }) {
  const rc = routeColor(lead.routing.team, T);
  const isDQ = lead.routing.team === 'DQ';
  return (
    <button
      onClick={onClick}
      className="flex w-full text-left px-5 py-4 gap-3.5 items-start"
      style={{
        background: active ? T.cream : 'transparent',
        border: 'none',
        borderBottom: `1px solid ${T.lineSoft}`,
        borderLeft: active ? `3px solid ${T.forestThrive}` : '3px solid transparent',
        cursor: 'pointer',
      }}
    >
      <div className="rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-semibold" style={{ width: 38, height: 38, background: T.oliveIntegrity, color: T.cream, letterSpacing: 0.3 }}>
        {initialsFor(lead.lead.firstName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[14px] font-medium" style={{ color: T.ink }}>{lead.lead.firstName || 'Unknown'}</span>
          <span className="font-mono" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.4 }}>{lead.id}</span>
          {lead.routing.flags.length > 0 && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.warn }} />}
        </div>
        <div className="text-[13px] mb-1.5 truncate" style={{ color: T.inkSoft, lineHeight: 1.4 }}>
          {lead.answers.scopeDetail || lead.answers.scope || '—'}
        </div>
        <div className="flex gap-1.5 items-center flex-wrap">
          <Pill bg={isDQ ? 'rgba(162,61,44,.10)' : `${rc}20`} fg={rc}>
            {isDQ ? '✕ Likely DQ' : `→ ${lead.routing.owner}`}
          </Pill>
          <span className="font-mono" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.3 }}>
            {lead.routing.confidence}% · {lead.answers.budget?.label || 'no budget'} · {lead.answers.timeline || 'no timeline'}
          </span>
        </div>
      </div>
      <div className="font-mono uppercase flex-shrink-0 pt-1" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.4 }}>
        {timeAgo(lead.receivedAt)}
      </div>
    </button>
  );
}

function LeadDrawer({ lead, onPushedToHubspot }: { lead: StoredLead; onPushedToHubspot: (msg: string) => void }) {
  const rc = routeColor(lead.routing.team, T);
  const isDQ = lead.routing.team === 'DQ';
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const pushToHubspot = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/push-to-hubspot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      const m = data.dryRun ? 'Dry-run: HubSpot env not configured, payload logged server-side.' : 'Pushed to HubSpot.';
      setMsg(m);
      onPushedToHubspot(m);
    } catch (e) {
      setMsg('Push failed. Check the server log.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col" style={{ background: '#fff', borderLeft: `1px solid ${T.line}` }}>
      <div className="px-7 pt-5 pb-4" style={{ borderBottom: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="font-mono" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6 }}>{lead.id}</span>
          <span style={{ color: T.inkFaint }}>·</span>
          <span className="font-mono" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6 }}>{timeAgo(lead.receivedAt)} ago</span>
        </div>
        <h2 className="font-display m-0" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.6, color: T.oliveIntegrity, lineHeight: 1 }}>
          {lead.lead.firstName || 'Unknown'}
        </h2>
        <div className="text-[13px] mt-1.5" style={{ color: T.inkSoft }}>{lead.answers.address?.address || '—'}</div>

        <div className="mt-4 px-4 py-4 rounded-xl" style={{ background: T.cream, border: `1px solid ${T.line}` }}>
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: rc }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T.cream} strokeWidth="2" strokeLinecap="round"><path d="M2 5l2 2 4-4" /></svg>
            </div>
            <span className="font-mono uppercase font-medium" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.8 }}>AI routing</span>
            <span className="ml-auto font-mono font-semibold" style={{ fontSize: 11, color: T.ok }}>{lead.routing.confidence}% confident</span>
          </div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 700, color: T.oliveIntegrity, letterSpacing: -0.4, lineHeight: 1.1 }}>
            {isDQ ? 'Likely disqualify' : `Route to ${lead.routing.owner}`}
          </div>
          <div className="text-[13px] mt-1" style={{ color: T.inkSoft }}>
            {isDQ ? 'Flag for human review' : `${lead.routing.team} team`} · {lead.routing.reason}
          </div>
          <div className="flex gap-2 mt-3">
            <button className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: T.oliveIntegrity, color: T.cream, border: 'none' }}>
              {isDQ ? 'Confirm DQ' : 'Accept & route'}
            </button>
            <button className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: 'transparent', color: T.ink, border: `1px solid ${T.line}` }}>
              Override
            </button>
          </div>
        </div>

        {lead.routing.flags.length > 0 && (
          <div className="mt-3.5 px-4 py-3" style={{ background: `${T.warn}15`, borderLeft: `3px solid ${T.warn}`, borderRadius: '0 8px 8px 0' }}>
            <div className="font-mono uppercase font-semibold mb-1.5" style={{ fontSize: 10.5, color: T.warn, letterSpacing: 0.6 }}>Flags</div>
            {lead.routing.flags.map(f => (
              <div key={f} className="text-[13px]" style={{ color: T.ink, lineHeight: 1.4 }}>· {f}</div>
            ))}
          </div>
        )}
      </div>

      <div className="px-7 py-5 flex-1">
        <SectionTitle>Routing logic applied</SectionTitle>
        <div className="mb-5">
          {lead.routing.checks.map((s, i) => (
            <div key={i} className="flex gap-2.5 py-2" style={{ borderBottom: i < lead.routing.checks.length - 1 ? `1px dashed ${T.lineSoft}` : 'none' }}>
              <div className="rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center" style={{ width: 18, height: 18, background: s.pass ? `${T.ok}20` : `${T.dq}20` }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={s.pass ? T.ok : T.dq} strokeWidth="2" strokeLinecap="round">
                  {s.pass ? <path d="M2 5l2 2 4-4" /> : <path d="M2 2l6 6M8 2l-6 6" />}
                </svg>
              </div>
              <div className="flex-1 text-[13px]" style={{ color: T.ink, lineHeight: 1.35 }}>
                {s.label}
                {s.needsHuman && <span className="font-mono uppercase ml-2" style={{ fontSize: 10, color: T.warn, letterSpacing: 0.4 }}>needs human</span>}
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>Answers</SectionTitle>
        <div className="grid grid-cols-2 gap-3.5 mb-5">
          {[
            ['Scope', lead.answers.scope || '—'],
            ['Detail', lead.answers.scopeDetail || '—'],
            ['Budget', lead.answers.budget?.label || '—'],
            ['Timeline', lead.answers.timeline || '—'],
            ['Address', lead.answers.address?.address || '—'],
            ['Phone', lead.answers.phone || '—'],
            ['Photos', `${lead.answers.photos?.files?.length || 0} attached`],
            ...(lead.answers.union ? [['Union/Non', lead.answers.union]] as Array<[string, string]> : []),
          ].map(([k, v]) => (
            <div key={k}>
              <div className="font-mono uppercase mb-0.5" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.6 }}>{k}</div>
              <div className="text-[13.5px] font-medium" style={{ color: T.ink }}>{v as string}</div>
            </div>
          ))}
        </div>

        {lead.answers.photos && lead.answers.photos.files.length > 0 && (
          <>
            <SectionTitle>Photos</SectionTitle>
            <div className="flex flex-wrap gap-2 mb-5">
              {lead.answers.photos.files.map((f, i) => (
                <div key={i} className="rounded-md" style={{ width: 64, height: 64, background: f.url ? `url(${f.url}) center/cover` : T.cream }} />
              ))}
            </div>
          </>
        )}

        <SectionTitle>HubSpot note (auto-generated)</SectionTitle>
        <pre className="font-mono whitespace-pre-wrap p-4" style={{ background: T.cream, borderRadius: 10, fontSize: 12, color: T.ink, lineHeight: 1.6, border: `1px solid ${T.line}` }}>
{noteTemplate(lead)}
        </pre>

        <div className="flex gap-2 mt-3.5">
          <button onClick={pushToHubspot} disabled={busy} className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: T.oliveIntegrity, color: T.cream, border: 'none', opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Sending...' : 'Send to HubSpot'}
          </button>
          <button className="flex-1 py-2.5 rounded-lg text-[13px] font-medium" style={{ background: 'transparent', color: T.ink, border: `1px solid ${T.line}` }}>
            Email owner
          </button>
        </div>
        {msg && <div className="mt-2 text-[12px] font-mono" style={{ color: T.inkSoft }}>{msg}</div>}
      </div>
    </div>
  );
}

export default function AdminInbox({ initialLeads }: { initialLeads: StoredLead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [activeId, setActiveId] = useState(initialLeads[0]?.id || '');
  const [filter, setFilter] = useState<'all' | 'new' | 'flagged' | 'dq'>('all');
  const [toast, setToast] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' });
      const data = await res.json();
      if (Array.isArray(data.leads)) setLeads(data.leads);
    } catch { /* ignore */ }
  };

  const shown = useMemo(() => {
    return leads.filter(l => {
      if (filter === 'new') return true;        // store doesn't track status yet
      if (filter === 'flagged') return l.routing.flags.length > 0;
      if (filter === 'dq') return l.routing.team === 'DQ';
      return true;
    });
  }, [leads, filter]);

  const active = leads.find(l => l.id === activeId) || leads[0];

  const counts = {
    all: leads.length,
    new: leads.length,
    flagged: leads.filter(l => l.routing.flags.length > 0).length,
    dq: leads.filter(l => l.routing.team === 'DQ').length,
  };

  return (
    <div className="flex h-screen min-h-0" style={{ background: '#fff', color: T.ink, fontFamily: T.sans }}>
      {/* sidebar */}
      <div className="flex flex-col flex-shrink-0 px-4 py-5" style={{ width: 220, background: T.creamDeep, borderRight: `1px solid ${T.line}` }}>
        <div className="mb-7"><KDLogo size={28} /></div>
        <div className="font-mono uppercase mb-2.5" style={{ fontSize: 9.5, color: T.inkFaint, letterSpacing: 0.6 }}>Lead Ops</div>
        {[
          ['all', 'Inbox', counts.all],
          ['new', 'New', counts.new],
          ['flagged', 'Flagged', counts.flagged],
          ['dq', 'Disqualified', counts.dq],
        ].map(([k, label, count]) => {
          const active = filter === k;
          return (
            <button
              key={k as string}
              onClick={() => setFilter(k as any)}
              className="flex justify-between items-center px-3 py-2.5 rounded-lg mb-0.5 text-[13.5px]"
              style={{ background: active ? '#fff' : 'transparent', border: active ? `1px solid ${T.line}` : 'none', color: active ? T.ink : T.inkSoft, fontWeight: active ? 500 : 400, cursor: 'pointer', textAlign: 'left' }}
            >
              <span>{label as string}</span>
              <span className="font-mono" style={{ fontSize: 11, color: T.inkFaint }}>{count as number}</span>
            </button>
          );
        })}
        <div className="mt-auto pt-5 flex gap-2.5 items-center" style={{ borderTop: `1px solid ${T.line}` }}>
          <div className="rounded-full flex items-center justify-center text-[12px] font-semibold" style={{ width: 30, height: 30, background: T.forestThrive, color: T.cream }}>S</div>
          <div>
            <div className="text-[12.5px] font-medium leading-none">Sean Laux</div>
            <div className="font-mono mt-1" style={{ fontSize: 10, color: T.inkFaint, letterSpacing: 0.4 }}>K&D · Sales Ops</div>
          </div>
        </div>
      </div>

      {/* inbox */}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="px-7 pt-5 pb-3.5" style={{ borderBottom: `1px solid ${T.line}` }}>
          <div className="flex items-baseline gap-3 mb-3.5">
            <h1 className="font-display m-0" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.8, color: T.oliveIntegrity, lineHeight: 1 }}>
              Inbox
            </h1>
            <span className="font-mono" style={{ fontSize: 11, color: T.inkFaint, letterSpacing: 0.5 }}>
              {leads.length} leads · AI-routed
            </span>
            <button onClick={refresh} className="ml-auto font-mono uppercase px-2.5 py-1 rounded-full" style={{ fontSize: 10.5, color: T.inkSoft, background: 'transparent', border: `1px solid ${T.line}`, letterSpacing: 0.4, cursor: 'pointer' }}>Refresh</button>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'new', 'flagged', 'dq'] as const).map(k => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                style={{
                  border: `1px solid ${filter === k ? T.oliveIntegrity : T.line}`,
                  background: filter === k ? T.oliveIntegrity : 'transparent',
                  color: filter === k ? T.cream : T.ink,
                  cursor: 'pointer',
                }}
              >
                {k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {shown.length === 0 && (
            <div className="px-7 py-10 text-[13px]" style={{ color: T.inkFaint }}>
              No leads in this view yet. Submit one through the portal to see it here.
            </div>
          )}
          {shown.map(l => (
            <LeadRow key={l.id} lead={l} active={l.id === active?.id} onClick={() => setActiveId(l.id)} />
          ))}
        </div>
      </div>

      {/* drawer */}
      {active && (
        <div className="flex-shrink-0" style={{ width: 460 }}>
          <LeadDrawer lead={active} onPushedToHubspot={(m) => setToast(m)} />
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full text-[13px]" style={{ background: T.oliveIntegrity, color: T.cream, boxShadow: '0 6px 20px rgba(33,34,33,.18)' }} onAnimationEnd={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
