import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";

import { requireSession } from "@/lib/auth";
import { recordAuditLog, resolveAuditActor } from "@/lib/audit";
import { supabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { data, error } = await supabaseServerClient
    .from("users")
    .select("nisn, name, is_admin")
    .order("nisn", { ascending: true });

  if (error) {
    return NextResponse.json({ message: "Failed to export users" }, { status: 500 });
  }

  const rows = (data ?? []).map((user) => ({
    NISN: user.nisn,
    Nama: user.name ?? "",
    Token: "",
    Role: user.is_admin ? "Admin" : "Member",
  }));

  const csv = Papa.unparse(rows, {
    columns: ["NISN", "Nama", "Token", "Role"],
  });

  const filename = `users-${Date.now()}.csv`;

  const { actorName, actorNisn } = await resolveAuditActor(session.sub, session.nisn);
  await recordAuditLog({
    actorId: session.sub,
    actorName,
    actorNisn,
    action: "users_export",
    metadata: {
      count: rows.length,
    },
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
