"use client";

import { type ComponentProps, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { ChevronRight, LogIn, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/utils/motion";

const floatingVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type Status = "idle" | "loading" | "error" | "success";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("from") ?? "/dashboard", [searchParams]);

  const [nisn, setNisn] = useState("");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("loading");
      setError(null);

      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ nisn: nisn.trim(), token }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ message: "Unable to login" }));
          setStatus("error");
          setError(payload.message ?? "Invalid credentials");
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.replace(redirectTo);
        }, 200);
      } catch {
        setStatus("error");
        setError("Unexpected error. Please try again.");
      }
    },
    [nisn, token, redirectTo, router]
  );

  const disableSubmit = status === "loading" || nisn.trim().length === 0 || token.length === 0;

  return (
    <motion.div
      className="relative w-full max-w-xl overflow-hidden rounded-[32px] border border-white/20 bg-white/15 p-[1px] shadow-[0_30px_70px_rgba(139,0,0,0.25)] backdrop-blur-3xl"
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="relative h-full w-full rounded-[30px] bg-gradient-to-br from-white/35 via-white/25 to-white/10 px-10 py-12 dark:from-[#190707]/80 dark:via-[#140404]/70 dark:to-[#0b0202]/70">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_65%)]" />
  <motion.div className="mb-10 space-y-2" variants={floatingVariants} initial="hidden" animate="visible">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/25 px-4 py-2 text-xs uppercase tracking-[0.35em] text-[#8B0000] shadow-[0_12px_30px_rgba(139,0,0,0.3)]">
            <ShieldCheck className="h-4 w-4" /> Secure Access
          </div>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Welcome back</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Enter your registered NISN and security token to access the SOC control center.
          </p>
        </motion.div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <FloatingField
              id="nisn"
              label="NISN"
              value={nisn}
              onChange={(event) => setNisn(event.target.value)}
              autoComplete="username"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={20}
            />
            <FloatingField
              id="token"
              label="Token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="current-password"
              minLength={8}
            />
          </div>

          <motion.div whileHover={{ scale: disableSubmit ? 1 : 1.01 }} whileTap={{ scale: disableSubmit ? 1 : 0.98 }}>
            <Button
              type="submit"
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] py-4 text-base font-semibold text-white shadow-[0_22px_45px_rgba(139,0,0,0.35)] transition"
              disabled={disableSubmit}
            >
              <span>{status === "loading" ? "Authenticating" : "Enter Command Console"}</span>
              <motion.span animate={status === "loading" ? { rotate: 360 } : { rotate: 0 }} transition={{ repeat: status === "loading" ? Infinity : 0, duration: 1.2, ease: "linear" }}>
                <LogIn className="h-5 w-5" />
              </motion.span>
            </Button>
          </motion.div>
        </form>

        <AnimatePresence mode="wait">
          {status === "error" && error ? (
            <motion.p
              key="error"
              className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-100"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {error}
            </motion.p>
          ) : null}
          {status === "success" ? (
            <motion.p
              key="success"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-100"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              Access granted
              <ChevronRight className="h-4 w-4" />
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

type FloatingFieldProps = ComponentProps<typeof Input> & {
  label: string;
};

function FloatingField({ id, label, className, value, ...props }: FloatingFieldProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <motion.div className="relative" variants={floatingVariants} initial="hidden" animate="visible">
      <Input
        id={id}
        value={value}
        className={cn(
          "peer h-14 rounded-2xl border-white/30 bg-white/10 px-4 text-lg text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur placeholder-transparent transition-all",
          "focus-visible:border-[#8B0000]/50 focus-visible:ring-[#8B0000]/40",
          "dark:border-white/15 dark:bg-white/5",
          className
        )}
        {...props}
      />
      <Label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium uppercase tracking-[0.3em] text-foreground/60 transition-all",
          "peer-focus:-top-2 peer-focus:left-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#8B0000]",
          hasValue ? "-top-2 left-3 translate-y-0 text-xs text-[#8B0000]" : ""
        )}
      >
        {label}
      </Label>
    </motion.div>
  );
}
