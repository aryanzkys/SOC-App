import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { getSessionFromCookies } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | SOC App",
};

export default async function LoginPage() {
  const session = await getSessionFromCookies();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.18),transparent_65%)] px-6 py-20 sm:px-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.16),transparent_55%),radial-gradient(circle_at_85%_10%,rgba(139,0,0,0.5),transparent_65%)]" />
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:items-start lg:justify-between">
        <section className="max-w-xl space-y-6 text-center lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-4 py-2 text-xs uppercase tracking-[0.4em] text-[#8B0000] shadow-[0_15px_40px_rgba(139,0,0,0.3)]">
            SMANESI Olympiad Club Access
          </p>
          <h1 className="text-balance text-4xl font-semibold text-foreground sm:text-5xl lg:text-6xl">
            Authenticate securely. Command with absolute clarity.
          </h1>
          <p className="text-lg text-muted-foreground">
            Dual-factor credentials ensure that every action is traceable and sovereign. Use your NISN and security token to step back into mission control.
          </p>
        <div className="grid gap-3 text-sm text-muted-foreground/80">
            <p>• Tokens are securely updated right away using bcrypt hashing.</p>
            <p>• Sessions stay active for 8 hours, protected with tamper-proof JWT signatures.</p>
            <p>• Your data is always encrypted and kept private.</p>
        </div>

        </section>

        <div className="w-full max-w-xl">
          <LoginForm />
          <p className="mt-6 text-center text-sm text-muted-foreground/80 lg:text-left">
            Administrator?{" "}
            <Link href="/admin/login" className="font-semibold text-[#8B0000] underline-offset-4 hover:underline">
              Buka gerbang admin khusus
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
