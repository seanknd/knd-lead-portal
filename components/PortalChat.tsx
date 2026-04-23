'use client';

// Portal chat — main lead-prequal flow. Renders mobile-first; expands to a
// two-column layout above 900px wide (progress sidebar + chat).
//
// All LLM calls go through /api/ivy. If the backend is unreachable or returns
// non-JSON, we fall back to scripted bubbles from the same source of truth
// the server uses (lib/ivy.ts → fallbackFor) — so the flow never dies.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { T } from '../app/lib/tokens';
import type { Answers, BudgetAnswer, Lead, RoutingResult, AddressAnswer, PhotosAnswer, PhotoFile } from '../app/lib/types';
import { computeRouting } from '../app/lib/routing';
import { publicTeamLabel } from '../app/lib/ivy';
import { KDLogo } from './KDLogo';

// ─── Step script (mirrors lib/ivy.ts on the server) ────────────────────
type InputKind = 'chips' | 'text' | 'phone' | 'budget' | 'address' | 'upload' | 'union';
interface ScriptStep {
  id: string;
  commitAs: keyof Answers;
  input: { kind: InputKind; options?: string[]; placeholder?: string };
}

const SCRIPT: ScriptStep[] = [
  { id: 'greet',       commitAs: 'consent',     input: { kind: 'chips', options: ['Sure, go ahead', "I've only got a minute", 'Maybe later'] } },
  { id: 'scope',       commitAs: 'scope',       input: { kind: 'chips', options: ['Full yard remodel', 'Patio or outdoor living build', 'Drainage / retaining wall', 'Commercial or HOA project', 'Something else'] } },
  { id: 'scopeDetail', commitAs: 'scopeDetail', input: { kind: 'text', placeholder: 'e.g. pavers, an outdoor kitchen, built-in seating near the fire pit' } },
  { id: 'budget',      commitAs: 'budget',      input: { kind: 'budget' } },
  { id: 'timeline',    commitAs: 'timeline',    input: { kind: 'chips', options: ['ASAP / this month', '1-3 months', '3-6 months', 'Later this year', "I'm flexible"] } },
  { id: 'address',     commitAs: 'address',     input: { kind: 'address' } },
  { id: 'photos',      commitAs: 'photos',      input: { kind: 'upload' } },
  { id: 'phone',       commitAs: 'phone',       input: { kind: 'phone', placeholder: '(831) 555-0123' } },
  // Conditional final step — only shown for commercial/HOA
  { id: 'union',       commitAs: 'union',       input: { kind: 'union' } },
];

interface Bubble { role: 'ai' | 'user'; text: string }

// ─── LLM call (server proxy) ────────────────────────────────────────────
async function callIvy(stepId: string, answers: Answers, lead: Lead, userMessage: string | null): Promise<string[]> {
  try {
    const res = await fetch('/api/ivy', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stepId, answers, lead, userMessage }),
    });
    if (!res.ok) throw new Error(`ivy ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.bubbles) && data.bubbles.length > 0) return data.bubbles.slice(0, 2);
    throw new Error('no bubbles');
  } catch {
    // Hard fallback so the flow never dies — match the server's fallbackFor.
    return clientFallback(stepId, userMessage);
  }
}

async function callIvyClose(answers: Answers, routing: RoutingResult, lead: Lead): Promise<string> {
  try {
    const res = await fetch('/api/ivy/close', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ answers, routing, lead }),
    });
    if (!res.ok) throw new Error('close');
    const data = await res.json();
    if (Array.isArray(data.bubbles) && data.bubbles[0]) return data.bubbles[0];
    throw new Error('no close bubble');
  } catch {
    const team = publicTeamLabel(routing.team);
    return `Perfect, you're all set. Someone from ${team} will reach out within one business day. You'll get a text before any call so you know who's coming.`;
  }
}

function clientFallback(stepId: string, userMessage: string | null): string[] {
  const map: Record<string, string[]> = {
    greet:       ["Hi, I'm Ivy, project coordinator at K&D Landscaping.", "Mind if I ask a few quick things so I can route you to the right team?"],
    scope:       ["First question: are you thinking a full outdoor remodel, or something more focused?"],
    scopeDetail: ["Got it. Tell me a little about what you're picturing in your own words."],
    budget:      ["No pressure, but it helps to know roughly what you're planning to invest in the project so we can match you with the right team. For context, full remodels usually land around $100k+ and smaller enhancements start around $15k. This isn't a quote — a rough range is plenty, and it's fine to say you're still figuring it out."],
    timeline:    ["When are you hoping to get started?"],
    address:     ["What's the project address? K&D serves the Monterey Bay region, so I'll make sure we're in range."],
    photos:      ["If you have photos of the space or any inspiration images, drop them here. Totally optional."],
    phone:       ["Last thing for now: what's the best number to reach you on?"],
    union:       ["Quick fit question: is this a union or non-union project? K&D is a non-union shop, so we just want to make sure we're a fit."],
  };
  const ack = userMessage ? ['Got it.'] : [];
  return [...ack, ...(map[stepId] || ["Let's keep going."])];
}

// ─── Sub-components ─────────────────────────────────────────────────────
function MessageBubble({ children, role }: { children: React.ReactNode; role: 'ai' | 'user' }) {
  const isAI = role === 'ai';
  return (
    <div className={`flex mb-2 ${isAI ? 'justify-start' : 'justify-end'} bubble-in`}>
      <div
        className="max-w-[78%] px-[15px] py-[11px] text-[15.5px] leading-snug whitespace-pre-wrap break-words"
        style={{
          background: isAI ? '#fff' : T.oliveIntegrity,
          color: isAI ? T.ink : T.cream,
          borderRadius: isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
          boxShadow: isAI ? '0 1px 2px rgba(33,34,33,.06)' : 'none',
          border: isAI ? `1px solid ${T.lineSoft}` : 'none',
          fontWeight: isAI ? 400 : 500,
          letterSpacing: -0.1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-2">
      <div className="flex items-center gap-1 px-4 py-3.5 bg-white" style={{ borderRadius: '18px 18px 18px 4px', border: `1px solid ${T.lineSoft}` }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="typing-dot" style={{ width: 6, height: 6, borderRadius: 3, background: T.inkFaint, animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

function Chips({ options, onPick }: { options: string[]; onPick: (s: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap px-4 pt-3 pb-3.5" style={{ background: T.creamDeep, borderTop: `1px solid ${T.line}` }}>
      {options.map(o => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className="px-4 py-2.5 text-[14.5px] font-medium rounded-full transition-all"
          style={{ border: `1px solid ${T.oliveIntegrity}`, color: T.oliveIntegrity, background: 'transparent', letterSpacing: -0.1 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.oliveIntegrity; (e.currentTarget as HTMLButtonElement).style.color = T.cream; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = T.oliveIntegrity; }}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function BudgetInput({ onCommit }: { onCommit: (v: BudgetAnswer) => void }) {
  const [v, setV] = useState(75);
  const current = v >= 250 ? `$${v}k+` : `$${Math.max(5, v)}k`;
  const tier = v < 20 ? 'Small enhancement' : v < 50 ? 'Focused project' : v < 100 ? 'Partial yard' : v < 200 ? 'Full yard' : 'Large project';
  return (
    <div className="px-5 py-[18px]" style={{ background: T.creamDeep, borderTop: `1px solid ${T.line}` }}>
      <div className="flex items-baseline justify-between mb-3.5">
        <div>
          <div className="font-display" style={{ fontSize: 32, fontWeight: 600, color: T.oliveIntegrity, letterSpacing: -1, lineHeight: 1 }}>{current}</div>
          <div className="text-[13px] mt-1" style={{ color: T.inkSoft }}>{tier}</div>
          <div className="text-[11.5px] mt-1.5 italic" style={{ color: T.inkFaint, lineHeight: 1.35 }}>
            This isn't a quote — it just helps us match you with the right team.
          </div>
        </div>
        <button
          onClick={() => onCommit({ label: current, tier, raw: v })}
          className="px-[18px] py-2.5 rounded-full text-sm font-medium"
          style={{ background: T.oliveIntegrity, color: T.cream, border: 'none' }}
        >
          That's my ballpark →
        </button>
      </div>
      <input type="range" min={5} max={500} step={5} value={v} onChange={e => setV(+e.target.value)} className="w-full" style={{ height: 4 }} />
      <div className="flex justify-between mt-2 font-mono uppercase" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.4 }}>
        <span>$5k</span><span>$50k</span><span>$100k</span><span>$250k</span><span>$500k+</span>
      </div>
      <button
        onClick={() => onCommit({ label: 'Not sure yet', tier: 'unsure', raw: null })}
        className="mt-3 text-[13px] underline"
        style={{ background: 'transparent', border: 'none', color: T.inkSoft, textUnderlineOffset: 3, textDecorationColor: T.inkFaint }}
      >
        Not sure yet — that's okay, skip this
      </button>
    </div>
  );
}

function AddressInput({ onCommit }: { onCommit: (v: AddressAnswer) => void }) {
  const [addr, setAddr] = useState('');
  const [suggestions, setSuggestions] = useState<{ display: string; lat: string; lon: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (addr.length < 4) { setSuggestions([]); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=us&limit=5&q=${encodeURIComponent(addr)}`;
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        const data: { display_name: string; lat: string; lon: string }[] = await res.json();
        setSuggestions(data.map(r => ({ display: r.display_name, lat: r.lat, lon: r.lon })));
      } catch (e: any) {
        if (e.name !== 'AbortError') setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [addr]);

  return (
    <div className="px-4 py-3.5" style={{ background: T.creamDeep, borderTop: `1px solid ${T.line}` }}>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T.inkFaint} strokeWidth="1.6">
            <path d="M8 14s5-4.5 5-8.5A5 5 0 008 1a5 5 0 00-5 4.5C3 9.5 8 14 8 14z" /><circle cx="8" cy="5.5" r="1.8" />
          </svg>
        </div>
        <input
          value={addr}
          onChange={e => setAddr(e.target.value)}
          placeholder="Start typing the project address"
          className="w-full px-[38px] py-3 pr-11 text-[15px] outline-none"
          style={{ border: `1px solid ${T.line}`, background: '#fff', borderRadius: 10, color: T.ink }}
          onFocus={e => (e.currentTarget.style.borderColor = T.oliveIntegrity)}
          onBlur={e => (e.currentTarget.style.borderColor = T.line)}
        />
        {addr.length > 0 && (
          <button
            onClick={() => onCommit({ address: addr })}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{ background: T.oliveIntegrity, color: T.cream, border: 'none', borderRadius: 8, width: 34, height: 34 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 7h10M8 3l4 4-4 4" />
            </svg>
          </button>
        )}
      </div>
      {(suggestions.length > 0 || loading) && (
        <div className="mt-2 overflow-hidden" style={{ background: '#fff', borderRadius: 10, border: `1px solid ${T.line}` }}>
          {loading && <div className="px-3.5 py-2.5 font-mono uppercase" style={{ fontSize: 11, color: T.inkFaint, letterSpacing: 0.4 }}>Searching...</div>}
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onCommit({ address: s.display, lat: s.lat, lon: s.lon })}
              className="flex w-full px-3.5 py-2.5 text-left gap-2.5 items-start text-[13px]"
              style={{ background: 'transparent', border: 'none', borderBottom: i < suggestions.length - 1 ? `1px solid ${T.lineSoft}` : 'none', color: T.ink, lineHeight: 1.4 }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={T.inkFaint} strokeWidth="1.5" style={{ marginTop: 2, flexShrink: 0 }}>
                <path d="M7 12s4-3.5 4-7A4 4 0 007 1a4 4 0 00-4 4C3 8.5 7 12 7 12z" />
              </svg>
              <span>{s.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadInput({ onCommit }: { onCommit: (v: PhotosAnswer) => void }) {
  const [files, setFiles] = useState<PhotoFile[]>([]);
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    const arr: PhotoFile[] = Array.from(fl).map(f => {
      const isImage = f.type.startsWith('image/');
      return { name: f.name, size: f.size, type: f.type, kind: isImage ? 'photo' : 'doc', url: isImage ? URL.createObjectURL(f) : null };
    });
    setFiles(prev => [...prev, ...arr]);
  };

  const removeAt = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  return (
    <div className="px-4 py-3.5" style={{ background: T.creamDeep, borderTop: `1px solid ${T.line}` }}>
      {files.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {files.map((f, i) => (
            <div key={i} className="relative w-16 h-16 rounded-[10px] overflow-hidden flex items-center justify-center" style={{ background: f.url ? `url(${f.url}) center/cover` : T.cream, border: f.url ? 'none' : `1px dashed ${T.inkFaint}` }}>
              {!f.url && (
                <div className="font-mono uppercase text-[9px] text-center px-1" style={{ color: T.inkSoft, letterSpacing: 0.5 }}>
                  {(f.name.split('.').pop() || 'doc').slice(0, 4)}
                </div>
              )}
              <button
                onClick={() => removeAt(i)}
                className="absolute top-0.5 right-0.5 rounded-full text-white text-[11px] flex items-center justify-center"
                style={{ width: 18, height: 18, background: 'rgba(0,0,0,.55)', border: 'none' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <input ref={photoRef} type="file" accept="image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      <input ref={docRef} type="file" accept=".pdf,.doc,.docx,image/*" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
      <div className="flex gap-2">
        <button onClick={() => photoRef.current?.click()} className="flex-1 py-3 flex items-center justify-center gap-2 text-[13.5px] font-medium" style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T.oliveIntegrity} strokeWidth="1.6"><rect x="1.5" y="3" width="13" height="10" rx="1.5" /><circle cx="6" cy="7.5" r="1.2" /><path d="M2 12l3.5-3.5L9 11l2-2 3 3" /></svg>
          Add photos
        </button>
        <button onClick={() => docRef.current?.click()} className="flex-1 py-3 flex items-center justify-center gap-2 text-[13.5px] font-medium" style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={T.oliveIntegrity} strokeWidth="1.6"><path d="M3 1.5h6l3.5 3.5V14a.5.5 0 01-.5.5H3a.5.5 0 01-.5-.5V2a.5.5 0 01.5-.5z" /><path d="M9 1.5V5h3.5" /></svg>
          Plans / docs
        </button>
      </div>
      <div className="flex gap-3 mt-3 items-center justify-between">
        <button onClick={() => onCommit({ files: [], skipped: true })} className="text-[13px] underline" style={{ background: 'transparent', border: 'none', color: T.inkSoft, padding: 0, textUnderlineOffset: 3 }}>
          Skip — no photos
        </button>
        {files.length > 0 && (
          <button onClick={() => onCommit({ files, skipped: false })} className="px-4 py-2 rounded-full text-[13.5px] font-medium" style={{ background: T.oliveIntegrity, color: T.cream, border: 'none' }}>
            Send {files.length} {files.length === 1 ? 'file' : 'files'} →
          </button>
        )}
      </div>
    </div>
  );
}

function TextInput({ placeholder, onCommit, kind = 'text', autoFocus = false }: { placeholder?: string; onCommit: (s: string) => void; kind?: 'text' | 'phone'; autoFocus?: boolean }) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  const submit = () => { if (v.trim()) { onCommit(v.trim()); setV(''); } };
  return (
    <div className="px-4 pt-3 pb-3.5" style={{ background: T.creamDeep, borderTop: `1px solid ${T.line}` }}>
      <div className="relative">
        <textarea
          ref={ref}
          value={v}
          onChange={e => setV(e.target.value)}
          placeholder={placeholder}
          rows={kind === 'phone' ? 1 : 2}
          inputMode={kind === 'phone' ? 'tel' : 'text'}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
          className="w-full px-3.5 py-3 pr-12 text-[15px] outline-none resize-none"
          style={{ border: `1px solid ${T.line}`, background: '#fff', borderRadius: 14, color: T.ink, lineHeight: 1.4 }}
          onFocus={e => (e.currentTarget.style.borderColor = T.oliveIntegrity)}
          onBlur={e => (e.currentTarget.style.borderColor = T.line)}
        />
        <button
          onClick={submit}
          disabled={!v.trim()}
          className="absolute right-1.5 bottom-1.5 flex items-center justify-center"
          style={{ background: v.trim() ? T.oliveIntegrity : T.inkFaint, color: T.cream, border: 'none', borderRadius: 10, width: 34, height: 34, cursor: v.trim() ? 'pointer' : 'default' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M7 12V2M3 6l4-4 4 4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Summary screen (after submit) ──────────────────────────────────────
function SummaryScreen({ answers, lead, routing }: { answers: Answers; lead: Lead; routing: RoutingResult }) {
  const photoCount = answers.photos?.files?.length || 0;
  const rows: Array<[string, string]> = [
    ['Project scope', answers.scope || '—'],
    ["What you're picturing", answers.scopeDetail || '—'],
    ['Budget', answers.budget?.label || '—'],
    ['Timeline', answers.timeline || '—'],
    ['Address', answers.address?.address || '—'],
    ['Photos & plans', photoCount > 0 ? `${photoCount} attached` : 'None'],
    ['Phone', answers.phone || '—'],
  ];
  if (answers.union) rows.push(['Union / non-union', answers.union]);

  // The lead never sees "DQ" copy — always warm.
  const isDQ = routing.team === 'DQ';

  return (
    <div className="px-7 pt-7 pb-10 min-h-full" style={{ background: T.cream }}>
      <div className="rounded-full flex items-center justify-center mb-3.5" style={{ width: 44, height: 44, background: T.forestThrive }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={T.cream} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10l4 4 8-8" />
        </svg>
      </div>
      <h1 className="font-display" style={{ fontSize: 36, fontWeight: 700, color: T.oliveIntegrity, letterSpacing: -0.8, margin: 0, lineHeight: 1.05 }}>
        Thanks, {lead.firstName || 'there'}.<br />We've got what we need.
      </h1>
      <p className="text-[15px] my-6 leading-relaxed max-w-md" style={{ color: T.inkSoft }}>
        {isDQ
          ? <>Someone from our team will follow up directly to figure out the best path forward.</>
          : <>Your project is headed to <strong style={{ color: T.ink }}>{publicTeamLabel(routing.team)}</strong>. They'll reach out within one business day to set up a site walk.</>
        }
      </p>

      <div className="mb-4" style={{ background: '#fff', borderRadius: 16, border: `1px solid ${T.line}`, padding: '6px 18px' }}>
        {rows.map((r, i) => (
          <div key={r[0]} className="flex justify-between items-start gap-4" style={{ padding: '14px 0', borderBottom: i < rows.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
            <div className="font-mono uppercase font-medium" style={{ fontSize: 11.5, color: T.inkFaint, letterSpacing: 0.6, paddingTop: 2, width: 110, flexShrink: 0 }}>{r[0]}</div>
            <div className="text-right text-[14.5px]" style={{ color: T.ink, fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word' }}>{r[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Progress sidebar (desktop only) ────────────────────────────────────
function ProgressSidebar({ steps, currentIdx, answers }: { steps: ScriptStep[]; currentIdx: number; answers: Answers }) {
  const labels: Record<string, string> = {
    greet: 'Hello', scope: 'Scope', scopeDetail: 'Details', budget: 'Budget',
    timeline: 'Timeline', address: 'Address', photos: 'Photos', phone: 'Phone', union: 'Union',
  };
  const summaryFor = (s: ScriptStep): string | null => {
    const v: any = answers[s.commitAs];
    if (v == null) return null;
    if (typeof v === 'string') return v;
    if (v.label) return v.label;          // budget
    if (v.address) return v.address;      // address
    if (typeof v.skipped === 'boolean') return v.skipped ? 'Skipped' : `${v.files.length} file${v.files.length === 1 ? '' : 's'}`;
    return null;
  };
  return (
    <aside className="hidden lg:flex flex-col flex-shrink-0" style={{ width: 320, background: T.creamDeep, borderRight: `1px solid ${T.line}`, padding: '28px 24px' }}>
      <div className="mb-7"><KDLogo size={28} /></div>
      <div className="font-mono uppercase mb-3" style={{ fontSize: 10.5, color: T.inkFaint, letterSpacing: 0.8 }}>Project intake</div>
      <div className="font-display mb-5" style={{ fontSize: 22, color: T.oliveIntegrity, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15 }}>
        A few quick questions so we can route you well.
      </div>
      <ol className="list-none p-0 m-0 mt-2 space-y-1">
        {steps.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const summary = summaryFor(s);
          return (
            <li key={s.id} className="flex gap-3 py-2.5">
              <div className="flex-shrink-0 mt-0.5 rounded-full flex items-center justify-center" style={{
                width: 18, height: 18,
                background: done ? T.forestThrive : active ? T.oliveIntegrity : 'transparent',
                border: done || active ? 'none' : `1.5px solid ${T.inkFaint}`,
              }}>
                {done && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={T.cream} strokeWidth="2" strokeLinecap="round"><path d="M2 5l2 2 4-4" /></svg>}
                {active && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.cream }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: active ? T.oliveIntegrity : done ? T.ink : T.inkSoft }}>
                  {labels[s.id] || s.id}
                </div>
                {summary && (
                  <div className="text-[12px] mt-0.5 truncate" style={{ color: T.inkFaint }}>{summary}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-auto font-mono uppercase pt-4" style={{ fontSize: 10, color: T.inkFaint, letterSpacing: 0.6, borderTop: `1px solid ${T.line}` }}>
        Secure session · K&D Landscaping
      </div>
    </aside>
  );
}

// ─── Main component ────────────────────────────────────────────────────
export default function PortalChat({ lead = { firstName: 'Sarah', originalInquiry: 'a backyard remodel in Aptos' } }: { lead?: Lead }) {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [thinking, setThinking] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [done, setDone] = useState(false);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  // Build the active script — drop the union step unless commercial/HOA.
  const activeScript = useMemo(() => {
    const scope = (answers.scope || '').toLowerCase();
    const isCommercial = scope.includes('commercial') || scope.includes('hoa');
    return SCRIPT.filter(s => s.id !== 'union' || isCommercial);
  }, [answers.scope]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, showInput, thinking]);

  const runStep = async (idx: number, prevUserMsg: string | null) => {
    if (idx >= activeScript.length) { void finishFlow(); return; }
    const step = activeScript[idx];
    setThinking(true);
    setShowInput(false);
    const bubbles = await callIvy(step.id, answers, lead, prevUserMsg);
    for (let i = 0; i < bubbles.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 200 : 500));
      setMessages(m => [...m, { role: 'ai', text: bubbles[i] }]);
    }
    setThinking(false);
    setShowInput(true);
  };

  const finishFlow = async () => {
    setThinking(true);
    setShowInput(false);
    // Call /api/submit so routing is computed server-side. Fall back to
    // client computeRouting if the network call fails.
    let result: RoutingResult;
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lead, answers }),
      });
      if (!res.ok) throw new Error('submit');
      const data = await res.json();
      result = data.routing as RoutingResult;
    } catch {
      result = computeRouting(answers);
    }
    setRouting(result);
    const closing = await callIvyClose(answers, result, lead);
    await new Promise(r => setTimeout(r, 400));
    setMessages(m => [...m, { role: 'ai', text: closing }]);
    setThinking(false);
    setTimeout(() => setDone(true), 1200);
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void runStep(0, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (value: any) => {
    const step = activeScript[stepIdx];
    const display =
      typeof value === 'string'
        ? value
        : value?.label || value?.address || (value?.files && value?.skipped ? 'Skip' : value?.files ? `${value.files.length} file${value.files.length === 1 ? '' : 's'}` : JSON.stringify(value));
    setMessages(m => [...m, { role: 'user', text: display }]);
    const newAnswers = { ...answers, [step.commitAs]: value } as Answers;
    setAnswers(newAnswers);
    setShowInput(false);
    const next = stepIdx + 1;
    setStepIdx(next);
    setTimeout(() => void runStep(next, display), 300);
  };

  if (done && routing) {
    return (
      <div className="flex h-full" style={{ background: T.cream }}>
        <ProgressSidebar steps={activeScript} currentIdx={activeScript.length} answers={answers} />
        <div className="flex-1 overflow-y-auto"><SummaryScreen answers={answers} lead={lead} routing={routing} /></div>
      </div>
    );
  }

  const step = activeScript[stepIdx];
  const input = step?.input;

  return (
    <div className="flex h-full" style={{ background: T.cream }}>
      <ProgressSidebar steps={activeScript} currentIdx={Math.min(stepIdx, activeScript.length - 1)} answers={answers} />

      <div className="flex flex-col flex-1 min-w-0">
        {/* mobile header */}
        <div className="flex items-center gap-3 flex-shrink-0 px-5 py-3.5 lg:hidden" style={{ background: T.cream, borderBottom: `1px solid ${T.line}` }}>
          <KDLogo size={28} />
          <div className="flex-1" />
          <div className="font-mono uppercase" style={{ fontSize: 10, color: T.inkFaint, letterSpacing: 0.6 }}>
            {Math.min(stepIdx + 1, activeScript.length)} / {activeScript.length}
          </div>
        </div>

        {/* desktop subheader */}
        <div className="hidden lg:flex items-center gap-3 flex-shrink-0 px-7 py-4" style={{ background: T.cream, borderBottom: `1px solid ${T.line}` }}>
          <div className="rounded-full flex items-center justify-center" style={{ width: 36, height: 36, background: T.oliveIntegrity }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill={T.cream}><path d="M9 2c-3 3-3 7 0 10 3-3 3-7 0-10zM3 10c1-1 3-1 4 0-1 1-3 1-4 0zm12 0c-1-1-3-1-4 0 1 1 3 1 4 0zM9 14v2" /></svg>
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-medium leading-tight" style={{ color: T.ink }}>Ivy · Project Coordinator</div>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11.5px]" style={{ color: T.ok }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: T.ok }} />
              K&D Landscaping
            </div>
          </div>
          <div className="font-mono uppercase" style={{ fontSize: 10, color: T.inkFaint, letterSpacing: 0.6 }}>
            Step {Math.min(stepIdx + 1, activeScript.length)} of {activeScript.length}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 pt-5 pb-3" style={{ background: T.cream, scrollBehavior: 'smooth' }}>
          <div className="max-w-[820px] mx-auto">
            {messages.map((m, i) => <MessageBubble key={i} role={m.role}>{m.text}</MessageBubble>)}
            {thinking && <TypingIndicator />}
          </div>
        </div>

        {showInput && input && !thinking && (
          <div className="flex-shrink-0">
            <div className="max-w-[820px] mx-auto">
              {input.kind === 'chips' && <Chips options={input.options!} onPick={commit} />}
              {input.kind === 'text' && <TextInput placeholder={input.placeholder} onCommit={commit} autoFocus />}
              {input.kind === 'phone' && <TextInput placeholder={input.placeholder || '(831) 555-0123'} kind="phone" onCommit={commit} />}
              {input.kind === 'budget' && <BudgetInput onCommit={commit} />}
              {input.kind === 'address' && <AddressInput onCommit={commit} />}
              {input.kind === 'upload' && <UploadInput onCommit={commit} />}
              {input.kind === 'union' && <Chips options={['Non-union', 'Union', 'Not sure']} onPick={commit} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
