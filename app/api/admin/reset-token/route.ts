import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { recordAuditLog, resolveAuditActor } from "@/lib/audit";
import { supabaseServerClient } from "@/lib/supabase";
import { hashToken } from "@/lib/token";

export async function PATCH(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { userId, newToken } = await request.json();

  if (typeof userId !== "string") {
    return NextResponse.json({ message: "userId is required" }, { status: 400 });
  }

  if (typeof newToken !== "string" || newToken.length < 8) {
    return NextResponse.json(
      { message: "New token must be at least 8 characters" },
      { status: 400 }
    );
  }

  const newHash = await hashToken(newToken);

  const { error } = await supabaseServerClient
    .from("users")
    .update({ token_hash: newHash })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ message: "Failed to reset token" }, { status: 500 });
  }

  const { actorName, actorNisn } = await resolveAuditActor(session.sub, session.nisn);
  await recordAuditLog({
    actorId: session.sub,
    actorName,
    actorNisn,
    action: "token_reset",
    metadata: { userId },
  });

  return NextResponse.json({ message: "Token reset" });
}
