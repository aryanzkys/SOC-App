import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";

import { signSession, verifySession, type SessionPayload } from "@/lib/jwt";

const SESSION_COOKIE_NAME = "session";

export function createSessionResponse({
  payload,
  response,
}: {
  payload: Omit<SessionPayload, "exp">;
  response: NextResponse;
}) {
  const token = signSession(payload);
  const cookie = serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    sameSite: "strict",
    priority: "high",
    maxAge: 60 * 60 * 8,
  });

  response.headers.append("Set-Cookie", cookie);
  return response;
}

export function clearSession(response: NextResponse) {
  const cookie = serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    path: "/",
    sameSite: "strict",
    maxAge: 0,
  });
  response.headers.append("Set-Cookie", cookie);
  return response;
}

export function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return verifySession(token);
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    return verifySession(token);
  } catch {
    return null;
  }
}

export function requireSession(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) {
    return { session: null, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }
  return { session, response: null };
}

export { SESSION_COOKIE_NAME };
