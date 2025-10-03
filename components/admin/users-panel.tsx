"use client";

import { type FormEvent, type ReactNode, useCallback, useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Download, RefreshCcw, Search, Upload, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ImportResult = {
  message: string;
  processed: number;
  created: number;
  updated: number;
};

type CreateFormState = {
  nisn: string;
  name: string;
  is_admin: boolean;
};

type RoleFilter = "all" | "admin" | "member";

const columnHelper = createColumnHelper<UserRecord>();

export function UsersPanel({ users }: UsersPanelProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);

  const [createForm, setCreateForm] = useState<CreateFormState>({ nisn: "", name: "", is_admin: false });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createToken, setCreateToken] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  const filteredUsers = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        normalized.length === 0 ||
        user.nisn.toLowerCase().includes(normalized) ||
        (user.name ?? "").toLowerCase().includes(normalized);
      const matchesRole =
        roleFilter === "all" || (roleFilter === "admin" && user.is_admin) || (roleFilter === "member" && !user.is_admin);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("nisn", {
        header: "NISN",
        cell: (info) => <span className="font-mono text-sm text-foreground/80">{info.getValue()}</span>,
      }),
      columnHelper.accessor("name", {
        header: "Nama",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("is_admin", {
        header: "Role",
        cell: (info) => (
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]",
              info.getValue()
                ? "border-[#8B0000]/40 bg-[#8B0000]/15 text-[#ffd5d5]"
                : "border-white/25 bg-white/10 text-foreground/70"
            )}
          >
            {info.getValue() ? "Admin" : "Member"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
              onClick={() => {
                setSelectedUser(row.original);
                setGeneratedToken(null);
                setTokenDialogOpen(true);
              }}
            >
              Generate token
            </Button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExport = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users/export");
      if (!response.ok) {
        throw new Error("Failed to export users");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `soc-users-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const handleImport = useCallback(
    async (file: File) => {
      setImporting(true);
      setImportResult(null);

      const text = await file.text();
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

      const rows = (parsed.data as Record<string, string>[]).map((row) => ({
        nisn: (row.NISN ?? row.nisn ?? "").trim(),
        name: (row.Nama ?? row.nama ?? "").trim(),
        token: (row.Token ?? row.token ?? "").trim(),
        isAdmin: ((row.Role ?? row.role ?? "Member").toLowerCase() === "admin"),
      }));

      const validRows = rows.filter((row) => row.nisn.length > 0 && row.token.length >= 8);

      try {
        const response = await fetch("/api/admin/users/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            records: validRows.map((row) => ({
              nisn: row.nisn,
              name: row.name || null,
              token: row.token,
              isAdmin: row.isAdmin,
            })),
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({ message: "Gagal impor" }));
          setImportResult({ message: payload.message, processed: 0, created: 0, updated: 0 });
        } else {
          const json = (await response.json()) as ImportResult;
          setImportResult(json);
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        setImportResult({ message: "Terjadi kesalahan saat import", processed: 0, created: 0, updated: 0 });
      } finally {
        setImporting(false);
      }
    },
    [router]
  );

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCreateLoading(true);
      setCreateMessage(null);
      const token = generateReadableToken();

      try {
        const response = await fetch("/api/admin/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nisn: createForm.nisn.trim(),
            name: createForm.name.trim().length ? createForm.name.trim() : null,
            token,
            isAdmin: createForm.is_admin,
          }),
        });

        const payload = await response.json().catch(() => ({ message: "Gagal membuat user" }));

        if (!response.ok) {
          setCreateMessage(payload.message ?? "Gagal membuat user");
          setCreateLoading(false);
          return;
        }

        setCreateToken(token);
        setCreateMessage("User berhasil dibuat. Simpan token berikut untuk diserahkan ke user.");
        router.refresh();
        setCreateForm({ nisn: "", name: "", is_admin: false });
      } catch (error) {
        console.error(error);
        setCreateMessage("Terjadi kesalahan tak terduga");
      } finally {
        setCreateLoading(false);
      }
    },
    [createForm, router]
  );

  const handleGenerateToken = useCallback(async () => {
    if (!selectedUser) return;
    setTokenLoading(true);
    setGeneratedToken(null);
    const token = generateReadableToken();

    try {
      const response = await fetch("/api/admin/reset-token", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, newToken: token }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Gagal reset token" }));
        setGeneratedToken(`Error: ${payload.message ?? "Gagal reset token"}`);
      } else {
        setGeneratedToken(token);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      setGeneratedToken("Terjadi kesalahan saat reset token");
    } finally {
      setTokenLoading(false);
    }
  }, [router, selectedUser]);

  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("all");
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">Admin Ops</p>
          <h2 className="text-3xl font-semibold text-foreground">Manajemen Anggota SOC</h2>
          <p className="text-sm text-muted-foreground">
            Pantau kredensial anggota, impor massal via CSV, dan rotasi token dengan aman.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(139,0,0,0.35)]"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setImportDialogOpen(true)}
            className="flex items-center gap-2 rounded-2xl border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2 rounded-2xl border-white/30 bg-white/10 px-4 py-3 text-sm font-semibold text-foreground shadow-[0_18px_45px_rgba(139,0,0,0.15)] backdrop-blur"
          >
            <Wand2 className="h-4 w-4" /> Tambah User
          </Button>
        </div>
      </div>

      <Card className="rounded-[36px] border-white/15 bg-white/12 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="border-b border-white/10 p-6">
          <CardTitle className="text-xl text-foreground">Filter &amp; Pencarian</CardTitle>
          <CardDescription>Gunakan pencarian teks dan filter role untuk memfokuskan daftar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 md:grid-cols-[2fr_1fr_auto]">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">Cari</Label>
            <div className="flex items-center gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-2">
              <Search className="h-4 w-4 text-foreground/50" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari nama atau NISN"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-foreground/40 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">Role</Label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className="h-12 rounded-2xl border border-white/25 bg-white/10 px-4 text-sm text-foreground"
            >
              <option value="all" className="bg-[#1c0606]">
                Semua
              </option>
              <option value="admin" className="bg-[#1c0606]">
                Admin
              </option>
              <option value="member" className="bg-[#1c0606]">
                Member
              </option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={resetFilters}
              className="w-full rounded-2xl border-white/30 bg-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[36px] border-white/15 bg-white/12 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="border-b border-white/10 p-6">
          <CardTitle className="text-xl text-foreground">Daftar Users</CardTitle>
          <CardDescription>{filteredUsers.length} pengguna cocok dengan filter saat ini.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-white/10 text-xs uppercase tracking-[0.3em] text-foreground/60">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="px-4 py-3">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-white/10">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-muted-foreground">
                      Tidak ada data sesuai pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {table.getRowModel().rows.length} dari {filteredUsers.length} user.
            </p>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
              >
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">Halaman {table.getState().pagination.pageIndex + 1}</span>
              <Button
                variant="outline"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import CSV Users</DialogTitle>
            <DialogDescription>
              Format kolom: <strong>NISN, Nama, Token, Role</strong>. Role opsional (default member). Token minimal 8 karakter.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload CSV</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                disabled={importing}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    handleImport(file);
                    event.target.value = "";
                  }
                }}
              />
              {importResult ? (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white">
                  <p>{importResult.message}</p>
                  <p className="text-xs text-white/70">
                    Diproses: {importResult.processed} • Dibuat: {importResult.created} • Diperbarui: {importResult.updated}
                  </p>
                </div>
              ) : null}
            </TabsContent>
            <TabsContent value="template" className="space-y-4 text-sm text-white/80">
              <p>Contoh data:</p>
              <pre className="rounded-2xl border border-white/20 bg-[#1f0606] p-4 text-xs text-white/80">
NISN,Nama,Token,Role
12000123,Andi Pratama,securePass123,Admin
12000456,Sinta Dewi,anggota789,Member
              </pre>
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreate} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Tambah User</DialogTitle>
              <DialogDescription>
                Token akan digenerate otomatis dan hanya ditampilkan satu kali setelah user berhasil dibuat.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <Field label="NISN" required>
                <Input
                  value={createForm.nisn}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, nisn: event.target.value }))}
                  required
                  inputMode="numeric"
                />
              </Field>
              <Field label="Nama">
                <Input
                  value={createForm.name}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
                />
              </Field>
              <div className="flex items-center justify-between rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                <span className="text-sm text-muted-foreground">Jadikan admin?</span>
                <Switch
                  checked={createForm.is_admin}
                  onCheckedChange={(value) => setCreateForm((prev) => ({ ...prev, is_admin: value }))}
                />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {createMessage ? (
                <motion.div
                  key={createMessage}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white"
                >
                  <p>{createMessage}</p>
                  {createToken ? (
                    <p className="mt-2 font-mono text-sm text-amber-200">Token: {createToken}</p>
                  ) : null}
                </motion.div>
              ) : null}
            </AnimatePresence>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={createLoading}
                className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                {createLoading ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Token Baru</DialogTitle>
            <DialogDescription>
              Token baru akan menggantikan token sebelumnya. Pastikan pengguna menerima token ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              User: <span className="font-semibold text-foreground">{selectedUser?.name ?? selectedUser?.nisn}</span>
            </p>
            {generatedToken ? (
              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Token Baru</p>
                <p className="mt-2 font-mono text-lg text-amber-200">{generatedToken}</p>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTokenDialogOpen(false)}
              className="rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
            >
              Tutup
            </Button>
            <Button
              onClick={handleGenerateToken}
              disabled={tokenLoading}
              className="rounded-2xl bg-gradient-to-br from-[#8B0000] via-[#b21212] to-[#360000] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {tokenLoading ? "Memproses..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function generateReadableToken(length = 16) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const array = new Uint32Array(length);
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let index = 0; index < length; index += 1) {
      array[index] = Math.floor(Math.random() * alphabet.length);
    }
  }
  return Array.from({ length }, (_, index) => alphabet[array[index] % alphabet.length]).join("");
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="space-y-2 text-sm text-foreground/80">
      <span className="block text-xs uppercase tracking-[0.3em] text-foreground/60">
        {label}
        {required ? <span className="text-red-300">*</span> : null}
      </span>
      {children}
    </label>
  );
}
