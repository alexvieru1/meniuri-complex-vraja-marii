import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const COOKIE_NAME = 'session_token'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

const sessions = new Map<string, { email: string }>()

export async function createSession(email: string, res: NextResponse) {
  const token = randomBytes(64).toString('hex')
  sessions.set(token, { email })

  const jar = res.cookies

  // Proactively clear legacy cookies that might have been set on a narrower path
  try { jar.set(COOKIE_NAME, '', { path: '/admin', maxAge: 0 }) } catch {}
  try { jar.set(COOKIE_NAME, '', { path: '/', maxAge: 0 }) } catch {}

  jar.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return token
}

export async function getSession(req?: NextRequest) {
  let token: string | undefined
  if (req) {
    token = req.cookies.get(COOKIE_NAME)?.value
  }
  if (!token) return null
  return sessions.get(token) || null
}

export async function destroySession(req: NextRequest, res: NextResponse) {
  const token = req.cookies.get(COOKIE_NAME)?.value
  if (token) {
    sessions.delete(token)
  }
  res.cookies.delete(COOKIE_NAME)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  const res = NextResponse.json(
    session ? { ok: true, email: session.email } : { ok: false },
    { status: session ? 200 : 401 }
  )
  res.headers.set('Cache-Control', 'no-store')
  return res
}