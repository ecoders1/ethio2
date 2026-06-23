import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/jwt";

const publicPaths = ["/", "/auth/signin", "/auth/signup"];
const apiPublicPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/me"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname === p)) return NextResponse.next();
  if (apiPublicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Check auth token
  const token = req.cookies.get("eee_token")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  const payload = await verifyJWT(token);
  if (!payload) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Admin path protection
  if (pathname.startsWith("/admin") && !payload.isAdmin) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json).*)",
  ],
};
