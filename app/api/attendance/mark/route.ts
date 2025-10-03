import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { type AttendanceStatus, getJakartaDateInfo } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

const ALLOWED_STATUSES: AttendanceStatus[] = ["Hadir", "Izin"];

export async function POST(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  let requestedStatus: AttendanceStatus | undefined;
  try {
    const payload = await request.json();
    if (payload && typeof payload.status === "string") {
      requestedStatus = payload.status as AttendanceStatus;
    }
  } catch {
    // Ignore JSON parse errors and fallback to default status
  }

  const { isoDate, isSaturday } = getJakartaDateInfo();

  if (!isSaturday) {
    return NextResponse.json({ message: "Presensi hanya tersedia hari Sabtu" }, { status: 400 });
  }

  const status: AttendanceStatus = ALLOWED_STATUSES.includes(requestedStatus ?? "Hadir")
    ? (requestedStatus ?? "Hadir")
    : "Hadir";

  const existingRecord = await supabaseServerClient
    .from("attendance")
    .select("id")
    .eq("user_id", session.sub)
    .eq("date", isoDate)
    .maybeSingle();

  if (existingRecord.data) {
    return NextResponse.json({ message: "Kamu sudah absen hari ini" }, { status: 400 });
  }

  if (existingRecord.error && existingRecord.error.code !== "PGRST116") {
    return NextResponse.json({ message: "Gagal memeriksa presensi" }, { status: 500 });
  }

  const insertResult = await supabaseServerClient
    .from("attendance")
    .insert({
      user_id: session.sub,
      nisn: session.nisn,
      date: isoDate,
      status,
    })
    .select("id, date, status, created_at")
    .maybeSingle();

  if (insertResult.error || !insertResult.data) {
    return NextResponse.json({ message: "Gagal menyimpan presensi" }, { status: 500 });
  }

  return NextResponse.json({ record: insertResult.data }, { status: 201 });
}
