import { Input } from '@/retail-components/ui/input'
import CodeList from './code-list'
import RacingCodeList from './racing-code-list'
import { useTranslation } from 'react-i18next'
import { useState, useContext } from 'react'
import { BetsContext } from '@/retail-contexts/bets-context'
import {
  parseFastBetInput,
  createBetFromFastCode,
} from '@/retail-lib/fastbet-parser'
import { toast } from 'sonner'

function getDisciplineFromPath(): 'soccer' | 'racing' {
  if (typeof window === 'undefined') return 'soccer'

  const path = window.location.pathname
  if (
    path.includes('/horses') ||
    path.includes('/dogs') ||
    path.includes('/dogs-horses')
  ) {
    return 'racing'
  }
  return 'soccer'
}

export default function FastBet({ selectedEvent }: { selectedEvent?: any }) {
  const { t } = useTranslation()
  const discipline = getDisciplineFromPath()

  const markets = {
    W: { name: 'Winner', selections: 1 },
    P: { name: 'Placed', selections: 1 },
    S: { name: 'Show', selections: 1 },
    E: { name: 'Exacta', selections: 2 },
    Q: { name: 'Quinella', selections: 2 },
    O: { name: 'Under/Over', selections: 0 },
    EV: { name: 'Even/Odd', selections: 0 },
    OD: { name: 'Even/Odd', selections: 0 },
    T: { name: 'Trifecta', selections: 3 },
    BT: { name: 'Boxed Trifecta', selections: 3 },
    U: { name: 'Under/Over', selections: 0 },
  }

  const [codeInput, setCodeInput] = useState('')
  const [selectionInput, setSelectionInput] = useState('')

  const { addBets } = useContext(BetsContext)

  const currentMarket = markets[codeInput.trim()]
  const isSelectionInputDisabled =
    !codeInput.trim() || currentMarket?.selections === 0

  const handleSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentMarket || currentMarket.selections === 0) return

    const value = e.target.value
    const numbersOnly = value.replace(/[^0-9]/g, '')

    let formattedValue = ''
    for (
      let i = 0;
      i < numbersOnly.length && i < currentMarket.selections;
      i++
    ) {
      if (i > 0) formattedValue += '-'
      formattedValue += numbersOnly[i]
    }

    setSelectionInput(formattedValue)
  }

  const handleSubmit = async () => {
    if (!codeInput.trim()) {
      toast.error(t('enter_code'))
      return
    }

    if (
      currentMarket &&
      currentMarket.selections > 0 &&
      !selectionInput.trim()
    ) {
      toast.error(t('enter_selection'))
      return
    }

    if (
      currentMarket &&
      currentMarket.selections === 0 &&
      selectionInput.trim()
    ) {
      toast.error(t('no_selection_needed'))
      return
    }

    const parsedCode = parseFastBetInput(codeInput, selectionInput)

    if (!parsedCode) {
      toast.error(t('invalid_code_selection'))
      return
    }

    if (currentMarket && currentMarket.selections > 0) {
      const providedSelections = parsedCode.selections?.length || 0
      if (providedSelections !== currentMarket.selections) {
        toast.error(
          t('wrong_selection_count', {
            expected: currentMarket.selections,
            provided: providedSelections,
          }) ||
            `Expected ${currentMarket.selections} selections, got ${providedSelections}`,
        )
        return
      }
    }

    if (!selectedEvent) {
      toast.error(t('no_event_selected'))
      return
    }

    const bets = await createBetFromFastCode(parsedCode, selectedEvent)

    if (!bets || bets.length === 0) {
      toast.error(t('no_odds_found'))
      return
    }

    const marketName = markets[parsedCode.code]?.name || 'FastBet'

    addBets(marketName, bets)
    toast.success(`${bets.length} ${t('bets_added')}`)

    setCodeInput('')
    setSelectionInput('')
  }

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          {t('fastbet')}
        </span>
        {discipline === 'racing' ? (
          <RacingCodeList markets={markets} />
        ) : (
          <CodeList />
        )}
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/4 text-[16px]"
          placeholder={t('code')}
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={submitOnEnter}
        />
        <Input
          className="text-bold h-10 w-3/4 text-[16px]"
          placeholder={
            currentMarket?.selections > 1
              ? t('selection') + ' (e.g., 1-2-3)'
              : t('selection')
          }
          value={selectionInput}
          onChange={handleSelectionChange}
          onKeyDown={submitOnEnter}
          disabled={isSelectionInputDisabled}
        />
      </div>
    </div>
  )
}
