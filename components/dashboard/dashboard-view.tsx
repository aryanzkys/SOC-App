"use client";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, BadgeCheck, CalendarCheck, CheckCircle2, Clock, FileSpreadsheet, History, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type AttendanceRecord, type AttendanceStatus, formatAttendanceDate, formatAttendanceDateTime, formatAttendanceTime } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerChildren } from "@/utils/motion";

type DashboardViewProps = {
  user: {
    name: string | null;
    nisn: string;
    is_admin: boolean;
  };
  stats: Array<{
    title: string;
    value: string;
    note: string;
  }>;
  attendance: {
    isSaturday: boolean;
    todayRecord: AttendanceRecord | null;
    todayLabel: string;
    history: AttendanceRecord[];
  };
};

export function DashboardView({ user, stats, attendance }: DashboardViewProps) {
  const displayName = user.name?.trim().length ? user.name : user.nisn;
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>("Hadir");
  const [markState, setMarkState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [markMessage, setMarkMessage] = useState<string | null>(null);

  const previewHistory = useMemo(() => attendance.history.slice(0, 3), [attendance.history]);
  const canMarkToday = attendance.isSaturday && !attendance.todayRecord;
  const lastRecord = attendance.todayRecord ?? attendance.history[0] ?? null;

  const handleMarkAttendance = useCallback(async () => {
    if (!canMarkToday) return;

    setMarkState("loading");
    setMarkMessage(null);

    try {
      const response = await fetch("/api/attendance/mark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const payload = await response.json().catch(() => ({ message: null }));

      if (!response.ok) {
        setMarkState("error");
        setMarkMessage(payload.message ?? "Gagal menyimpan presensi.");
        return;
      }

      setMarkState("success");
      setMarkMessage("Presensi tercatat. Terima kasih!");
      setTimeout(() => {
        router.refresh();
      }, 800);
    } catch (error) {
      setMarkState("error");
      setMarkMessage("Terjadi kesalahan. Coba lagi.");
    }
  }, [canMarkToday, router, selectedStatus]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.16),transparent_62%)] px-6 pb-24 pt-16 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.45),transparent_55%)]" />
      <motion.div
        className="mx-auto flex w-full max-w-6xl flex-col gap-12"
        variants={staggerChildren}
        initial="hidden"
        animate="visible"
      >
        <motion.section variants={fadeInUp} className="grid gap-6 rounded-[36px] border border-white/10 bg-white/10 p-8 shadow-[0_32px_70px_rgba(139,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">Central Control</p>
              <h1 className="mt-2 text-4xl font-semibold text-foreground sm:text-5xl">Hello, {displayName}</h1>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground">
                Monitor operations, assess readiness, and drill into critical insights. Your session is authenticated via military-grade token security.
              </p>
              {lastRecord ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-foreground/70">
                  <Clock className="h-4 w-4 text-[#8B0000]" />
                  Status terakhir: <StatusBadge status={lastRecord.status} />
                  <span className="font-medium text-foreground/80">{formatAttendanceDateTime(lastRecord.created_at)}</span>
                </p>
              ) : null}
            </div>
            <motion.div
              className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/20 px-5 py-4 text-sm text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.2)] backdrop-blur"
              whileHover={{ scale: 1.02 }}
            >
              <BadgeCheck className="h-5 w-5 text-[#8B0000]" />
              <span className="font-medium uppercase tracking-[0.3em]">Token Verified</span>
            </motion.div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {stats.map((stat) => (
              <motion.div key={stat.title} variants={fadeInUp}>
                <Card className="h-full rounded-3xl border-white/20 bg-white/40 px-6 py-5 text-foreground shadow-[0_24px_60px_rgba(139,0,0,0.15)] backdrop-blur-lg transition hover:-translate-y-1 hover:shadow-[0_32px_70px_rgba(139,0,0,0.22)] dark:border-white/15 dark:bg-white/10">
                  <CardHeader className="space-y-2 p-0">
                    <CardTitle className="text-sm uppercase tracking-[0.35em] text-[#8B0000]/80">
                      {stat.title}
                    </CardTitle>
                    <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                  </CardHeader>
                  <CardContent className="mt-3 p-0">
                    <CardDescription className="text-sm text-muted-foreground">{stat.note}</CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section variants={fadeInUp} className="grid gap-6 lg:grid-cols-[1.25fr,1fr]">
          <PresensiStatusCard
            todayLabel={attendance.todayLabel}
            todayRecord={attendance.todayRecord}
            isSaturday={attendance.isSaturday}
            canMark={canMarkToday}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            onMark={handleMarkAttendance}
            markState={markState}
            markMessage={markMessage}
          />
          <PresensiHistoryPreview history={previewHistory} />
        </motion.section>

        <motion.section variants={fadeInUp}>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 rounded-3xl bg-white/10 p-2 text-sm text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur-lg md:w-auto md:grid-cols-4">
              <TabsTrigger value="overview" className={tabClass}>Overview</TabsTrigger>
              <TabsTrigger value="profile" className={tabClass}>Profile</TabsTrigger>
              <TabsTrigger value="presensi" className={tabClass}>Presensi</TabsTrigger>
              {user.is_admin ? (
                <TabsTrigger value="admin" className={tabClass}>
                  Admin
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="overview" className="mt-8 focus-visible:outline-none">
              <Card className="rounded-[32px] border-white/15 bg-white/15 p-8 shadow-[0_24px_60px_rgba(139,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl font-semibold text-foreground">Rapid Situational Awareness</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Critical summaries, current threat posture, and automated playbooks are one tap away.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-6 grid gap-6 p-0 text-sm text-muted-foreground/90 md:grid-cols-3">
                  <GlassBullet title="Live Alerts" description="3 critical patterns tracked with AI-backed triage" />
                  <GlassBullet title="Coverage" description="99.2% detection coverage across SOC assets" />
                  <GlassBullet title="Resilience" description="Playbooks tested weekly for mission readiness" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-8 focus-visible:outline-none">
              <Card className="rounded-[32px] border-white/15 bg-white/15 p-8 shadow-[0_24px_60px_rgba(139,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <CardHeader className="p-0">
                  <CardTitle className="text-2xl font-semibold text-foreground">Operator Identity</CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Review your SOC identity imprint. Manage your credential from the profile module.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-6 grid gap-5 p-0 text-sm text-muted-foreground/90 md:grid-cols-2">
                  <IdentityRow label="Name" value={displayName} />
                  <IdentityRow label="NISN" value={user.nisn} />
                  <IdentityRow label="Role" value={user.is_admin ? "Administrator" : "Member"} />
                  <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
                    <span className="text-xs uppercase tracking-[0.35em] text-[#8B0000]">Update Token</span>
                    <Button asChild variant="outline" className="rounded-2xl border-white/40 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/80">
                      <Link href="/profile">Manage</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="presensi" className="mt-8 focus-visible:outline-none">
              <Card className="rounded-[32px] border-white/15 bg-white/15 p-8 shadow-[0_24px_60px_rgba(139,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                <CardHeader className="flex flex-col gap-3 p-0">
                  <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                    <CalendarCheck className="h-6 w-6 text-[#8B0000]" />
                    Presensi SOC
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Absensi hanya tersedia setiap Sabtu. Tandai kehadiranmu atau akses riwayat lengkap di halaman presensi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-6 flex flex-col gap-4 p-0 text-sm text-muted-foreground/90">
                  <GlassBullet title="Presensi Sabtu" description="Ketersediaan absensi otomatis aktif pukul 00.00 WIB setiap Sabtu" />
                  <GlassBullet title="Status Cepat" description="Lihat ringkasan kehadiran langsung dari dashboard" />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button asChild className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(139,0,0,0.25)]">
                      <Link href="/dashboard/presensi">Buka Halaman Presensi</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                      onClick={() => router.push("/dashboard/presensi")}
                    >
                      Lihat Riwayat Lengkap
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {user.is_admin ? (
              <TabsContent value="admin" className="mt-8 focus-visible:outline-none">
                <Card className="rounded-[32px] border-white/15 bg-white/15 p-8 shadow-[0_24px_60px_rgba(139,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="flex flex-col gap-3 p-0">
                    <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                      <LayoutDashboard className="h-6 w-6 text-[#8B0000]" />
                      Admin Command Deck
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Enlist operators, rotate credentials, dan ekspor data anggota dan presensi untuk audit.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-6 flex flex-wrap items-center gap-4 p-0">
                    <Button asChild className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-6 py-3 text-sm font-semibold">
                      <Link href="/admin/users">Open Admin Panel</Link>
                    </Button>
                    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/70">
                      <FileSpreadsheet className="h-4 w-4 text-[#8B0000]" /> CSV Ready
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>
        </motion.section>
      </motion.div>
    </div>
  );
}

const tabClass = cn(
  "rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-foreground transition-all",
  "data-[state=active]:bg-white data-[state=active]:text-[#8B0000] data-[state=active]:shadow-[0_12px_30px_rgba(139,0,0,0.25)]",
  "data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground/70"
);

type GlassBulletProps = {
  title: string;
  description: string;
};

function GlassBullet({ title, description }: GlassBulletProps) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/12 px-5 py-4 text-sm text-muted-foreground shadow-[0_18px_40px_rgba(139,0,0,0.15)] backdrop-blur dark:border-white/10 dark:bg-white/8">
      <p className="text-xs uppercase tracking-[0.35em] text-[#8B0000]/80">{title}</p>
      <p className="mt-2 text-sm text-foreground/80">{description}</p>
    </div>
  );
}

type IdentityRowProps = {
  label: string;
  value: string;
};

function IdentityRow({ label, value }: IdentityRowProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm text-muted-foreground shadow-[0_18px_45px_rgba(139,0,0,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/8">
      <span className="text-xs uppercase tracking-[0.35em] text-[#8B0000]/70">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

type PresensiStatusCardProps = {
  todayLabel: string;
  todayRecord: AttendanceRecord | null;
  isSaturday: boolean;
  canMark: boolean;
  selectedStatus: AttendanceStatus;
  onStatusChange: (status: AttendanceStatus) => void;
  onMark: () => void;
  markState: "idle" | "loading" | "success" | "error";
  markMessage: string | null;
};

function PresensiStatusCard({
  todayLabel,
  todayRecord,
  isSaturday,
  canMark,
  selectedStatus,
  onStatusChange,
  onMark,
  markState,
  markMessage,
}: PresensiStatusCardProps) {
  return (
    <Card className="rounded-[36px] border-white/15 bg-white/15 p-8 shadow-[0_30px_70px_rgba(139,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <CardHeader className="flex flex-col gap-2 p-0">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <CalendarCheck className="h-6 w-6 text-[#8B0000]" /> Presensi Hari Ini
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">{todayLabel}</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 space-y-6 p-0">
        {todayRecord ? (
          <motion.div
            className="flex flex-col gap-4 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-5 text-emerald-100 shadow-[0_18px_45px_rgba(16,185,129,0.25)]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-lg font-semibold">Kehadiran tersimpan</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <StatusBadge status={todayRecord.status} />
              <span className="text-foreground/80">{formatAttendanceDateTime(todayRecord.created_at)}</span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-foreground/80 shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur">
              <p className="text-lg font-semibold text-foreground">
                {isSaturday ? "Belum absen hari ini" : "Presensi belum tersedia"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isSaturday
                  ? "Tandai kehadiranmu sekali untuk hari ini. Pilih izin jika tidak bisa hadir."
                  : "Presensi hanya dibuka setiap Sabtu pukul 00.00 WIB."}
              </p>
            </div>

            {isSaturday ? (
              <div className="flex flex-wrap items-center gap-3">
                <StatusSelector
                  selectedStatus={selectedStatus}
                  onChange={onStatusChange}
                  disabled={!canMark || markState === "loading"}
                />
                <motion.div whileHover={{ scale: canMark && markState !== "loading" ? 1.02 : 1 }} whileTap={{ scale: canMark && markState !== "loading" ? 0.98 : 1 }}>
                  <Button
                    onClick={onMark}
                    disabled={!canMark || markState === "loading"}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-6 py-3 text-sm font-semibold text-white shadow-[0_22px_50px_rgba(139,0,0,0.35)]"
                  >
                    {markState === "loading" ? "Sedang menyimpan..." : "Absen Sekarang"}
                  </Button>
                </motion.div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-5 py-4 text-sm text-foreground/70">
                <AlertTriangle className="h-5 w-5 text-[#8B0000]" />
                Presensi hanya tersedia hari Sabtu.
              </div>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {markMessage ? (
            <motion.p
              key={`${markState}-${markMessage}`}
              className={cn(
                "rounded-2xl border px-4 py-3 text-sm font-medium",
                markState === "success"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                  : "border-red-500/40 bg-red-500/10 text-red-100"
              )}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {markMessage}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

type PresensiHistoryPreviewProps = {
  history: AttendanceRecord[];
};

function PresensiHistoryPreview({ history }: PresensiHistoryPreviewProps) {
  return (
    <Card className="rounded-[36px] border-white/15 bg-white/15 p-8 shadow-[0_30px_70px_rgba(139,0,0,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
      <CardHeader className="flex flex-col gap-2 p-0">
        <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <History className="h-6 w-6 text-[#8B0000]" /> Riwayat Singkat
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Rekap tiga presensi terakhir untuk memantau konsistensi hadir.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 space-y-4 p-0">
        {history.length > 0 ? (
          <Table className="overflow-hidden rounded-3xl border border-white/15 bg-white/8 text-sm text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur">
            <TableHeader>
              <TableRow className="bg-white/10 text-xs uppercase tracking-[0.3em] text-foreground/60">
                <TableHead className="px-4 py-3">Tanggal</TableHead>
                <TableHead className="px-4 py-3">Status</TableHead>
                <TableHead className="px-4 py-3 text-right">Waktu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record) => (
                <TableRow key={record.id} className="border-white/10 text-sm text-foreground/80 transition hover:bg-white/10">
                  <TableCell className="px-4 py-3">{formatAttendanceDate(record.date)}</TableCell>
                  <TableCell className="px-4 py-3">
                    <StatusBadge status={record.status} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-mono text-xs text-foreground/60">
                    {formatAttendanceTime(record.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption className="py-3 text-xs uppercase tracking-[0.35em] text-foreground/50">
              Riwayat lengkap tersedia di halaman presensi.
            </TableCaption>
          </Table>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-3xl border border-dashed border-white/20 bg-white/5 px-6 py-5 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-[#8B0000]" />
            <span>Belum ada data presensi untuk ditampilkan.</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button asChild className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white shadow-[0_18px_45px_rgba(139,0,0,0.3)]">
            <Link href="/dashboard/presensi">Lihat Semua Riwayat</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type StatusSelectorProps = {
  selectedStatus: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
};

function StatusSelector({ selectedStatus, onChange, disabled }: StatusSelectorProps) {
  const label = selectedStatus === "Hadir" ? "Hadir" : "Izin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className="flex items-center gap-2 rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
        >
          Status: {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[12rem]">
        <DropdownMenuItem onSelect={() => onChange("Hadir")}>Hadir</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onChange("Izin")}>Izin (Tidak bisa hadir)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const styles = getStatusStyles(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
        styles.wrapper
      )}
    >
      <span className={styles.dot} />
      {status}
    </span>
  );
}

function getStatusStyles(status: AttendanceStatus) {
  switch (status) {
    case "Hadir":
      return {
        wrapper: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
        dot: "h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]",
      };
    case "Izin":
      return {
        wrapper: "border-yellow-500/40 bg-yellow-500/10 text-yellow-100",
        dot: "h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.6)]",
      };
    case "Alfa":
    default:
      return {
        wrapper: "border-red-500/40 bg-red-500/10 text-red-100",
        dot: "h-2 w-2 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.6)]",
      };
  }
}
