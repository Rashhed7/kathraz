# Deploying KATHRAZ to Cloudflare (Frontend + Backend in one Worker)

Your entire site — the React storefront **and** the Express API — runs on
Cloudflare Workers with static assets. Free tier is enough to start.

---

## What was changed in this repo

| File | Purpose |
|---|---|
| `server/app.js` | **NEW** — the Express app, exported so both runtimes can use it |
| `server/server.js` | Slimmed to a thin local entry (behavior unchanged) |
| `worker/index.js` | **NEW** — Cloudflare Worker entry (`cloudflare:node` httpServerHandler) |
| `wrangler.jsonc` | **NEW** — Workers config: serves `dist/` as CDN assets, routes `/api/*` to Express |
| `package.json` | Added `deploy`, `preview`, `cf-typegen` scripts + `wrangler` devDependency |

`npm run dev` and `npm start` work exactly as before.

---

## One-time setup (≈10 minutes)

### 1. Create your Cloudflare account
Go to **https://dash.cloudflare.com/sign-up** — just an email + password. No card needed.

### 2. Login from your terminal
```bash
npx wrangler login
```
A browser window opens → click **Allow**.

### 3. Add your secrets
Run each line once and paste the value when prompted (copy from your local `.env`):
```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put RAZORPAY_KEY_ID
npx wrangler secret put RAZORPAY_KEY_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
```
> ⚠️ Use the **session-pooler** DATABASE_URL (port 5432) — it works from any IP.
> The direct connection (port 5432 restricted to your IP) would fail on Cloudflare.

> ℹ️ `DATABASE_URL` is now only a fallback on the Worker — queries actually go
> through **Hyperdrive** (Cloudflare's Postgres proxy/pooler), which was created
> with your Supabase connection string via `wrangler hyperdrive create` and is
> bound in `wrangler.jsonc`. It fixes pg's TLS handshake on Workers and pools
> connections for you.

### 4. Deploy 🚀
```bash
npm run deploy
```
First deploy asks a couple of questions (create the Worker, etc.) — answer Yes.
You'll get a URL like `https://kathraz.<your-subdomain>.workers.dev`.

### 5. Seed the production database (first deploy only)
The Worker does **not** run `initDatabase()` on requests (correct — it would
re-run on every cold start). Run it once from your machine:
```bash
# from your local dev shell, with your .env pointing at Supabase
node -e "require('./server/database').initDatabase().then(()=>{console.log('DB ready');process.exit(0)})"
```
If you already used the site on Render, your Supabase DB is already seeded — skip this.

---

## Everyday deploys

```bash
npm run deploy        # build + push (about a minute)
npm run preview       # run the Workers runtime locally before deploying
```

## Custom domain (optional)
1. Buy a domain (Cloudflare Registrar sells at cost) or add your existing one.
2. Dashboard → your Worker → **Settings → Domains & Routes → Add → Custom domain** → `kathraz.com`.
DNS + HTTPS are automatic.

---

## Gotchas on the Workers runtime

| Issue | Status |
|---|---|
| Multer uploads (`/api/admin/upload`) | Should work via Node compat. **Test once after deploy** — if a big video upload fails, that route is the place to look. |
| Supabase Storage | Works — it's plain HTTPS from the Worker. |
| Razorpay / Google auth | Works (crypto + fetch are supported). |
| Cold starts | First request after idle has ~50–100 ms extra latency. Fine for a store. |
| Free tier limits | 100k requests/day, 10 GB static traffic/month. Plenty to launch. |
| `dist/` must exist | `npm run deploy` builds first — don't run `wrangler deploy` on a fresh clone without building. |

## Rollback plan
Your `render.yaml` still exists — if Cloudflare ever misbehaves, `git push` still
deploys the same app to Render as before. Nothing in the Render path was removed.
