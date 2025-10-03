import { NextRequest, NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { isRateLimited, registerFailedAttempt, resetRateLimit } from "@/lib/rate-limit";
import { supabaseServerClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  const { adminId, password } = await request.json();

  if (typeof adminId !== "string" || typeof password !== "string") {
    return NextResponse.json({ message: "Admin ID and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
  }

  const identifier =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";

  const rateLimit = await isRateLimited(identifier);

  if (rateLimit.blocked) {
    return NextResponse.json(
      {
        message: "Too many admin login attempts. Please try again later.",
        retryAfter: rateLimit.retryAfter,
      },
      { status: 429 }
    );
  }

  const { data: user, error } = await supabaseServerClient
    .from("users")
    .select("id, nisn, token_hash, name, is_admin")
    .eq("nisn", adminId)
    .eq("is_admin", true)
    .maybeSingle();

  if (error || !user || !user.token_hash) {
    await registerFailedAttempt(identifier);
    return NextResponse.json({ message: "Invalid admin credentials" }, { status: 401 });
  }

  const matches = await verifyToken(password, user.token_hash);

  if (!matches) {
    await registerFailedAttempt(identifier);
    return NextResponse.json({ message: "Invalid admin credentials" }, { status: 401 });
  }

  await resetRateLimit(identifier);

  const response = NextResponse.json({
    message: "Admin login successful",
    user: {
      id: user.id,
      adminId: user.nisn,
      name: user.name,
      is_admin: user.is_admin,
    },
  });

  return createSessionResponse({
    payload: { sub: user.id, nisn: user.nisn, is_admin: true },
    response,
  });
}
