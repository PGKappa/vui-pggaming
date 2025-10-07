import { Input } from '@/retail-components/ui/input'
import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import {
  createBetFromFastCode,
  parseFastBetInput,
} from '@/retail-lib/fastbet-parser'
import { Search } from 'lucide-react'
import Image from 'next/image'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'

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
    for (const betInput of betInputs) {
      let code = ''
      let selections = ''

      // Check if input contains selections (numbers)
      const hasNumbers = /\d/.test(betInput)

      if (hasNumbers) {
        // Extract letters (code) and numbers (selections)
        const letters = betInput.match(/[A-Z]+/g)?.join('') || ''
        const numbers = betInput.match(/\d+/g)?.join('-') || ''
        code = letters
        selections = numbers
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

      addBets(marketName, bets)
      totalBetsAdded += bets.length
    }

    // Success message showing all bets added
    toast.success(`${totalBetsAdded} ${t('bets_added')}`)

    setFastbetInput('')
  }

  const submitOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex h-14 w-full items-center gap-2 bg-accent">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-background" />
        <Input
          className="h-10 w-full bg-accent pl-10 text-center text-[19px] font-bold text-accent-foreground"
          placeholder="FASTBET"
          value={fastbetInput}
          onChange={(e) => setFastbetInput(e.target.value.toUpperCase())}
          onKeyDown={submitOnEnter}
        />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-14 w-14 bg-tertiary text-2xl font-bold text-tertiary-foreground hover:bg-tertiary/90"
          >
            i
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[75vh] max-w-[75vw]">
          <div className="flex flex-col items-center justify-center bg-accent pt-4">
            <h2 className="h-10 text-[19px] font-bold text-accent-foreground">
              {t('code_list')}
            </h2>
            <Image
              src="/dogshorses-codes-image.png"
              alt="Codici scommesse cani e cavalli"
              width={1920}
              height={1080}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
