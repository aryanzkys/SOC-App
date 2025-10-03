import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PresensiPanel } from "@/components/admin/presensi/presensi-panel";
import { getSessionFromCookies } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Manajemen Presensi | SOC App",
};

export const dynamic = "force-dynamic";

export default async function AdminPresensiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (!session.is_admin) {
    redirect("/dashboard");
  }

  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  const defaultStart = (typeof resolvedParams.startDate === "string" && resolvedParams.startDate.length)
    ? resolvedParams.startDate
    : start.toISOString().slice(0, 10);
  const defaultEnd = (typeof resolvedParams.endDate === "string" && resolvedParams.endDate.length)
    ? resolvedParams.endDate
    : today.toISOString().slice(0, 10);

  const params = new URLSearchParams();
  params.set("startDate", defaultStart);
  params.set("endDate", defaultEnd);

  if (typeof resolvedParams.nisn === "string" && resolvedParams.nisn.trim()) {
    params.set("nisn", resolvedParams.nisn.trim());
  }
  if (typeof resolvedParams.status === "string" && resolvedParams.status.trim()) {
    params.set("status", resolvedParams.status.trim());
  }

  const { data, error } = await supabaseServerClient
    .from("attendance")
    .select("id, user_id, nisn, status, date, created_at, users(name)")
    .gte("date", defaultStart)
    .lte("date", defaultEnd)
    .order("date", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error("Gagal mengambil data presensi");
  }

  type AttendanceRow = {
    id: string;
    user_id: string;
    nisn: string;
    status: "Hadir" | "Izin" | "Alfa";
    date: string;
    created_at: string;
    users: { name: string | null } | { name: string | null }[] | null;
  };

  const initialData = ((data ?? []) as AttendanceRow[]).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    nisn: row.nisn,
    status: row.status,
    date: row.date,
    created_at: row.created_at,
    name: Array.isArray(row.users) ? row.users[0]?.name ?? null : row.users?.name ?? null,
  }));

  return (
    <PresensiPanel initialData={initialData} initialStartDate={defaultStart} initialEndDate={defaultEnd} />
  );
}
