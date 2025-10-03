"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  createColumnHelper,
} from "@tanstack/react-table";
import Papa from "papaparse";
import { Download, Filter, RefreshCcw, Upload } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatAttendanceDate, formatAttendanceDateTime } from "@/lib/attendance";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/utils/motion";
import { motion } from "framer-motion";

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "Hadir", label: "Hadir" },
  { value: "Izin", label: "Izin" },
  { value: "Alfa", label: "Alfa" },
];

export type AttendanceAdminRecord = {
  id: string;
  user_id: string;
  nisn: string;
  status: "Hadir" | "Izin" | "Alfa";
  date: string;
  created_at: string;
  name: string | null;
};

type PresensiPanelProps = {
  initialData: AttendanceAdminRecord[];
  initialStartDate: string;
  initialEndDate: string;
};

type ImportResult = {
  message: string;
  imported: number;
  unmatched: number;
};

type FilterState = {
  nisn: string;
  status: string;
  startDate: string;
  endDate: string;
};

const columnHelper = createColumnHelper<AttendanceAdminRecord>();

export function PresensiPanel({ initialData, initialStartDate, initialEndDate }: PresensiPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<AttendanceAdminRecord[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [filters, setFilters] = useState<FilterState>(() => ({
    nisn: searchParams.get("nisn") ?? "",
    status: searchParams.get("status") ?? "",
    startDate: searchParams.get("startDate") ?? initialStartDate,
    endDate: searchParams.get("endDate") ?? initialEndDate,
  }));

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.nisn) params.set("nisn", filters.nisn);
    if (filters.status) params.set("status", filters.status);
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);

    const queryString = params.toString();
    router.replace(queryString ? `/admin/presensi?${queryString}` : "/admin/presensi");
  }, [filters, router]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.nisn) params.append("nisn", filters.nisn);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/admin/attendance?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal memuat data");
      }
      const payload = await response.json();
      const records = (payload.records ?? []) as AttendanceAdminRecord[];
      setData(records.map((record) => ({ ...record, name: record.name ?? null })));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("date", {
        header: "Tanggal",
        cell: (info) => <span className="font-medium text-foreground/90">{formatAttendanceDate(info.getValue())}</span>,
      }),
      columnHelper.accessor("name", {
        header: "Nama",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("nisn", {
        header: "NISN",
        cell: (info) => <span className="font-mono text-xs text-foreground/70">{info.getValue()}</span>,
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              info.getValue() === "Hadir" && "bg-emerald-500/10 text-emerald-200",
              info.getValue() === "Izin" && "bg-yellow-500/10 text-yellow-200",
              info.getValue() === "Alfa" && "bg-red-500/10 text-red-200"
            )}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Dicatat",
        cell: (info) => <span className="text-xs text-foreground/60">{formatAttendanceDateTime(info.getValue())}</span>,
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const onImportCsv = useCallback(
    async (file: File) => {
      setIsImporting(true);
      setImportResult(null);

      const text = await file.text();
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });

      const records = (result.data as Papa.ParseResult<Record<string, string>>["data"]).map((row) => ({
        nisn: (row.NISN ?? row.nisn ?? "").trim(),
        date: (row.Tanggal ?? row.date ?? "").trim(),
        status: ((row.Status ?? row.status ?? "") as "Hadir" | "Izin" | "Alfa").trim(),
      }));

      const payload = {
        records: records.filter((row) => row.nisn && row.date && STATUS_OPTIONS.some((option) => option.value === row.status || option.label === row.status)),
      };

      try {
        const response = await fetch("/api/admin/attendance/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const message = (await response.json().catch(() => ({ message: "Gagal impor" }))).message;
          setImportResult({ message, imported: 0, unmatched: 0 });
        } else {
          const json = (await response.json()) as ImportResult;
          setImportResult(json);
          fetchData();
        }
      } catch (error) {
        console.error(error);
        setImportResult({ message: "Gagal mengunggah CSV", imported: 0, unmatched: 0 });
      } finally {
        setIsImporting(false);
      }
    },
    [fetchData]
  );

  const handleExport = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.nisn) params.append("nisn", filters.nisn);
      if (filters.status) params.append("status", filters.status);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/admin/attendance/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Gagal mengekspor data");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `presensi-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  }, [filters]);

  const resetFilters = () => {
    setFilters({ nisn: "", status: "", startDate: initialStartDate, endDate: initialEndDate });
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-foreground/60">Admin Ops</p>
          <h2 className="text-3xl font-semibold text-foreground">Manajemen Presensi Mingguan</h2>
          <p className="text-sm text-muted-foreground">
            Filter, impor, dan ekspor data presensi dengan aman. Semua tindakan terekam audit log.
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
        </div>
      </div>

      <Card className="rounded-[36px] border-white/15 bg-white/12 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="flex flex-col gap-3 border-b border-white/10 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl text-foreground">Filter Presensi</CardTitle>
            <CardDescription>Gunakan pencarian cerdas untuk memantau kehadiran spesifik.</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-2 rounded-2xl border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground"
          >
            <RefreshCcw className="h-4 w-4" /> Reset
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="nisn-filter" className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                Cari NISN
              </Label>
              <Input
                id="nisn-filter"
                placeholder="Masukkan NISN"
                value={filters.nisn}
                onChange={(event) => setFilters((prev) => ({ ...prev, nisn: event.target.value }))}
                className="rounded-2xl border-white/25 bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-xs uppercase tracking-[0.3em] text-foreground/60">
                Status
              </Label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                className="h-12 rounded-2xl border border-white/25 bg-white/10 px-4 text-sm text-foreground"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1c0606]">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
                className="rounded-2xl border-white/25 bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-[0.3em] text-foreground/60">Tanggal Akhir</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
                className="rounded-2xl border-white/25 bg-white/10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[36px] border-white/15 bg-white/12 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="flex flex-col gap-2 border-b border-white/10 p-6">
          <CardTitle className="text-xl text-foreground">Data Presensi</CardTitle>
          <CardDescription>{isLoading ? "Memuat data..." : `${data.length} baris ditemukan.`}</CardDescription>
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
                {table.getRowModel().rows?.length ? (
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
                      Tidak ada data sesuai filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-muted-foreground">
              Menampilkan {table.getRowModel().rows.length} dari {data.length} hasil.
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
              <span className="text-sm text-muted-foreground">
                Halaman {table.getState().pagination.pageIndex + 1}
              </span>
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
            <DialogTitle>Import CSV Presensi</DialogTitle>
            <DialogDescription>
              Unggah file CSV dengan format kolom: <strong>NISN, Nama, Tanggal, Status</strong>. Baris
              dengan status tidak valid akan diabaikan.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="upload">
            <TabsList className="mb-4">
              <TabsTrigger value="upload" className="flex items-center gap-2 text-sm">
                <Upload className="h-4 w-4" /> Upload CSV
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2 text-sm">
                <Filter className="h-4 w-4" /> Template
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                disabled={isImporting}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImportCsv(file);
                    event.target.value = "";
                  }
                }}
              />
              {importResult ? (
                <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white">
                  <p>{importResult.message}</p>
                  <p className="text-xs text-white/70">
                    Diimpor: {importResult.imported} • Tidak cocok: {importResult.unmatched}
                  </p>
                </div>
              ) : null}
            </TabsContent>
            <TabsContent value="template" className="space-y-4 text-sm text-white/80">
              <p>Struktur CSV:</p>
              <pre className="rounded-2xl border border-white/20 bg-[#1f0606] p-4 text-xs text-white/80">
NISN,Nama,Tanggal,Status
12000123,Andi Pratama,2025-10-01,Hadir
12000456,Sinta Dewi,2025-10-01,Izin
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
    </motion.div>
  );
}
