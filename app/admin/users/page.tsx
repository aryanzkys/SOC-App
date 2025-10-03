import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UsersPanel } from "@/components/admin/users-panel";
import { getSessionFromCookies } from "@/lib/auth";
import { supabaseServerClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Admin Panel | SOC App",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/admin/login");
  }

  if (!session.is_admin) {
    redirect("/dashboard");
  }

  const { data: users } = await supabaseServerClient
    .from("users")
    .select("id, nisn, name, is_admin")
    .order("nisn", { ascending: true });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(139,0,0,0.16),transparent_62%)] px-6 pb-24 pt-16 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(139,0,0,0.45),transparent_55%)]" />
      <div className="mx-auto w-full max-w-6xl">
        <UsersPanel users={users ?? []} />
      </div>
    </div>
  );
}
