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
  incrementValue?: number
}) {
  const { t } = useTranslation()
  const {
    activeDrawerId,
    setActiveDrawer,
    getCurrencySymbol,
    getMinStakeIncrement,
    getStakeButtons,
  } = useContext(RootContext)
  const [value, setValue] = useState(props.value)
  const [drawerValue, setDrawerValue] = useState('0.00')
  const [shouldReplaceOnNextDigit, setShouldReplaceOnNextDigit] =
    useState(false)

  // Get currency symbol from RootContext or fallback to prop/$
  const currencySymbol = getCurrencySymbol?.() || props.currencySymbol || '$'

  // Get increment value from prop or context (fallback 0.5 se non disponibile)
  const incrementValue = props.incrementValue ?? getMinStakeIncrement?.() ?? 0.5

  // Get stake buttons from context or fallback to defaults
  const stakeButtons = useMemo(() => {
    return getStakeButtons?.() || [1000, 2000, 3000, 5000, 10000]
  }, [getStakeButtons])

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
    const numValue = typeof props.value === 'number' ? props.value : 0
    setValue(numValue)
  }, [props.value])

  useEffect(() => {
    if (open) {
      setDrawerValue('0.00')
      setShouldReplaceOnNextDigit(false)
    }
  }, [open])

  const handlePresetValue = (amount: number) => {
    // Valida che amount sia un numero valido
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      return
    }

    setDrawerValue((prev) => {
      const currentValue = parseFloat(prev) || 0
      const newValue = currentValue + amount
      if (isNaN(newValue) || !isFinite(newValue)) {
        return '0.00'
      }
      return newValue.toFixed(2)
    })
    // Dopo aver cliccato un preset, il prossimo digit dovrebbe sostituire
    setShouldReplaceOnNextDigit(true)
  }

  const handleNumberClick = (digit: string) => {
    setDrawerValue((prev) => {
      // Se abbiamo appena cliccato un preset, resetta e inizia da capo
      if (shouldReplaceOnNextDigit) {
        setShouldReplaceOnNextDigit(false)
        return digit === '0' ? '0' : digit
      }

      // Se il valore precedente è '0.00' o '0', inizia da capo
      if (prev === '0.00' || prev === '0') {
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
      // Se abbiamo appena cliccato un preset, resetta e inizia da "0."
      if (shouldReplaceOnNextDigit) {
        setShouldReplaceOnNextDigit(false)
        return '0.'
      }

      if (!prev.includes('.')) {
        return prev + '.'
      }
      return prev
    })
  }

  const handleDelete = () => {
    setShouldReplaceOnNextDigit(false)
    setDrawerValue((prev) => {
      if (prev.length <= 1) {
        return '0.00'
      }
      const newValue = prev.slice(0, -1)
      return newValue === '' ? '0.00' : newValue
    })
  }

  const handleClear = () => {
    setShouldReplaceOnNextDigit(false)
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
    const displayValue = typeof value === 'number' ? value : 0
    if (props.showPlusMinus) {
      return (
        <div className="relative left-1 flex w-fit items-center border border-border">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-minusButton p-3 text-[19px] text-minusButton-foreground hover:opacity-90 disabled:bg-disabledButton disabled:text-white disabled:opacity-50"
            disabled={displayValue <= 0}
            onClick={(e) => {
              e.stopPropagation()
              handlePlusMinus(-incrementValue)
            }}
          >
            <MinusIcon className="h-4 w-4" />
          </Button>
          <Input
            type="text"
            value={`${currencySymbol} ${displayValue.toFixed(2)}`}
            className={`bg-background-foreground h-8 border-x text-center text-black ${props.inputWidth || 'w-20'}`}
            readOnly
            onClick={openDrawer}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-7 bg-plusButton p-3 text-[19px] text-bet-foreground hover:opacity-90"
            onClick={(e) => {
              e.stopPropagation()
              handlePlusMinus(incrementValue)
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
            value={`${currencySymbol} ${displayValue.toFixed(2)}`}
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

      <DrawerContent className="ml-auto mr-2 h-[475px] w-[400px] border-0">
        <DrawerHeader className="relative h-[45px] bg-accent text-accent-foreground">
          <DrawerTitle className="relative bottom-[1px] text-center text-accent-foreground">
            {props.triggerLabel || t('enter_stake_amount')}
          </DrawerTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeDrawer}
            className="absolute right-2 top-1 bg-transparent"
          >
            <ChevronDown className="h-5 w-5 !size-6" />
          </Button>
        </DrawerHeader>

        <div className="flex flex-col space-y-3 p-2">
          {/* Display Value */}
          <div className="flex items-center space-x-3">
            <Input
              value={drawerValue}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              className="h-12 flex-1 border-[1px] pr-2 text-right text-[22px] font-bold"
              autoFocus
            />
            <Button
              variant="outline"
              onClick={handleDelete}
              className="h-12 w-[115.34px] px-1"
            >
              <Delete className="h-5 w-5" style={{ zoom: 2 }} />
            </Button>
          </div>

          {/* Preset Values */}
          <div
            className="grid space-x-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(stakeButtons.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            {stakeButtons.map((amount, idx) => {
              const numericAmount =
                typeof amount === 'number'
                  ? amount
                  : parseFloat(
                      String(amount)
                        .replace(',', '.')
                        .replace(/[^\d.]/g, ''),
                    )

              if (
                isNaN(numericAmount) ||
                !isFinite(numericAmount) ||
                numericAmount <= 0
              ) {
                return null
              }

              return (
                <Button
                  key={`stake-${idx}-${numericAmount}`}
                  variant="outline"
                  size="sm"
                  className="h-10 text-[16px] font-semibold tabular-nums"
                  onClick={() => handlePresetValue(numericAmount)}
                >
                  {numericAmount} {currencySymbol}
                </Button>
              )
            })}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 space-x-3 space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="relative left-3 top-3 h-12 w-[112px] text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('1')}
            >
              1
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('2')}
            >
              2
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('3')}
            >
              3
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('4')}
            >
              4
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('5')}
            >
              5
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('6')}
            >
              6
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('7')}
            >
              7
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('8')}
            >
              8
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('9')}
            >
              9
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={handleDecimalClick}
            >
              .
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={handleClear}
            >
              C
            </Button>
          </div>

          <Button
            onClick={handleConfirm}
            className="h-12 w-full bg-secondary text-[18px] tabular-nums text-accent-foreground hover:opacity-95"
          >
            {t('ok')}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
