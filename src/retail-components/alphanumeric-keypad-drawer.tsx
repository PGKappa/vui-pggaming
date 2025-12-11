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

  const handleClear = () => {
    setValue('')
    props.setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const key = e.key.toUpperCase()

    if (key === 'ENTER') {
      e.preventDefault()
      handleSubmit()
      return
    }

    e.preventDefault()

    if ((key >= '0' && key <= '9') || (key >= 'A' && key <= 'Z')) {
      handleCharacterClick(key)
    } else if (key === '-' || key === '/') {
      handleCharacterClick(key)
    } else if (key === ' ') {
      handleCharacterClick(' ')
    } else if (key === 'BACKSPACE') {
      handleDelete()
    } else if (key === 'DELETE') {
      handleClear()
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

      <DrawerContent className="ml-2 w-[1500px]">
        <DrawerHeader className="relative bg-accent text-accent-foreground">
          <DrawerTitle className="pt-1 text-center text-accent-foreground">
            {props.placeholder || 'FASTBET'}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="absolute right-2 top-2"
          >
            <ChevronDown className="h-5 w-5" style={{ scale: 2 }} />
          </Button>
        </DrawerHeader>

        <div className="flex flex-col gap-3 p-4">
          {/* Display Value */}
          <div className="flex items-center gap-2">
            <Input
              value={value}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="h-12 flex-1 border pr-2 text-right text-2xl font-bold uppercase"
              autoFocus
            />
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 w-[126px] px-1"
            >
              <Delete className="h-5 w-5" style={{ scale: 2 }} />
            </Button>
          </div>

          {/* Number Row */}
          <div className="grid grid-cols-11 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((num) => (
              <Button
                key={num}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-bold"
                onClick={() => handleCharacterClick(num)}
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-lg font-bold"
              onClick={handleClear}
            >
              {t('clear')}
            </Button>
          </div>

          {/* First Letter Row - QWERTY */}
          <div className="grid grid-cols-11 gap-2">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map((char) => (
              <Button
                key={char}
                variant="outline"
                size="lg"
                className="h-12 text-xl font-bold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-xl font-bold"
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
                className="h-12 text-xl font-bold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-xl font-bold"
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
                className="h-12 text-xl font-bold"
                onClick={() => handleCharacterClick(char)}
              >
                {char}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              className="col-span-2 h-12 bg-accent text-xl font-bold text-accent-foreground hover:bg-accent/90"
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
              className="h-12 w-[600px] text-xl font-bold"
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
