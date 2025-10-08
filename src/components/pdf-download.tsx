'use client'

import { useCallback, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
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
    <Button
      type="button"
      variant="default"
      onClick={handleDownload}
      disabled={!date || isGenerating}
      className="flex-1 py-3 text-sm font-medium disabled:bg-primary disabled:text-primary-foreground disabled:hover:bg-primary disabled:hover:text-primary-foreground"
    >
      {isGenerating ? 'Se generează…' : 'Descarcă PDF'}
    </Button>
  )
}
