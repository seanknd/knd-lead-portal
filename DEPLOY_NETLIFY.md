# Deploying the K&D Lead Portal to Netlify

A step-by-step guide for getting this demo onto a shareable Netlify URL,
with Ivy (the Claude AI chat) still working end-to-end.

**Time estimate:** 15–25 minutes, mostly spent waiting on the first build.

---

## What you need before you start

1. A **GitHub account** (free at github.com). Netlify deploys from GitHub.
2. A **Netlify account** (free at netlify.com). Sign up with your GitHub login for the smoothest experience.
3. Your **Anthropic API key**. This is what powers Ivy. Get one at console.anthropic.com → Settings → API Keys → Create Key.
4. **Git installed** on your laptop. If you already have it, run `git --version` in PowerShell to check. If not, install from git-scm.com.

You do NOT need HubSpot credentials for the demo. The portal will run in "dry-run" mode without them — HubSpot push endpoints log the payload and return OK.

---

## Step 1 — Push the project to GitHub

From PowerShell, inside the project folder:

```powershell
cd "C:\Users\Sean Laux\Downloads\Lead Prequalification Form\design_handoff_lead_portal"

# Initialize git if it isn't already
git init
git add .
git commit -m "Initial K&D portal demo"
```

Now create an empty repo on github.com (click the "+" in the top right → New repository → name it `knd-lead-portal` → leave everything else blank → Create). GitHub will show you two lines to copy:

```powershell
git remote add origin https://github.com/YOUR-USERNAME/knd-lead-portal.git
git branch -M main
git push -u origin main
```

Refresh the GitHub page — you should see all the project files.

> **Important:** `.env.local` is already in `.gitignore`, so your API keys will NOT be uploaded. Good.

---

## Step 2 — Connect Netlify to the GitHub repo

1. Go to **app.netlify.com** and log in with GitHub.
2. Click **"Add new site" → "Import an existing project"**.
3. Choose **GitHub** as the source.
4. Authorize Netlify to read your repositories if prompted.
5. Pick the `knd-lead-portal` repo from the list.

Netlify will auto-detect the Next.js setup. You'll see:

- **Build command:** `npm run build` (leave as detected)
- **Publish directory:** `.next` (leave as detected)
- **Branch to deploy:** `main`

Do **NOT** click "Deploy" yet. First, scroll down and click **"Add environment variables"** (or find "Show advanced" → "New variable").

---

## Step 3 — Add the environment variables

Netlify needs to know your secrets. Add these four (copy the names exactly):

| Variable                  | Value                                           |
|---------------------------|-------------------------------------------------|
| `ANTHROPIC_API_KEY`       | `sk-ant-...` (your real key from Anthropic)    |
| `LINK_SIGNING_SECRET`     | Any long random string. Run `openssl rand -base64 32` in PowerShell, or paste any 40+ character string you mash out. |
| `PORTAL_BASE_URL`         | `https://your-site.netlify.app` — Netlify will tell you the URL once deployed. You can leave this blank for the first deploy and set it after. |
| `ADMIN_PASSWORD`          | Whatever password you want to protect the `/admin` route with. |

Leave HubSpot and R2 variables unset for the demo. The app handles that gracefully.

Now click **"Deploy site"**.

---

## Step 4 — Wait for the build

First build usually takes 2–4 minutes. You'll see a log streaming.

When it's done, Netlify gives you a URL like `https://chipper-babbage-4b2c1d.netlify.app`. Click it.

You should see the K&D demo portal with Sarah's backyard remodel pre-filled.

If the build fails, the most common causes are:
- Missing `ANTHROPIC_API_KEY` env var → Ivy's chat 500s but the page loads (fallback scripted bubbles kick in)
- A typo in an env var name → Go to **Site settings → Environment variables** and fix
- Node version mismatch → Already pinned to Node 20 in `netlify.toml`, so this shouldn't happen

---

## Step 5 — Set your custom URL (optional but looks nicer)

To share a cleaner URL:

1. In Netlify → **Domain settings → Options → Edit site name**.
2. Change `chipper-babbage-4b2c1d` to something like `knd-portal-demo`.
3. Your URL becomes `https://knd-portal-demo.netlify.app`.
4. Go back to **Environment variables** and update `PORTAL_BASE_URL` to match, then trigger a redeploy (Deploys → Trigger deploy).

---

## What to share with your reviewer

Send them three links:

1. **The demo chat** — `https://knd-portal-demo.netlify.app/` (Sarah, backyard remodel)
2. **The admin inbox** — `https://knd-portal-demo.netlify.app/admin` (shows four seeded leads + anything new they complete)
3. **The email preview** — `https://knd-portal-demo.netlify.app/email-preview` (what the lead gets from HubSpot)

Tell them: "Complete the chat on link 1. Then check link 2 to see how it shows up on our side."

---

## What's NOT in the demo yet (and what "production" means)

The Netlify demo is wired for clicking through, but a few things still need real infrastructure before it goes live at `portal.kndlandscaping.com`:

- **Lead storage:** currently in-memory, resets every deploy. Production needs Postgres, Supabase, or a HubSpot custom object.
- **Photo uploads:** currently echoes fake URLs. Production needs Cloudflare R2 or AWS S3 with signed uploads.
- **HubSpot push:** runs in dry-run mode without the private-app token. Once that's set, the portal writes contact properties, notes, and owner assignments back to HubSpot.
- **Admin auth:** protected by a simple password env var for the demo. Production should use HubSpot SSO, Clerk, or equivalent.

None of that blocks the demo — the chat and routing all work fully.

---

## If something breaks

- **Check the Netlify deploy log** first (Deploys → click the failed deploy → Deploy log).
- **Ivy returns generic bubbles instead of natural responses:** `ANTHROPIC_API_KEY` is missing or invalid. Fix in env vars, redeploy.
- **"This link has expired" on /s/...:** the token signing secret doesn't match what was used to mint the link. In practice this only happens if you generate a link on localhost and open it on Netlify, or vice versa. For the demo, just use the root `/` URL.
- **Admin inbox is empty after a demo lead is submitted:** expected — the in-memory store resets on cold-starts. Submit, then open admin in the same session.

---

## Pushing updates after changes

Any git push to `main` triggers an automatic Netlify redeploy:

```powershell
git add .
git commit -m "Describe what changed"
git push
```

Netlify emails you when the deploy is live (usually 90 seconds).
