'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import MenuPdf, { type Dish, type MealKey, type MenuKey } from '@/components/menu-pdf'
import { Button } from '@/components/ui/button'

export default function PdfDownload({
  date,
  menu,
}: {
  date: string
  menu: Record<MenuKey, Record<MealKey, Dish[]>>
}) {
  return (
    <PDFDownloadLink
      document={<MenuPdf date={date} menu={menu} orientation="landscape" />}
      fileName={`Meniuri_${date || new Date().toISOString().slice(0, 10)}.pdf`}
    >
      {({ loading }) => (
        <Button variant="secondary" className="flex-1 py-3 text-sm font-medium">
          {loading ? 'Se generează…' : 'Descarcă PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}