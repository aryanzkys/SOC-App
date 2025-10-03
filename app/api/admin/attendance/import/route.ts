import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { recordAuditLog, resolveAuditActor } from "@/lib/audit";
import { type AttendanceStatus } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

const VALID_STATUS: AttendanceStatus[] = ["Hadir", "Izin", "Alfa"];

type ImportRow = {
  nisn: string;
  date: string;
  status: AttendanceStatus;
};

type ImportPayload = {
  records: ImportRow[];
};

export async function POST(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let payload: ImportPayload;

  try {
    payload = (await request.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    return NextResponse.json({ message: "No data to import" }, { status: 400 });
  }

  const sanitized = payload.records
    .map((record) => ({
      nisn: typeof record.nisn === "string" ? record.nisn.trim() : "",
      date: typeof record.date === "string" ? record.date.trim() : "",
      status: record.status,
    }))
    .filter((record) => record.nisn.length > 0 && record.date.length > 0 && VALID_STATUS.includes(record.status));

  if (sanitized.length === 0) {
    return NextResponse.json({ message: "No valid records" }, { status: 400 });
  }

  const uniqueNisn = [...new Set(sanitized.map((item) => item.nisn))];

  const { data: users } = await supabaseServerClient
    .from("users")
    .select("id, nisn, name")
    .in("nisn", uniqueNisn);

  const userMap = new Map((users ?? []).map((user) => [user.nisn, user] as const));

  const upsertRows = sanitized
    .map((row) => {
      const user = userMap.get(row.nisn);
      if (!user) return null;
      return {
        user_id: user.id,
        nisn: row.nisn,
        date: row.date,
        status: row.status,
      };
    })
    .filter(Boolean) as Array<{
      user_id: string;
      nisn: string;
      date: string;
      status: AttendanceStatus;
    }>;

  if (upsertRows.length === 0) {
    return NextResponse.json({ message: "No matching users for provided NISN" }, { status: 400 });
  }

  const { error } = await supabaseServerClient
    .from("attendance")
    .upsert(upsertRows, { onConflict: "user_id,date" });

  if (error) {
    return NextResponse.json({ message: "Failed to import attendance" }, { status: 500 });
  }

  const { actorName, actorNisn } = await resolveAuditActor(session.sub, session.nisn);
  await recordAuditLog({
    actorId: session.sub,
    actorName,
    actorNisn,
    action: "attendance_import",
    metadata: {
      received: payload.records.length,
      imported: upsertRows.length,
      unmatched: sanitized.length - upsertRows.length,
    },
  });

  return NextResponse.json({
    message: "Attendance import completed",
    imported: upsertRows.length,
    unmatched: sanitized.length - upsertRows.length,
  });
}
