"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { Unit } from "@prisma/client";

export async function createDish(
  name: string,
  gramaj: number | string,
  unit: Unit = "GRAM",
  displayGramaj?: string
) {
  if (!name) return { success: false, message: "Numele este obligatoriu." };

  const gramajNum =
    typeof gramaj === "number"
      ? gramaj
      : Number(String(gramaj).replace(",", ".").trim());

  if (!Number.isFinite(gramajNum) || gramajNum <= 0) {
    return { success: false, message: "Gramajul trebuie să fie un număr pozitiv." };
  }

  try {
    await prisma.dish.create({
      data: {
        name: name.trim(),
        gramaj: Math.round(gramajNum),
        unit,
        displayGramaj: displayGramaj?.trim() || null,
      },
    });
    revalidatePath("/admin/dishes");
    return { success: true, message: "Preparatul a fost adăugat cu succes." };
  } catch (error) {
    console.error("❌ createDish error:", error);
    return { success: false, message: "Eroare la adăugarea preparatului." };
  }
}

export async function deleteDish(id: number) {
  try {
    await prisma.dish.delete({ where: { id } });
    revalidatePath("/admin/dishes");
    return { success: true, message: "Preparatul a fost șters." };
  } catch (error) {
    console.error("❌ deleteDish error:", error);
    return { success: false, message: "Eroare la ștergere." };
  }
}