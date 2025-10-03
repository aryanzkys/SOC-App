"use client";

import { motion } from "framer-motion";
import { ShieldCheck, BarChart3, Sparkles } from "lucide-react";

import ModeToggle from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fadeInUp, staggerChildren } from "@/utils/motion";

const featureCards = [
  {
    icon: ShieldCheck,
    title: "Unified SOC Oversight",
    description:
      "Command every incident, asset, and alert from a single luxurious dashboard tailored for rapid response.",
  },
  {
    icon: BarChart3,
    title: "Adaptive Analytics",
    description:
      "Leverage rich trend visualizations and predictive KPIs to anticipate coverage gaps before they appear.",
  },
  {
    icon: Sparkles,
    title: "Automated Excellence",
    description:
      "Elevate operations with curated playbooks, AI-assisted workflows, and frictionless collaboration tools.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.22),transparent_60%)] px-6 pb-24 pt-12 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.45),transparent_55%)] backdrop-blur-[2px]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <header className="flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#a10a0a] to-[#4a0202] text-lg font-semibold text-white shadow-[0_18px_40px_rgba(139,0,0,0.45)]">
              SOC
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">
                Security Operations Center
              </p>
              <h1 className="text-2xl font-semibold text-foreground">
                SOC App
              </h1>
            </div>
          </motion.div>
          <div className="flex items-center gap-3">
            <ModeToggle />
          </div>
        </header>

        <motion.main
          className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          <motion.section className="space-y-8" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#8B0000] shadow-[0_10px_30px_rgba(139,0,0,0.25)] backdrop-blur">
              Luxury-grade SOC Intelligence
            </div>
            <h2 className="text-balance text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Elevate your cyber defense with immersive, data-rich command visuals.
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">
              Orchestrate human expertise and automated guardrails inside a single pane of glass. SOC App merges compliance, incident response, and resilience metrics into one opulent control room.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button className="group rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-8 py-6 text-base font-semibold tracking-wide text-white shadow-[0_25px_45px_rgba(139,0,0,0.35)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_35px_60px_rgba(139,0,0,0.42)]">
                Launch Command Console
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl border-white/30 bg-white/15 px-8 py-6 text-base font-semibold backdrop-blur transition hover:border-white/60 hover:bg-white/25"
              >
                Explore Platform Tour
              </Button>
            </div>
          </motion.section>

          <motion.section
            className="relative rounded-[32px] border border-white/20 bg-white/10 p-1 shadow-[0_30px_80px_rgba(79,11,11,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-black/20"
            variants={fadeInUp}
          >
            <div className="absolute inset-x-12 top-0 h-24 rounded-b-full bg-gradient-to-b from-white/40 via-white/15 to-transparent blur-2xl" />
            <div className="relative grid gap-4 rounded-[28px] bg-gradient-to-br from-white/35 via-white/15 to-white/5 p-8 dark:from-[#1a0606]/60 dark:via-[#120202]/60 dark:to-[#040101]/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/60">
                    Live posture
                  </p>
                  <h3 className="text-4xl font-semibold text-white">99.2%</h3>
                </div>
                <span className="rounded-xl border border-white/40 bg-white/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/80 backdrop-blur">
                  fortified
                </span>
              </div>
              <div className="space-y-3 text-sm text-white/80">
                <p className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Critical alerts</span>
                  <span className="text-base font-semibold text-white">03</span>
                </p>
                <p className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Response time</span>
                  <span className="text-base font-semibold text-white">2m 18s</span>
                </p>
                <p className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
                  <span>Compliance score</span>
                  <span className="text-base font-semibold text-[#FCD7D7]">98</span>
                </p>
              </div>
            </div>
          </motion.section>
        </motion.main>

        <motion.section
          className="grid gap-6 md:grid-cols-3"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {featureCards.map((feature) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Card className="group h-full rounded-3xl border border-white/10 bg-white/50 text-foreground shadow-[0_25px_60px_rgba(139,0,0,0.15)] backdrop-blur-lg transition hover:-translate-y-2 hover:border-[#8B0000]/40 hover:shadow-[0_35px_90px_rgba(139,0,0,0.25)] dark:border-white/10 dark:bg-white/10">
                <CardHeader className="space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] text-white shadow-[0_18px_40px_rgba(139,0,0,0.35)]">
                    <feature.icon className="h-6 w-6" aria-hidden />
                  </div>
                  <CardTitle className="text-xl font-semibold tracking-wide">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-[#8B0000]/70">
                    Learn more →
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.section>
      </div>
    </div>
  );
}
