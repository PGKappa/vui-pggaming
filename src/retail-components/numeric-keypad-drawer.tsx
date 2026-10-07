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
import {
  useState,
  useEffect,
  useLayoutEffect,
  useContext,
  useMemo,
  useRef,
} from 'react'
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
  restrictDecimalDigits?: boolean
  // Con restrictDecimalDigits: 0.5 -> decimali .00/.50,
  // 0.05 -> decimali .00/.05/.50/.55
  decimalStep?: 0.5 | 0.05
  minPlusMinusValue?: number
  prefillValue?: boolean
  clearValue?: number
  disableZeroAndDecimalAsFirstKey?: boolean
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
  const inputRef = useRef<HTMLInputElement>(null)
  // Posizione del cursore da ripristinare dopo una modifica da tastiera
  const pendingCaretRef = useRef<number | null>(null)
  // Posizione del cursore nel campo (null = in fondo): i tasti del
  // tastierino inseriscono/cancellano lì, come la tastiera fisica
  const [caret, setCaret] = useState<number | null>(null)

  useLayoutEffect(() => {
    if (pendingCaretRef.current === null || !inputRef.current) return
    const caret = pendingCaretRef.current
    pendingCaretRef.current = null
    inputRef.current.setSelectionRange(caret, caret)
  }, [drawerValue])

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
      // Riporta l'importo corrente nel tastierino; la prima cifra digitata lo sostituisce
      const current = props.prefillValue ? value : 0
      setDrawerValue(current > 0 ? current.toFixed(2) : '0.00')
      setShouldReplaceOnNextDigit(current > 0)
      setCaret(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isFiveCentsStep = props.decimalStep === 0.05
  // Dopo il punto decimale consente solo 5, 0, C e le scelte rapide
  const isDecimalLocked =
    !!props.restrictDecimalDigits &&
    !shouldReplaceOnNextDigit &&
    drawerValue !== '0.00' &&
    drawerValue.includes('.')
  // Passo 0.5: prima cifra decimale 5 o 0, seconda solo 0
  // Passo 0.05: prima e seconda cifra decimale 0 o 5
  const decimalDigitsCount = isDecimalLocked
    ? drawerValue.length - drawerValue.indexOf('.') - 1
    : 0
  // 0 e punto non possono essere il primo tasto: si abilitano dopo un'altra cifra
  const isFirstKeyBlocked =
    !!props.disableZeroAndDecimalAsFirstKey &&
    (shouldReplaceOnNextDigit || drawerValue === '0.00' || drawerValue === '0')
  // Cursore posizionato prima della fine del valore (es. sulla parte intera)
  const isCaretInside =
    caret !== null && caret < drawerValue.length && !shouldReplaceOnNextDigit
  const isDigitEnabled = (digit: string) => {
    if (isCaretInside) {
      const edit = computeCaretEdit(caret, caret, digit)
      return edit !== null && edit.next !== drawerValue
    }
    if (digit === '0' && isFirstKeyBlocked) return false
    if (!isDecimalLocked) return true
    if (decimalDigitsCount === 0)
      return digit === '5' || digit === '0'
    if (decimalDigitsCount === 1)
      return isFiveCentsStep ? digit === '0' || digit === '5' : digit === '0'
    return false
  }

  const handlePresetValue = (amount: number) => {
    // Valida che amount sia un numero valido
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
      return
    }

    setCaret(null)
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
    if (!isDigitEnabled(digit)) return
    if (isCaretInside) {
      applyCaretEdit(caret, caret, digit)
      return
    }
    setCaret(null)
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
    if (isDecimalLocked || isFirstKeyBlocked) return
    setCaret(null)
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
    if (isCaretInside) {
      applyCaretEdit(caret, caret, '', true)
      return
    }
    const newValue = drawerValue.length <= 1 ? '' : drawerValue.slice(0, -1)
    // Se l'importo si svuota (o vale 0) torna al valore del tasto C
    if (newValue === '' || (props.clearValue && !parseFloat(newValue))) {
      handleClear()
      return
    }
    setShouldReplaceOnNextDigit(false)
    setCaret(null)
    setDrawerValue(newValue)
  }

  const handleClear = () => {
    // Con clearValue il tasto C riporta a quel valore; la prima cifra digitata lo sostituisce
    const clearValue = props.clearValue ?? 0
    setShouldReplaceOnNextDigit(clearValue > 0)
    setCaret(null)
    setDrawerValue(clearValue > 0 ? clearValue.toFixed(2) : '0.00')
  }

  const isValidAmountText = (text: string) => {
    if (!/^\d*\.?\d{0,2}$/.test(text)) return false
    if (!props.restrictDecimalDigits || !text.includes('.')) return true
    const decimals = text.slice(text.indexOf('.') + 1)
    const allowed = isFiveCentsStep
      ? ['', '0', '5', '00', '05', '50', '55']
      : ['', '0', '5', '00', '50']
    return allowed.includes(decimals)
  }

  // Calcola il valore risultante da una modifica nella posizione del
  // cursore (o sostituendo la selezione); null se non è un importo valido
  const computeCaretEdit = (
    start: number,
    end: number,
    insert: string,
    deleteBefore = false,
  ): { next: string; caret: number } | null => {
    if (deleteBefore && start === end) {
      if (start === 0) return null
      start -= 1
    }
    let next = drawerValue.slice(0, start) + insert + drawerValue.slice(end)
    let nextCaret = start + insert.length
    // Rimuove gli zeri iniziali superflui (es. "05" -> "5")
    const leadingZeros = next.match(/^0+(?=\d)/)?.[0].length ?? 0
    if (leadingZeros) {
      next = next.slice(leadingZeros)
      nextCaret = Math.max(0, nextCaret - leadingZeros)
    }
    if (next !== '' && !isValidAmountText(next)) return null
    return { next, caret: nextCaret }
  }

  const applyCaretEdit = (
    start: number,
    end: number,
    insert: string,
    deleteBefore = false,
  ) => {
    const edit = computeCaretEdit(start, end, insert, deleteBefore)
    if (!edit) return
    if (edit.next === '') {
      handleClear()
      return
    }
    setShouldReplaceOnNextDigit(false)
    pendingCaretRef.current = edit.caret
    setCaret(edit.caret)
    setDrawerValue(edit.next)
  }

  // Modifica il valore nella posizione del cursore (o sostituisce la selezione)
  const editAtCaret = (
    input: HTMLInputElement,
    insert: string,
    deleteBefore = false,
  ) => {
    applyCaretEdit(
      input.selectionStart ?? drawerValue.length,
      input.selectionEnd ?? drawerValue.length,
      insert,
      deleteBefore,
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab'].includes(e.key)) {
      return
    }
    e.preventDefault()
    const input = e.currentTarget
    const caretAtEnd =
      input.selectionStart === input.selectionEnd &&
      input.selectionEnd === drawerValue.length
    if (e.key >= '0' && e.key <= '9') {
      if (caretAtEnd) handleNumberClick(e.key)
      else editAtCaret(input, e.key)
    } else if (e.key === '.') {
      if (caretAtEnd) handleDecimalClick()
      else if (!drawerValue.includes('.')) editAtCaret(input, '.')
    } else if (e.key === 'Backspace') {
      if (caretAtEnd) handleDelete()
      else editAtCaret(input, '', true)
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

  // Valore minimo raggiungibile con il tasto meno (es. giocata minima)
  const minPlusMinusValue = props.minPlusMinusValue ?? 0

  const handlePlusMinus = (increment: number) => {
    const newValue = Math.max(minPlusMinusValue, value + increment)
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
            className="disabled:bg-disabledButton disabled:text-white disabled:opacity-1 h-8 w-7 bg-minusButton p-3 text-[19px] text-white hover:opacity-90"
            disabled={displayValue <= minPlusMinusValue}
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

      <DrawerContent className="ml-auto mr-[4px] mb-[8px] h-[475px] w-[400px] border-0">
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
              ref={inputRef}
              value={drawerValue}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              onSelect={(e) => setCaret(e.currentTarget.selectionStart)}
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
                  {currencySymbol} {numericAmount}
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
              disabled={!isDigitEnabled('1')}
            >
              1
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('2')}
              disabled={!isDigitEnabled('2')}
            >
              2
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('3')}
              disabled={!isDigitEnabled('3')}
            >
              3
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('4')}
              disabled={!isDigitEnabled('4')}
            >
              4
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('5')}
              disabled={!isDigitEnabled('5')}
            >
              5
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('6')}
              disabled={!isDigitEnabled('6')}
            >
              6
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('7')}
              disabled={!isDigitEnabled('7')}
            >
              7
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('8')}
              disabled={!isDigitEnabled('8')}
            >
              8
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('9')}
              disabled={!isDigitEnabled('9')}
            >
              9
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={handleDecimalClick}
              disabled={isDecimalLocked || isFirstKeyBlocked}
            >
              .
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 text-[20px] font-semibold tabular-nums"
              onClick={() => handleNumberClick('0')}
              disabled={!isDigitEnabled('0')}
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
