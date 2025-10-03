import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";
import { hashToken, verifyToken } from "@/lib/token";

export async function PATCH(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  const { currentToken, newToken } = await request.json();

  if (typeof currentToken !== "string" || typeof newToken !== "string") {
    return NextResponse.json(
      { message: "Current and new tokens are required" },
      { status: 400 }
    );
  }

  if (newToken.length < 8) {
    return NextResponse.json(
      { message: "New token must be at least 8 characters" },
      { status: 400 }
    );
  }

  const { data: user, error } = await supabaseServerClient
    .from("users")
    .select("token_hash")
    .eq("id", session.sub)
    .maybeSingle();

  if (error || !user || !user.token_hash) {
    return NextResponse.json(
      { message: "Unable to verify current token" },
      { status: 400 }
    );
  }

  const matches = await verifyToken(currentToken, user.token_hash);

  if (!matches) {
    return NextResponse.json(
      { message: "Current token is incorrect" },
      { status: 401 }
    );
  }

  const newHash = await hashToken(newToken);
  const { error: updateError } = await supabaseServerClient
    .from("users")
    .update({ token_hash: newHash })
    .eq("id", session.sub);

  if (updateError) {
    return NextResponse.json(
      { message: "Failed to update token" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Token updated successfully" });
}
