import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const session = await getSession()
    const res = NextResponse.json(
      session ? { ok: true, email: session.email } : { ok: false },
      { status: session ? 200 : 401 }
    )
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
}