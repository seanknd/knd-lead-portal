# Handoff: KND Landscaping Lead Prequalification Portal

## Overview

A conversational web portal that new landscape leads reach via a link in their inquiry-reply email. An AI concierge named **Ivy** chats with them, collects the 8 data points the sales team needs to route the lead correctly (scope, budget, timeline, address, photos, phone), and hands the result off to HubSpot. An internal admin dashboard shows inbound leads with AI-generated routing recommendations and disqualification flags.

The goal is to replace the current generic "thanks, we'll be in touch" email flow with a structured, warm intake that pre-qualifies leads against KND's routing cheat sheet **before** a designer's time gets spent.

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look, copy, and behavior. They are **not production code to copy directly**.

Your task is to **recreate these designs in a real, deployable web application** — frontend + backend + HubSpot integration. Suggested stack below, but you're free to pick whatever the team will maintain.

The prototypes currently call `window.claude.complete()` which only works inside the preview sandbox. Production must call Anthropic's API server-side through your own backend.

## Fidelity

**High-fidelity.** Colors, typography, spacing, copy, and interactions are final. Recreate pixel-perfectly. Design tokens are listed below — match them exactly.

---

## Recommended Architecture

```
                     ┌─────────────────────────┐
  Lead submits form  │  HubSpot form / workflow │
  on knd site  ───►  │  fires outbound email w/ │
                     │  tokenized portal link   │
                     └───────────┬─────────────┘
                                 │
                                 ▼
                     ┌─────────────────────────┐
                     │  Portal (Next.js app)    │
                     │  portal.kndlandscaping   │
                     │                          │
  Lead chats  ────►  │  Frontend: React chat    │
                     │  Backend API routes:     │
                     │    /api/ivy  (LLM proxy) │
                     │    /api/submit (finalize)│
                     │    /api/upload (photos)  │
                     └─────────┬───────┬───────┘
                               │       │
                   Anthropic   │       │   HubSpot API
                   Claude API  │       │   + Cloudflare R2 / S3
                               ▼       ▼
```

### Suggested stack
- **Framework:** Next.js 14 (App Router) on Vercel — serverless functions built in, free tier covers expected volume
- **LLM:** `@anthropic-ai/sdk` calling `claude-haiku-4-5` (fast, cheap, already what the prototype uses)
- **File storage:** Cloudflare R2 (S3-compatible, $0 egress) or AWS S3
- **Address lookup:** OpenStreetMap Nominatim (free, already wired in prototype) or Google Places if volume grows
- **HubSpot:** Private app with scopes for `crm.objects.contacts.write` and `crm.objects.notes.write`
- **Env vars needed:**
  - `ANTHROPIC_API_KEY`
  - `HUBSPOT_PRIVATE_APP_TOKEN`
  - `HUBSPOT_PORTAL_ID`
  - `R2_ACCESS_KEY` / `R2_SECRET` / `R2_BUCKET` (or S3 equivalents)
  - `PORTAL_BASE_URL` (e.g. `https://portal.kndlandscaping.com`)
  - `LINK_SIGNING_SECRET` (for tokenized links)

### Tokenized link flow
1. HubSpot workflow fires when new lead submits contact form
2. Workflow calls a webhook on our portal: `POST /api/intake-webhook` with `{contactId, firstName, originalInquiry}`
3. Webhook returns a signed URL like `https://portal.kndlandscaping.com/s/eyJhbGc...` — a JWT containing the HubSpot contactId
4. HubSpot workflow inserts that URL into the follow-up email template
5. When lead clicks, portal decodes the JWT, pre-fills `firstName` and `originalInquiry`, and ties submitted answers back to the correct HubSpot contact

---

## Screens / Views

There are **4 surfaces** to build:

### 1. Intake email
Not part of the web app — it's a HubSpot email template. See `email.jsx` for the exact copy and structure. Key elements:
- Subject: "Let's scope your project — a few quick questions"
- From: a real designer's name (not `no-reply@`)
- Body: warm 3-sentence intro + prominent CTA button linking to the tokenized portal URL
- Fallback plaintext link

Deliverable: a HubSpot email template + workflow JSON export.

### 2. Mobile portal (primary experience — 70%+ of leads will use this)
Full-bleed single-column chat. See `portal-chat.jsx` for complete implementation reference.

**Layout:**
- Full viewport height, dark forest (`#1f3a2e`) header with brand wordmark "Moss & Stone" (replace with "KND Landscaping")
- Header shows Ivy's name, role ("Project Coordinator"), and a live progress dot indicator (8 steps)
- Chat transcript fills middle, scrolls
- Input surface docks to bottom, morphs based on current step (chips / slider / address / file upload / text / phone)
- Typing indicator (3 animated dots) shown while Ivy is "thinking"

**The 8 conversation steps:**
| # | ID | Ask | Input surface |
|---|---|---|---|
| 1 | `greet` | Greet + consent to chat | Chips: Sounds good / Only have a minute / Can we do this later? |
| 2 | `scope` | Full remodel or focused? | Chips: 5 options (see script) |
| 3 | `scopeDetail` | Describe what they're picturing | Free text |
| 4 | `budget` | Ballpark budget | Custom slider, $5k–$500k+, with "Not sure yet" escape |
| 5 | `timeline` | When to start | Chips: 5 options |
| 6 | `address` | Project address | OSM Nominatim autocomplete |
| 7 | `photos` | Optional photos/inspo | `<input type="file" multiple accept="image/*">` with thumbnails + skip option |
| 8 | `phone` | Best number | `tel` input with format validation |

After step 8: routing runs client-side (purely to show a friendly summary), the full payload posts to `/api/submit`, and the lead sees a wrap-up screen. The lead **never** sees a "disqualified" result — always a warm message. DQ flagging happens internally only.

### 3. Desktop portal
Same flow, two-column layout. See `portal-chat.jsx` + `design-canvas.jsx` for reference.
- Left column (360px): progress sidebar showing all 8 steps, current step highlighted, completed steps show summary of answer
- Right column: chat transcript + input surface
- Max content width 900px, centered in viewport
- Breakpoint: ≥ 900px shows desktop layout, below is mobile

### 4. Admin dashboard
Internal team view. See `admin-dashboard.jsx` for full implementation.
- Top bar: brand + "Leads" title + counts (New / In review / Routed)
- Left column: lead list, one row per lead with avatar, name, scope preview, routing pill, confidence %, time-ago
- Right drawer (opens on click): full lead detail
  - Header with name, location, status
  - **AI Routing Recommendation** card: recommended owner + confidence + reason, with "Accept" / "Override" buttons
  - **Route Logic Checklist** showing each cheat-sheet rule, pass/fail, and which require human judgment
  - Answers section: all 8 data points
  - Photos gallery (if any)
  - **HubSpot Note Preview**: auto-generated markdown-formatted note ready to push
  - "Send to HubSpot" button (fires `/api/push-to-hubspot`)
  - DQ reason (if flagged) — shown only internally

---

## Routing Logic (Cheat Sheet)

This is the core business logic. Implement **server-side** in `/api/submit` so it can't be manipulated client-side. See `computeRouting()` in `portal-chat.jsx` for reference implementation.

```
INPUTS: { scope, scopeDetail, budget.raw (in $k), timeline, address }

1. DQ CHECKS (return early):
   - scopeDetail matches /tree trim|tree remov|just mow|lawn mow|junk removal|cleanup only|one-off|small repair/i
     → { team: 'DQ', reason: 'Out-of-scope single trade' }
   - budget.raw !== null && budget.raw < 15
     → { team: 'DQ', reason: 'Budget below $15k minimum' }

2. COMMERCIAL:
   - scope includes 'commercial' or 'hoa':
     - If maintenance/weekly/mowing keywords:
       → { team: 'Biz Dev', owner: 'Jamie Reyes' }
     - Else:
       → { team: 'Commercial', owner: 'Brian Wallace', flag: 'confirm non-union' }

3. RES LITE:
   - scope includes 'drainage' or 'retaining':
     → { team: 'Res Lite', owner: 'Kendel Okafor' }
   - budget.raw < 50:
     → { team: 'Res Lite', owner: 'Kendel Okafor' }

4. DESIGN-BUILD (default):
   - budget.raw >= 100: → { owner: 'Rudy Alvarez' }
   - else: → { owner: 'Megha Iyer' }
```

**Confidence %** is a display value only — compute it loosely based on how many signals align (all strong signals = 90s, mixed = 70s–80s).

**Replace the placeholder owner names** (Rudy Alvarez, Kendel Okafor, Jamie Reyes, Brian Wallace, Megha Iyer) with actual KND team members. The user has the real list.

---

## Ivy's Voice — LLM Integration

The prototype calls `window.claude.complete()` directly. In production:

1. Frontend POSTs `{step, answers, userMessage, lead}` to `/api/ivy`
2. Backend constructs the system + user prompts (already written in `portal-chat.jsx` → `ivySay()` and `ivyClose()`)
3. Backend calls Anthropic SDK with `claude-haiku-4-5`, max_tokens 300
4. Returns `{bubbles: ["...", "..."]}` — 1 or 2 short bubbles
5. Fallback: if LLM call fails, use the hardcoded `fallbackFor(step)` script so the flow never dies

The exact prompts, voice rules ("warm, concise, no emoji, never say 'I'm an AI'"), and JSON response shape are all in `portal-chat.jsx` — lift them directly.

**Cost envelope:** ~8 LLM calls per lead × ~400 tokens each ≈ $0.002/lead on Haiku. Negligible.

---

## HubSpot Integration

### Contact property mapping
On `/api/submit`, update the HubSpot contact with:

| HubSpot property | Source field | Type |
|---|---|---|
| `firstname` | `lead.firstName` | string |
| `phone` | `answers.phone` | string |
| `address` | `answers.address.formatted` | string |
| `project_scope` | `answers.scope` | string (create custom prop) |
| `project_detail` | `answers.scopeDetail` | multiline (create custom prop) |
| `project_budget` | `answers.budget.label` | string (create custom prop) |
| `project_timeline` | `answers.timeline` | string (create custom prop) |
| `lead_owner_recommended` | `routing.owner` | string (create custom prop) |
| `lead_team` | `routing.team` | enumeration: Design-Build, Res Lite, Commercial, Biz Dev, DQ |
| `lead_dq_reason` | `routing.reason` (if DQ) | multiline |

### Engagement note
Create a note on the contact with markdown-formatted summary. See `admin-dashboard.jsx` → `noteTemplate()` for the exact format. Include photo URLs (from R2) inline.

### Assign owner
If routing is not DQ, call HubSpot's "assign owner" endpoint with the mapped HubSpot user ID for that team member. The user will need to provide the mapping `{'Rudy Alvarez': hubspotUserId, ...}`.

### Webhook for inbound
`POST /api/intake-webhook` receives `{contactId, firstName, originalInquiry, email}` from HubSpot workflow, creates a signed JWT link, returns it. HubSpot email template inserts this link.

---

## State Management

### Frontend (portal)
- `answers` object: `{scope, scopeDetail, budget: {raw, label, tier}, timeline, address: {formatted, lat, lng}, photos: [File...], phone}`
- `transcript` array: `[{role: 'ai' | 'user', text, ts}...]`
- `currentStep` index into SCRIPT array (0–7)
- `isTyping` boolean for Ivy indicator
- Persist `answers` + `currentStep` to `localStorage` keyed on JWT — so if lead closes and comes back, they pick up where they left off

### Backend
Stateless. Each `/api/ivy` call is independent. Final state lives in HubSpot.

---

## Design Tokens

From `tokens.jsx`. Match exactly. You may want to re-theme once KND's real brand colors are applied.

### Colors
```
forest:     #1f3a2e   (primary brand — deep evergreen)
forestDeep: #13261e   (near-black hero backgrounds)
moss:       #4a6a52   (softer forest accent)
sage:       #9bb3a0   (muted sage)
terracotta: #c8714a   (warm accent, high-priority badges)
clay:       #e8cdb8   (soft clay / sand)
cream:      #f7f2ea   (page background)
creamDeep:  #efe7d9   (card background)
stone:      #b8ada0   (muted warm gray)
ink:        #2a241d   (body text)
inkSoft:    #5c544a   (secondary text)
inkFaint:   #8a8376   (tertiary text, timestamps)
line:       rgba(42,36,29,0.10)  (dividers)
lineSoft:   rgba(42,36,29,0.06)  (subtle dividers)

ok:   #3f7a4e   (success / passed route check)
warn: #c89a2a   (warning / needs human)
dq:   #a23d2c   (disqualification)
```

### Typography
- **Display:** `"Newsreader", "Cormorant Garamond", Georgia, serif` — hero numbers, section headers
- **Sans:** `"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` — all UI text
- **Mono:** `"Geist Mono", ui-monospace, SFMono-Regular, monospace` — IDs, timestamps, metadata

### Spacing scale
Not a strict scale — use 4/8/12/16/20/24/32/40/56/72/96 px. Match what the prototype uses.

### Border radius
- `4px` — small (chat bubble tail corner)
- `8px` — inputs
- `12px` — cards
- `18px` — chat bubbles
- `999px` — pills, buttons, chips

### Shadows
- `0 1px 2px rgba(42,36,29,.06)` — subtle lift (chat bubbles)
- `0 4px 12px rgba(42,36,29,.08)` — cards
- `0 20px 48px rgba(42,36,29,.15)` — modals, drawers

### Animations
- Bubble in: `cubic-bezier(.2,.7,.3,1)` 350ms, `translateY(6px)` → `translateY(0)`, opacity 0 → 1
- Typing dots: 1.3s ease-in-out, staggered 0.18s each
- All UI transitions: 150ms ease for hover, 200ms ease for layout

---

## Assets

The prototype uses no proprietary assets. You'll need:
- **KND Landscaping logo** (SVG preferred, light + dark variants)
- **Final brand colors** if they differ from the placeholder forest/cream palette
- **Real team member names** for routing (replace Rudy Alvarez, Kendel Okafor, etc.)
- **Real service area definition** (currently "Bay Area, CA" — update to actual coverage)
- **Photos of past work** if the post-submission "thanks" screen should include a portfolio teaser (optional)

---

## Files in This Bundle

- `README.md` — this file
- `Lead Prequalification Portal (standalone).html` — single-file working prototype, open in any browser
- `Lead Prequalification Portal.html` — same, but loads component files from disk (requires local server)
- `portal-chat.jsx` — mobile + desktop chat component with full LLM integration, routing logic, all 8 input surfaces
- `admin-dashboard.jsx` — internal leads dashboard with routing recs and HubSpot note preview
- `email.jsx` — Gmail-style mock of the outbound intake email (reference for HubSpot template copy)
- `ios-frame.jsx` — iOS bezel wrapper used in canvas view
- `browser-window.jsx` — desktop browser chrome wrapper used in canvas view
- `design-canvas.jsx` — canvas wrapper (for viewing multiple artboards side-by-side — not needed in production)
- `tokens.jsx` — design tokens (colors, typography) — **port these to CSS variables or a theme object**

---

## Deployment Checklist

- [ ] Next.js app scaffolded and deployed to Vercel
- [ ] Subdomain `portal.kndlandscaping.com` configured with SSL
- [ ] Anthropic API key obtained and added to Vercel env vars
- [ ] HubSpot private app created with contact + note scopes
- [ ] HubSpot custom properties created (see mapping table)
- [ ] HubSpot user ID → team member name mapping stored in env or constants file
- [ ] HubSpot workflow configured to POST to `/api/intake-webhook` on new contact form submission
- [ ] HubSpot email template updated with `{portal_link}` personalization token
- [ ] R2 or S3 bucket provisioned for photo uploads
- [ ] `/api/ivy`, `/api/submit`, `/api/upload`, `/api/intake-webhook`, `/api/push-to-hubspot` implemented and tested
- [ ] JWT signing secret generated and stored
- [ ] End-to-end test: submit HubSpot form → receive email → click link → complete chat → verify contact updated + note created + owner assigned
- [ ] Admin dashboard deployed at `/admin` behind basic auth or HubSpot SSO
- [ ] Error monitoring (Sentry) wired up
- [ ] Rate limiting on `/api/ivy` to prevent abuse (recommend: 60 req/min per JWT)

---

## Open Questions for the Team

Ask the user before you start building:

1. **Final team member names** for routing (the prototype uses placeholders)
2. **Service area polygon** — what's the real geographic boundary for DQ?
3. **Confirm the 8 steps are final** — any cheat-sheet questions missing? Any to drop for brevity?
4. **Brand assets** — logo, final colors, any imagery to include
5. **Admin dashboard auth** — HubSpot SSO? Google Workspace SSO? Simple password?
6. **Should leads receive an SMS confirmation** after submission, or just wait for the designer's text?
7. **Retention policy** for uploaded photos — delete after 90 days? Keep indefinitely?
