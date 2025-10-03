import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const AUTH_PAGES = ["/login"];
const PROTECTED_PAGES = ["/dashboard", "/profile", "/admin"];
const PROTECTED_APIS = [
  "/api/auth/change-token",
  "/api/attendance",
  "/api/admin/create-user",
  "/api/admin/reset-token",
  "/api/admin/users",
  "/api/admin/attendance",
];

async function readSession(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    return payload as { sub: string; nisn: string; is_admin: boolean };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request);

  const isAuthPage = AUTH_PAGES.some((path) => pathname.startsWith(path));
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isProtectedPage = PROTECTED_PAGES.some((path) => pathname.startsWith(path));
  if (isProtectedPage && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const isProtectedApi = PROTECTED_APIS.some((path) => pathname.startsWith(path));
  if (isProtectedApi && !session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (pathname.startsWith("/admin") && session && !session.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (
    PROTECTED_APIS.some((path) => pathname.startsWith(path)) &&
    session &&
    !session.is_admin &&
    pathname.startsWith("/api/admin")
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
