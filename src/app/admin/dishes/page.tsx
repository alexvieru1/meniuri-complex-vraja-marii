"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconTrash,
  IconPlus,
  IconSearch,
  IconPencil,
  IconX,
  IconCheck,
} from "@tabler/icons-react";

type Dish = { id: number; name: string; gramaj: number };

export default function DishesPage() {
  const normalizeRo = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ș|ş/g, "s")
      .replace(/ț|ţ/g, "t")
      .replace(/ă/g, "a")
      .replace(/â/g, "a")
      .replace(/î/g, "i");

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [name, setName] = useState("");
  const [gramaj, setGramaj] = useState<string>("");
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        if (!res.ok) window.location.href = "/admin/login";
      } catch {
        window.location.href = "/admin/login";
      }
    })();
  }, []);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGramaj, setEditGramaj] = useState<string>("");

  async function load() {
    const res = await fetch("/api/dishes", { cache: "no-store" });
    const data = (await res.json()) as Dish[];
    setDishes(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeRo(query.trim());
    if (!q) return dishes;
    return dishes.filter((d) => normalizeRo(d.name).includes(q));
  }, [dishes, query]);

  async function handleCreate() {
    if (!name || !gramaj) return;
    startTransition(async () => {
      await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, gramaj: Number(gramaj) }),
      });
      setName("");
      setGramaj("");
      await load();
    });
  }

  async function handleDelete(id: number) {
    startTransition(async () => {
      await fetch(`/api/dishes/${id}`, { method: "DELETE" });
      await load();
    });
  }

  function startEdit(d: Dish) {
    setEditingId(d.id);
    setEditName(d.name);
    setEditGramaj(String(d.gramaj));
  }

  async function handleSave(id: number) {
    if (!editName || !editGramaj) return;
    startTransition(async () => {
      await fetch(`/api/dishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, gramaj: Number(editGramaj) }),
      });
      setEditingId(null);
      setEditName("");
      setEditGramaj("");
      await load();
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
              Administrare feluri
            </h1>
            <p className="text-sm text-zinc-500">
              Adaugă, caută și șterge feluri de mâncare.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {dishes.length} total
          </Badge>
        </div>

        {/* Add form */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Adaugă un fel de mâncare
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <Input
              placeholder="Nume (ex: Supă de pui)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Gramaj (g)"
              value={gramaj}
              onChange={(e) => setGramaj(e.target.value)}
            />
            <Button
              onClick={handleCreate}
              disabled={!name || !gramaj || isPending}
              className="inline-flex items-center justify-center gap-2"
            >
              <IconPlus size={18} />
              Adaugă
            </Button>
          </CardContent>
        </Card>

        {/* Search & list */}
        <Card className="shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Lista felurilor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <IconSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                size={18}
              />
              <Input
                className="pl-10"
                placeholder="Caută după nume (diacritice opționale)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                Nu s-au găsit rezultate.
              </p>
            ) : (
              <ul className="divide-y">
                {filtered.map((d) => (
                  <li
                    key={d.id}
                    className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="w-full">
                      {editingId === d.id ? (
                        <div className="grid w-full gap-2 sm:grid-cols-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={editGramaj}
                            onChange={(e) => setEditGramaj(e.target.value)}
                          />
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-zinc-800">{d.name}</p>
                          <p className="text-sm text-zinc-500">{d.gramaj} g</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === d.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleSave(d.id)}
                            className="gap-2"
                          >
                            <IconCheck size={16} /> Salvează
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setEditName("");
                              setEditGramaj("");
                            }}
                            className="gap-2"
                          >
                            <IconX size={16} /> Anulează
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(d)}
                            className="gap-2"
                          >
                            <IconPencil size={16} /> Editează
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(d.id)}
                            className="gap-2"
                          >
                            <IconTrash size={16} /> Șterge
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
