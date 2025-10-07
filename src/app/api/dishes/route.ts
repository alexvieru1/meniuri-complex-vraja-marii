import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const dishes = await prisma.dish.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(dishes)
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, gramaj } = await req.json()
  if (!name || !gramaj) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const created = await prisma.dish.create({ data: { name, gramaj: Number(gramaj) } })
  return NextResponse.json(created, { status: 201 })
}