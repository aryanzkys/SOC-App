import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/auth/admin-login-form";
import { getSessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin Login | SOC App",
};

export default async function AdminLoginPage() {
  const session = await getSessionFromCookies();

  if (session?.is_admin) {
    redirect("/admin");
  }

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.22),transparent_65%)] px-6 py-20 sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_25%,rgba(255,255,255,0.18),transparent_60%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.55),transparent_65%)]" />
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-between">
        <section className="max-w-xl space-y-6 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-4 py-2 text-xs uppercase tracking-[0.4em] text-[#8B0000] shadow-[0_15px_40px_rgba(139,0,0,0.3)]">
            Admin Command Gate
          </p>
          <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
            Secure the SOC core with dedicated admin access.
          </h1>
          <p className="text-lg text-muted-foreground">
            Only verified administrators may enter this console. Authentication logs and session signatures ensure every privileged action is accountable.
          </p>
          <div className="grid gap-3 text-sm text-muted-foreground/80">
            <p>• Default Admin ID: <strong>admin12345</strong></p>
            <p>• Default Password: <strong>87654321</strong> (change it after first login)</p>
            <p>• Password updates sync instantly through the Profile tab.</p>
          </div>
        </section>

        <AdminLoginForm />
      </div>
    </div>
  );
}
