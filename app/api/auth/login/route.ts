import { NextRequest, NextResponse } from "next/server";

import { createSessionResponse } from "@/lib/auth";
import { isRateLimited, resetRateLimit } from "@/lib/rate-limit";
import { supabaseServerClient } from "@/lib/supabase";
import { verifyToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  const { nisn, token } = await request.json();

  if (typeof nisn !== "string" || typeof token !== "string") {
    return NextResponse.json(
      { message: "NISN and token are required" },
      { status: 400 }
    );
  }

  if (token.length < 8) {
    return NextResponse.json(
      { message: "Token must be at least 8 characters" },
      { status: 400 }
    );
  }

  const identifier =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    request.headers.get("cf-connecting-ip") ??
    "unknown";

  if (isRateLimited(identifier)) {
    return NextResponse.json(
      { message: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const { data: user, error } = await supabaseServerClient
    .from("users")
    .select("id, nisn, token_hash, name, is_admin")
    .eq("nisn", nisn)
    .maybeSingle();

  if (error || !user || !user.token_hash) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await verifyToken(token, user.token_hash);

  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }

  resetRateLimit(identifier);

  const response = NextResponse.json({
    message: "Login successful",
    user: {
      id: user.id,
      nisn: user.nisn,
      name: user.name,
      is_admin: user.is_admin,
    },
  });

  return createSessionResponse({
    payload: { sub: user.id, nisn: user.nisn, is_admin: user.is_admin },
    response,
  });
}
