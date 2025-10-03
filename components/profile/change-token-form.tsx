"use client";

import { type ComponentProps, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/utils/motion";

type Status = "idle" | "loading" | "success" | "error";

export function ChangeTokenForm() {
  const [currentToken, setCurrentToken] = useState("");
  const [newToken, setNewToken] = useState("");
  const [confirmToken, setConfirmToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus("loading");
      setMessage(null);

      if (newToken !== confirmToken) {
        setStatus("error");
        setMessage("New token confirmation does not match.");
        return;
      }

      if (newToken.length < 8) {
        setStatus("error");
        setMessage("New token must be at least 8 characters.");
        return;
      }

      try {
        const response = await fetch("/api/auth/change-token", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ currentToken, newToken }),
        });

        const payload = await response.json().catch(() => ({ message: "Unable to update token" }));

        if (!response.ok) {
          setStatus("error");
          setMessage(payload.message ?? "Failed to update token.");
          return;
        }

        setStatus("success");
        setMessage("Token updated successfully.");
        setCurrentToken("");
        setNewToken("");
        setConfirmToken("");
      } catch {
        setStatus("error");
        setMessage("Unexpected error. Please try again.");
      }
    },
    [currentToken, newToken, confirmToken]
  );

  const disableSubmit =
    status === "loading" ||
    currentToken.length === 0 ||
    newToken.length < 8 ||
    confirmToken.length < 8;

  return (
    <motion.form
      className="space-y-6"
      onSubmit={onSubmit}
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <FloatingField
          id="current-token"
          label="Current token"
          type="password"
          value={currentToken}
          onChange={(event) => setCurrentToken(event.target.value)}
          autoComplete="current-password"
        />
        <FloatingField
          id="new-token"
          label="New token"
          type="password"
          value={newToken}
          onChange={(event) => setNewToken(event.target.value)}
          autoComplete="new-password"
        />
        <FloatingField
          id="confirm-token"
          label="Confirm token"
          type="password"
          value={confirmToken}
          onChange={(event) => setConfirmToken(event.target.value)}
          autoComplete="new-password"
        />
      </div>

      <motion.div whileHover={{ scale: disableSubmit ? 1 : 1.01 }} whileTap={{ scale: disableSubmit ? 1 : 0.98 }}>
        <Button
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] py-4 text-base font-semibold text-white shadow-[0_22px_45px_rgba(139,0,0,0.35)] transition"
          disabled={disableSubmit}
        >
          <span>{status === "loading" ? "Securing" : "Update token"}</span>
          <Sparkles className="h-5 w-5" />
        </Button>
      </motion.div>

      <AnimatePresence mode="wait">
        {message ? (
          <motion.p
            key={status}
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              status === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                : "border-red-500/40 bg-red-500/10 text-red-100"
            )}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
          >
            {message}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <p className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-xs uppercase tracking-[0.35em] text-foreground/70 shadow-[0_18px_40px_rgba(139,0,0,0.12)] backdrop-blur">
        <KeyRound className="h-4 w-4 text-[#8B0000]" />
        Tokens are hashed using bcrypt v12 cost factor.
      </p>
    </motion.form>
  );
}

type FloatingFieldProps = ComponentProps<typeof Input> & {
  label: string;
};

function FloatingField({ id, label, className, value, ...props }: FloatingFieldProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <motion.div className="relative" variants={fadeInUp} initial="hidden" animate="visible">
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
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground/60 transition-all",
          "peer-focus:-top-2 peer-focus:left-3 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:text-[#8B0000]",
          hasValue ? "-top-2 left-3 translate-y-0 text-xs text-[#8B0000]" : ""
        )}
      >
        {label}
      </Label>
    </motion.div>
  );
}
