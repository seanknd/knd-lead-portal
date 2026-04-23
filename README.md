# K&D Lead Prequalification Portal

A Next.js 14 app that turns a contact-form submission into a routed, qualified lead.
When a prospect fills out the K&D contact form, HubSpot sends them a follow-up email
with a signed portal link. The portal runs a conversational intake (powered by
Ivy, a Claude Haiku agent) that collects scope, budget, timeline, address, photos,
and phone — then computes routing server-side against the K&D cheat sheet and
drops the lead into the admin inbox + HubSpot.

Design reference files (the original static prototypes) live in `_design_reference/`.

## What's in the box

- `app/` — Next.js App Router pages and API routes
  - `app/page.tsx` — demo portal entry (for local testing)
  - `app/s/[token]/page.tsx` — signed-link route used in production
  - `app/admin/` — internal inbox dashboard
  - `app/email-preview/` — static preview of the follow-up email
  - `app/api/` — Ivy chat, submit, upload, intake webhook, HubSpot push
  - `app/lib/` — routing engine, Ivy prompts, JWT helpers, in-memory store
- `components/PortalChat.tsx` — the chat experience
- `components/KDLogo.tsx` — inline K&D wordmark (replace with real SVG when ready)
- `tailwind.config.ts` — K&D brand palette (Forest Thrive, Olive Integrity, etc.)

## Quick start

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Copy the env file and fill in the blanks**

   ```bash
   cp .env.example .env.local
   ```

   For local smoke testing you only need two values:

   - `LINK_SIGNING_SECRET` — generate one with `openssl rand -base64 32`
   - `ANTHROPIC_API_KEY` — optional. Without it, Ivy falls back to scripted
     bubbles so the flow still works end-to-end.

   `HUBSPOT_PRIVATE_APP_TOKEN` is also optional — leave it blank and the
   HubSpot push endpoint runs in dry-run mode (logs the payload, returns OK).

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit:

   - <http://localhost:3000> — demo portal (prefilled as Sarah / Aptos remodel)
   - <http://localhost:3000/admin> — admin inbox (seeded with 4 demo leads)
   - <http://localhost:3000/email-preview> — follow-up email reference

## Generating a real signed link

Once `LINK_SIGNING_SECRET` is set you can mint a token the same way HubSpot will:

```bash
curl -X POST http://localhost:3000/api/intake-webhook \
  -H "content-type: application/json" \
  -d '{
    "contactId": "12345",
    "firstName": "Sarah",
    "originalInquiry": "full backyard remodel in Aptos",
    "email": "sarah@example.com"
  }'
```

The response contains a URL like `http://localhost:3000/s/<jwt>` — open it to see
the portal rendered with the seeded lead context.

## Production notes

- **Lead store:** `app/lib/store.ts` is an in-memory `Map` keyed on
  `globalThis.__KND_LEAD_STORE`. It resets on every deploy. Swap it for a real
  database (Postgres, Supabase, HubSpot custom object) before going live.
- **Uploads:** `/api/upload` echoes fake URLs. Wire up R2 or S3 with signed
  uploads before production — the env file already has slots for the keys.
- **HubSpot push:** `/api/push-to-hubspot` runs in dry-run mode until
  `HUBSPOT_PRIVATE_APP_TOKEN` is set. The TODOs in that file mark the three
  real calls needed (PATCH contact properties, POST note, set owner).
- **Admin auth:** the `/admin` route is currently unauthenticated. Gate it
  behind HubSpot SSO, Clerk, or basic auth before exposing it publicly.
- **Routing:** `app/lib/routing.ts` is the source of truth. Business logic
  lives server-side so clients can't tamper with DQ outcomes. If the cheat
  sheet changes, edit that file and nothing else.

## Smoke-testing the routing engine

The routing logic encodes the K&D cheat sheet. You can exercise it manually
by completing the chat with these answers and confirming the admin inbox
shows the expected outcome:

| Scope              | Detail                     | Budget | Expected route                     |
|--------------------|----------------------------|--------|------------------------------------|
| Full yard remodel  | design + build             | $150k  | Design-Build — Rudy        |
| Drainage           | retaining wall             | $20k   | Res Lite — Kendel           |
| Commercial / HOA   | non-union maintenance      | $40k   | Biz Dev — Jamie              |
| Commercial / HOA   | union build                | $60k   | DQ (union conflict)                |
| Something else     | tree removal               | $8k    | DQ (scope + budget)                |
| Patio build        | outdoor kitchen            | $75k   | Design-Build — Megha          |

## Scripts

- `npm run dev` — start the dev server on port 3000
- `npm run build` — production build
- `npm start` — serve the production build
- `npm run lint` — Next.js lint
