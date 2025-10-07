import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'admin_session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function getSecret() {
  const secret = process.env.ADMIN_SECRET
  if (!secret) throw new Error('ADMIN_SECRET is not set')
  return secret
}

export async function createSession(email: string) {
  const payload = JSON.stringify({ email, exp: Math.floor(Date.now()/1000) + MAX_AGE })
  const sig = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  const token = Buffer.from(payload).toString('base64') + '.' + sig
  const jar = await cookies()
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

export async function getSession(): Promise<{ email: string } | null> {
  const jar = await cookies()
  const raw = jar.get(COOKIE_NAME)?.value
  if (!raw) return null
  const [b64, sig] = raw.split('.')
  if (!b64 || !sig) return null
  const payload = Buffer.from(b64, 'base64').toString()
  const expected = crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
  if (sig !== expected) return null
  const data = JSON.parse(payload) as { email: string; exp: number }
  if (data.exp * 1000 < Date.now()) return null
  return { email: data.email }
}