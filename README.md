# SMAN ESI Olympiad Club Attendance Platform

SOC App is a secure attendance and member management system for the SMAN ESI Olympiad Club. It combines a Next.js App Router frontend with Supabase for persistence, hardened authentication, and Netlify hosting.

## ✨ Features

- **Secure student login** with hashed tokens, Supabase-backed rate limiting, and signed HTTP-only cookies.
- **Attendance workflows** optimised for Saturday club sessions with timezone-aware validation.
- **Admin tooling** for importing members, rotating tokens, auditing privileged actions, and uploading attendance CSVs safely.
- **Royal Red design system** driven by reusable tokens (`design/tokens.css`) and Tailwind.
- **Production-ready pipeline**: Netlify deploys with strict security headers, Lighthouse quality gates, and GitHub Actions CI (lint ➝ test ➝ build).

## 🛠️ Local development

1. **Install dependencies**

	```bash
	npm install
	```

2. **Copy the environment template**

	```bash
	cp .env.local.example .env.local
	```

	Fill in Supabase credentials and a strong `JWT_SECRET`.

3. **Run database migrations**

	```bash
	npx supabase db push
	```

	The `supabase/migrations` directory keeps schema changes under version control.

4. **Start the dev server**

	```bash
	npm run dev
	```

	Visit [http://localhost:3000](http://localhost:3000) to access the app.

5. **Execute the quality suite**

	```bash
	npm run lint
	npm run test
	npm run build
	```

## 🔐 Environment variables

| Variable | Description | Netlify scope |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client-side URL for Supabase | Required
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | Required
| `SUPABASE_URL` | Server-side Supabase URL (usually same as public) | Required
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key used only in server functions | Required (never expose publicly)
| `JWT_SECRET` | Secret used to sign member sessions | Required
| `NEXT_PUBLIC_APP_URL` | Base URL of the deployed site | Optional (defaults to Netlify URL)

In Netlify, open **Site settings → Environment variables** and mirror the values from `.env.local`. Redeploy to apply changes.

## 🚀 Deployment workflow

1. **Continuous Integration** (`.github/workflows/ci.yml`)
	- Runs linting, Jest integration tests, and a production build on every push/PR.
	- Opens/updates a `ci-failure` GitHub issue when the pipeline breaks.

2. **Netlify configuration** (`netlify.toml`)
	- Uses `@netlify/plugin-nextjs` to optimise routing and image handling.
	- Enforces security headers (CSP, X-Frame-Options, X-XSS-Protection, Referrer-Policy).
	- Runs the Lighthouse plugin as a quality gate (`.lighthouse` reports stored per deploy).

3. **Recommended Netlify settings**
	- Connect the repository: `https://github.com/aryanzkys/SOC-App.git` on branch `main`.
	- Build command: `npm run build` • Publish directory: `.next`
	- Enable automatic deploys on push to `main` and request deploy notifications (Slack/email) for failures.

4. **First deployment checklist**
	- Verify the site is live at [https://smanesiolympiadclub.netlify.app](https://smanesiolympiadclub.netlify.app).
	- Confirm `/api/health` returns `{ "status": "ok" }`.
	- Inspect Netlify deploy logs for Lighthouse scores (fix regressions before promoting to production).

## 📂 Project structure highlights

```
app/
  api/              # API routes (Next.js App Router)
  (routes)/         # UI routes and layouts
design/tokens.css   # Royal Red theme design tokens
lib/                # Auth, Supabase, attendance utilities
supabase/migrations # SQL migrations tracked in Git
tests/              # Jest integration tests for critical flows
```

## 🧪 Tests & monitoring

- `tests/api/login.test.ts` validates secure login flow.
- `tests/api/attendance-mark.test.ts` ensures Saturday attendance workflow.
- `tests/api/reset-token.test.ts` covers administrative token rotation.
- Netlify runs Lighthouse via plugin and blocks regressions.
- CI raises GitHub issues with label `ci-failure` whenever a build/test fails.

## 📄 Additional docs

- [`SECURITY.md`](SECURITY.md) — full hardening checklist.
- [`.env.local.example`](.env.local.example) — environment template.
- [`design/tokens.css`](design/tokens.css) — shared design primitives.

For questions or new feature requests, open an issue or reach out to the maintainers.
