"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
// near the imports in src/app/page.tsx
type PdfDownloadProps = {
  date: string;
  menu: Record<MenuKey, Record<MealKey, Dish[]>>;
};

// use a relative import so TS definitely finds the file
const PdfDownload = dynamic<PdfDownloadProps>(
  () => import("../components/pdf-download").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="flex-1 py-3 text-sm font-medium disabled:bg-primary disabled:text-primary-foreground disabled:hover:bg-primary disabled:hover:text-primary-foreground">
        Descarcă PDF
      </Button>
    ),
  }
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconSearch, IconTrash, IconPlus, IconCalendar } from "@tabler/icons-react";
import { useReactToPrint } from "react-to-print";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format, startOfToday } from "date-fns";
import { ro } from "date-fns/locale";
import { formatUnitShort, type MaybeUnitValue } from "@/lib/unit";

// --- Types ---
export type Dish = {
  id: number;
  name: string;
  gramaj: number;
  unit?: MaybeUnitValue;
  displayGramaj?: string | null;
};
const unitLabel = formatUnitShort;

type MealKey = "mic_dejun" | "pranz" | "cina";
type MenuKey = "normal" | "diabetic" | "hepato_gastro";

const MEAL_LABEL: Record<MealKey, string> = {
  mic_dejun: "Mic dejun",
  pranz: "Prânz",
  cina: "Cină",
};

const MENU_LABEL: Record<MenuKey, string> = {
  normal: "Normal",
  diabetic: "Diabetic",
  hepato_gastro: "Hepato-gastro-intestinal",
};

const MENU_STYLE: Record<MenuKey, { bg: string; border: string }> = {
  normal: {
    bg: "bg-yellow-100 print:bg-yellow-100",
    border: "border-yellow-300",
  },
  diabetic: {
    bg: "bg-rose-100 print:bg-rose-100",
    border: "border-rose-300",
  },
  hepato_gastro: {
    bg: "bg-sky-100 print:bg-sky-100",
    border: "border-sky-300",
  },
};

const MENU_PRINT: Record<MenuKey, { bg: string; border: string }> = {
  normal: { bg: "#FEF3C7", border: "#FCD34D" }, // yellow-100 / yellow-300
  diabetic: { bg: "#FFE4E6", border: "#FDA4AF" }, // rose-100 / rose-300
  hepato_gastro: { bg: "#E0F2FE", border: "#7DD3FC" }, // sky-100 / sky-300
};

const LIMITS: Record<MealKey, number> = {
  mic_dejun: 10,
  pranz: 5,
  cina: 5,
};

// diacritics-insensitive normalizer (RO)
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

const formatRomanianDate = (value: Date) => {
  const base = format(value, "d MMMM yyyy", { locale: ro });
  const parts = base.split(" ");
  if (parts.length < 3) return base;
  const [day, month, ...rest] = parts;
  const capitalizedMonth =
    month.charAt(0).toUpperCase() + month.slice(1);
  return [day, capitalizedMonth, ...rest].join(" ");
};

export default function Home() {
  const [date, setDate] = useState(""); // ex: 2025-10-08 or free text like "8 Octombrie 2025"
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const today = startOfToday();

  // Menu state: menu -> meal -> Dish[]
  const [menu, setMenu] = useState<Record<MenuKey, Record<MealKey, Dish[]>>>(
    () => ({
      normal: { mic_dejun: [], pranz: [], cina: [] },
      diabetic: { mic_dejun: [], pranz: [], cina: [] },
      hepato_gastro: { mic_dejun: [], pranz: [], cina: [] },
    })
  );

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const printableRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `Meniuri_${date || new Date().toISOString().slice(0, 10)}`,
    pageStyle: `@page { size: A4 landscape; margin: 12mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }`,
  });

  // Load dishes from API (authorized endpoint)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/dishes`, { cache: 'no-store' })
        if (!res.ok) {
          console.error('Failed to load dishes', res.status, await res.text())
          return
        }
        const data = (await res.json()) as Dish[]
        setAllDishes(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error('Error fetching dishes', err)
      }
    })();
  }, []);

  function addDish(toMenu: MenuKey, toMeal: MealKey, dish: Dish) {
    setMenu((prev) => {
      const current = prev[toMenu][toMeal];
      const limit = LIMITS[toMeal];
      if (current.find((x) => x.id === dish.id)) return prev; // no duplicates
      if (current.length >= limit) return prev; // reached limit
      return {
        ...prev,
        [toMenu]: {
          ...prev[toMenu],
          [toMeal]: [...current, dish],
        },
      };
    });
  }

  function removeDish(fromMenu: MenuKey, fromMeal: MealKey, dishId: number) {
    setMenu((prev) => ({
      ...prev,
      [fromMenu]: {
        ...prev[fromMenu],
        [fromMeal]: prev[fromMenu][fromMeal].filter((d) => d.id !== dishId),
      },
    }));
  }

  // Search + add widget (each meal has its own input & results)
  function SearchAdd({ toMenu, toMeal }: { toMenu: MenuKey; toMeal: MealKey }) {
    const [localQuery, setLocalQuery] = useState("");

    const localFiltered = useMemo(() => {
      const q = normalizeRo(localQuery.trim());
      if (!q) return [];
      return allDishes
        .filter((d) => normalizeRo(d.name).includes(q))
        .slice(0, 25);
    }, [allDishes, localQuery]);

    const list = menu[toMenu][toMeal];
    const limit = LIMITS[toMeal];

    return (
      <div className="space-y-3">
        {/* Selected list */}
        {list.length === 0 ? (
          <p className="text-sm text-zinc-500">Niciun fel adăugat încă.</p>
        ) : (
          <ul className="space-y-4">
            {list.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between rounded-md border p-4"
              >
                <div>
                  <p className="font-medium leading-none">{d.name}</p>
                  <p className="text-xs text-zinc-500">
                    {d.displayGramaj && d.displayGramaj.trim() ? d.displayGramaj.trim() : d.gramaj} {unitLabel(d.unit)}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeDish(toMenu, toMeal, d.id)}
                  className="gap-2"
                >
                  <IconTrash size={16} /> Șterge
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Search input */}
        <div className="relative">
          <IconSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />
          <Input
            className="pl-10"
            placeholder="Caută fel (diacritice opționale)"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
          />
        </div>

        {/* Results appear only if there is a query */}
        {localQuery.trim() && (
          <div className="max-h-48 overflow-auto rounded-md border">
            {localFiltered.length === 0 ? (
              <p className="p-3 text-sm text-zinc-500">Niciun rezultat.</p>
            ) : (
              <ul className="divide-y">
                {localFiltered.map((d) => {
                  const disabled =
                    menu[toMenu][toMeal].some((x) => x.id === d.id) ||
                    menu[toMenu][toMeal].length >= LIMITS[toMeal];
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <p className="text-xs text-zinc-500">
                          {d.displayGramaj && d.displayGramaj.trim() ? d.displayGramaj.trim() : d.gramaj} {unitLabel(d.unit)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={disabled}
                        onClick={() => addDish(toMenu, toMeal, d)}
                        className="gap-2"
                      >
                        <IconPlus size={16} /> Adaugă
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="text-right text-xs text-zinc-500">
          {list.length}/{limit} feluri
        </div>
      </div>
    );
  }

  function MenuCard({ menuKey }: { menuKey: MenuKey }) {
    return (
      <Card
        className={`rounded-xl border shadow-sm print:shadow-none ${MENU_STYLE[menuKey].bg} ${MENU_STYLE[menuKey].border}`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">
              {MENU_LABEL[menuKey]}
            </CardTitle>
            <Badge variant="secondary">
              {Object.values(menu[menuKey]).reduce((a, b) => a + b.length, 0)}{" "}
              feluri
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3 p-4 sm:p-6">
          {(Object.keys(MEAL_LABEL) as MealKey[]).map((meal) => (
            <div key={meal} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{MEAL_LABEL[meal]}</h3>
                <Badge variant="outline" className="text-[11px]">
                  max {LIMITS[meal]}
                </Badge>
              </div>
              <SearchAdd toMenu={menuKey} toMeal={meal} />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-800">
              Meniul zilei
            </h1>
            <p className="text-sm text-zinc-500">
              Selectează data, caută feluri și adaugă-le la mesele zilei.
            </p>
          </div>
        </div>

        {/* Date + actions */}
        <Card className="rounded-xl shadow-sm">
        <CardContent className="grid gap-3 pt-6 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-sm text-zinc-600">
                Data meniului
              </label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex w-full max-w-sm items-center justify-between gap-2 text-left font-normal"
                  >
                    <span className={`flex-1 truncate ${date ? "" : "text-zinc-500"}`}>
                      {date || "Selectează data"}
                    </span>
                    <IconCalendar size={18} className="text-zinc-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    defaultMonth={selectedDate ?? today}
                    onSelect={(day) => {
                      if (!day) {
                        setSelectedDate(undefined);
                        setDate("");
                        return;
                      }
                      setSelectedDate(day);
                      setDate(formatRomanianDate(day));
                      setCalendarOpen(false);
                    }}
                    locale={ro}
                    initialFocus
                    disabled={{ before: today }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-6 sm:gap-2">
              <Button
                onClick={handlePrint}
                className="flex-1 py-3 text-sm font-medium"
              >
                Previzualizează / Exportă PDF
              </Button>
              {mounted ? (
                <Suspense
                  fallback={
                    <Button disabled className="flex-1 py-3 text-sm font-medium disabled:bg-primary disabled:text-primary-foreground disabled:hover:bg-primary disabled:hover:text-primary-foreground">
                      Descarcă PDF
                    </Button>
                  }
                >
                  <PdfDownload date={date} menu={menu} />
                </Suspense>
              ) : (
                <Button disabled className="flex-1 py-3 text-sm font-medium disabled:bg-primary disabled:text-primary-foreground disabled:hover:bg-primary disabled:hover:text-primary-foreground">
                  Descarcă PDF
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 py-3 text-sm font-medium"
                onClick={() => {
                  setMenu({
                    normal: { mic_dejun: [], pranz: [], cina: [] },
                    diabetic: { mic_dejun: [], pranz: [], cina: [] },
                    hepato_gastro: { mic_dejun: [], pranz: [], cina: [] },
                  });
                }}
              >
                Resetează
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menus */}
        <div className="space-y-16">
          {(Object.keys(MENU_LABEL) as MenuKey[]).map((m) => (
            <MenuCard key={m} menuKey={m} />
          ))}
        </div>
        {/* Printable area (kept off-screen for screen view, fully styled for print) */}
        <div
          ref={printableRef}
          aria-hidden
          className="pointer-events-none absolute -left-[9999px] top-0 w-[1122px] print:static print:w-auto print:p-0"
          style={{ backgroundColor: "#ffffff", color: "#111827" }}
        >
          <div className="mx-auto space-y-4 p-4 print:p-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">Meniul zilei</h1>
              <div className="text-sm" style={{ color: "#374151" }}>
                Data: {date || "___"}{" "}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(MENU_LABEL) as MenuKey[]).map((m) => (
                <div
                  key={m}
                  className="rounded-xl print:shadow-none"
                  style={{
                    backgroundColor: MENU_PRINT[m].bg,
                    border: `1px solid ${MENU_PRINT[m].border}`,
                  }}
                >
                  <div
                    className="p-3"
                    style={{ borderBottom: "1px solid #E5E7EB" }}
                  >
                    <div className="text-base font-semibold">
                      {MENU_LABEL[m]}
                    </div>
                  </div>
                  <div className="grid gap-3 p-3">
                    {(Object.keys(MEAL_LABEL) as MealKey[]).map((meal) => (
                      <div key={meal} className="">
                        <div className="mb-1 text-[13px] font-semibold uppercase tracking-wide">
                          {MEAL_LABEL[meal]}
                        </div>
                        {menu[m][meal].length === 0 ? (
                          <div className="text-xs" style={{ color: "#4B5563" }}>
                            —
                          </div>
                        ) : (
                          <ul className="ml-4 list-disc space-y-1">
                            {menu[m][meal].map((d) => (
                              <li key={d.id} className="text-sm leading-tight">
                                {d.name} — {(d.displayGramaj && d.displayGramaj.trim()) ? d.displayGramaj.trim() : d.gramaj} {unitLabel(d.unit)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
