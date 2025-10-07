"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createDish(name: string, gramaj: number) {
  if (!name || !gramaj) return;
  await prisma.dish.create({
    data: { name, gramaj: Number(gramaj) },
  });
  revalidatePath("/admin/dishes");
}

export async function deleteDish(id: number) {
  await prisma.dish.delete({
    where: { id },
  });
  revalidatePath("/admin/dishes");
}
