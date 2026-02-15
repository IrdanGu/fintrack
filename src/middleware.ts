import { NextRequest, NextResponse } from "next/server";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret";
const COOKIE_NAME = "fintrack_auth";

async function verifyToken(token: string): Promise<boolean> {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = token.substring(0, lastDot);
  const signature = token.substring(lastDot + 1);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(AUTH_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === signature;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page and auth API
  if (pathname === "/login" || pathname === "/api/auth") {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token || !(await verifyToken(token))) {
    // API routes return 401, pages redirect to /login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
