import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ChangeTokenForm } from "@/components/profile/change-token-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionFromCookies } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Profile | SOC App",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  const { data: userRecord } = await supabaseServerClient
    .from("users")
    .select("name, nisn, is_admin")
    .eq("id", session.sub)
    .maybeSingle();

  const displayName = userRecord?.name?.trim().length ? userRecord?.name : session.nisn;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.18),transparent_60%)] px-6 pb-24 pt-16 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.12),transparent_50%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.45),transparent_65%)]" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-foreground/60">Profile</p>
          <h1 className="text-4xl font-semibold text-foreground sm:text-5xl">Credential Control Center</h1>
          <p className="max-w-2xl text-base text-muted-foreground">
            Rotate your security token with confidence. All updates are hashed instantly and recorded in the audit trail.
          </p>
        </section>

        <Card className="rounded-[36px] border-white/15 bg-white/15 p-10 shadow-[0_30px_80px_rgba(139,0,0,0.2)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
          <CardHeader className="space-y-3 p-0">
            <CardTitle className="flex flex-col gap-1 text-2xl font-semibold text-foreground">
              <span>{displayName}</span>
              <span className="text-sm font-normal text-muted-foreground">NISN • {session.nisn}</span>
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Tokens must contain at least eight characters. Avoid predictable sequences to maintain SOC-grade security.
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-8 p-0">
            <ChangeTokenForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
