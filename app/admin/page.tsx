import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminOverview } from "@/components/admin/panel/admin-overview";
import { getSessionFromCookies } from "@/lib/auth";
import { fetchAuditLogs } from "@/lib/audit";
import { getJakartaDateInfo } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Admin Panel | SOC App",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.is_admin) {
    redirect("/dashboard");
  }

  const [usersCountResult, adminsCountResult] = await Promise.all([
    supabaseServerClient.from("users").select("id", { count: "exact", head: true }),
    supabaseServerClient
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true),
  ]);

  const totalUsers = usersCountResult.count ?? 0;
  const adminUsers = adminsCountResult.count ?? 0;

  const nowJakarta = new Date();
  const startOfWindow = new Date(nowJakarta);
  startOfWindow.setDate(startOfWindow.getDate() - 6);
  const startDate = startOfWindow.toISOString().slice(0, 10);

  const [{ data: weeklyRows }, { data: recentRows }] = await Promise.all([
    supabaseServerClient
      .from("attendance")
      .select("status")
      .gte("date", startDate),
    supabaseServerClient
      .from("attendance")
      .select("id, nisn, status, date, created_at, users(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const weeklyBreakdownMap = new Map<string, number>();
  (weeklyRows ?? []).forEach((row) => {
    const status = row.status as string;
    weeklyBreakdownMap.set(status, (weeklyBreakdownMap.get(status) ?? 0) + 1);
  });

  const weeklyBreakdown = Array.from(weeklyBreakdownMap.entries()).map(([status, count]) => ({
    status,
    count,
  }));

  const attendanceThisWeek = (weeklyRows ?? []).length;
  const hadirCount = weeklyBreakdownMap.get("Hadir") ?? 0;
  const hadirRate = attendanceThisWeek === 0 ? 0 : (hadirCount / attendanceThisWeek) * 100;

  type RecentRow = {
    id: string;
    nisn: string;
    status: string;
    date: string;
    created_at: string;
    users: { name: string | null } | { name: string | null }[] | null;
  };

  const recentAttendance = ((recentRows ?? []) as RecentRow[]).map((row) => ({
    id: row.id,
    nisn: row.nisn,
    status: row.status,
    date: row.date,
    created_at: row.created_at,
    name: Array.isArray(row.users) ? row.users[0]?.name ?? null : row.users?.name ?? null,
  }));

  const auditLogsRaw = await fetchAuditLogs(8);
  const auditLogs = auditLogsRaw.map((log) => ({
    id: log.id,
    actor_name: log.actor_name,
    actor_nisn: log.actor_nisn,
    action: log.action,
    metadata: log.metadata,
    created_at: log.created_at,
  }));

  const { readableDate } = getJakartaDateInfo();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">{readableDate}</p>
        <h1 className="text-4xl font-semibold text-foreground">SOC Admin Overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor kesehatan data presensi dan aktivitas administrasi dalam satu layar.
        </p>
      </div>
      <AdminOverview
        stats={{ totalUsers, adminUsers, attendanceThisWeek, hadirRate }}
        weeklyBreakdown={weeklyBreakdown}
        recentAttendance={recentAttendance}
        auditLogs={auditLogs}
      />
    </div>
  );
}
