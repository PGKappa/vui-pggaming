'use client'

import { Button } from '@/retail-components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/retail-components/ui/drawer'
import { Input } from '@/retail-components/ui/input'
import { Delete, ChevronDown, Search } from 'lucide-react'
import { useState, useEffect, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RootContext } from '@/retail-contexts/root-context'

export default function AlphanumericKeypadDrawer(props: {
  value: string
  setValue: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  drawerId?: string
}) {
  const { t } = useTranslation()
  const { activeDrawerId, setActiveDrawer } = useContext(RootContext)
  const [value, setValue] = useState(props.value)

  // Genera un ID univoco per questo drawer se non fornito
  const drawerId = useMemo(
    () =>
      props.drawerId || `drawer-${Math.random().toString(36).substring(2, 9)}`,
    [props.drawerId],
  )

  // Determina se questo drawer è aperto
  const open = activeDrawerId === drawerId

  // Sync with props.value when it changes from outside
  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  const handleCharacterClick = (char: string) => {
    const newValue = value + char
    setValue(newValue)
    props.setValue(newValue)
  }

  const handleDelete = () => {
    if (value.length > 0) {
      const newValue = value.slice(0, -1)
      setValue(newValue)
      props.setValue(newValue)
    }
  }

  const processKey = (rawKey: string, prevent: () => void) => {
    const key = rawKey.toUpperCase()

    if (key === 'ENTER') {
      prevent()
      handleSubmit()
      return
    }

    const unsupportedKeys = new Set([
      'SHIFT',
      'CONTROL',
      'ALT',
      'META',
      'CAPSLOCK',
      'TAB',
      'ARROWLEFT',
      'ARROWRIGHT',
      'ARROWUP',
      'ARROWDOWN',
      'HOME',
      'END',
      'PAGEUP',
      'PAGEDOWN',
      'INSERT',
      'NUMLOCK',
      'SCROLLLOCK',
      'PRINTSCREEN',
      'PAUSE',
      'CONTEXTMENU',
      // Function keys
      'F1',
      'F2',
      'F3',
      'F4',
      'F5',
      'F6',
      'F7',
      'F8',
      'F9',
      'F10',
      'F11',
      'F12',
    ])
    if (unsupportedKeys.has(key)) {
      prevent()
      return
    }

    prevent()

    // Only allow single-character inputs
    if (key.length === 1) {
      if ((key >= '0' && key <= '9') || (key >= 'A' && key <= 'Z')) {
        handleCharacterClick(key)
        return
      }
      if (key === '-' || key === '/' || key === ' ') {
        handleCharacterClick(key)
        return
      }
    }

    if (key === 'BACKSPACE') {
      handleDelete()
    } else if (key === 'DELETE') {
      // Map physical Delete to single-character delete (same as trash icon)
      handleDelete()
    } else if (key === 'ESCAPE') {
      closeDrawer()
    }
  }

  const handleSubmit = () => {
    props.onSubmit()
    setActiveDrawer(undefined)
  }

  // Funzioni per aprire e chiudere il drawer
  const openDrawer = () => {
    setActiveDrawer(drawerId)
  }

  const closeDrawer = () => {
    setActiveDrawer(undefined)
  }

  // Capture physical keyboard while drawer is open
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      // Previeni il default prima di qualsiasi processing
      event.preventDefault()
      event.stopPropagation()

      processKey(event.key, () => {})
    }

    window.addEventListener('keydown', onKeyDown, { capture: true })
    return () =>
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value])

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => (isOpen ? openDrawer() : closeDrawer())}
      modal={false}
    >
      <DrawerTrigger asChild>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-black" />
          <Input
            type="text"
            value={value}
            className="h-10 w-full bg-white pl-10 text-center text-[16px] font-normal text-black placeholder:text-black"
            placeholder={props.placeholder || 'FASTBET'}
            readOnly
            onClick={openDrawer}
          />
        </div>
      </DrawerTrigger>

      <DrawerContent className="w-[calc(100vw-420px)] pt-10 mt-[150px] ml-[8px] border-0">
        <DrawerHeader className="relative bg-accent text-accent-foreground">
          <DrawerTitle className="pt-1 text-center text-accent-foreground">
            {props.placeholder || 'FASTBET'}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="absolute right-2 top-2 bg-transparent"
          >
            <ChevronDown
              className="relative bottom-1 h-5 w-5 bg-transparent"
              style={{ scale: 1.7 }}
            />
          </Button>
        </DrawerHeader>

        <div className="flex flex-col space-y-3 p-3">
          {/* Number Row */}
          <div className="grid grid-cols-11 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-semibold tabular-nums"
                onClick={() => handleCharacterClick(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 w-full px-1"
            >
              <Delete className="h-5 w-5 bg-transparent" style={{ scale: 2 }} />
            </Button>
          </div>

          {/* First Letter Row - QWERTY */}
          <div className="grid grid-cols-11 gap-2">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((char) => (
              <Button
                key={char}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-semibold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-xl font-semibold"
              onClick={() => handleCharacterClick('/')}
            >
              /
            </Button>
          </div>

          {/* Second Letter Row - ASDF */}
          <div className="grid grid-cols-11 gap-2">
            <div className="col-span-1" />
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map((char) => (
              <Button
                key={char}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-semibold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-xl font-semibold"
              onClick={() => handleCharacterClick('-')}
            >
              -
            </Button>
          </div>

          {/* Third Letter Row - ZXCV */}
          <div className="grid grid-cols-11 gap-2">
            <div className="col-span-2" />
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map((char) => (
              <Button
                key={char}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-semibold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="col-span-2 h-12 bg-secondary text-[18px] font-semibold text-accent-foreground hover:opacity-95 border-0"
              onClick={handleSubmit}
            >
              {t('enter')}
            </Button>
          </div>

          {/* Space Bar - Centered */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="lg"
              className="h-12 w-[600px] text-[18px] font-semibold"
              onClick={() => handleCharacterClick(' ')}
            >
              {t('space')}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
