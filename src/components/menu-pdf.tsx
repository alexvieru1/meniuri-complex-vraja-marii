'use client'

import { Document, Page, StyleSheet, View, Text } from '@react-pdf/renderer'

// Keep types aligned with the app
export type Dish = { id: number; name: string; gramaj: number }
export type MealKey = 'mic_dejun' | 'pranz' | 'cina'
export type MenuKey = 'normal' | 'diabetic' | 'hepato_gastro'

const MEAL_LABEL: Record<MealKey, string> = {
  mic_dejun: 'Mic dejun',
  pranz: 'Prânz',
  cina: 'Cină',
}

const MENU_LABEL: Record<MenuKey, string> = {
  normal: 'Normal',
  diabetic: 'Diabetic',
  hepato_gastro: 'Hepato-gastro-intestinal',
}

// Hex palette (print-safe)
const MENU_PRINT: Record<MenuKey, { bg: string; border: string }> = {
  normal: { bg: '#FEF3C7', border: '#FCD34D' }, // yellow-100 / yellow-300
  diabetic: { bg: '#FFE4E6', border: '#FDA4AF' }, // rose-100 / rose-300
  hepato_gastro: { bg: '#E0F2FE', border: '#7DD3FC' }, // sky-100 / sky-300
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 700 },
  date: { fontSize: 12, color: '#374151' },
  grid: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  colHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  colTitle: { fontSize: 12, fontWeight: 700 },
  colBody: { padding: 8, display: 'flex', gap: 6 },
  mealTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  empty: { fontSize: 9, color: '#4B5563' },
  item: { fontSize: 10, marginLeft: 8 },
})

export default function MenuPdf({
  date,
  menu,
  orientation = 'landscape',
}: {
  date: string
  menu: Record<MenuKey, Record<MealKey, Dish[]>>
  orientation?: 'portrait' | 'landscape'
}) {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Meniul zilei</Text>
          <Text style={styles.date}>Data: {date || '___'}</Text>
        </View>
        <View style={styles.grid}>
          {(Object.keys(MENU_LABEL) as MenuKey[]).map((m) => (
            <View
              key={m}
              style={{
                ...styles.col,
                borderColor: MENU_PRINT[m].border,
                backgroundColor: MENU_PRINT[m].bg,
              }}
            >
              <View style={styles.colHeader}>
                <Text style={styles.colTitle}>{MENU_LABEL[m]}</Text>
              </View>
              <View style={styles.colBody}>
                {(Object.keys(MEAL_LABEL) as MealKey[]).map((meal) => (
                  <View key={meal}>
                    <Text style={styles.mealTitle}>{MEAL_LABEL[meal]}</Text>
                    {menu[m][meal].length === 0 ? (
                      <Text style={styles.empty}>—</Text>
                    ) : (
                      <View>
                        {menu[m][meal].map((d) => (
                          <Text key={`${d.id}-${d.name}`} style={styles.item}>
                            • {d.name} — {d.gramaj} g
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}
