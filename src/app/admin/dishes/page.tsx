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
import { Toaster, toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DEFAULT_UNIT,
  UNIT_SELECT_OPTIONS,
  formatUnitShort,
  type UnitValue,
} from "@/lib/unit";

type Dish = {
  id: number;
  name: string;
  gramaj: number;
  unit: UnitValue;
};

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

  const unitLabel = formatUnitShort;

  const [dishes, setDishes] = useState<Dish[]>([]);
  const [name, setName] = useState("");
  const [gramaj, setGramaj] = useState<string>("");
  const [unit, setUnit] = useState<UnitValue>(DEFAULT_UNIT);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) window.location.href = "/admin/login";
      } catch {
        window.location.href = "/admin/login";
      }
    })();
  }, []);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGramaj, setEditGramaj] = useState<string>("");
  const [editUnit, setEditUnit] = useState<UnitValue>(DEFAULT_UNIT);

  async function load() {
    const res = await fetch("/api/dishes", {
      cache: "no-store",
      credentials: "include",
    });
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
    const val = Number(String(gramaj).replace(",", ".").trim());
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Gramajul trebuie să fie un număr pozitiv.");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gramaj: Math.round(val),
          unit,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Fel adăugat.");
        setName("");
        setGramaj("");
        setUnit(DEFAULT_UNIT);
        await load();
      } else {
        const msg = await res.text().catch(() => "");
        toast.error(msg || "Eroare la adăugare.");
      }
    });
  }

  async function handleDelete(id: number) {
    startTransition(async () => {
      const res = await fetch(`/api/dishes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Fel șters.");
        await load();
      } else {
        toast.error("Eroare la ștergere.");
      }
    });
  }

  function startEdit(d: Dish) {
    setEditingId(d.id);
    setEditName(d.name);
    setEditGramaj(String(d.gramaj));
    setEditUnit(d.unit);
  }

  async function handleSave(id: number) {
    if (!editName || !editGramaj) return;
    const val = Number(String(editGramaj).replace(",", ".").trim());
    if (!Number.isFinite(val) || val <= 0) {
      toast.error("Gramajul trebuie să fie un număr pozitiv.");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/dishes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          gramaj: Math.round(val),
          unit: editUnit,
        }),
        credentials: "include",
      });
      if (res.ok) {
        toast.success("Modificări salvate.");
        setEditingId(null);
        setEditName("");
        setEditGramaj("");
        setEditUnit(DEFAULT_UNIT);
        await load();
      } else {
        toast.error("Eroare la salvare.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <Toaster position="bottom-right" richColors />
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
          <CardContent className="grid gap-2 sm:grid-cols-5">
            <Input
              placeholder="Nume (ex: Supă de pui)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              className="sm:col-span-2"
            />
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Gramaj"
              value={gramaj}
              onChange={(e) => setGramaj(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <Select value={unit} onValueChange={(v) => setUnit(v as UnitValue)}>
              <SelectTrigger>
                <SelectValue placeholder="Unitate" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_SELECT_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                        <div className="grid w-full gap-2 sm:grid-cols-4">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(d.id);
                            }}
                            className="sm:col-span-2"
                          />
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={editGramaj}
                            onChange={(e) => setEditGramaj(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(d.id);
                            }}
                          />
                          <Select value={editUnit} onValueChange={(v) => setEditUnit(v as UnitValue)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Unitate" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIT_SELECT_OPTIONS.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div>
                          <p className="font-medium text-zinc-800">{d.name}</p>
                          <p className="text-sm text-zinc-500">
                            {`${d.gramaj} ${unitLabel(d.unit)}`}
                          </p>
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
                              setEditUnit(DEFAULT_UNIT);
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
