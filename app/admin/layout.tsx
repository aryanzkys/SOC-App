import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminLayoutShell } from "@/components/admin/panel/layout-shell";
import { getSessionFromCookies } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/login");
  }

  if (!session.is_admin) {
    redirect("/dashboard");
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
