"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, LibraryBig, Users2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/presensi", label: "Manajemen Presensi", icon: LibraryBig },
  { href: "/admin/users", label: "Manajemen Users", icon: Users2 },
];

export function AdminLayoutShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.2),transparent_70%)] text-foreground">
      <div className="flex min-h-screen">
        <aside className="group relative hidden w-full max-w-[280px] flex-col bg-gradient-to-br from-[#360000] via-[#8B0000] to-[#360000] p-8 text-white shadow-[0_35px_80px_rgba(139,0,0,0.45)] lg:flex">
          <div className="mb-12 space-y-3">
            <p className="text-xs uppercase tracking-[0.4em] text-white/70">SOC Ops</p>
            <h1 className="text-2xl font-semibold">Admin Panel</h1>
            <p className="text-sm text-white/70">Kelola presensi dan anggota dengan presisi</p>
          </div>

          <nav className="space-y-2">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link key={href} href={href} className="block">
                  <motion.div
                    whileHover={{ x: 6 }}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
                      isActive
                        ? "bg-white/15 shadow-[0_18px_45px_rgba(255,255,255,0.2)]"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl border border-white/20 bg-white/10 p-5 text-xs text-white/70">
            Panel ini menggunakan guard Supabase untuk memastikan hanya admin yang dapat mengakses data sensitif.
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 min-h-screen px-6 pb-16 pt-16 sm:px-12 lg:px-16"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_85%_20%,rgba(139,0,0,0.35),transparent_55%)]" />
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
