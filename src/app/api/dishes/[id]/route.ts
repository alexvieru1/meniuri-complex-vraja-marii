import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { $Enums, type Unit } from "@prisma/client";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Normalize various UI/unit synonyms to the actual Prisma enum value present in the DB
function normalizeUnit(input: string): Unit | null {
  // Actual enum values in the generated Prisma Client (e.g. ['GRAM','ML','BUCATA'] or ['GRAM','MILLILITER','BUC'])
  const enums = Object.values($Enums.Unit) as string[];

  // Utility: strip diacritics & non-alphanumerics, then uppercase
  const canonical = (raw: string) =>
    raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .replace(/[^a-zA-Z0-9]/g, '') // keep only letters/numbers
      .toUpperCase();

  const up = canonical(input);

  // Detect which variants exist in THIS project
  const BUC_VARIANT =
    enums.includes('BUCATA') ? 'BUCATA' : enums.includes('BUC') ? 'BUC' : null;
  const ML_VARIANT =
    enums.includes('ML') ? 'ML' : enums.includes('MILLILITER') ? 'MILLILITER' : null;

  // Accept common synonyms/shortcuts; map to canonical tokens
  const map: Record<string, string> = {
    // grams
    G: 'GRAM',
    GR: 'GRAM',
    GRAM: 'GRAM',
    GRAMAJ: 'GRAM',
    GRAMS: 'GRAM',
    GRAMME: 'GRAM',
    GRAMMES: 'GRAM',

    // milliliters
    ML: ML_VARIANT ?? 'ML',
    MIL: ML_VARIANT ?? 'ML',
    MILLILITRU: ML_VARIANT ?? 'ML',
    MILLILITRI: ML_VARIANT ?? 'ML',
    MILILITRU: ML_VARIANT ?? 'ML',
    MILILITRI: ML_VARIANT ?? 'ML',
    MILLILITER: ML_VARIANT ?? 'MILLILITER',
    MILLILITERS: ML_VARIANT ?? 'MILLILITER',
    MILLILITRE: ML_VARIANT ?? 'MILLILITER',
    MILLILITRES: ML_VARIANT ?? 'MILLILITER',

    // pieces
    BUC: BUC_VARIANT ?? 'BUC',
    BUCATA: BUC_VARIANT ?? 'BUCATA',
    BUCI: BUC_VARIANT ?? 'BUCATA',
    BUCATI: BUC_VARIANT ?? 'BUCATA',
  };

  const target = map[up] ?? up;

  // Only return if it matches one of the enum values from the generated client
  return enums.includes(target) ? (target as Unit) : null;
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dishId = Number(id);
    if (!dishId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    // Remove dependent rows first to avoid constraint errors
    await prisma.menuItem.deleteMany({ where: { dishId } });
    await prisma.dish.delete({ where: { id: dishId } });

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dishId = Number(id);
    if (!dishId) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const body = await req.json();
    const { name, gramaj, unit, displayGramaj } = body as {
      name?: string;
      gramaj?: number | string;
      unit?: Unit | string;
      displayGramaj?: string | null;
    };

    const data: { name?: string; gramaj?: number; unit?: Unit; displayGramaj?: string | null } = {};

    if (typeof name === 'string' && name.trim()) {
      data.name = name.trim();
    }

    if (typeof gramaj !== 'undefined' && gramaj !== null && `${gramaj}`.trim() !== '') {
      const g = Number(gramaj);
      if (!Number.isFinite(g) || g < 0) {
        return NextResponse.json({ error: 'Invalid gramaj' }, { status: 400 });
      }
      data.gramaj = Math.trunc(g);
    }

    if (typeof unit === 'string') {
      const norm = normalizeUnit(unit);
      if (!norm) {
        const allowed = Object.values($Enums.Unit);
        return NextResponse.json(
          { error: 'Invalid unit', allowed },
          { status: 400 }
        );
      }
      data.unit = norm;
    }

    if (typeof displayGramaj !== 'undefined') {
      const s = (displayGramaj ?? '').toString().trim();
      data.displayGramaj = s.length ? s : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const updated = await prisma.dish.update({ where: { id: dishId }, data });
    return NextResponse.json(updated, { headers: { 'Cache-Control': 'no-store' } });
  } catch (_err) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}