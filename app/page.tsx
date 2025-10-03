import Link from "next/link";

import { CalendarCheck2, LineChart, ShieldCheck, Users } from "lucide-react";

import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getJakartaDateInfo } from "@/lib/attendance";
import { supabaseServerClient } from "@/lib/supabase";

type AttendanceStatus = "Hadir" | "Izin" | "Alfa";

type RecentAttendanceRow = {
  id: string;
  status: AttendanceStatus | string;
  date: string;
  created_at: string;
  nisn: string | null;
  users: { name: string | null } | { name: string | null }[] | null;
};

const featureCards = [
  {
    icon: CalendarCheck2,
    title: "Presensi Terjadwal",
    description:
      "Sesi otomatis tiap Sabtu dengan penyesuaian zona waktu Jakarta guna memastikan setiap anggota tercatat tepat waktu.",
  },
  {
    icon: Users,
    title: "Ekosistem Anggota",
    description:
      "Profil lengkap anggota, pembaruan riwayat presensi, dan insight kedisiplinan langsung dari data Supabase.",
  },
  {
    icon: ShieldCheck,
    title: "Keamanan Berlapis",
    description:
      "Login terpisah untuk admin, audit log, dan rate limiting menjaga data organisasi selalu aman.",
  },
  {
    icon: LineChart,
    title: "Analitik Langsung",
    description:
      "Pantau performa kehadiran mingguan serta aktivitas terbaru tanpa harus masuk ke dashboard.",
  },
];

function formatDateTime(value: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
    ...options,
  }).format(typeof value === "string" ? new Date(value) : value);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeZone: "Asia/Jakarta",
  }).format(typeof value === "string" ? new Date(value) : value);
}

function getStatusStyles(status: AttendanceStatus | string) {
  switch (status) {
    case "Hadir":
      return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500";
    case "Izin":
      return "border border-amber-500/40 bg-amber-500/10 text-amber-500";
    case "Alfa":
      return "border border-rose-500/40 bg-rose-500/10 text-rose-500";
    default:
      return "border border-primary/30 bg-primary/10 text-primary";
  }
}

function getNextSessionLabel() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  const nextSaturday = new Date(now);
  nextSaturday.setDate(now.getDate() + daysUntilSaturday);
  return formatDate(nextSaturday);
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const { isoDate, readableDate, isSaturday } = getJakartaDateInfo();

  const now = new Date();
  const startOfWindow = new Date(now);
  startOfWindow.setDate(startOfWindow.getDate() - 6);
  const startDate = startOfWindow.toISOString().slice(0, 10);

  const [usersCountResult, attendanceCountResult, weeklyAttendanceResult, todayAttendanceResult, recentAttendanceResult] =
    await Promise.all([
      supabaseServerClient.from("users").select("id", { count: "exact", head: true }),
      supabaseServerClient.from("attendance").select("id", { count: "exact", head: true }),
      supabaseServerClient.from("attendance").select("status").gte("date", startDate),
      supabaseServerClient.from("attendance").select("status").eq("date", isoDate),
      supabaseServerClient
        .from("attendance")
        .select("id, nisn, status, date, created_at, users(name)")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const totalMembers = usersCountResult.error ? 0 : usersCountResult.count ?? 0;
  const totalAttendanceRecords = attendanceCountResult.error
    ? 0
    : attendanceCountResult.count ?? 0;

  const weeklyRows = weeklyAttendanceResult.error ? [] : weeklyAttendanceResult.data ?? [];
  const todayRows = todayAttendanceResult.error ? [] : todayAttendanceResult.data ?? [];

  const hadirThisWeek = weeklyRows.filter((row) => row.status === "Hadir").length;
  const izinThisWeek = weeklyRows.filter((row) => row.status === "Izin").length;
  const alfaThisWeek = weeklyRows.filter((row) => row.status === "Alfa").length;
  const attendanceThisWeek = weeklyRows.length;
  const hadirRate = attendanceThisWeek === 0 ? 0 : (hadirThisWeek / attendanceThisWeek) * 100;

  const todayBreakdown = todayRows.reduce(
    (acc, row) => {
      if (row.status === "Hadir") acc.hadir += 1;
      else if (row.status === "Izin") acc.izin += 1;
      else if (row.status === "Alfa") acc.alfa += 1;
      else acc.lain += 1;
      return acc;
    },
    { hadir: 0, izin: 0, alfa: 0, lain: 0 }
  );

  const recentAttendanceRaw = recentAttendanceResult.error
    ? []
    : ((recentAttendanceResult.data ?? []) as RecentAttendanceRow[]);

  const recentAttendance = recentAttendanceRaw.map((row) => {
    const name = Array.isArray(row.users)
      ? row.users[0]?.name ?? "-"
      : row.users?.name ?? "-";

    return {
      id: row.id,
      name,
      nisn: row.nisn ?? "-",
      status: row.status,
      createdAt: formatDateTime(row.created_at),
      dateLabel: formatDate(row.date),
    };
  });

  const heroStats = [
    {
      label: "Total Anggota",
      value: totalMembers.toLocaleString("id-ID"),
      description: "Terdaftar di SOC App",
    },
    {
      label: "Catatan Presensi",
      value: totalAttendanceRecords.toLocaleString("id-ID"),
      description: "Terekam sejak awal aplikasi",
    },
    {
      label: "Kehadiran Mingguan",
      value: `${hadirRate.toFixed(1)}%`,
      description: `${attendanceThisWeek} sesi tercatat 7 hari terakhir`,
    },
  ];

  const updatedAt = formatDateTime(now, { dateStyle: "long" });
  const nextSessionLabel = getNextSessionLabel();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.18),transparent_65%)] px-6 pb-24 pt-12 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.38),transparent_55%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#a10a0a] to-[#4a0202] text-lg font-semibold text-white shadow-[0_18px_40px_rgba(139,0,0,0.45)]">
              SOC
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">
                SMANESI Olympiad Club
              </p>
              <h1 className="text-2xl font-semibold text-foreground">SOC Attendance Hub</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Button asChild variant="outline" className="rounded-2xl border-white/20 bg-white/10">
              <Link href="/admin/login">Admin Login</Link>
            </Button>
            <Button asChild className="rounded-2xl">
              <Link href="/login">Masuk Anggota</Link>
            </Button>
          </div>
        </header>

        <main className="space-y-16">
          <section className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8B0000] shadow-[0_10px_30px_rgba(139,0,0,0.25)] backdrop-blur">
                Data Langsung • {updatedAt}
              </div>
              <div className="space-y-4">
                <h2 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                  Presensi SOC yang terhubung penuh dengan data secara real-time.
                </h2>
                <p className="max-w-xl text-lg text-muted-foreground">
                  SOC App merangkum keamanan, kemudahan, serta insight data ke dalam satu halaman.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link href="/dashboard">Lihat Dashboard Anggota</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="rounded-2xl border-white/30 bg-white/15 backdrop-blur transition hover:border-white/60 hover:bg-white/25"
                >
                  <Link href="#fitur">Pelajari Fitur</Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <Card key={item.label} className="rounded-3xl border-white/10 bg-white/50 shadow-[0_25px_60px_rgba(139,0,0,0.12)] backdrop-blur">
                    <CardHeader className="space-y-1">
                      <CardDescription className="text-xs font-medium uppercase tracking-[0.25em] text-[#8B0000]/70">
                        {item.label}
                      </CardDescription>
                      <CardTitle className="text-3xl font-semibold text-foreground">
                        {item.value}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="relative overflow-hidden rounded-[32px] border-white/20 bg-white/10 shadow-[0_30px_80px_rgba(79,11,11,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-black/20">
              <div className="absolute inset-x-12 top-0 h-24 rounded-b-full bg-gradient-to-b from-white/40 via-white/15 to-transparent blur-2xl" />
              <CardHeader className="relative space-y-3">
                <Badge variant="outline" className="w-fit rounded-full border-white/30 bg-white/20 text-[11px] uppercase tracking-[0.3em] text-white/70">
                  {isSaturday ? "Presensi Berlangsung" : "Persiapan Sesi"}
                </Badge>
                <CardTitle className="text-3xl font-semibold text-white">{readableDate}</CardTitle>
                <CardDescription className="text-sm text-white/80">
                  {isSaturday
                    ? `Hari ini sudah tercatat ${todayRows.length} partisipasi.`
                    : `Sesi berikutnya: ${nextSessionLabel}.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4 text-sm text-white/85">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Ringkasan Hari Ini</p>
                  <ul className="mt-3 space-y-2 text-sm">
                    <li className="flex items-center justify-between">
                      <span>Hadir</span>
                      <span className="font-semibold text-emerald-200">{todayBreakdown.hadir}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Izin</span>
                      <span className="font-semibold text-amber-200">{todayBreakdown.izin}</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Alfa</span>
                      <span className="font-semibold text-rose-200">{todayBreakdown.alfa}</span>
                    </li>
                    {todayBreakdown.lain > 0 && (
                      <li className="flex items-center justify-between">
                        <span>Lainnya</span>
                        <span className="font-semibold text-white">{todayBreakdown.lain}</span>
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">Tren 7 Hari</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Hadir</span>
                      <span className="font-semibold text-emerald-200">{hadirThisWeek}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Izin</span>
                      <span className="font-semibold text-amber-200">{izinThisWeek}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Alfa</span>
                      <span className="font-semibold text-rose-200">{alfaThisWeek}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total Sesi</span>
                      <span className="font-semibold text-white">{attendanceThisWeek}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]" id="fitur">
            <Card className="rounded-3xl border-white/10 bg-white/65 shadow-[0_35px_90px_rgba(139,0,0,0.12)] backdrop-blur">
              <CardHeader className="space-y-3">
                <CardDescription className="text-xs uppercase tracking-[0.3em] text-[#8B0000]/70">
                  Aktivitas Terbaru
                </CardDescription>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  Presensi yang baru saja masuk
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Daftar berikut mencerminkan input terakhir dari anggota maupun admin. Informasi ini diperbarui setiap kali halaman dimuat.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentAttendance.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-white/40 bg-white/20 p-6 text-center text-sm text-muted-foreground">
                    Belum ada catatan presensi terbaru dalam satu minggu terakhir.
                  </p>
                )}
                {recentAttendance.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-2xl border border-white/30 bg-white/30 p-4 text-sm shadow-[0_10px_25px_rgba(139,0,0,0.08)] backdrop-blur-lg md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">
                        NISN {entry.nisn} • {entry.dateLabel}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 md:items-end">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(entry.status)}`}>
                        {entry.status}
                      </span>
                      <p className="text-xs text-muted-foreground">{entry.createdAt}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-6">
              {featureCards.map((feature) => (
                <Card
                  key={feature.title}
                  className="group h-full rounded-3xl border border-white/10 bg-white/50 text-foreground shadow-[0_25px_60px_rgba(139,0,0,0.12)] backdrop-blur-lg transition hover:-translate-y-2 hover:border-[#8B0000]/40 hover:shadow-[0_35px_90px_rgba(139,0,0,0.2)] dark:border-white/10 dark:bg-white/10"
                >
                  <CardHeader className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] text-white shadow-[0_18px_40px_rgba(139,0,0,0.35)]">
                      <feature.icon className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="space-y-2">
                      <CardTitle className="text-lg font-semibold tracking-wide">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#8B0000]/70">
                      Terhubung Database →
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="grid gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/40 via-white/25 to-white/10 p-8 shadow-[0_45px_110px_rgba(139,0,0,0.18)] backdrop-blur">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#8B0000]/70">
                Mulai sekarang
              </p>
              <h3 className="text-3xl font-semibold text-foreground">
                Satu aplikasi untuk seluruh kebutuhan kehadiran organisasi.
              </h3>
              <p className="text-sm text-muted-foreground">
                Rangkaian fitur SOC App mencakup presensi rutin, pengelolaan data anggota, audit aktivitas, hingga pembaruan kredensial aman. Semua berjalan di atas infrastruktur modern.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-2xl">
                <Link href="/admin/login">Masuk Sebagai Admin</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-2xl border-white/30 bg-white/10">
                <Link href="/login">Masuk Sebagai Anggota</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Terakhir diperbarui {updatedAt}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
