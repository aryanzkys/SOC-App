import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  const history = await supabaseServerClient
    .from("attendance")
    .select("id, date, status, created_at")
    .eq("user_id", session.sub)
    .order("date", { ascending: false })
    .limit(10);

  if (history.error) {
    return NextResponse.json({ message: "Gagal mengambil riwayat presensi" }, { status: 500 });
  }

  return NextResponse.json({ records: history.data ?? [] });
}
