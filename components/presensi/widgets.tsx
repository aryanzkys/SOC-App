"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarCheck, CheckCircle2, History } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type AttendanceRecord,
  type AttendanceStatus,
  formatAttendanceDate,
  formatAttendanceDateTime,
  formatAttendanceTime,
} from "@/lib/attendance";
import { cn } from "@/lib/utils";

export type AttendanceStatusCardProps = {
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

export function AttendanceStatusCard({
  todayLabel,
  todayRecord,
  isSaturday,
  canMark,
  selectedStatus,
  onStatusChange,
  onMark,
  markState,
  markMessage,
}: AttendanceStatusCardProps) {
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

export type AttendanceHistoryPreviewProps = {
  history: AttendanceRecord[];
};

export function AttendanceHistoryPreview({ history }: AttendanceHistoryPreviewProps) {
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

export type StatusSelectorProps = {
  selectedStatus: AttendanceStatus;
  onChange: (status: AttendanceStatus) => void;
  disabled?: boolean;
};

export function StatusSelector({ selectedStatus, onChange, disabled }: StatusSelectorProps) {
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

export function StatusBadge({ status }: { status: AttendanceStatus }) {
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

export function getStatusStyles(status: AttendanceStatus) {
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
