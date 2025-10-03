import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";
import { hashToken } from "@/lib/token";

export async function POST(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { nisn, token, name, isAdmin = false } = await request.json();

  if (typeof nisn !== "string" || nisn.trim().length === 0) {
    return NextResponse.json(
      { message: "NISN is required" },
      { status: 400 }
    );
  }

  if (typeof token !== "string" || token.length < 8) {
    return NextResponse.json(
      { message: "Token must be at least 8 characters" },
      { status: 400 }
    );
  }

  const tokenHash = await hashToken(token);

  const { data, error } = await supabaseServerClient
    .from("users")
    .insert({
      nisn,
      token_hash: tokenHash,
      name: typeof name === "string" ? name : null,
      is_admin: Boolean(isAdmin),
    })
    .select("id, nisn, name, is_admin")
    .single();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message =
      status === 409 ? "User with this NISN already exists" : "Failed to create user";
    return NextResponse.json({ message }, { status });
  }

  return NextResponse.json({
    message: "User created",
    user: data,
  });
}
