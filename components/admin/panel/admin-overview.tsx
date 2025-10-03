"use client";

import { motion } from "framer-motion";
import { Activity, FileSpreadsheet, Users2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAttendanceDate, formatAttendanceDateTime } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import type { AuditAction } from "@/lib/audit";

export type AdminOverviewProps = {
  stats: {
    totalUsers: number;
    adminUsers: number;
    attendanceThisWeek: number;
    hadirRate: number;
  };
  weeklyBreakdown: Array<{ status: string; count: number }>;
  recentAttendance: Array<{
    id: string;
    nisn: string;
    name: string | null;
    status: string;
    date: string;
    created_at: string;
  }>;
  auditLogs: Array<{
    id: string;
    actor_name: string | null;
    actor_nisn: string | null;
    action: AuditAction;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
};

const actionCopy: Record<AuditAction, string> = {
  attendance_export: "Ekspor presensi",
  attendance_import: "Impor presensi",
  attendance_update: "Update presensi",
  users_export: "Ekspor users",
  users_import: "Impor users",
  token_reset: "Reset token",
  user_create: "Tambah user",
};

function statusColor(status: string) {
  switch (status) {
    case "Hadir":
      return "text-emerald-300";
    case "Izin":
      return "text-yellow-200";
    case "Alfa":
    default:
      return "text-red-200";
  }
}

export function AdminOverview({ stats, weeklyBreakdown, recentAttendance, auditLogs }: AdminOverviewProps) {
  return (
    <div className="space-y-12">
      <section>
        <motion.div
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            icon={<Users2 className="h-5 w-5 text-white/80" />}
            description={`${stats.adminUsers} admin aktif`}
          />
          <StatCard
            title="Admin Aktif"
            value={stats.adminUsers.toLocaleString()}
            icon={<Users2 className="h-5 w-5 text-white/80" />}
            description="Memiliki akses penuh ke panel"
          />
          <StatCard
            title="Presensi 7 Hari"
            value={stats.attendanceThisWeek.toLocaleString()}
            icon={<Activity className="h-5 w-5 text-white/80" />}
            description="Total rekaman minggu ini"
          />
          <StatCard
            title="Tingkat Kehadiran"
            value={`${stats.hadirRate.toFixed(1)}%`}
            icon={<FileSpreadsheet className="h-5 w-5 text-white/80" />}
            description="Rasio hadir terhadap total"
          />
        </motion.div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[32px] border-white/15 bg-white/10 shadow-[0_25px_70px_rgba(139,0,0,0.2)] backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-foreground">Distribusi Mingguan</CardTitle>
              <CardDescription>Trend status presensi selama 7 hari terakhir.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {weeklyBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada data presensi minggu ini.</p>
              ) : (
                <ul className="space-y-3">
                  {weeklyBreakdown.map((item) => (
                    <li key={item.status} className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
                      <span className={cn("font-semibold", statusColor(item.status))}>{item.status}</span>
                      <span className="font-mono text-foreground/80">{item.count.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[32px] border-white/15 bg-white/10 shadow-[0_25px_70px_rgba(139,0,0,0.2)] backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-foreground">Aktivitas Audit</CardTitle>
              <CardDescription>Jejak impor/ekspor terakhir oleh admin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada aktivitas terekam.</p>
              ) : (
                <ul className="space-y-4">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                      <p className="text-sm font-semibold text-foreground">
                        {log.actor_name ?? "Admin"}
                        {log.actor_nisn ? (
                          <span className="ml-2 text-xs text-foreground/50">({log.actor_nisn})</span>
                        ) : null}
                      </p>
                      <p className="text-sm text-muted-foreground">{actionCopy[log.action]}</p>
                      <p className="text-xs text-foreground/50">{formatAttendanceDateTime(log.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </section>

      <section>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Card className="rounded-[32px] border-white/15 bg-white/10 shadow-[0_25px_70px_rgba(139,0,0,0.2)] backdrop-blur">
            <CardHeader className="space-y-2">
              <CardTitle className="text-xl text-foreground">Presensi Terbaru</CardTitle>
              <CardDescription>5 aktivitas terakhir lengkap dengan status dan waktu pencatatan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table className="rounded-3xl border border-white/15 bg-white/5 text-sm">
                <TableHeader>
                  <TableRow className="bg-white/10 text-xs uppercase tracking-[0.3em] text-foreground/60">
                    <TableHead className="px-4 py-3">Tanggal</TableHead>
                    <TableHead className="px-4 py-3">Nama</TableHead>
                    <TableHead className="px-4 py-3">NISN</TableHead>
                    <TableHead className="px-4 py-3">Status</TableHead>
                    <TableHead className="px-4 py-3">Dicatat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAttendance.map((record) => (
                    <TableRow key={record.id} className="border-white/10">
                      <TableCell className="px-4 py-3 font-medium text-foreground/90">
                        {formatAttendanceDate(record.date)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-foreground/80">{record.name ?? "—"}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs text-foreground/70">{record.nisn}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">
                        <span className={cn("rounded-full px-3 py-1", statusColor(record.status))}>{record.status}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-xs text-foreground/60">
                        {formatAttendanceDateTime(record.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="rounded-[32px] border-white/15 bg-white/10 shadow-[0_25px_70px_rgba(139,0,0,0.2)] backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between p-6">
        <div>
          <CardDescription className="text-xs uppercase tracking-[0.35em] text-white/60">
            {title}
          </CardDescription>
          <CardTitle className="mt-3 text-3xl font-semibold text-white">{value}</CardTitle>
        </div>
        <div className="rounded-full bg-white/10 p-3 text-white">{icon}</div>
      </CardHeader>
      <CardContent className="px-6 pb-6 text-sm text-white/70">{description}</CardContent>
    </Card>
  );
}
