"use client";

import { motion } from "framer-motion";
import { BadgeCheck, FileSpreadsheet, LayoutDashboard, UserCheck2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
};

export function DashboardView({ user, stats }: DashboardViewProps) {
  const displayName = user.name?.trim().length ? user.name : user.nisn;

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
                    <UserCheck2 className="h-6 w-6 text-[#8B0000]" />
                    Attendance Matrix
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Presensi analytics module is being forged. Expect attendance visualizations and SOC readiness scores soon.
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-6 grid gap-4 p-0 text-sm text-muted-foreground/90">
                  <GlassBullet title="In-development" description="Team presence heatmaps with Recharts visual analytics" />
                  <GlassBullet title="Timeline" description="Automated updates rolling out in the next sprint" />
                  <GlassBullet title="Goal" description="Surface who is on shift, their certifications, and active playbooks" />
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
                      Enlist operators, rotate credentials, and export SOC membership for audits.
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
