import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, buildCookieDeleteOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Clear the cookie from the request store
  const jar = await cookies();
  jar.delete(COOKIE_NAME);

  // Redirect to /admin/login on the SAME origin as the request
  // (works on localhost and on Vercel)
  const url = new URL("/admin/login", request.url);
  const res = NextResponse.redirect(url);
  res.cookies.delete({
    name: COOKIE_NAME,
    ...buildCookieDeleteOptions(),
  });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "Cookie");
  return res;
}
