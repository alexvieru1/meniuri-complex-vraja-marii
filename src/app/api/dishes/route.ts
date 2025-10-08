import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const dishes = await prisma.dish.findMany({ orderBy: { name: 'asc' } })
    const res = NextResponse.json(dishes)
    res.headers.set('Cache-Control', 'no-store')
    return res
  } catch (err) {
    console.error('GET /api/dishes failed', err)
    return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, gramaj } = await req.json()
  if (!name || !gramaj) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const created = await prisma.dish.create({ data: { name, gramaj: Number(gramaj) } })
  return NextResponse.json(created, { status: 201 })
}