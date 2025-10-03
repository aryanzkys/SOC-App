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

  const searchParams = request.nextUrl.searchParams;
  const nisnQuery = searchParams.get("nisn");
  const statusQuery = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let query = supabaseServerClient
    .from("attendance")
    .select("id, user_id, nisn, status, date, created_at, users(name)")
    .order("date", { ascending: false });

  if (nisnQuery) {
    query = query.ilike("nisn", `%${nisnQuery.trim()}%`);
  }

  if (statusQuery && ["Hadir", "Izin", "Alfa"].includes(statusQuery)) {
    query = query.eq("status", statusQuery as AttendanceStatus);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const result = await query;

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
