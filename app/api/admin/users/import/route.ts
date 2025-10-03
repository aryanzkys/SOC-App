import { NextRequest, NextResponse } from "next/server";

import { requireSession } from "@/lib/auth";
import { recordAuditLog, resolveAuditActor } from "@/lib/audit";
import { supabaseServerClient } from "@/lib/supabase";
import { hashToken } from "@/lib/token";

const MIN_TOKEN_LENGTH = 8;
const NISN_PATTERN = /^[0-9]{5,20}$/;
const NAME_SAFE_PATTERN = /[^A-Za-zÀ-ÖØ-öø-ÿ\s'.-]/g;

type ImportRow = {
  nisn: string;
  name?: string | null;
  token: string;
  isAdmin?: boolean;
};

type ImportPayload = {
  records: ImportRow[];
};

export async function POST(request: NextRequest) {
  const { session, response } = requireSession(request);
  if (!session) {
    return response;
  }

  if (!session.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let payload: ImportPayload;

  try {
    payload = (await request.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  if (!Array.isArray(payload.records) || payload.records.length === 0) {
    return NextResponse.json({ message: "No data to import" }, { status: 400 });
  }

  const deduped = new Map<string, ImportRow>();
  let rejected = 0;

  for (const record of payload.records) {
    const nisnRaw = typeof record.nisn === "string" ? record.nisn.trim() : "";
    const tokenRaw = typeof record.token === "string" ? record.token.trim() : "";
    const nameRaw = typeof record.name === "string" ? record.name.trim() : null;
    const isAdminFlag = typeof record.isAdmin === "boolean" ? record.isAdmin : false;

    if (!NISN_PATTERN.test(nisnRaw) || tokenRaw.length < MIN_TOKEN_LENGTH) {
      rejected += 1;
      continue;
    }

    const safeName = nameRaw ? nameRaw.replace(NAME_SAFE_PATTERN, "").replace(/\s+/g, " ").trim() : null;

    deduped.set(nisnRaw, {
      nisn: nisnRaw,
      name: safeName,
      token: tokenRaw,
      isAdmin: isAdminFlag,
    });
  }

  const sanitized = Array.from(deduped.values());

  if (sanitized.length === 0) {
    return NextResponse.json({ message: "No valid rows" }, { status: 400 });
  }

  const nisns = [...new Set(sanitized.map((row) => row.nisn))];

  const { data: existing } = await supabaseServerClient
    .from("users")
    .select("id, nisn")
    .in("nisn", nisns);

  const existingMap = new Map((existing ?? []).map((item) => [item.nisn, item] as const));

  const upsertRows: Array<{ nisn: string; name: string | null; token_hash: string; is_admin: boolean }> = [];
  let created = 0;
  let updated = 0;

  for (const row of sanitized) {
    const tokenHash = await hashToken(row.token);
    const isExisting = existingMap.has(row.nisn);
    if (isExisting) {
      updated += 1;
    } else {
      created += 1;
    }

    upsertRows.push({
      nisn: row.nisn,
      name: row.name ?? null,
      token_hash: tokenHash,
      is_admin: row.isAdmin ?? false,
    });
  }

  const { error } = await supabaseServerClient
    .from("users")
    .upsert(upsertRows, { onConflict: "nisn" });

  if (error) {
    return NextResponse.json({ message: "Failed to import users" }, { status: 500 });
  }

  const { actorName, actorNisn } = await resolveAuditActor(session.sub, session.nisn);
  await recordAuditLog({
    actorId: session.sub,
    actorName,
    actorNisn,
    action: "users_import",
    metadata: {
      received: payload.records.length,
      processed: upsertRows.length,
      created,
      updated,
      rejected,
    },
  });

  return NextResponse.json({
    message: "Users imported",
    processed: upsertRows.length,
    created,
    updated,
    rejected,
  });
}
