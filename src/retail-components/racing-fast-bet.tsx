import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import {
  createBetFromFastCode,
  parseFastBetInput,
} from '@/retail-lib/fastbet-parser'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import DraggableCodeList from './draggable-code-list'
import AlphanumericKeypadDrawer from './alphanumeric-keypad-drawer'

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

  const [fastbetInput, setFastbetInput] = useState('')

  const { addBets } = useContext(BetsContext)
  const rootContext = useContext(RootContext)

  const handleSubmit = async () => {
    if (!fastbetInput.trim()) {
      toast.error(t('enter_fastbet_code'))
      return
    }

    // Parse the fastbet input to handle multiple bets separated by "/"
    const trimmedInput = fastbetInput.trim().toUpperCase()
    const betInputs = trimmedInput
      .split('/')
      .map((bet) => bet.trim())
      .filter((bet) => bet.length > 0)

    if (betInputs.length === 0) {
      toast.error(t('enter_fastbet_code'))
      return
    }

    if (!selectedEvent) {
      toast.error(t('no_event_selected'))
      return
    }

    let totalBetsAdded = 0
    const allMarketNames: string[] = []

    // Process each bet input
    for (let betIndex = 0; betIndex < betInputs.length; betIndex++) {
      const betInput = betInputs[betIndex]
      let code = ''
      let selections = ''

      // Reject input with dashes
      if (betInput.includes('-')) {
        toast.error(t('invalid_fastbet_format'))
        return
      }

      // Check if input contains selections (numbers)
      const hasNumbers = /\d/.test(betInput)

      if (hasNumbers) {
        // Extract letters (code) and numbers (selections)
        const letters = betInput.match(/[A-Z]+/g)?.join('') || ''
        const numbersMatch = betInput.match(/\d/g)

        if (numbersMatch) {
          // For markets that need multiple selections, split digits
          const currentMarketCode = letters
          const currentMarket =
            markets[currentMarketCode as keyof typeof markets]

          if (currentMarket && currentMarket.selections > 1) {
            // Check if it's an "any order" market (BT = Boxed Trifecta, Q = Quinella)
            const isAnyOrderMarket = ['BT', 'Q'].includes(currentMarketCode)

            if (isAnyOrderMarket) {
              // Normalizzazione immediata - ordina sempre per mercati "any order"
              const sortedNumbers = numbersMatch.sort(
                (a, b) => parseInt(a) - parseInt(b),
              )
              selections = sortedNumbers.join('-')
            } else {
              // Keep original order for "in order" markets like Exacta, Trifecta
              selections = numbersMatch.join('-')
            }
          } else {
            // For single selection markets like Winner, Place, Show
            selections = numbersMatch.join('')
          }
        }

        code = letters
      } else {
        // Only code provided
        code = betInput
      }

      const parsedCode = parseFastBetInput(code, selections)

      if (!parsedCode) {
        toast.error(t('invalid_fastbet_format'))
        return
      }

      const currentMarket = markets[parsedCode.code]

      if (currentMarket && currentMarket.selections > 0 && !selections) {
        toast.error(
          t('selections_required_for_market', { market: currentMarket.name }),
        )
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

      const bets = await createBetFromFastCode(
        parsedCode,
        selectedEvent,
        rootContext.initCode || '',
      )

      if (!bets || bets.length === 0) {
        toast.error(t('no_odds_found'))
        return
      }

      const marketName = markets[parsedCode.code]?.name || 'FastBet'
      allMarketNames.push(marketName)

      // addBets now returns the actual number of bets added (after duplicate filtering)
      const actualBetsAdded = addBets(marketName, bets)
      totalBetsAdded += actualBetsAdded
    }

    // Show appropriate message based on results
    if (totalBetsAdded === 0) {
      // All bets were duplicates or no valid bets were processed
      toast.info(t('no_duplicates_added'))
    } else {
      // Success message showing bets added
      toast.success(`${totalBetsAdded} ${t('bets_added')}`)
    }

    setFastbetInput('')
  }

  return (
    <div className="flex h-12 w-full items-center gap-2 bg-white relative top-[3px]">
      <AlphanumericKeypadDrawer
        value={fastbetInput}
        setValue={setFastbetInput}
        onSubmit={handleSubmit}
        placeholder="FASTBET"
        drawerId="racing-fastbet"
      />

      <DraggableCodeList discipline="racing" />
    </div>
  )
}
