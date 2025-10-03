"use client";

import { type ComponentProps, useCallback, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Plus, ShieldCheck, ShieldPlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/utils/motion";

type UserRecord = {
  id: string;
  nisn: string;
  name: string | null;
  is_admin: boolean;
};

type UsersPanelProps = {
  users: UserRecord[];
};

type Status = "idle" | "loading" | "success" | "error";

type CreateFormState = {
  nisn: string;
  name: string;
  token: string;
  is_admin: boolean;
};

export function UsersPanel({ users }: UsersPanelProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [createForm, setCreateForm] = useState<CreateFormState>({
    nisn: "",
    name: "",
    token: "",
    is_admin: false,
  });
  const [createStatus, setCreateStatus] = useState<Status>("idle");
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState("");
  const [resetStatus, setResetStatus] = useState<Status>("idle");
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.is_admin && !b.is_admin) return -1;
        if (!a.is_admin && b.is_admin) return 1;
        return a.nisn.localeCompare(b.nisn);
      }),
    [users]
  );

  const handleCreate = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCreateStatus("loading");
      setCreateMessage(null);

      if (createForm.token.length < 8) {
        setCreateStatus("error");
        setCreateMessage("Token must be at least 8 characters.");
        return;
      }

      try {
        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nisn: createForm.nisn.trim(),
            name: createForm.name.trim().length ? createForm.name.trim() : null,
            token: createForm.token,
            isAdmin: createForm.is_admin,
          }),
        });

        const payload = await response.json().catch(() => ({ message: "Unable to create user" }));

        if (!response.ok) {
          setCreateStatus("error");
          setCreateMessage(payload.message ?? "Failed to create user.");
          return;
        }

        setCreateStatus("success");
        setCreateMessage("User created successfully.");
        setCreateForm({ nisn: "", name: "", token: "", is_admin: false });
        router.refresh();
      } catch {
        setCreateStatus("error");
        setCreateMessage("Unexpected error. Please try again.");
      }
    },
    [createForm, router]
  );

  const handleReset = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!resetUserId) return;
      setResetStatus("loading");
      setResetMessage(null);

      if (resetToken.length < 8) {
        setResetStatus("error");
        setResetMessage("Token must be at least 8 characters.");
        return;
      }

      try {
        const response = await fetch("/api/admin/reset-token", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: resetUserId, newToken: resetToken }),
        });

        const payload = await response.json().catch(() => ({ message: "Unable to reset token" }));

        if (!response.ok) {
          setResetStatus("error");
          setResetMessage(payload.message ?? "Failed to reset token.");
          return;
        }

        setResetStatus("success");
        setResetMessage("Token reset successfully.");
        setResetToken("");
        setResetUserId(null);
        router.refresh();
      } catch {
        setResetStatus("error");
        setResetMessage("Unexpected error. Please try again.");
      }
    },
    [resetToken, resetUserId, router]
  );

  const triggerImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImport = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const text = await file.text();
      const rows = text
        .split(/\r?\n/)
        .map((row) => row.trim())
        .filter(Boolean);

      if (rows.length <= 1) {
        setCreateStatus("error");
        setCreateMessage("CSV must contain header and at least one row.");
        event.target.value = "";
        return;
      }

      const [, ...dataRows] = rows;
      let successCount = 0;
      let failureCount = 0;

      for (const row of dataRows) {
        const columns = row.split(",").map((value) => value.trim());
        const [nisn, name = "", token = "", isAdmin = "false"] = columns;

        if (!nisn || token.length < 8) {
          failureCount += 1;
          continue;
        }

        try {
          const response = await fetch("/api/admin/create-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nisn,
              name: name.length ? name : null,
              token,
              isAdmin: isAdmin.toLowerCase() === "true",
            }),
          });

          if (response.ok) {
            successCount += 1;
          } else {
            failureCount += 1;
          }
        } catch {
          failureCount += 1;
        }
      }

      setCreateStatus("success");
      setCreateMessage(`Imported ${successCount} user(s). ${failureCount ? `${failureCount} failed.` : ""}`.trim());
      router.refresh();
      event.target.value = "";
    },
    [router]
  );

  const handleExport = useCallback(() => {
    const header = "nisn,name,is_admin";
    const body = users
      .map((user) => `${user.nisn},${user.name?.replace(/,/g, " ") ?? ""},${user.is_admin}`)
      .join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `soc-users-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [users]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">Admin Ops</p>
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">SOC Membership Registry</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(139,0,0,0.35)]"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={triggerImport}
            variant="outline"
            className="flex items-center gap-2 rounded-2xl border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </div>
      </div>

      <Card className="rounded-[36px] border-white/15 bg-white/12 p-8 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <CardHeader className="space-y-3 p-0">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <ShieldPlus className="h-6 w-6 text-[#8B0000]" /> Register New Member
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Assign a secure token and optional admin privileges. Tokens are hashed instantly before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-8 p-0">
          <motion.form
            className="grid gap-6 md:grid-cols-2"
            onSubmit={handleCreate}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <FloatingField
              id="create-nisn"
              label="NISN"
              value={createForm.nisn}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nisn: event.target.value }))}
              inputMode="numeric"
              required
            />
            <FloatingField
              id="create-name"
              label="Name"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FloatingField
              id="create-token"
              label="Token"
              type="password"
              value={createForm.token}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, token: event.target.value }))}
              required
            />
            <div className="flex flex-col justify-end gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
              <Label htmlFor="create-admin" className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8B0000]/80">
                Admin Privileges
              </Label>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Grants access to user management & credential rotation.</p>
                <Switch
                  id="create-admin"
                  checked={createForm.is_admin}
                  onCheckedChange={(value) => setCreateForm((prev) => ({ ...prev, is_admin: value }))}
                />
              </div>
            </div>
            <div className="md:col-span-2">
              <motion.div whileHover={{ scale: createStatus === "loading" ? 1 : 1.01 }} whileTap={{ scale: createStatus === "loading" ? 1 : 0.98 }}>
                <Button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] py-4 text-base font-semibold text-white shadow-[0_22px_45px_rgba(139,0,0,0.35)]"
                  disabled={createStatus === "loading"}
                >
                  <Plus className="h-5 w-5" />
                  {createStatus === "loading" ? "Registering" : "Create user"}
                </Button>
              </motion.div>
            </div>
          </motion.form>

          <AnimatePresence mode="wait">
            {createMessage ? (
              <motion.p
                key={createStatus}
                className={cn(
                  "mt-6 rounded-2xl border px-4 py-3 text-sm font-medium",
                  createStatus === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-red-500/40 bg-red-500/10 text-red-100"
                )}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {createMessage}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card className="rounded-[36px] border-white/15 bg-white/12 p-8 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
        <CardHeader className="space-y-3 p-0">
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-foreground">
            <ShieldCheck className="h-6 w-6 text-[#8B0000]" /> Active Roster
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Monitor current SOC members. Reset credentials instantly when required.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-8 space-y-6 p-0">
          <Table className="rounded-3xl border border-white/15 bg-white/5 shadow-[0_18px_45px_rgba(139,0,0,0.18)] backdrop-blur">
            <TableHeader>
              <TableRow className="bg-white/10 text-xs uppercase tracking-[0.3em] text-foreground/70">
                <TableHead className="px-4 py-3">NISN</TableHead>
                <TableHead className="px-4 py-3">Name</TableHead>
                <TableHead className="px-4 py-3">Role</TableHead>
                <TableHead className="px-4 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="border-white/10">
                  <TableCell className="px-4 py-3 font-mono text-sm text-foreground">{user.nisn}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-foreground/80">{user.name ?? "—"}</TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
                      user.is_admin
                        ? "border-[#8B0000]/40 bg-[#8B0000]/15 text-[#8B0000]"
                        : "border-white/30 bg-white/10 text-foreground/70"
                    )}>
                      {user.is_admin ? "Admin" : "Member"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                      onClick={() => {
                        setResetUserId(user.id);
                        setResetToken("");
                        setResetStatus("idle");
                        setResetMessage(null);
                      }}
                    >
                      Reset token
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>Export data for audits or import updates from CSV templates.</TableCaption>
          </Table>

          <AnimatePresence mode="wait">
            {resetUserId ? (
              <motion.form
                key={resetUserId}
                className="grid gap-4 rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[0_18px_45px_rgba(139,0,0,0.18)] backdrop-blur"
                onSubmit={handleReset}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <p className="text-xs uppercase tracking-[0.35em] text-[#8B0000]/80">Reset token for user</p>
                <FloatingField
                  id="reset-token"
                  label="New token"
                  type="password"
                  value={resetToken}
                  onChange={(event) => setResetToken(event.target.value)}
                  required
                />
                <div className="flex items-center gap-3 md:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
                    onClick={() => {
                      setResetUserId(null);
                      setResetToken("");
                      setResetStatus("idle");
                      setResetMessage(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
                    disabled={resetStatus === "loading"}
                  >
                    {resetStatus === "loading" ? "Resetting" : "Confirm reset"}
                  </Button>
                </div>
              </motion.form>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {resetMessage ? (
              <motion.p
                key={resetStatus}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm font-medium",
                  resetStatus === "success"
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
                    : "border-red-500/40 bg-red-500/10 text-red-100"
                )}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                {resetMessage}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}

type FloatingFieldProps = ComponentProps<typeof Input> & {
  label: string;
};

function FloatingField({ id, label, className, value, ...props }: FloatingFieldProps) {
  const hasValue = typeof value === "string" ? value.length > 0 : Boolean(value);

  return (
    <div className="relative">
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
    </div>
  );
}
