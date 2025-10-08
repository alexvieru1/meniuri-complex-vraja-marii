import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, destroySession, COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store')
  // Avoid any accidental caching layers that ignore Cache-Control
  res.headers.set('Vary', 'Cookie')
  return res
}

// Health check for the current admin session (used by the navbar/pages)
export async function GET() {
  // Read the raw cookie as a diagnostic to distinguish "cookie not sent" vs "token invalid"
  const jar = cookies()
  const raw = (await jar).get(COOKIE_NAME)?.value ?? null

  const session = await getSession()

  // Only include debug fields when explicitly enabled in the environment
  const body = process.env.DEBUG_SESSION === '1'
    ? { ok: !!session, email: session?.email, rawCookiePresent: !!raw }
    : session
    ? { ok: true, email: session.email }
    : { ok: false }

  const res = NextResponse.json(body, { status: session ? 200 : 401 })
  return withNoStore(res)
}

// Optional: allow logging out by calling DELETE /api/admin/session
export async function DELETE() {
  await destroySession()
  const res = new NextResponse(null, { status: 204 })
  return withNoStore(res)
}