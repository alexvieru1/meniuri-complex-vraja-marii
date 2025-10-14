import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { $Enums, type Unit } from "@prisma/client";
import { DEFAULT_UNIT } from "@/lib/unit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeUnit(input: string | undefined | null): Unit | null {
  if (!input) return null;

  const enums = Object.values($Enums.Unit) as string[];

  const canonical = (raw: string) =>
    raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

  const up = canonical(input);

  const BUC = enums.includes("BUCATA") ? "BUCATA" : enums.includes("BUC") ? "BUC" : null;
  const ML  = enums.includes("ML") ? "ML" : enums.includes("MILLILITER") ? "MILLILITER" : null;

  const map: Record<string, string> = {
    G: "GRAM",
    GR: "GRAM",
    GRAM: "GRAM",
    GRAMS: "GRAM",
    GRAMAJ: "GRAM",

    ML: ML ?? "ML",
    MIL: ML ?? "ML",
    MILLILITER: ML ?? "MILLILITER",
    MILLILITERS: ML ?? "MILLILITER",
    MILLILITRE: ML ?? "MILLILITER",
    MILLILITRES: ML ?? "MILLILITER",
    MILILITRU: ML ?? "MILLILITER",
    MILILITRI: ML ?? "MILLILITER",

    BUC: BUC ?? "BUC",
    BUCATA: BUC ?? "BUCATA",
    BUCATI: BUC ?? "BUCATA",
  };

  const target = map[up] ?? up;
  return enums.includes(target) ? (target as Unit) : null;
}

export async function GET() {
  const data = await prisma.dish.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body?.name ?? "").trim();
  const gramajNum = Number(body?.gramaj);
  const unitIn = body?.unit as string | undefined;

  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  if (!Number.isFinite(gramajNum) || gramajNum <= 0) {
    return NextResponse.json({ error: "Invalid gramaj" }, { status: 400 });
  }

  let unit: Unit | null = null;
  if (unitIn != null) {
    unit = normalizeUnit(unitIn);
    if (!unit) {
      return NextResponse.json(
        { error: "Invalid unit", allowed: Object.values($Enums.Unit) },
        { status: 400 }
      );
    }
  } else {
    unit = DEFAULT_UNIT as Unit; // default only when omitted
  }

  const created = await prisma.dish.create({
    data: {
      name,
      gramaj: Math.trunc(gramajNum),
      unit, // normalized & guaranteed valid
    },
  });

  return NextResponse.json(created, { status: 201, headers: { "Cache-Control": "no-store" } });
}
