import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import {
  createBetFromFastCode,
  parseFastBetInput,
  normalizeMarketCode,
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

  const [fastbetInput, setFastbetInput] = useState('')

  const { addBets } = useContext(BetsContext)
  const rootContext = useContext(RootContext)

  // Ottieni la lingua corrente
  const currentLanguage = rootContext?.userData?.lang || 'en'

  // Funzione per ottenere i nomi dei mercati tradotti
  const getMarketNames = (lang: string) => {
    if (lang === 'it') {
      return {
        W: { name: 'Vincente', selections: 1 },
        P: { name: 'Piazzato', selections: 1 },
        S: { name: 'Podio', selections: 1 },
        E: { name: 'Accoppiata in Ordine', selections: 2 },
        Q: { name: 'Accoppiata a Girare', selections: 2 },
        O: { name: 'Over 3.5', selections: 0 },
        EV: { name: 'Pari', selections: 0 },
        OD: { name: 'Dispari', selections: 0 },
        T: { name: 'Trio in Ordine', selections: 3 },
        BT: { name: 'Trio a Girare', selections: 3 },
        U: { name: 'Under 3.5', selections: 0 },
      }
    }
    if (lang === 'es') {
      return {
        W: { name: 'Ganador', selections: 1 },
        P: { name: 'Colocado', selections: 1 },
        S: { name: 'Tercero', selections: 1 },
        E: { name: 'Exacta', selections: 2 },
        Q: { name: 'Quinella', selections: 2 },
        O: { name: 'Más 3.5', selections: 0 },
        EV: { name: 'Par', selections: 0 },
        OD: { name: 'Impar', selections: 0 },
        T: { name: 'Trifecta', selections: 3 },
        BT: { name: 'Combinada Trifecta', selections: 3 },
        U: { name: 'Menos 3.5', selections: 0 },
      }
    }
    // Default English
    return {
      W: { name: 'Winner', selections: 1 },
      P: { name: 'Placed', selections: 1 },
      S: { name: 'Show', selections: 1 },
      E: { name: 'Exacta', selections: 2 },
      Q: { name: 'Quinella', selections: 2 },
      O: { name: 'Over 3.5', selections: 0 },
      EV: { name: 'Even', selections: 0 },
      OD: { name: 'Odd', selections: 0 },
      T: { name: 'Trifecta', selections: 3 },
      BT: { name: 'Boxed Trifecta', selections: 3 },
      U: { name: 'Under 3.5', selections: 0 },
    }
  }

  // Ottieni i nomi dei mercati tradotti
  const markets = getMarketNames(currentLanguage)

  // Codici validi per lingua corrente
  const getValidCodesForLanguage = (lang: string): string[] => {
    if (lang === 'es') {
      return ['G', '2C', '3C', 'E', 'Q', 'T', 'CT', 'PA', 'IM', 'ME', 'MA']
    }
    if (lang === 'it') {
      return ['V', '2P', '3P', 'AO', 'AG', 'TO', 'TG', 'P', 'D', 'U', 'O']
    }
    // Inglese e altre lingue
    return ['W', 'P', 'S', 'E', 'Q', 'T', 'BT', 'EV', 'OD', 'U', 'O']
  }

  const handleSubmit = async () => {
    if (!fastbetInput.trim()) {
      toast.error(t('enter_fastbet_code'))
      return
    }

    // Validazione iniziale: assicurati che initCode e operator siano disponibili
    if (!rootContext?.initCode || !rootContext?.operator) {
      toast.error(t('login_required') || 'Authentication required')
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

      // Casi speciali per codici con numeri nel codice stesso (spagnolo: 2C, 3C - italiano: 2P, 3P)
      const isSpecialCode = /^(2C|3C|2P|3P)/.test(betInput)

      // Validazione
      const orderValidation = isSpecialCode
        ? /^(2C|3C|2P|3P)\d*$/
        : /^[A-Z]+\d*$/
      if (!orderValidation.test(betInput)) {
        toast.error(t('invalid_fastbet_format') + t('code_and_number_required'))
        return
      }

      // Check if input contains selections (numbers after the code)
      let hasNumbers = false
      let letters = ''
      let numbersMatch: string[] = []

      if (isSpecialCode) {
        // Per 2C, 3C, 2P, 3P: estrai il codice (primi 2 caratteri)
        letters = betInput.substring(0, 2)
        const restOfInput = betInput.substring(2)
        hasNumbers = /\d/.test(restOfInput)
        if (hasNumbers) {
          numbersMatch = restOfInput.split('')
        }
      } else {
        // Logica normale per altri codici
        hasNumbers = /\d/.test(betInput)
        if (hasNumbers) {
          const letterMatch = betInput.match(/^[A-Z]+/)
          const numberMatch = betInput.match(/\d+$/)

          if (!letterMatch || !numberMatch) {
            toast.error(t('invalid_fastbet_format'))
            return
          }

          letters = letterMatch[0]
          numbersMatch = numberMatch[0].split('')
        } else {
          letters = betInput
        }
      }

      if (hasNumbers) {
        // Validazione: il codice deve essere nella lingua corrente
        const validCodes = getValidCodesForLanguage(currentLanguage)
        if (!validCodes.includes(letters)) {
          toast.error(
            t('invalid_code_for_language') ||
              `Codice non valido per la lingua corrente. Usa: ${validCodes.join(', ')}`,
          )
          return
        }

        // Normalizza il codice alla versione inglese per il processing
        const normalizedCode = normalizeMarketCode(letters, currentLanguage)
        const currentMarket = markets[normalizedCode as keyof typeof markets]

        if (currentMarket && currentMarket.selections > 1) {
          // Check if it's an "any order" market (CT/BT = Boxed Trifecta, Q = Quinella)
          const isAnyOrderMarket = ['BT', 'Q'].includes(normalizedCode)

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

        code = letters
      } else {
        // Only code provided (senza numeri)
        code = betInput

        // Validazione: il codice deve essere nella lingua corrente
        const validCodes = getValidCodesForLanguage(currentLanguage)
        if (!validCodes.includes(code)) {
          toast.error(t('invalid_code_for_language'))
          return
        }
      }

      const parsedCode = parseFastBetInput(code, selections, currentLanguage)

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
        rootContext.getTrackName,
        rootContext.operator,
        currentLanguage,
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
    <div className="relative top-[3px] flex h-12 w-full items-center gap-2 bg-white">
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
