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

  const { data: userRecord } = await supabaseServerClient
    .from("users")
    .select("name, nisn, is_admin")
    .eq("id", session.sub)
    .maybeSingle();

  const { isoDate, isSaturday, readableDate } = getJakartaDateInfo();

  const todayResult = await supabaseServerClient
    .from("attendance")
    .select("id, date, status, created_at, nisn")
    .eq("user_id", session.sub)
    .eq("date", isoDate)
    .maybeSingle();

  const todayRecord = todayResult.error && todayResult.error.code !== "PGRST116"
    ? null
    : todayResult.data
      ? {
          ...todayResult.data,
          nisn: todayResult.data.nisn ?? (userRecord?.nisn ?? session.nisn),
        }
      : null;

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

  const stats = [
    {
      title: "Posture",
      value: "99.2%",
      note: "Current detection coverage across SOC surfaces",
    },
    {
      title: "Response",
      value: "2m 18s",
      note: "Median containment time in the last 24 hours",
    },
    {
      title: "Compliance",
      value: "98",
      note: "Aligned with the SOC gold-standard operational index",
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
