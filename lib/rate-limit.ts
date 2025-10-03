import { createHash } from "crypto";

import { supabaseServerClient } from "@/lib/supabase";

const WINDOW_SECONDS = 5 * 60; // 5 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60; // 15 minutes

type RateLimitRow = {
  attempts: number;
  first_attempt_at: string | null;
  blocked_until: string | null;
};

function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier).digest("hex");
}

function nowUtc() {
  return new Date();
}

export async function isRateLimited(identifier: string) {
  const hashed = hashIdentifier(identifier);
  const { data } = await supabaseServerClient
    .from("login_throttle")
    .select("attempts, first_attempt_at, blocked_until")
    .eq("identifier", hashed)
    .maybeSingle();

  const row = (data ?? null) as RateLimitRow | null;

  if (!row) {
    return { blocked: false, identifier: hashed } as const;
  }

  const now = nowUtc();

  if (row.blocked_until) {
    const blockedUntil = new Date(row.blocked_until);
    if (blockedUntil.getTime() > now.getTime()) {
      const retryAfter = Math.ceil((blockedUntil.getTime() - now.getTime()) / 1000);
      return { blocked: true, identifier: hashed, retryAfter } as const;
    }
  }

  if (row.first_attempt_at) {
    const firstAttempt = new Date(row.first_attempt_at);
    if (now.getTime() - firstAttempt.getTime() > WINDOW_SECONDS * 1000) {
      await supabaseServerClient
        .from("login_throttle")
        .update({ attempts: 0, first_attempt_at: now.toISOString(), blocked_until: null })
        .eq("identifier", hashed);
      return { blocked: false, identifier: hashed } as const;
    }
  }

  return { blocked: (row.attempts ?? 0) >= MAX_ATTEMPTS, identifier: hashed } as const;
}

export async function registerFailedAttempt(identifier: string) {
  const hashed = hashIdentifier(identifier);
  const now = nowUtc();

  const { data } = await supabaseServerClient
    .from("login_throttle")
    .select("attempts, first_attempt_at")
    .eq("identifier", hashed)
    .maybeSingle();

  const row = (data ?? null) as RateLimitRow | null;

  let attempts = 1;
  let firstAttemptAt = now.toISOString();

  if (row?.first_attempt_at) {
    const firstAttempt = new Date(row.first_attempt_at);
    if (now.getTime() - firstAttempt.getTime() > WINDOW_SECONDS * 1000) {
      attempts = 1;
      firstAttemptAt = now.toISOString();
    } else {
      attempts = (row.attempts ?? 0) + 1;
      firstAttemptAt = firstAttempt.toISOString();
    }
  }

  let blockedUntil: string | null = null;
  if (attempts >= MAX_ATTEMPTS) {
    blockedUntil = new Date(now.getTime() + LOCKOUT_SECONDS * 1000).toISOString();
  }

  await supabaseServerClient.from("login_throttle").upsert({
    identifier: hashed,
    attempts,
    first_attempt_at: firstAttemptAt,
    blocked_until: blockedUntil,
  });

  return { attempts, blockedUntil, identifier: hashed } as const;
}

export async function resetRateLimit(identifier: string) {
  const hashed = hashIdentifier(identifier);
  await supabaseServerClient.from("login_throttle").delete().eq("identifier", hashed);
}
