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

  const searchParams = request.nextUrl.searchParams;
  const nisnQuery = searchParams.get("nisn");
  const statusQuery = searchParams.get("status");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  let query = supabaseServerClient
    .from("attendance")
    .select("nisn, status, date, users(name)")
    .order("date", { ascending: false });

  if (nisnQuery) {
    query = query.ilike("nisn", `%${nisnQuery.trim()}%`);
  }

  if (statusQuery) {
    query = query.eq("status", statusQuery);
  }

  if (startDate) {
    query = query.gte("date", startDate);
  }

  if (endDate) {
    query = query.lte("date", endDate);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ message: "Gagal mengekspor data" }, { status: 500 });
  }

  type AttendanceRow = {
    nisn: string;
    status: string;
    date: string;
    users: { name: string | null } | { name: string | null }[] | null;
  };

  const rows = ((data ?? []) as AttendanceRow[]).map((record) => ({
    NISN: record.nisn,
    Nama: Array.isArray(record.users) ? record.users[0]?.name ?? "" : record.users?.name ?? "",
    Tanggal: record.date,
    Status: record.status,
  }));

  const csv = Papa.unparse(rows, {
    columns: ["NISN", "Nama", "Tanggal", "Status"],
  });

  const filename = `attendance-${Date.now()}.csv`;

  const { actorName, actorNisn } = await resolveAuditActor(session.sub, session.nisn);
  await recordAuditLog({
    actorId: session.sub,
    actorName,
    actorNisn,
    action: "attendance_export",
    metadata: {
      count: rows.length,
      nisn: nisnQuery,
      status: statusQuery,
      startDate,
      endDate,
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
