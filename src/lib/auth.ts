import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";

type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
  expires: Date;
  domain?: string;
};

type CookieDeleteOptions = {
  path: string;
  domain?: string;
};

export const COOKIE_NAME = "admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw new Error("ADMIN_SECRET is not set");
  return secret;
}

function normalizeDomain(value: string | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "localhost") return undefined;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return undefined;
    }
  }
  return trimmed.split(":")[0];
}

const COOKIE_DOMAIN =
  normalizeDomain(process.env.COOKIE_DOMAIN) ||
  normalizeDomain(process.env.ADMIN_COOKIE_DOMAIN) ||
  normalizeDomain(process.env.NEXT_PUBLIC_COOKIE_DOMAIN);

export function buildCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    expires: new Date(Date.now() + MAX_AGE * 1000),
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

export function buildCookieDeleteOptions(): CookieDeleteOptions {
  return {
    path: "/",
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

function signPayload(payload: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
}

export function createSessionToken(email: string) {
  const payload = JSON.stringify({
    email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  });
  const sig = signPayload(payload);
  return `${Buffer.from(payload).toString("base64url")}.${sig}`;
}

export async function getSession(): Promise<{ email: string } | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [b64, sig] = raw.split(".");
  if (!b64 || !sig) return null;

  let payload: string;
  try {
    payload = Buffer.from(b64, "base64url").toString();
  } catch {
    return null;
  }

  const expected = signPayload(payload);
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");

  if (
    sigBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  let data: { email: string; exp: number };
  try {
    data = JSON.parse(payload) as { email: string; exp: number };
  } catch {
    return null;
  }

  if (data.exp * 1000 < Date.now()) return null;
  return { email: data.email };
}
