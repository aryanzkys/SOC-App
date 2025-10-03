import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "session";
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable");
}

const AUTH_PAGES = ["/login", "/admin/login"];
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

  // Auth page handling
  const isAuthPage = AUTH_PAGES.some((path) => pathname === path);

  if (isAuthPage && session) {
    if (pathname === "/login") {
      // Jika user sudah login biasa → redirect ke dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (pathname === "/admin/login" && session.is_admin) {
      // Jika admin sudah login → redirect ke admin dashboard
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  // Protected pages
  const isProtectedPage = PROTECTED_PAGES.some((path) => pathname.startsWith(path));
  if (isProtectedPage && !session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Protected APIs
  const isProtectedApi = PROTECTED_APIS.some((path) => pathname.startsWith(path));
  if (isProtectedApi && !session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Admin page restriction
  if (pathname.startsWith("/admin") && session && !session.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Admin API restriction
  if (
    pathname.startsWith("/api/admin") &&
    session &&
    !session.is_admin
  ) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
