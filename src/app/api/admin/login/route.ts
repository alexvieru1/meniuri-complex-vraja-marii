import { NextResponse } from "next/server";
import { createSession, COOKIE_NAME, getCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectTo(path: string, request: Request, status: number) {
  const location = new URL(path, request.url);
  const res = NextResponse.redirect(location, status);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "Cookie");
  return res;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const expectedEmail = process.env.ADMIN_EMAIL || "";
  const expectedPass = process.env.ADMIN_PASS || "";

  if (email !== expectedEmail || password !== expectedPass) {
    return redirectTo("/admin/login?e=1", request, 303);
  }

  const token = await createSession(email);
  const res = redirectTo("/admin/dishes", request, 303);
  res.cookies.set(COOKIE_NAME, token, getCookieOptions());
  return res;
}
