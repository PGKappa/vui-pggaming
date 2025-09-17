import { Input } from '@/retail-components/ui/input'
import { BetsContext } from '@/retail-contexts/bets-context'
import {
  createBetFromFastCode,
  parseFastBetInput,
} from '@/retail-lib/fastbet-parser'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
/* import RacingCodeList from './racing-code-list' */
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import Image from 'next/image'

export default function RacingFastBet({
  selectedEvent,
}: {
  selectedEvent?: any
}) {
  const { t } = useTranslation()

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

  /* const handleCodeClick = (code: string) => {
    setCodeInput(code)
    setSelectionInput('') // Clear selection when changing code
  }

  const handleDirectBet = async (code: string) => {
    if (!selectedEvent) {
      toast.error(t('no_event_selected'))
      return
    }

    const parsedCode = parseFastBetInput(code, '')

    if (!parsedCode) {
      toast.error(t('invalid_code_selection'))
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
  } */

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
        {/* <RacingCodeList
          markets={markets}
          onCodeClick={handleCodeClick}
          onDirectBet={handleDirectBet}
        /> */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-32 bg-bet text-[16px] font-bold text-bet-foreground">
              {t('code_list')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl">
            <div className="flex flex-col items-center justify-center bg-accent pt-4">
              <h2 className="h-10 text-[19px] font-bold text-accent-foreground">
                {t('code_list')}
              </h2>
              <Image
                src="/dogshorses-codes-image.png"
                alt="Codici scommesse calcio"
                width={1920}
                height={1080}
                className="h-auto max-w-full"
              />
            </div>
          </DialogContent>
        </Dialog>
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
