import { supabaseServerClient } from "@/lib/supabase";

export type AuditAction =
  | "attendance_export"
  | "attendance_import"
  | "attendance_update"
  | "users_export"
  | "users_import"
  | "token_reset"
  | "user_create";

type AuditMetadata = Record<string, unknown>;

type RecordAuditLogParams = {
  actorId: string;
  actorNisn?: string | null;
  actorName?: string | null;
  action: AuditAction;
  metadata?: AuditMetadata;
};

export async function recordAuditLog({
  actorId,
  actorNisn,
  actorName,
  action,
  metadata = {},
}: RecordAuditLogParams) {
  const { error } = await supabaseServerClient.from("admin_audit_logs").insert({
    actor_id: actorId,
    actor_nisn: actorNisn ?? null,
    actor_name: actorName ?? null,
    action,
    metadata,
  });

  if (error) {
    console.error("Failed to record audit log", error);
  }
}

type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_nisn: string | null;
  actor_name: string | null;
  action: AuditAction;
  metadata: AuditMetadata;
  created_at: string;
};

export async function fetchAuditLogs(limit = 10) {
  const { data, error } = await supabaseServerClient
    .from("admin_audit_logs")
    .select("id, actor_id, actor_nisn, actor_name, action, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to fetch audit logs", error);
    return [] satisfies AuditLogRow[];
  }

  return (data ?? []) as AuditLogRow[];
}

export async function resolveAuditActor(userId: string, fallbackNisn?: string | null) {
  const { data } = await supabaseServerClient
    .from("users")
    .select("name, nisn")
    .eq("id", userId)
    .maybeSingle();

  return {
    actorName: data?.name ?? null,
    actorNisn: data?.nisn ?? fallbackNisn ?? null,
  };
}
