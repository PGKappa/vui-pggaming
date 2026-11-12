'use client'

import { Button } from '@/virtual-components/ui/button'
import { Input } from '@/virtual-components/ui/input'
import { Card, CardContent, CardFooter } from '@/virtual-components/ui/card'
import { Separator } from '@/virtual-components/ui/separator'
import { BetsContext } from '@/virtual-contexts/bets-context'
import { RootContext } from '@/virtual-contexts/root-context'
import { distributeExactStake } from '@/retail-lib/system-bets'
import { getBettingLimits } from '@/virtual-lib/betting-limits'
import {
  computeGroupWinRounded,
  generateSystemGroups,
} from '@/virtual-lib/system-bets'
import { BetEntry, Discipline, SubmittedTicket } from '@/virtual-lib/types'
import { extractTicketId, storeTicketId } from '@/virtual-lib/ticket-history'
import { useBetTemplate } from '@/virtual-lib/use-bet-template'
import { createPGVirtualAPICall } from '@/virtual-lib/utils'
import {
  ChevronDown,
  CircleXIcon,
  CornerDownLeft,
  DivideIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
} from 'lucide-react'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import EventBets from './event-bets'
import Image from 'next/image'
import { ScrollArea } from './ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem } from './ui/accordion'
import { Checkbox } from './ui/checkbox'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

/**
 * Simbolo della valuta subito dopo l'importo (separato da uno spazio) in un
 * campo con testo centrato. Importo e simbolo sono disegnati qui, sulla stessa
 * riga, così restano allineati; il testo del campo è trasparente (si vede
 * solo il cursore) e ha lo stesso font e padding, quindi il cursore coincide.
 */
function CurrencyAfterValue(props: {
  value: number
  symbol: string
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex items-center justify-center pl-6 pr-6 ${props.className ?? ''}`}
    >
      <span className="relative whitespace-pre text-black">
        {props.value || '0'}
        <span className="absolute left-full top-0 whitespace-pre text-black">
          {'\u00a0'}
          {props.symbol}
        </span>
      </span>
    </span>
  )
}

export default function BettingSlip() {
  const router = useRouter()
  const {
    betEntries,
    betsByEvent,
    betMode,
    isSystemToggleEnabled,
    systemToggleMode,
    setSystemToggleMode,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)

  const rootContext = useContext(RootContext)

  // Ottieni simbolo valuta dal context
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'

  // Limiti di gioco da cashier_init (stesse chiavi e default del retail)
  const {
    minStake,
    minBet,
    maxWin,
    minStakeIncrement,
    systemStakeIncrement,
    maxEvents,
    maxSelections,
    maxCombinations,
  } = getBettingLimits(rootContext?.cashierData)

  // tasti importo rapido della cassa: cashier_init intl.stake_buttons,
  // stesso default del retail
  const stakeButtons = useMemo<number[]>(() => {
    const buttons = rootContext?.cashierData?.intl?.stake_buttons
    if (!Array.isArray(buttons)) return [1, 2, 5, 10]
    return buttons
      .map((v: string | number) =>
        typeof v === 'number'
          ? v
          : parseFloat(
              String(v)
                .replace(/[^0-9.,]/g, '')
                .replace(',', '.'),
            ),
      )
      .filter((v: number) => isFinite(v) && v > 0)
  }, [rootContext?.cashierData])

  // template betslip (standard | noIncrement) come sul retail, da ?bet=
  const { template: betTemplate } = useBetTemplate()

  const totalOdds =
    betEntries.length > 0
      ? Math.round(
          betEntries.reduce(
            (total, betEntry) => total * betEntry.bet.option.decPrice,
            1,
          ) * 100,
        ) / 100
      : 0

  const [global, setGlobal] = useState(0)
  const potentialWinning = global * totalOdds
  const { t } = useTranslation()

  const [systemGroupStakes, setSystemGroupStakes] = useState<
    Record<string, number>
  >({})

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [printFunctionName, setPrintFunctionName] = useState('Bubble')

  // Stati per accordion e checkbox
  const [accordionOpen, setAccordionOpen] = useState<string>('combinations')
  const [systemGroupsOpen, setSystemGroupsOpen] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>(
    {},
  )
  const [allGroupsSelected, setAllGroupsSelected] = useState(false)
  const [systemDistributeStake, setSystemDistributeStake] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const funcName = params.get('print_function') || 'Bubble'
    setPrintFunctionName(funcName)
  }, [])

  // La modalità arriva dal contesto (stessa regola del retail): più selezioni
  // sullo stesso evento -> SYSTEM, anche con un solo evento
  const effectiveMode = betMode

  const baseSystemGroups = useMemo(() => {
    if (effectiveMode !== 'SYSTEM') {
      return []
    }
    return generateSystemGroups(betEntries, { maxSelections, maxEvents })
  }, [betEntries, effectiveMode, maxSelections, maxEvents])

  // Combina i gruppi base con le puntate inserite dall'utente
  const systemGroups = useMemo(() => {
    return baseSystemGroups.map((group) => ({
      ...group,
      stake: systemGroupStakes[group.name] ?? 0,
    }))
  }, [baseSystemGroups, systemGroupStakes])

  const activeSystemGroups = systemGroups.filter((group) => group.stake > 0)

  // importo totale giocato e vincite min/max del sistema (ogni combinazione
  // arrotondata al centesimo, fisse e stesso evento come sul retail)
  const systemTotalPlayed =
    Math.round(
      activeSystemGroups.reduce(
        (sum, group) => sum + group.stake * group.combinations.length,
        0,
      ) * 100,
    ) / 100
  // IMPORTO del sistema: campo separato da DIVIDI/AGGIUNGI. Mentre lo si
  // scrive resta com'è; altrimenti mostra il totale giocato dai gruppi
  const [systemTotalStake, setSystemTotalStake] = useState(0)
  const isEditingSystemTotal = useRef(false)
  useEffect(() => {
    if (!isEditingSystemTotal.current) setSystemTotalStake(systemTotalPlayed)
  }, [systemTotalPlayed])

  const systemCombinationsCount = activeSystemGroups.reduce(
    (sum, group) => sum + group.combinations.length,
    0,
  )
  const systemMinWin = (() => {
    const mins = activeSystemGroups
      .map((group) => computeGroupWinRounded(group).minWin)
      .filter((value) => value > 0)
    return mins.length > 0 ? Math.min(...mins) : 0
  })()
  const systemMaxWin =
    Math.round(
      activeSystemGroups.reduce(
        (sum, group) => sum + computeGroupWinRounded(group).maxWin,
        0,
      ) * 100,
    ) / 100

  // Funzione per calcolare il type basato sulle discipline nel ticket
  const getTicketType = (entries: BetEntry[]): string => {
    const disciplines = new Set(entries.map((entry) => entry.bet.discipline))

    if (disciplines.has(Discipline.FOOTBALL)) {
      return 'football'
    }

    const hasDogs =
      disciplines.has(Discipline.DOGS) || disciplines.has(Discipline.DOGS8)
    const hasHorses = disciplines.has(Discipline.HORSES)

    if (hasDogs && hasHorses) {
      return 'dogs-horses'
    } else if (hasDogs) {
      return 'dogs'
    } else if (hasHorses) {
      return 'horses'
    }

    return 'football' // fallback
  }

  // Funzione per calcolare il mode basato sul tipo di scommessa
  const getTicketMode = (
    mode: 'SINGLE' | 'MULTIPLE' | 'SYSTEM',
    entries: BetEntry[],
  ): string => {
    if (mode === 'SYSTEM') {
      return 'system'
    } else if (mode === 'MULTIPLE' && entries.length > 1) {
      return 'multiple'
    } else {
      return 'single'
    }
  }

  // Mappa i nomi dei mercati (tradotti) ai nomi API
  const getAPIMarketName = (marketName: string): string => {
    const normalized = marketName.toLowerCase().trim()

    const API_MARKET_NAMES: Record<string, string> = {
      // Nomi in inglese
      winner: 'winner',
      placed: 'placed',
      show: 'show',
      exacta: 'exacta',
      quinella: 'quinella',
      trifecta: 'trifecta',
      'boxed trifecta': 'boxedtrifecta',
      'box trifecta': 'boxedtrifecta',
      'even/odd': 'evenodd',
      'under/over': 'underover',

      // Nomi italiani/tradotti
      vincente: 'winner',
      'piazzato su 2': 'placed',
      'piazzato su 3': 'show',
      accoppiata: 'exacta',
      trio: 'trifecta',
      'trio girare': 'boxedtrifecta',
      'pari/dispari': 'evenodd',

      // FastBet codes tradotti
      place: 'placed',
      couples: 'exacta',
      triplets: 'trifecta',
      even_odd: 'evenodd',
      under_over: 'underover',
    }

    return API_MARKET_NAMES[normalized] || normalized
  }

  // Controlla che un importo sia multiplo del passo minimo
  const isMultipleOf = (value: number, step: number) => {
    if (step <= 0) return true
    return Math.abs(value - Math.round(value / step) * step) <= 0.0001
  }

  // Errori del backend che indicano evento partito / mercato chiuso
  const isEventStartedError = (message: string) => {
    const lower = message.toLowerCase()
    return [
      'event started',
      'event_started',
      'market closed',
      'not available',
      'odds not found',
      'event is closed',
      'event closed',
    ].some((text) => lower.includes(text))
  }

  // Validazioni prima dell'invio (stessi controlli e limiti del retail)
  const validateTicket = (): boolean => {
    if (!rootContext?.initCode) {
      toast.error(t('login_required'))
      return false
    }
    if (rootContext?.cashierData?.ret_code !== 1024) {
      toast.error(t('cashier_not_initialized'))
      return false
    }
    if (betEntries.length === 0) {
      toast.error(t('no_bet_selected'))
      return false
    }

    const expiredCount = betEntries.filter(
      (entry) => new Date(entry.bet.event.startingAt) <= new Date(),
    ).length
    if (expiredCount > 0) {
      if (expiredCount === betEntries.length) {
        toast.warning(t('event_started_single'))
      } else {
        toast.warning(
          expiredCount > 1
            ? t('event_started_removed_plural', { count: expiredCount })
            : t('event_started_removed', { count: expiredCount }),
        )
      }
      return false
    }

    if (betEntries.length > maxSelections) {
      toast.error(t('max_selections_error', { max: maxSelections }))
      return false
    }

    if (effectiveMode !== 'SYSTEM') {
      if (!(global > 0)) {
        toast.error(t('enter_valid_amount'))
        return false
      }
      if (!isMultipleOf(global, minStakeIncrement)) {
        toast.error(
          t('stake_increment_error', { increment: minStakeIncrement }),
        )
        return false
      }
      if (Math.round(global * 100) < Math.round(minStake * 100)) {
        toast.error(t('min_stake_error', { min: minStake }))
        return false
      }
      if (minBet > 0 && global < minBet) {
        toast.error(t('min_bet_error', { min: minBet }))
        return false
      }
      if (potentialWinning > maxWin) {
        toast.error(t('max_win_error', { max: maxWin }))
        return false
      }
      return true
    }

    // SISTEMA
    const eventsCount = Object.keys(betsByEvent).length
    if (eventsCount > maxEvents) {
      toast.error(t('max_events_system', { max: maxEvents }))
      return false
    }
    if (activeSystemGroups.length === 0) {
      toast.error(t('enter_system_amount'))
      return false
    }
    if (systemCombinationsCount > maxCombinations) {
      toast.error(t('max_combinations_error', { max: maxCombinations }))
      return false
    }
    if (activeSystemGroups.some((group) => group.stake < minStake)) {
      toast.error(t('min_stake_error', { min: minStake }))
      return false
    }
    if (
      !betTemplate.exactStakeDistribution &&
      activeSystemGroups.some(
        (group) => !isMultipleOf(group.stake, systemStakeIncrement),
      )
    ) {
      toast.error(
        t('stake_increment_error', { increment: systemStakeIncrement }),
      )
      return false
    }
    if (minBet > 0 && systemTotalPlayed < minBet) {
      toast.error(t('min_bet_error', { min: minBet }))
      return false
    }
    if (systemMaxWin > maxWin) {
      toast.error(t('max_win_error', { max: maxWin }))
      return false
    }
    return true
  }

  const handleSubmitTicket = async () => {
    if (!validateTicket()) return

    setIsSubmitting(true)

    try {
      // Usa direttamente betsByEvent che già raggruppa per DISCIPLINE_NUMBER
      const groupedByEvent = betsByEvent

      // Crea le selections nel formato richiesto dall'API
      const selections = Object.entries(groupedByEvent).map(
        ([eventKey, entries]) => {
          // Estrai eventId dalla chiave (DISCIPLINE_NUMBER)
          const eventId = eventKey.includes('_')
            ? eventKey.split('_')[1]
            : eventKey

          // Raggruppa per market all'interno dell'evento
          const marketGroups = entries.reduce(
            (acc, entry) => {
              const apiMarketName = getAPIMarketName(entry.market)
              if (!acc[apiMarketName]) {
                acc[apiMarketName] = []
              }

              let cleanOutcome = entry.bet.option.outcome

              // Normalizza outcome per Even/Odd e Under/Over in inglese lowercase
              if (
                apiMarketName === 'evenodd' ||
                apiMarketName === 'underover'
              ) {
                const lowerOutcome = cleanOutcome.toLowerCase()
                if (['par', 'pari', 'even'].includes(lowerOutcome)) {
                  cleanOutcome = 'even'
                } else if (['impar', 'dispari', 'odd'].includes(lowerOutcome)) {
                  cleanOutcome = 'odd'
                } else if (['menos', 'under'].includes(lowerOutcome)) {
                  cleanOutcome = 'under'
                } else if (['más', 'mas', 'over'].includes(lowerOutcome)) {
                  cleanOutcome = 'over'
                } else {
                  cleanOutcome = lowerOutcome
                }
              }

              acc[apiMarketName].push({
                description: cleanOutcome,
                odds: entry.bet.option.decPrice.toFixed(2),
                status: 1,
              })
              return acc
            },
            {} as Record<string, any[]>,
          )

          // Converti i market groups in formato API
          const markets = Object.entries(marketGroups).map(
            ([marketName, selections]) => ({
              description: marketName,
              selections: selections,
            }),
          )

          // Determina gameId e channelId basato sulla disciplina
          const firstEntry = entries[0]
          const gameId =
            firstEntry.bet.discipline === Discipline.HORSES
              ? 'horses6'
              : firstEntry.bet.discipline === Discipline.DOGS
                ? 'dogs6'
                : firstEntry.bet.discipline === Discipline.DOGS8
                  ? 'dogs8'
                  : 'soccer'
          const channelId =
            firstEntry.bet.discipline === Discipline.HORSES
              ? 3
              : firstEntry.bet.discipline === Discipline.DOGS
                ? 4
                : firstEntry.bet.discipline === Discipline.DOGS8
                  ? 5 // id del canale dogs8 in /api/event/list
                  : 1

          // palimpsestId: dall'evento della giocata, poi dall'evento nel
          // palinsesto caricato (id + disciplina), infine il default storico
          const eventAny = firstEntry.bet.event as any
          const liveEvent = rootContext?.upcomingEvents?.find(
            (event) =>
              event.id === firstEntry.bet.event.number &&
              event.discipline === firstEntry.bet.discipline,
          ) as any
          const palimpsestId =
            eventAny.palimpsestId ||
            eventAny.extId ||
            liveEvent?.extId ||
            liveEvent?.palimpsestId ||
            (firstEntry.bet.discipline === Discipline.HORSES
              ? '1000003504'
              : '1000003502')

          return {
            gameId: gameId,
            channelId: channelId,
            palimpsestId: palimpsestId,
            eventId: eventId,
            isBanker: entries.some((entry) => entry.fixed === true),
            markets: markets,
          }
        },
      )

      // Calcola i valori per il payload
      const ticketType = getTicketType(betEntries)
      const ticketMode = getTicketMode(effectiveMode, betEntries)

      // system: { dimensione: importo totale del gruppo } come sul retail.
      // Per singola/multipla la dimensione è il numero di selezioni.
      const ticketData = {
        placeBet: {
          currency: rootContext?.getCurrencyCode?.() || 'USD',
          type: ticketType,
          mode: ticketMode,
          ...(effectiveMode === 'SYSTEM'
            ? {
                system: Object.fromEntries(
                  activeSystemGroups.map((group) => [
                    group.size.toString(),
                    Math.round(group.stake * group.combinations.length * 100) /
                      100,
                  ]),
                ),
              }
            : {
                system: {
                  [betEntries.length.toString()]:
                    Math.round(global * 100) / 100,
                },
              }),
          selections: selections,
        },
      }

      const response = await createPGVirtualAPICall(
        '/api/ticket/add',
        rootContext.initCode || '',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketData),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        let message = errorText
        try {
          const errorJson = JSON.parse(errorText)
          message =
            errorJson.ret_msg || errorJson.message || errorJson.error || ''
        } catch {
          /* risposta non JSON */
        }
        if (isEventStartedError(message)) {
          toast.warning(t('backend_event_started'))
        } else {
          toast.error(message || t('bet_submission_error'))
        }
        return
      }

      const result = await response.json()
      console.log('Ticket submitted successfully:', result)

      const retCode = parseInt(result.ret_code)
      if (!isNaN(retCode) && retCode !== 1024) {
        const message = result.description || result.ret_msg || ''
        if (isEventStartedError(message)) {
          toast.warning(t('backend_event_started'))
        } else {
          toast.error(message || t('bet_submission_error'))
        }
        return
      }

      // Successo
      toast.success(t('bet_submitted_successfully'))

      const playedAmount =
        effectiveMode === 'SYSTEM'
          ? systemTotalPlayed
          : Math.round(global * 100) / 100
      const potentialWin =
        effectiveMode === 'SYSTEM'
          ? systemMaxWin
          : Math.round(potentialWinning * 100) / 100

      // Salva il codice ticket per "Le mie scommesse"
      const ticketId = extractTicketId(result)
      if (ticketId && rootContext?.initCode) {
        storeTicketId(rootContext.initCode, ticketId)
      } else {
        console.warn('Ticket id non trovato nella risposta:', result)
      }

      // Invia postMessage al parent con i dati del ticket
      try {
        const postMessageData = {
          source: 'v-ui',
          func: printFunctionName,
          command: 'sell',
          content: {
            ticket: result.ticket || result.data?.ticket || {},
            print: result.print || result.data?.print || '',
          },
        }
        console.log('Sending postMessage:', postMessageData)
        window.parent.postMessage(postMessageData, '*')
      } catch (err) {
        console.error('PostMessage error:', err)
      }

      // Salva per storico
      const newTicket: SubmittedTicket = {
        date: new Date(),
        amount: playedAmount,
        winning: potentialWin,
        betEntries: betEntries,
      }

      localStorage.setItem('lastSubmittedTicket', JSON.stringify(newTicket))

      // Svuota la betting slip
      removeAllBets()
      setGlobal(0)
      setSystemGroupStakes({})
      setSystemDistributeStake(0)
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast.error(t('bet_submission_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // importi delle combinazioni arrotondati al centesimo
  const roundCents = (value: number) => Math.round(value * 100) / 100

  const updateSystemGroupStake = (groupName: string, value: number) => {
    setSystemGroupStakes((prev) => ({
      ...prev,
      [groupName]: value >= 0 ? roundCents(value) : 0,
    }))
  }

  // Funzione per dividere lo stake tra i gruppi selezionati
  const handleDistributeStake = () => {
    if (systemDistributeStake <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }
    if (systemDistributeStake < minStake) {
      toast.error(t('min_stake_error', { min: minStake }))
      return
    }

    const selectedGroupsList = systemGroups.filter(
      (group) => selectedGroups[group.name],
    )
    if (selectedGroupsList.length === 0) {
      toast.error(t('select_at_least_one_group'))
      return
    }

    if (betTemplate.exactStakeDistribution) {
      // il totale viene ripartito al centesimo tra i gruppi, in proporzione
      // alle combinazioni (stessa logica del retail)
      const exactStakes = distributeExactStake(
        selectedGroupsList.map((group) => ({
          name: group.name,
          combinations: group.combinations.length,
        })),
        systemDistributeStake,
      )
      setSystemGroupStakes((prev) => ({ ...prev, ...exactStakes }))
      return
    }

    // Come il retail: puntata per combinazione multipla del passo minimo del
    // sistema, il resto va ai gruppi con meno combinazioni
    const step = systemStakeIncrement
    const totalCombinations = selectedGroupsList.reduce(
      (sum, group) => sum + group.combinations.length,
      0,
    )
    const baseStake =
      Math.floor(systemDistributeStake / totalCombinations / step) * step
    let remaining = systemDistributeStake - baseStake * totalCombinations

    const stakes: Record<string, number> = {}
    for (const group of selectedGroupsList) {
      stakes[group.name] = baseStake
    }

    const groupsByPriority = [...selectedGroupsList].sort(
      (a, b) => a.combinations.length - b.combinations.length,
    )
    for (let pass = 0; pass < 2 && remaining >= step; pass++) {
      for (const group of groupsByPriority) {
        if (remaining < step) break
        const additional =
          Math.floor(remaining / group.combinations.length / step) * step
        if (additional >= step) {
          stakes[group.name] += additional
          remaining -= additional * group.combinations.length
          remaining = Math.round(remaining / step) * step
        }
      }
    }

    const roundedStakes: Record<string, number> = {}
    for (const [name, stake] of Object.entries(stakes)) {
      roundedStakes[name] = roundCents(stake)
    }
    setSystemGroupStakes((prev) => ({ ...prev, ...roundedStakes }))

    if (Object.values(roundedStakes).some((stake) => stake <= 0)) {
      const difference = roundCents(
        totalCombinations * minStake - systemDistributeStake,
      )
      if (difference > 0) {
        toast.error(
          t('min_stake_per_combination_not_met', {
            amount: `${currencySymbol}${difference}`,
          }),
        )
      }
    }
  }

  // Importo totale del sistema inserito a mano: ripartito sulle combinazioni
  // dei gruppi selezionati, oppure sul gruppo più grande (come il retail)
  const handleSystemTotalInput = (value: number) => {
    setSystemTotalStake(Math.max(value, 0))
    if (!(value > 0) || systemGroups.length === 0) {
      setSystemGroupStakes({})
      return
    }

    let targetGroups = systemGroups.filter(
      (group) => selectedGroups[group.name],
    )
    if (targetGroups.length === 0) {
      const largest = systemGroups.reduce((a, b) => (b.size > a.size ? b : a))
      targetGroups = [largest]
      setSelectedGroups({ [largest.name]: true })
      setAllGroupsSelected(systemGroups.length === 1)
    }

    const totalCombinations = targetGroups.reduce(
      (sum, group) => sum + group.combinations.length,
      0,
    )
    const stakes: Record<string, number> = {}
    systemGroups.forEach((group) => {
      stakes[group.name] = 0
    })
    targetGroups.forEach((group) => {
      stakes[group.name] = roundCents(value / totalCombinations)
    })
    setSystemGroupStakes(stakes)
  }

  // Funzione per aggiungere stake a tutti i gruppi selezionati
  const handleAddStakeToAll = () => {
    if (systemDistributeStake <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    const newStakes = { ...systemGroupStakes }
    Object.keys(selectedGroups).forEach((groupName) => {
      if (selectedGroups[groupName]) {
        newStakes[groupName] = roundCents(systemDistributeStake)
      }
    })

    setSystemGroupStakes(newStakes)
  }

  // Gestione checkbox "tutti"
  const handleAllGroupsToggle = (checked: boolean) => {
    setAllGroupsSelected(checked)
    const newSelections: Record<string, boolean> = {}
    systemGroups.forEach((group) => {
      newSelections[group.name] = checked
    })
    setSelectedGroups(newSelections)
    // deselezionando tutte le combinazioni i loro importi tornano a 0
    if (!checked) {
      const zeroStakes: Record<string, number> = {}
      systemGroups.forEach((group) => {
        zeroStakes[group.name] = 0
      })
      setSystemGroupStakes((prev) => ({ ...prev, ...zeroStakes }))
    }
  }

  // Gestione singolo checkbox gruppo
  const handleGroupToggle = (groupName: string, checked: boolean) => {
    setSelectedGroups((prev) => ({
      ...prev,
      [groupName]: checked,
    }))
    // combinazione disattivata: il suo importo torna a 0
    if (!checked) {
      setSystemGroupStakes((prev) => ({ ...prev, [groupName]: 0 }))
    }

    // Aggiorna "tutti" se necessario
    const allSelected = systemGroups.every((group) =>
      group.name === groupName ? checked : selectedGroups[group.name],
    )
    setAllGroupsSelected(allSelected)
  }

  // Controlla se siamo in modalità SYSTEM obbligatoria (almeno un evento con 2+ bet)
  const isSystemMandatory = useMemo(() => {
    return Object.values(betsByEvent).some((group) => group.length > 1)
  }, [betsByEvent])

  // Layout ricalcato sulla betslip retail (altezze, spazi e larghezze fisse),
  // con la palette web e le funzioni web.
  const isMultipleTabActive =
    !isSystemMandatory &&
    (!isSystemToggleEnabled || systemToggleMode === 'multiple')
  const isSystemTabActive =
    isSystemMandatory ||
    (isSystemToggleEnabled && systemToggleMode === 'system')

  const groupsScrollHeight = (() => {
    const groupHeight = 59
    const detailsHeight = 55
    const visible = Math.min(Math.max(systemGroups.length, 1), 3)
    const openDetails = betTemplate.showGroupDetails
      ? systemGroupsOpen.filter((name) =>
          systemGroups.some((group) => group.name === name),
        ).length
      : 0
    return (
      groupHeight * visible + Math.min(openDetails, visible) * detailsHeight
    )
  })()

  return (
    <Card
      className="grid h-full min-h-0 w-full flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-none bg-card font-inter text-betSlip-foreground shadow-sm"
      data-testid="betting-slip"
    >
      {/* INTESTAZIONE: barra 52px + tab 41px */}
      <div className="grid grid-cols-2 text-center">
        <div className="col-span-2 grid h-[52px] w-full grid-cols-2 items-center bg-card-header text-card-header-foreground">
          {/* SCHEDINA (n) + cestino che svuota la schedina, come in cassa */}
          <div className="relative flex h-full items-center justify-center">
            <span className="text-[14px] font-semibold">
              {t('bet_slip').toUpperCase()} ({betEntries.length})
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 size-7 bg-transparent hover:bg-transparent hover:opacity-75"
              onClick={removeAllBets}
              disabled={betEntries.length === 0}
              title={t('remove_all_bets')}
            >
              <Image
                src="/bin.svg"
                alt="Bin"
                width={40}
                height={20}
                className="h-[17px] w-6 object-contain brightness-0 invert"
              />
            </Button>
          </div>
          <div className="flex h-full items-center justify-center border-l border-white/15 [&_button]:h-[52px] [&_button]:w-full [&_button]:rounded-none [&_button]:px-4 [&_button]:py-0 [&_button]:text-[13px] [&_button]:font-semibold [&_button]:uppercase [&_button]:text-card-header-foreground/85 hover:[&_button]:bg-white/10 hover:[&_button]:text-card-header-foreground">
            {/* apre la pagina Lista ticket (come la cassa), mantenendo i
                parametri dell'URL (init_code, skin, operator...) */}
            <button
              type="button"
              onClick={() =>
                router.push(`/virtual/bets${window.location.search}`)
              }
            >
              {t('my_bets')}
            </button>
          </div>
        </div>

        <div className="col-span-2 flex h-[41px] w-full flex-row bg-card-header">
          <div
            className={`relative flex w-full flex-col items-center justify-center border-b-4 ${
              isMultipleTabActive ? 'border-tertiary' : 'border-white/15'
            } ${
              isSystemMandatory
                ? 'cursor-not-allowed'
                : isSystemToggleEnabled
                  ? 'cursor-pointer'
                  : ''
            }`}
            onClick={() =>
              !isSystemMandatory &&
              isSystemToggleEnabled &&
              setSystemToggleMode('multiple')
            }
          >
            <span
              className={`pt-1 text-[14px] text-card-header-foreground ${
                isMultipleTabActive ? 'font-semibold' : 'font-normal opacity-60'
              }`}
            >
              {effectiveMode === 'SINGLE'
                ? t('single').toUpperCase()
                : `${t('multiple').toUpperCase()} (${Object.entries(betsByEvent).length})`}
            </span>
          </div>

          <div
            className={`relative flex w-full flex-col items-center justify-center border-b-4 ${
              isSystemTabActive ? 'border-tertiary' : 'border-white/15'
            } ${
              isSystemToggleEnabled || isSystemMandatory
                ? 'cursor-pointer'
                : 'cursor-not-allowed'
            }`}
            onClick={() =>
              !isSystemMandatory &&
              isSystemToggleEnabled &&
              setSystemToggleMode('system')
            }
          >
            <span
              className={`pt-1 text-[14px] text-card-header-foreground ${
                isSystemTabActive ? 'font-semibold' : 'font-normal opacity-60'
              }`}
            >
              {t('system').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* SELEZIONI */}
      <CardContent className="min-h-[72px] w-full overflow-hidden bg-white p-2 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="relative flex h-full min-h-0 items-start justify-center pt-2">
            <span className="text-[15px] font-normal leading-none">
              {t('no_selection')}
            </span>
            <Button
              variant="betNow"
              size="icon-sm"
              className="absolute right-0 top-1 rounded-none font-bold"
              onClick={restoreLastSubmittedTicket}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ) : (
          <ScrollArea thin className="h-full w-full">
            <ul className="flex flex-col space-y-2">
              {Object.entries(betsByEvent).map(([eventKey, eventBets]) => (
                <EventBets
                  key={eventKey}
                  betMode={effectiveMode}
                  eventKey={eventKey}
                  eventBets={eventBets}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <div className="flex min-h-0 flex-col">
        <Separator />

        <CardFooter className="relative flex shrink-0 flex-col bg-card p-0">
          {effectiveMode !== 'SYSTEM' ? (
            // SINGOLA / MULTIPLA
            <>
              <div className="h-[30px] w-full bg-card-header" />

              <div className="relative top-[7px] flex w-full flex-row items-center justify-between px-4 py-3">
                <span className="text-[15px] font-semibold">
                  {t('total_odd').toUpperCase()}
                </span>
                <span className="text-[15px] font-bold tabular-nums">
                  {totalOdds.toFixed(2)}
                </span>
              </div>

              <Separator className="mt-[7px]" />

              {/* tasti importo rapido, come in cassa */}
              <div
                className="grid w-full gap-2 px-2 py-3"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(stakeButtons.length, 5) || 1}, minmax(0, 1fr))`,
                }}
              >
                {stakeButtons.map((amount, index) => (
                  <Button
                    key={`stake-${index}-${amount}`}
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-none text-[14px] tabular-nums"
                    onClick={() => setGlobal((prev) => prev + amount)}
                  >
                    + {amount} {currencySymbol}
                  </Button>
                ))}
              </div>

              <div className="mt-2 flex w-full flex-row items-center justify-between px-4 py-3">
                <span className="text-[15px] font-semibold">
                  {t('amount').toUpperCase()}
                </span>
                <div className="flex w-fit items-center border border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-7 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                    onClick={() => setGlobal((prev) => Math.max(prev - 1, 1))}
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <div className="relative">
                    <Input
                      type="number"
                      value={global || ''}
                      placeholder="0"
                      onFocus={(e) => e.target.select()}
                      className="h-8 w-[174px] rounded-none border-0 border-x bg-white pl-6 pr-6 text-center text-[16px] tabular-nums text-transparent caret-black shadow-none placeholder:text-transparent focus-visible:ring-0"
                      onChange={(e) =>
                        setGlobal(Math.max(parseFloat(e.target.value) || 0, 0))
                      }
                    />
                    <CurrencyAfterValue
                      value={global}
                      symbol={currencySymbol}
                      className="text-[16px] tabular-nums"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-7 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                    onClick={() => setGlobal((prev) => prev + 1)}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="relative top-[3px] flex w-full flex-row items-center justify-between px-4 py-3">
                <span className="text-[17px] font-semibold">
                  {t('potential_win').toUpperCase()}
                </span>
                <span className="text-[17px] font-semibold tabular-nums">
                  {currencySymbol} {potentialWinning.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            // SISTEMA
            <>
              <Accordion
                type="single"
                value={accordionOpen}
                onValueChange={setAccordionOpen}
                className="w-full"
              >
                <AccordionItem
                  value="combinations"
                  className="gap-0 border-none bg-muted"
                >
                  <div className="relative flex h-[34px] w-full items-center justify-between bg-card-header px-4 text-[13px] text-card-header-foreground">
                    <span className="leading-none">
                      {t('combinations').toUpperCase()}
                    </span>
                    <button
                      onClick={() =>
                        setAccordionOpen(
                          accordionOpen === 'combinations'
                            ? ''
                            : 'combinations',
                        )
                      }
                      className="ml-2 flex size-5 items-center justify-center bg-transparent transition-transform duration-200"
                      style={{
                        transform:
                          accordionOpen === 'combinations'
                            ? 'rotate(180deg)'
                            : 'rotate(0deg)',
                      }}
                    >
                      <ChevronDown className="w-5 shrink-0" />
                    </button>
                  </div>
                  <AccordionContent className="pb-0">
                    {/* DIVIDI / AGGIUNGI */}
                    <div className="-mt-px flex h-[54px] items-center border-b bg-muted px-4">
                      <div className="flex w-full items-center space-x-2">
                        <Checkbox
                          id="all-groups"
                          checked={allGroupsSelected}
                          onCheckedChange={handleAllGroupsToggle}
                        />
                        <div className="flex h-[33px] min-w-0 flex-1 items-center space-x-2">
                          <span className="text-[12px] font-semibold">
                            {t('divide').toUpperCase()}
                          </span>
                          <div className="flex min-w-0 flex-1 items-center border border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleDistributeStake}
                              className="h-8 w-7 shrink-0 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                            >
                              <DivideIcon className="h-4 w-4" />
                            </Button>
                            <div className="relative flex min-w-0 flex-1">
                              <Input
                                type="number"
                                value={systemDistributeStake || ''}
                                placeholder="0"
                                onFocus={(e) => e.target.select()}
                                onChange={(e) =>
                                  setSystemDistributeStake(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8 w-full min-w-0 rounded-none border-0 bg-white pl-6 pr-6 text-center text-[13px] text-transparent caret-black shadow-none placeholder:text-transparent focus-visible:ring-0"
                              />
                              <CurrencyAfterValue
                                value={systemDistributeStake}
                                symbol={currencySymbol}
                                className="text-[13px]"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAddStakeToAll}
                              className="h-8 w-7 shrink-0 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                            >
                              <CornerDownLeft className="h-4 w-4" />
                            </Button>
                          </div>
                          <span className="text-[12px] font-semibold">
                            {t('add').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* GRUPPI: righe da 59px, al massimo 3 visibili */}
                    <ScrollArea
                      thin
                      className="overflow-hidden"
                      style={{ height: `${groupsScrollHeight}px` }}
                    >
                      <Accordion
                        type="multiple"
                        value={systemGroupsOpen}
                        onValueChange={setSystemGroupsOpen}
                        className="w-full"
                      >
                        {systemGroups.map((group) => {
                          const isOpen = systemGroupsOpen.includes(group.name)
                          return (
                            <AccordionItem
                              key={group.name}
                              value={group.name}
                              className="border-b-0 bg-white"
                            >
                              <div
                                className={`relative flex h-[59px] items-center border-b px-4 ${
                                  isOpen ? 'bg-muted' : 'bg-white'
                                }`}
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`group-${group.name}`}
                                      checked={
                                        selectedGroups[group.name] || false
                                      }
                                      onCheckedChange={(checked) =>
                                        handleGroupToggle(
                                          group.name,
                                          checked as boolean,
                                        )
                                      }
                                    />
                                    <span className="pt-0.5 text-[12px] font-semibold">
                                      {group.name.toUpperCase()}
                                    </span>
                                    <span className="pt-0.5 text-[12px] font-semibold text-muted-foreground">
                                      (x{group.combinations.length})
                                    </span>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="flex items-center border">
                                      {betTemplate.showGroupStakeIncrement && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          disabled={group.stake <= 0}
                                          className="h-8 w-7 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                                          onClick={() =>
                                            updateSystemGroupStake(
                                              group.name,
                                              Math.max(
                                                group.stake -
                                                  systemStakeIncrement,
                                                0,
                                              ),
                                            )
                                          }
                                        >
                                          <MinusIcon className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <div className="relative">
                                        <Input
                                          type="number"
                                          value={
                                            (betTemplate.exactStakeDistribution
                                              ? Number(group.stake.toFixed(2))
                                              : group.stake) || ''
                                          }
                                          placeholder="0"
                                          onFocus={(e) => e.target.select()}
                                          onChange={(e) =>
                                            updateSystemGroupStake(
                                              group.name,
                                              parseFloat(e.target.value) || 0,
                                            )
                                          }
                                          className="h-8 w-[142px] rounded-none border-0 bg-white pl-6 pr-6 text-center text-[13px] text-transparent caret-black shadow-none placeholder:text-transparent focus-visible:ring-0"
                                          step="0.5"
                                          min="0"
                                        />
                                        <CurrencyAfterValue
                                          value={
                                            betTemplate.exactStakeDistribution
                                              ? Number(group.stake.toFixed(2))
                                              : group.stake
                                          }
                                          symbol={currencySymbol}
                                          className="text-[13px]"
                                        />
                                      </div>
                                      {betTemplate.showGroupStakeIncrement && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-7 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                                          onClick={() =>
                                            updateSystemGroupStake(
                                              group.name,
                                              group.stake +
                                                systemStakeIncrement,
                                            )
                                          }
                                        >
                                          <PlusIcon className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                    {betTemplate.showGroupDetails && (
                                      <button
                                        onClick={() =>
                                          setSystemGroupsOpen((prev) =>
                                            prev.includes(group.name)
                                              ? prev.filter(
                                                  (name) => name !== group.name,
                                                )
                                              : [...prev, group.name],
                                          )
                                        }
                                        className="ml-2 flex size-5 items-center justify-center bg-transparent transition-transform duration-200"
                                        style={{
                                          transform: isOpen
                                            ? 'rotate(180deg)'
                                            : 'rotate(0deg)',
                                        }}
                                      >
                                        <ChevronDown className="w-5 shrink-0" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {betTemplate.showGroupDetails && (
                                <AccordionContent className="h-[55px] border-b px-4 pb-0">
                                  <div className="grid h-full grid-cols-3 items-center text-center">
                                    <div>
                                      <div className="text-[12px] font-semibold capitalize">
                                        {t('min_win')}
                                      </div>
                                      <div className="text-[13px] font-normal tabular-nums">
                                        {computeGroupWinRounded(
                                          group,
                                        ).minWin.toFixed(2)}{' '}
                                        {currencySymbol}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[12px] font-semibold capitalize">
                                        {t('max_win')}
                                      </div>
                                      <div className="text-[13px] font-normal tabular-nums">
                                        {computeGroupWinRounded(
                                          group,
                                        ).maxWin.toFixed(2)}{' '}
                                        {currencySymbol}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[12px] font-semibold">
                                        {t('total_played')}
                                      </div>
                                      <div className="text-[13px] font-normal tabular-nums">
                                        {(
                                          group.stake *
                                          group.combinations.length
                                        ).toFixed(2)}{' '}
                                        {currencySymbol}
                                      </div>
                                    </div>
                                  </div>
                                </AccordionContent>
                              )}
                            </AccordionItem>
                          )
                        })}
                      </Accordion>
                    </ScrollArea>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Separator />

              <div className="relative top-[7px] flex w-full flex-row items-center justify-between px-4 py-3">
                <span className="text-[15px] font-semibold">
                  {t('total_combinations').toUpperCase()}
                </span>
                <span className="text-[15px] font-semibold tabular-nums">
                  {systemGroups.reduce(
                    (sum, g) => sum + (g.stake > 0 ? g.combinations.length : 0),
                    0,
                  )}
                  /
                  {systemGroups.reduce(
                    (sum, g) => sum + g.combinations.length,
                    0,
                  )}
                </span>
              </div>

              <Separator className="mt-[7px]" />

              <div className="mt-2 flex w-full flex-row items-center justify-between px-4 py-3">
                <span className="text-[15px] font-semibold">
                  {t('amount').toUpperCase()}
                </span>
                {betTemplate.editableTotalStake ? (
                  <div className="relative">
                    <Input
                      type="number"
                      value={systemTotalStake || ''}
                      placeholder="0"
                      onFocus={(e) => {
                        isEditingSystemTotal.current = true
                        e.target.select()
                      }}
                      onBlur={() => {
                        isEditingSystemTotal.current = false
                        setSystemTotalStake(systemTotalPlayed)
                      }}
                      onChange={(e) =>
                        handleSystemTotalInput(parseFloat(e.target.value) || 0)
                      }
                      className="h-8 w-[220px] rounded-none border bg-white pl-6 pr-6 text-center text-[16px] tabular-nums text-transparent caret-black shadow-none placeholder:text-transparent focus-visible:ring-0"
                    />
                    <CurrencyAfterValue
                      value={systemTotalStake}
                      symbol={currencySymbol}
                      className="text-[16px] tabular-nums"
                    />
                  </div>
                ) : (
                  <span className="text-[16px] font-semibold tabular-nums">
                    {currencySymbol} {systemTotalPlayed.toFixed(2)}
                  </span>
                )}
              </div>

              <Separator />

              {betTemplate.showMinMaxWin ? (
                <div className="relative top-[3px] flex w-full flex-col px-4 py-3">
                  <div className="flex w-full flex-row items-center justify-between">
                    <span className="text-[17px] font-semibold tabular-nums">
                      {t('min_win').toUpperCase()}
                    </span>
                    <span className="text-[17px] font-semibold tabular-nums">
                      {currencySymbol} {systemMinWin.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex w-full flex-row items-center justify-between">
                    <span className="text-[17px] font-semibold tabular-nums">
                      {t('max_win').toUpperCase()}
                    </span>
                    <span className="text-[17px] font-semibold tabular-nums">
                      {currencySymbol} {systemMaxWin.toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative top-[3px] flex w-full flex-row items-center justify-between px-4 py-3">
                  <span className="text-[17px] font-semibold tabular-nums">
                    {t('potential_win').toUpperCase()}
                  </span>
                  <span className="text-[17px] font-semibold tabular-nums">
                    {currencySymbol} {systemMaxWin.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </CardFooter>

        <div className="shrink-0 bg-card">
          <div className="flex items-center justify-end px-3 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-1 text-[13px] text-muted-foreground hover:bg-transparent hover:text-destructive"
              onClick={removeAllBets}
              disabled={betEntries.length === 0}
            >
              {t('remove_all')}
              <CircleXIcon className="size-4" />
            </Button>
          </div>
          <div className="w-full px-3 pb-3 pt-2">
            <Button
              variant="betNow"
              disabled={betEntries.length === 0 || isSubmitting}
              onClick={handleSubmitTicket}
              className="h-12 w-full rounded-none text-[18px] font-bold"
            >
              {isSubmitting
                ? t('submitting') || 'Submitting...'
                : t('bet_now').toUpperCase()}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
