import React from "react";
import { Document, Page, StyleSheet, View, Text } from "@react-pdf/renderer";
import { formatUnitShort, type MaybeUnitValue } from "@/lib/unit";

// Keep types aligned with the app
export type Dish = {
  id: number;
  name: string;
  gramaj: number;
  unit?: MaybeUnitValue;
  displayGramaj?: string | null;
};
export type MealKey = "mic_dejun" | "pranz" | "cina";
export type MenuKey = "normal" | "diabetic" | "hepato_gastro";

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

// Hex palette (print-safe)
const MENU_PRINT: Record<MenuKey, { bg: string; border: string }> = {
  normal: { bg: "#FEF3C7", border: "#FCD34D" }, // yellow-100 / yellow-300
  diabetic: { bg: "#FFE4E6", border: "#FDA4AF" }, // rose-100 / rose-300
  hepato_gastro: { bg: "#E0F2FE", border: "#7DD3FC" }, // sky-100 / sky-300
};

const LONG_NAME_THRESHOLD = 28;

const toAscii = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ș|ş/g, "s")
    .replace(/Ș|Ş/g, "S")
    .replace(/ț|ţ/g, "t")
    .replace(/Ț|Ţ/g, "T")
    .replace(/ă/g, "a")
    .replace(/Ă/g, "A")
    .replace(/â/g, "a")
    .replace(/Â/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I");

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 18,
    fontSize: 9.5,
    color: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: 700 },
  date: { fontSize: 11, color: "#374151" },
  grid: {
    flexDirection: "row",
  },
  col: {
    flex: 1,
    borderRadius: 5,
    borderWidth: 1,
  },
  colSpacer: { width: 8 },
  colHeader: {
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  colTitle: { fontSize: 11, fontWeight: 700 },
  colBody: { padding: 6 },
  colBodyDense: { padding: 4.5 },
  mealBlock: { marginBottom: 5 },
  mealBlockDense: { marginBottom: 2.5 },
  mealTitle: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 1.5,
    textTransform: "uppercase",
  },
  empty: { fontSize: 8.5, color: "#4B5563" },
  item: { fontSize: 9.5, marginLeft: 6, lineHeight: 1.25 },
  itemDense: {
    fontSize: 8.75,
    marginLeft: 4,
    lineHeight: 1.1,
    letterSpacing: -0.05,
  },
});

export default function MenuPdf({
  date,
  menu,
  orientation = "landscape",
}: {
  date: string;
  menu: Record<MenuKey, Record<MealKey, Dish[]>>;
  orientation?: "portrait" | "landscape";
}) {
  const menuKeys: MenuKey[] = ["normal", "diabetic", "hepato_gastro"];
  const mealKeys: MealKey[] = ["mic_dejun", "pranz", "cina"];
  const displayDate = date?.trim() ? toAscii(date) : "___";

  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Meniul zilei</Text>
          <Text style={styles.date}>Data: {displayDate}</Text>
        </View>

        <View style={styles.grid}>
          {menuKeys.map((m, idx) => {
            const columnHasLong = mealKeys.some((meal) =>
              (menu?.[m]?.[meal] ?? []).some(
                (dish) => toAscii(dish.name).length >= LONG_NAME_THRESHOLD
              )
            );
            const columnFlex = columnHasLong ? 1.22 : 1;

            return (
              <React.Fragment key={m}>
                <View
                  style={{
                    ...styles.col,
                    flex: columnFlex,
                    borderColor: MENU_PRINT[m].border,
                    backgroundColor: MENU_PRINT[m].bg,
                  }}
                >
                  <View style={styles.colHeader}>
                    <Text style={styles.colTitle}>
                      {toAscii(MENU_LABEL[m])}
                    </Text>
                  </View>
                  <View
                    style={
                      columnHasLong
                        ? [styles.colBody, styles.colBodyDense]
                        : styles.colBody
                    }
                  >
                    {mealKeys.map((meal) => {
                      const list = menu?.[m]?.[meal] ?? [];
                      const hasLongItem = list.some(
                        (dish) =>
                          toAscii(dish.name).length >= LONG_NAME_THRESHOLD
                      );
                      const blockStyle = hasLongItem
                        ? [styles.mealBlock, styles.mealBlockDense]
                        : styles.mealBlock;
                      return (
                        <View key={`${m}-${meal}`} style={blockStyle}>
                          <Text style={styles.mealTitle}>
                            {toAscii(MEAL_LABEL[meal])}
                          </Text>
                          {list.length === 0 ? (
                            <Text style={styles.empty}>—</Text>
                          ) : (
                            <View>
                              {list.map((d) => (
                                <Text
                                  key={`${m}-${meal}-${d.id}-${d.name}`}
                                  style={
                                    hasLongItem
                                      ? [styles.item, styles.itemDense]
                                      : styles.item
                                  }
                                >
                                  • {toAscii(d.name)} — {(d.displayGramaj && d.displayGramaj.trim()) ? d.displayGramaj.trim() : d.gramaj} {formatUnitShort(d.unit)}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
                {idx < menuKeys.length - 1 ? (
                  <View style={styles.colSpacer} />
                ) : null}
              </React.Fragment>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
