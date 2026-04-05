# Deploy on Vercel (Step 9)

This app is a standard **Next.js 14 App Router** project. Vercel runs `next build` and hosts the serverless/Node routes automatically.

## 1. Put the code on Git

Push this repository to GitHub, GitLab, or Bitbucket (Vercel needs a remote to import, unless you use the CLI only).

## 2. Create a Vercel project

1. Open [vercel.com](https://vercel.com) → **Add New…** → **Project**.
2. **Import** your Git repository.
3. **Framework Preset:** Next.js (auto-detected).
4. **Root Directory:** repository root (leave default).
5. **Build Command:** `next build` (default).
6. **Output:** leave default (Vercel handles Next.js).

Do **not** commit `.env.local`; configure secrets in the Vercel dashboard instead.

## 3. Environment variables

In **Project → Settings → Environment Variables**, add every variable you use locally (see `.env.local.example`). Use at least **Production**; add **Preview** if you want Preview deployments to work (recommended for testing auth before promoting to production).

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same as local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as local |
| `NEXT_PUBLIC_APP_URL` | **Production:** `https://<your-project>.vercel.app` or your custom domain — **no trailing slash** |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional; only if your code uses it server-side |
| `ANTHROPIC_API_KEY` | Server-only; required for `/assistant` |
| `ANTHROPIC_MODEL` | Optional |
| Stripe / Resend | When you enable those features |

**Important:** After changing env vars, trigger a **Redeploy** (Deployments → … → Redeploy) so the new values apply.

## 4. Supabase Auth URLs (required for login)

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**:

1. **Site URL**  
   Set to your production origin, e.g. `https://<your-project>.vercel.app` (or your custom domain).

2. **Redirect URLs**  
   Add:

   - `https://<your-project>.vercel.app/auth/callback`  
   - If you use a **custom domain**, add `https://yourdomain.com/auth/callback` as well.

3. **Preview deployments** (optional)  
   For each Vercel Preview URL you use for real sign-in tests, add that origin’s callback, e.g.  
   `https://<branch>-<team>.vercel.app/auth/callback`  
   (Supabase does not support a single wildcard for all `*.vercel.app` URLs; add the ones you need.)

`NEXT_PUBLIC_APP_URL` in Vercel must match the URL users actually open (same scheme and host), because it is used for auth callback links.

## 5. Deploy

- **Git:** Pushing to the connected branch triggers a deployment.
- **CLI:** From the project folder (after `npm i -g vercel` or `npx vercel`):

  ```bash
  npx vercel        # preview
  npx vercel --prod # production
  ```

Link the folder once with `npx vercel link` if prompted.

## 6. Custom domain (optional)

**Project → Settings → Domains** → add your domain and follow DNS instructions. Update Supabase **Site URL** and **Redirect URLs** to include `https://yourdomain.com` and `https://yourdomain.com/auth/callback`.

## 7. API routes & limits

- `/api/ai` uses the Node runtime (`maxDuration` is set in code). On **Hobby**, function duration is limited; upgrade if Claude calls time out on large prompts.
- Ensure `ANTHROPIC_API_KEY` is set in Vercel for the Assistant page to work in production.

## Checklist

- [ ] All required env vars copied into Vercel (Production + Preview if needed)
- [ ] `NEXT_PUBLIC_APP_URL` matches the live site URL (no trailing slash)
- [ ] Supabase Site URL + `/auth/callback` redirect URLs updated for production (and previews if used)
- [ ] Redeploy after env changes
- [ ] Smoke test: sign in, open dashboard, open Assistant (if using AI)
