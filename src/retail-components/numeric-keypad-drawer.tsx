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
import { MinusIcon, PlusIcon, Delete, ChevronDown } from 'lucide-react'
import { useState, useEffect, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RootContext } from '@/retail-contexts/root-context'

export default function NumericKeypadDrawer(props: {
  value: number
  setValue: (value: number) => void
  inputWidth?: string
  triggerLabel?: string
  showPlusMinus?: boolean
  drawerId?: string
  currencySymbol?: string
}) {
  const { t } = useTranslation()
  const { activeDrawerId, setActiveDrawer } = useContext(RootContext)
  const [value, setValue] = useState(props.value)
  const [drawerValue, setDrawerValue] = useState('0.00')

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

  useEffect(() => {
    if (open) {
      setDrawerValue('0.00')
    }
  }, [open])

  const handleNumberClick = (digit: string) => {
    setDrawerValue((prev) => {
      if (prev === '0.00') {
        return digit === '0' ? '0.00' : digit
      }

      if (prev === '0') {
        return digit
      }

      const decimalIndex = prev.indexOf('.')
      if (decimalIndex !== -1 && prev.length - decimalIndex > 2) {
        return prev
      }

      return prev + digit
    })
  }

  const handleDecimalClick = () => {
    setDrawerValue((prev) => {
      if (!prev.includes('.')) {
        return prev + '.'
      }
      return prev
    })
  }

  const handleDelete = () => {
    setDrawerValue((prev) => {
      if (prev.length <= 1) {
        return '0.00'
      }
      const newValue = prev.slice(0, -1)
      return newValue === '' ? '0.00' : newValue
    })
  }

  const handleClear = () => {
    setDrawerValue('0.00')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    if (e.key >= '0' && e.key <= '9') {
      handleNumberClick(e.key)
    } else if (e.key === '.') {
      handleDecimalClick()
    } else if (e.key === 'Backspace') {
      handleDelete()
    } else if (e.key === 'Delete') {
      handleClear()
    } else if (e.key === 'Enter') {
      handleConfirm()
    } else if (e.key === 'Escape') {
      closeDrawer()
    }
  }

  const handleConfirm = () => {
    const newValue = parseFloat(drawerValue) || 0
    setValue(newValue)
    props.setValue(newValue)
    setActiveDrawer(undefined)
  }

  const handlePlusMinus = (increment: number) => {
    const newValue = Math.max(0, value + increment)
    setValue(newValue)
    props.setValue(newValue)
  }

  // Funzioni per aprire e chiudere il drawer
  const openDrawer = () => {
    setActiveDrawer(drawerId)
  }

  const closeDrawer = () => {
    setActiveDrawer(undefined)
  }

  // Render trigger based on showPlusMinus prop
  const renderTrigger = () => {
    if (props.showPlusMinus) {
      return (
        <div className="flex w-fit items-center border border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
            disabled={value <= 0}
            onClick={(e) => {
              e.stopPropagation()
              handlePlusMinus(-0.5)
            }}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            value={`${props.currencySymbol || ''} ${value.toFixed(2)}`}
            className={`bg-background-foreground h-8 border-x text-center ${props.inputWidth || 'w-20'}`}
            readOnly
            onClick={openDrawer}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
            onClick={(e) => {
              e.stopPropagation()
              handlePlusMinus(0.5)
            }}
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    } else {
      return (
        <div className="relative inline-block">
          <Input
            type="text"
            value={`${props.currencySymbol || ''} ${value.toFixed(2)}`}
            className={`bg-background-foreground h-8 text-center ${props.inputWidth || 'w-20'}`}
            readOnly
            onClick={openDrawer}
          />
        </div>
      )
    }
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => (isOpen ? openDrawer() : closeDrawer())}
      modal={false}
    >
      <DrawerTrigger asChild>{renderTrigger()}</DrawerTrigger>

      <DrawerContent className="ml-auto mr-2 w-[396px]">
        <DrawerHeader className="relative">
          <DrawerTitle className="pt-1 text-center">
            {props.triggerLabel || t('enter_stake_amount')}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="absolute right-2 top-2"
          >
            <ChevronDown className="h-5 w-5" style={{ scale: 1.5 }} />
          </Button>
        </DrawerHeader>

        <div className="flex flex-col gap-2 p-3">
          {/* Display Value */}
          <div className="flex items-center gap-3">
            <Input
              value={drawerValue}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="h-12 flex-1 border-2 pr-2 text-right text-2xl font-bold"
              autoFocus
            />
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 w-[115.34px] px-1"
            >
              <Delete className="h-5 w-5" style={{ scale: 2 }} />
            </Button>
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('1')}
            >
              1
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('2')}
            >
              2
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('3')}
            >
              3
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('4')}
            >
              4
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('5')}
            >
              5
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('6')}
            >
              6
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('7')}
            >
              7
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('8')}
            >
              8
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('9')}
            >
              9
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={handleDecimalClick}
            >
              .
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-2xl font-bold"
              onClick={handleClear}
            >
              C
            </Button>
          </div>

          <Button
            onClick={handleConfirm}
            className="h-12 w-full bg-accent text-2xl text-accent-foreground"
          >
            {t('ok')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
