# Security Checklist

This document tracks the core hardening steps applied to the SOC App deployment.

## Application hardening

- [x] Enforce server-side validation for authentication (bcrypt-based token hashes).
- [x] Persist and hash login rate limits using Supabase (`login_throttle` table).
- [x] Secure cookies with `HttpOnly`, `SameSite=Strict`, and `Secure` (production).
- [x] Validate attendance imports with timezone-aware parsing and NISN sanitization.
- [x] Sanitize admin user imports (token length, NISN format, duplicate protection).
- [x] Audit all privileged actions (user import, token reset, attendance import).
- [x] Reject attendance submissions outside Saturday (Asia/Jakarta) window.
- [x] Return structured error messages for bad credentials and lockouts.

## Platform & transport

- [x] Force HTTPS via Netlify (automatic) and secure cookies.
- [x] Set CSP, X-Frame-Options, X-XSS-Protection, and Referrer-Policy headers.
- [x] Provide health check endpoint at `/api/health` for uptime probing.
- [x] Enable Lighthouse quality gate via Netlify plugin.
- [x] Configure CI to fail fast and raise alerts on build or test failures.

## Secrets & environment

- [x] Store Supabase service role keys in environment variables (never committed).
- [x] Document required environment variables in `.env.local.example`.
- [x] Keep JWT signing secret in environment variable (`JWT_SECRET`).

## Monitoring & response

- [x] GitHub Actions workflow opens tracker issues on failed pipelines.
- [x] Netlify deploy runs Lighthouse plugin and blocks regressions.
- [ ] Configure external alerting (Slack/Email) with project-specific credentials.

When additional controls are added (e.g., runtime application security monitoring, WAF rules), update this checklist accordingly.
