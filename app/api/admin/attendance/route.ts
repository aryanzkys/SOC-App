import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { type AttendanceStatus } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const result = await supabaseServerClient
    .from("attendance")
    .select("id, user_id, nisn, status, date, created_at, users(name)")
    .order("date", { ascending: false });

  if (result.error) {
    return NextResponse.json({ message: "Gagal mengambil data presensi" }, { status: 500 });
  }

  type AttendanceRow = {
    id: string;
    user_id: string;
    nisn: string;
    status: AttendanceStatus;
    date: string;
    created_at: string;
    users: { name: string | null } | { name: string | null }[] | null;
  };

  const rows = (result.data ?? []) as AttendanceRow[];
  const records = rows.map(({ users, ...rest }) => {
    const relatedUser = Array.isArray(users) ? users[0] ?? null : users;
    return {
      ...rest,
      name: relatedUser?.name ?? null,
    };
  });

  return NextResponse.json({ records });
}
