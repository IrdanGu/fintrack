import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

const AUTH_SECRET = process.env.AUTH_SECRET || "fallback-secret";
const APP_PASSWORD = process.env.APP_PASSWORD || "";
const COOKIE_NAME = "fintrack_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function signToken(value: string): string {
  const hmac = createHmac("sha256", AUTH_SECRET);
  hmac.update(value);
  return `${value}.${hmac.digest("hex")}`;
}

export function verifyToken(token: string): boolean {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = token.substring(0, lastDot);
  return signToken(value) === token;
}

// POST — Login
export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!APP_PASSWORD) {
    return NextResponse.json({ error: "APP_PASSWORD not configured" }, { status: 500 });
  }

  if (password !== APP_PASSWORD) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = signToken("authenticated");
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return response;
}

// DELETE — Logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
