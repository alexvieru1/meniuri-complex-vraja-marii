import { NextResponse } from 'next/server'
import { getSession, destroySession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Health check for the current admin session (used by the navbar/pages)
export async function GET() {
  const session = await getSession()
  const res = NextResponse.json(
    session ? { ok: true, email: session.email } : { ok: false },
    { status: session ? 200 : 401 }
  )
  res.headers.set('Cache-Control', 'no-store')
  return res
}

// Optional: allow logging out by calling DELETE /api/admin/session
export async function DELETE() {
  await destroySession()
  const res = new NextResponse(null, { status: 204 })
  res.headers.set('Cache-Control', 'no-store')
  return res
}