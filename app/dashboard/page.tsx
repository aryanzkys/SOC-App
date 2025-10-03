import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getSessionFromCookies } from "@/lib/auth";
import { getJakartaDateInfo } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Dashboard | SOC App",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  // Ambil data user
  const { data: userRecord } = await supabaseServerClient
    .from("users")
    .select("name, nisn, is_admin")
    .eq("id", session.sub)
    .maybeSingle();

  const { isoDate, isSaturday, readableDate } = getJakartaDateInfo();

  // Cek presensi hari ini
  const todayResult = await supabaseServerClient
    .from("attendance")
    .select("id, date, status, created_at, nisn")
    .eq("user_id", session.sub)
    .eq("date", isoDate)
    .maybeSingle();

  const todayRecord =
    todayResult.error && todayResult.error.code !== "PGRST116"
      ? null
      : todayResult.data
      ? {
          ...todayResult.data,
          nisn: todayResult.data.nisn ?? (userRecord?.nisn ?? session.nisn),
        }
      : null;

  // Ambil riwayat 10 terakhir
  const historyResult = await supabaseServerClient
    .from("attendance")
    .select("id, date, status, created_at, nisn")
    .eq("user_id", session.sub)
    .order("date", { ascending: false })
    .limit(10);

  const attendanceHistory =
    (historyResult.data?.map((record) => ({
      ...record,
      nisn: record.nisn ?? (userRecord?.nisn ?? session.nisn),
    })) ?? []);

  // Hitung statistik presensi sederhana
  const totalHadir = attendanceHistory.filter((r) => r.status === "Hadir").length;
  const totalAbsen = attendanceHistory.filter((r) => r.status === "Absen").length;
  const totalPertemuan = attendanceHistory.length;
  const persentase =
    totalPertemuan > 0
      ? ((totalHadir / totalPertemuan) * 100).toFixed(1) + "%"
      : "0%";

  const stats = [
    {
      title: "Total Hadir",
      value: totalHadir.toString(),
      note: "Jumlah pertemuan yang diikuti",
    },
    {
      title: "Total Absen",
      value: totalAbsen.toString(),
      note: "Jumlah pertemuan yang terlewat",
    },
    {
      title: "Kehadiran",
      value: persentase,
      note: "Persentase kehadiranmu",
    },
  ];

  return (
    <DashboardView
      user={{
        name: userRecord?.name ?? null,
        nisn: userRecord?.nisn ?? session.nisn,
        is_admin: Boolean(userRecord?.is_admin ?? session.is_admin),
      }}
      stats={stats}
      attendance={{
        isSaturday,
        todayRecord,
        todayLabel: readableDate,
        history: attendanceHistory,
      }}
    />
  );
}
