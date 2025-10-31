'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/retail-components/ui/button'
import { X, Printer } from 'lucide-react'
import Image from 'next/image'

type Discipline = 'soccer' | 'racing'

interface DraggableCodeListProps {
  discipline: Discipline
  onCodeClick?: (code: string) => void
}

const disciplineConfig = {
  soccer: {
    image: '/soccer-codes-image.png',
    alt: 'Codici scommesse calcio',
    title: 'Soccer Code List',
  },
  racing: {
    image: '/dogshorses-codes-image.png',
    alt: 'Codici scommesse cani e cavalli',
    title: 'Racing Code List',
  },
}

export default function DraggableCodeList({
  discipline,
}: DraggableCodeListProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const dragRef = useRef<HTMLDivElement>(null)

  const config = disciplineConfig[discipline]

  // Funzioni di drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart.x, dragStart.y],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Event listeners per mouse
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=1200,height=800')
    if (printWindow) {
      // Imposta il titolo del documento
      printWindow.document.title = config.title

      // Imposta gli stili nella head
      printWindow.document.head.innerHTML = `
        <title>${config.title}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            text-align: center; 
            background: white;
          }
          h2 {
            margin-bottom: 20px;
            color: #333;
          }
          img { 
            max-width: 100%; 
            height: auto;
            border: 1px solid #ddd;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          @media print {
            body { margin: 0; padding: 10px; }
            img { max-width: 100%; page-break-inside: avoid; }
          }
        </style>
      `

      // Crea gli elementi nel body
      const heading = printWindow.document.createElement('h2')
      heading.textContent = config.title
      printWindow.document.body.appendChild(heading)

      const img = printWindow.document.createElement('img')
      img.src = `${window.location.origin}${config.image}`
      img.alt = config.alt
      img.style.maxWidth = '100%'
      img.style.height = 'auto'

      // Avvia la stampa quando l'immagine è caricata
      img.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setTimeout(() => {
            printWindow.close()
          }, 1000)
        }, 500)
      }

      printWindow.document.body.appendChild(img)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-14 bg-tertiary text-2xl font-bold text-tertiary-foreground hover:bg-tertiary/70"
        onClick={() => setIsOpen(!isOpen)}
      >
        i
      </Button>

      {isOpen && (
        <div
          ref={dragRef}
          className="fixed z-50 w-[90vw] max-w-7xl overflow-hidden border-b border-border bg-background"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'none',
          }}
        >
          <div
            className="relative flex cursor-move select-none items-center justify-center bg-accent py-4 transition-colors duration-200"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-[19px] font-bold text-accent-foreground">
              {t('code_list')}
            </h2>

            <div className="absolute right-4 flex items-center gap-2">
              <Button
                variant={'ghost'}
                size="icon"
                onClick={handlePrint}
                title="Print"
                className="hover:bg-accent/20"
              >
                <Printer
                  className="h-4 w-4 text-accent-foreground"
                  style={{ scale: 1.5 }}
                />
              </Button>
              <Button
                variant={'ghost'}
                size="icon"
                onClick={() => setIsOpen(false)}
                title="Close"
                className="hover:bg-accent/20"
              >
                <X
                  className="h-4 w-4 text-accent-foreground"
                  style={{ scale: 1.5 }}
                />
              </Button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center bg-accent">
            <Image
              src={config.image}
              alt={config.alt}
              width={1920}
              height={1080}
              className="h-auto max-h-[75vh] w-full object-contain"
              priority
            />
          </div>
        </div>
      )}
    </>
  )
}
