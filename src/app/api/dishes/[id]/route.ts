import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const dishId = Number(id);
  if (!dishId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  await prisma.dish.delete({ where: { id: dishId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const dishId = Number(id);
  if (!dishId)
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { name, gramaj } = await req.json();
  const data: { name?: string; gramaj?: number } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof gramaj !== "undefined") data.gramaj = Number(gramaj);
  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  const updated = await prisma.dish.update({ where: { id: dishId }, data });
  return NextResponse.json(updated);
}
