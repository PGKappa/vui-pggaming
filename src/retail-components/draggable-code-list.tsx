'use client'

import { useState, useRef, useEffect, useCallback, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/retail-components/ui/button'
import { X, Printer } from 'lucide-react'
import Image from 'next/image'
import { RootContext } from '@/retail-contexts/root-context'

type Discipline = 'soccer' | 'racing'

interface DraggableCodeListProps {
  discipline: Discipline
  onCodeClick?: (code: string) => void
}

// Configurazione immagini basata su disciplina e lingua
const getImageConfig = (discipline: Discipline, language: string) => {
  if (discipline === 'soccer') {
    if(language === 'es') {
      return {
        image: '/futbol-codes-image.png',
        alt: 'Códigos de apuestas de fútbol',
        title: 'Lista de Códigos de Fútbol',
      }
    }
    return {
      image: '/soccer-codes-image.png',
      alt: 'Soccer betting codes',
      title: 'Soccer Code List',
    }
  }

  // Racing: cambia immagine in base alla lingua
  if (language === 'es') {
    return {
      image: '/galgoscaballos-codes-image.png',
      alt: 'Códigos de apuestas galgos y caballos',
      title: 'Racing Code List',
    }
  }

  if (language === 'it') {
    return {
      image: '/cani-cavalli-codes-image.png',
      alt: 'Codici scommesse cani e cavalli',
      title: 'Elenco Codici Corse',
    }
  }

  // Default inglese per racing
  return {
    image: '/dogshorses-codes-image.png',
    alt: 'Dogs and horses betting codes',
    title: 'Racing Code List',
  }
}

export default function DraggableCodeList({
  discipline,
}: DraggableCodeListProps) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [size, setSize] = useState({ width: 1260, height: 625 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const dragRef = useRef<HTMLDivElement>(null)

  // Ottieni la lingua dall'API e configura l'immagine corretta
  const currentLanguage = rootContext?.userData?.lang || 'en'
  const config = getImageConfig(discipline, currentLanguage)

  // Funzione per chiudere e resettare dimensioni
  const handleClose = () => {
    setIsOpen(false)
    setSize({ width: 1260, height: 625 })
  }

  // Funzioni di drag
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging) {
        const touch = e.touches[0]
        setPosition({
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart.x, dragStart.y],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
  }, [])

  // Funzioni per resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    })
  }

  const handleResizeTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const touch = e.touches[0]
    setIsResizing(true)
    setResizeStart({
      x: touch.clientX,
      y: touch.clientY,
      width: size.width,
      height: size.height,
    })
  }

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y

        // Usa il delta maggiore per mantenere proporzioni
        const delta = Math.max(deltaX, deltaY)

        // Calcola nuove dimensioni con limiti minimi più stretti
        const newWidth = Math.max(600, resizeStart.width + delta)
        const newHeight = Math.max(450, resizeStart.height + delta)

        setSize({
          width: newWidth,
          height: newHeight,
        })
      }
    },
    [isResizing, resizeStart],
  )

  const handleResizeTouch = useCallback(
    (e: TouchEvent) => {
      if (isResizing) {
        const touch = e.touches[0]
        const deltaX = touch.clientX - resizeStart.x
        const deltaY = touch.clientY - resizeStart.y

        const delta = Math.max(deltaX, deltaY)
        const newWidth = Math.max(600, resizeStart.width + delta)
        const newHeight = Math.max(450, resizeStart.height + delta)

        setSize({
          width: newWidth,
          height: newHeight,
        })
      }
    },
    [isResizing, resizeStart],
  )

  // Event listeners per mouse e touch
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMove)
      document.addEventListener('touchend', handleTouchEnd)
    } else if (isResizing) {
      document.addEventListener('mousemove', handleResize)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleResizeTouch)
      document.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mousemove', handleResize)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchmove', handleResizeTouch)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    isDragging,
    isResizing,
    handleMouseMove,
    handleResize,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
    handleResizeTouch,
  ])

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
        className="h-12 w-12 bg-bet text-[18px] font-normal text-tertiary-foreground hover:opacity-90"
        onClick={() => setIsOpen(!isOpen)}
      >
        i
      </Button>

      {isOpen && (
        <div
          ref={dragRef}
          className={`fixed z-50 flex flex-col border border-border bg-background shadow-2xl ${isDragging || isResizing ? 'select-none' : ''}`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `607px`,
          }}
        >
          <div
            className="flex h-14 shrink-0 cursor-move select-none items-center justify-center  border-black bg-accent border-b"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <h2 className="text-[16px] font-bold text-accent-foreground">
              {t('code_list').toUpperCase()}
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
                onClick={handleClose}
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

          <div className="relative flex-1 overflow-hidden">
            <Image
              src={config.image}
              alt={config.alt}
              width={1920}
              height={1080}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          {/* Resize Handle */}
          <div
            className="absolute bottom-0 right-0 z-10 h-6 w-6 cursor-nwse-resize bg-accent/50 hover:bg-accent"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeTouchStart}
            title="Ridimensiona"
          >
            <svg
              className="h-full w-full p-1 text-accent-foreground"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M16 20 L20 20 L20 16 M12 20 L20 12" />
            </svg>
          </div>
        </div>
      )}
    </>
  )
}
