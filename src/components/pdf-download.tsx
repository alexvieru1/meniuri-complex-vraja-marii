'use client'

import { useCallback, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import MenuPdf, { type Dish, type MealKey, type MenuKey } from '@/components/menu-pdf'

export default function PdfDownload({
  date,
  menu,
}: {
  date: string
  menu: Record<MenuKey, Record<MealKey, Dish[]>>
}) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    if (isGenerating || !date) return

    setIsGenerating(true)
    try {
      const instance = pdf(<MenuPdf date={date} menu={menu} orientation="landscape" />)
      const blob = await instance.toBlob()
      const url = URL.createObjectURL(blob)
      const sanitizedDate = (date.trim() || new Date().toISOString().slice(0, 10)).replace(/\s+/g, '_')

      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `Meniuri_${sanitizedDate}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to generate PDF', error)
    } finally {
      setIsGenerating(false)
    }
  }, [date, isGenerating, menu])

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={!date || isGenerating}
      className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
    >
      {isGenerating ? 'Se generează…' : 'Descarcă PDF'}
    </button>
  )
}
