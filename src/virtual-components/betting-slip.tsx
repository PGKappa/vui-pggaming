'use client'

import { Button } from '@/virtual-components/ui/button'
import { Card, CardContent, CardFooter } from '@/virtual-components/ui/card'
import { Input } from '@/virtual-components/ui/input'
import { Separator } from '@/virtual-components/ui/separator'
import { BetsContext } from '@/virtual-contexts/bets-context'
import { RootContext } from '@/virtual-contexts/root-context'
import { distributeExactStake } from '@/retail-lib/system-bets'
import { generateSystemGroups } from '@/virtual-lib/system-bets'
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
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import BetsHistoryDialog from './bets-history-dialog'
import EventBets from './event-bets'
import { ScrollArea } from './ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem } from './ui/accordion'
import { Checkbox } from './ui/checkbox'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

export default function BettingSlip() {
  const {
    betEntries,
    betsByEvent,
    isSystemToggleEnabled,
    systemToggleMode,
    setSystemToggleMode,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)

  const rootContext = useContext(RootContext)

  // Ottieni simbolo valuta dal context
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'

  // template betslip (standard | noIncrement) come sul retail, da ?bet=
  const { template: betTemplate } = useBetTemplate()

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    betEntries.length > 0 ? 1 : 0,
  )

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

  // Determina la modalità effettiva basata sul toggle
  const effectiveMode = useMemo(() => {
    // Caso 1: Una sola scommessa o meno -> SINGLE
    if (betEntries.length <= 1) return 'SINGLE'

    // Caso 2: Più eventi E almeno un evento ha 2+ bet -> SYSTEM obbligatorio
    const eventGroups = Object.values(betsByEvent)
    const hasEventWithMultipleBets = eventGroups.some(
      (group) => group.length > 1,
    )
    const hasMultipleEvents = Object.keys(betsByEvent).length > 1

    if (hasMultipleEvents && hasEventWithMultipleBets) {
      return 'SYSTEM' // SYSTEM obbligatorio, no toggle
    }

    // Caso 3: Toggle abilitato -> usa la selezione dell'utente
    if (isSystemToggleEnabled) {
      return systemToggleMode === 'system' ? 'SYSTEM' : 'MULTIPLE'
    }

    // Caso 4: Default -> MULTIPLE (più bet, ma non condizioni per SYSTEM)
    return 'MULTIPLE'
  }, [betEntries.length, betsByEvent, isSystemToggleEnabled, systemToggleMode])

  const baseSystemGroups = useMemo(() => {
    if (effectiveMode !== 'SYSTEM') {
      return []
    }
    return generateSystemGroups(betEntries)
  }, [betEntries, effectiveMode])

  // Combina i gruppi base con le puntate inserite dall'utente
  const systemGroups = useMemo(() => {
    return baseSystemGroups.map((group) => ({
      ...group,
      stake: systemGroupStakes[group.name] ?? 0,
    }))
  }, [baseSystemGroups, systemGroupStakes])

  // importo totale giocato e vincite min/max del sistema
  const systemTotalPlayed = systemGroups.reduce(
    (sum, group) => sum + group.stake * group.combinations.length,
    0,
  )
  const systemMinWin = (() => {
    const mins = systemGroups
      .filter((group) => group.stake > 0)
      .map((group) => group.minWin * group.stake)
      .filter((value) => value > 0)
    return mins.length > 0 ? Math.min(...mins) : 0
  })()
  const systemMaxWin = systemGroups
    .filter((group) => group.stake > 0)
    .reduce((sum, group) => sum + group.maxWin * group.stake, 0)

  // Calcola i totali per la modalità SYSTEM
  /* const systemTotals = useMemo(() => {
    const totalStake = systemGroups.reduce((sum, group) => sum + group.stake, 0)
    const minWin = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + group.minWin * group.stake
    }, 0)
    const maxWin = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + group.maxWin * group.stake
    }, 0)

    const totalOdds = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + ((group.minWin + group.maxWin) / 2) * group.stake
    }, 0)

    return { totalStake, minWin, maxWin, totalOdds }
  }, [systemGroups]) */

  // Funzione per calcolare il type basato sulle discipline nel ticket
  const getTicketType = (entries: BetEntry[]): string => {
    const disciplines = new Set(entries.map((entry) => entry.bet.discipline))

    if (disciplines.has(Discipline.FOOTBALL)) {
      return 'football'
    }

    const hasDogs = disciplines.has(Discipline.DOGS)
    const hasHorses = disciplines.has(Discipline.HORSES)

    if (hasDogs) {
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

  const handleSubmitTicket = async () => {
    if (betEntries.length === 0) {
      toast.error(t('no_bet_selected'))
      return
    }

    if (effectiveMode !== 'SYSTEM' && global <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    if (effectiveMode === 'SYSTEM') {
      const totalSystemStake = systemGroups.reduce(
        (sum, group) => sum + group.stake,
        0,
      )
      if (totalSystemStake <= 0) {
        toast.error(t('enter_system_amount'))
        return
      }
    }

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
                if (
                  lowerOutcome === 'par' ||
                  lowerOutcome === 'pari' ||
                  lowerOutcome === 'even'
                ) {
                  cleanOutcome = 'even'
                } else if (
                  lowerOutcome === 'impar' ||
                  lowerOutcome === 'dispari' ||
                  lowerOutcome === 'odd'
                ) {
                  cleanOutcome = 'odd'
                } else if (
                  lowerOutcome === 'menos' ||
                  lowerOutcome === 'under'
                ) {
                  cleanOutcome = 'under'
                } else if (
                  lowerOutcome === 'más' ||
                  lowerOutcome === 'mas' ||
                  lowerOutcome === 'over'
                ) {
                  cleanOutcome = 'over'
                } else {
                  cleanOutcome = lowerOutcome
                }
              }

              acc[apiMarketName].push({
                description: cleanOutcome,
                odds: entry.bet.option.decPrice.toString(),
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
                : 'soccer'
          const channelId =
            firstEntry.bet.discipline === Discipline.HORSES
              ? 3
              : firstEntry.bet.discipline === Discipline.DOGS
                ? 4
                : 1

          // Prendi palimpsestId dall'evento
          const eventAny = firstEntry.bet.event as any
          const palimpsestId =
            eventAny.palimpsestId ||
            eventAny.extId ||
            (firstEntry.bet.discipline === Discipline.HORSES
              ? '1000003504'
              : '1000003502')

          return {
            gameId: gameId,
            channelId: channelId,
            palimpsestId: palimpsestId,
            eventId: eventId,
            isBanker: false,
            markets: markets,
          }
        },
      )

      // Calcola i valori per il payload
      const ticketType = getTicketType(betEntries)
      const ticketMode = getTicketMode(effectiveMode, betEntries)

      // Prepara il payload nel formato esatto dell'API
      const ticketData = {
        placeBet: {
          currency: rootContext?.getCurrencyCode?.() || 'USD',
          type: ticketType,
          mode: ticketMode,
          ...(effectiveMode === 'SYSTEM'
            ? {
                system: Object.fromEntries(
                  systemGroups
                    .filter((group) => group.stake > 0)
                    .map((group) => [group.size.toString(), group.stake]),
                ),
              }
            : {
                system: {
                  '1': effectiveMode === 'SINGLE' ? global : global,
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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Ticket submitted successfully:', result)

      // Successo
      toast.success(t('bet_submitted_successfully'))

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
        amount:
          effectiveMode === 'SYSTEM'
            ? systemGroups.reduce((sum, group) => sum + group.stake, 0)
            : global,
        winning:
          effectiveMode === 'SYSTEM'
            ? systemGroups.reduce(
                (sum, group) => sum + group.maxWin * group.stake,
                0,
              )
            : potentialWinning,
        betEntries: betEntries,
      }

      localStorage.setItem('lastSubmittedTicket', JSON.stringify(newTicket))

      // Svuota la betting slip
      removeAllBets()
      setGlobal(0)
      setSystemGroupStakes({})
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

    const totalCombinations = selectedGroupsList.reduce(
      (sum, group) => sum + group.combinations.length,
      0,
    )

    const stakePerCombination = roundCents(
      systemDistributeStake / totalCombinations,
    )
    const newStakes: Record<string, number> = {}

    for (const group of selectedGroupsList) {
      newStakes[group.name] = stakePerCombination
    }

    setSystemGroupStakes((prev) => ({ ...prev, ...newStakes }))
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
  }

  // Gestione singolo checkbox gruppo
  const handleGroupToggle = (groupName: string, checked: boolean) => {
    setSelectedGroups((prev) => ({
      ...prev,
      [groupName]: checked,
    }))

    // Aggiorna "tutti" se necessario
    const allSelected = systemGroups.every((group) =>
      group.name === groupName ? checked : selectedGroups[group.name],
    )
    setAllGroupsSelected(allSelected)
  }

  // Controlla se siamo in modalità SYSTEM obbligatoria (almeno un evento con 2+ bet)
  const isSystemMandatory = useMemo(() => {
    const eventGroups = Object.values(betsByEvent)
    return (
      eventGroups.some((group) => group.length > 1) &&
      Object.keys(betsByEvent).length > 1
    )
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
      className="grid h-full min-h-0 w-full flex-1 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-none bg-card text-betSlip-foreground shadow-sm"
      data-testid="betting-slip"
    >
      {/* INTESTAZIONE: barra 52px + tab 41px */}
      <div className="grid grid-cols-2 text-center">
        <div className="col-span-2 grid h-[52px] w-full grid-cols-2 items-center bg-card-header text-card-header-foreground">
          <span className="text-[14px] font-semibold">
            {t('bet_slip').toUpperCase()} ({betEntries.length})
          </span>
          <div className="flex h-full items-center justify-center border-l border-white/15 [&_button]:h-[52px] [&_button]:w-full [&_button]:rounded-none [&_button]:px-4 [&_button]:py-0 [&_button]:text-[13px] [&_button]:font-semibold [&_button]:uppercase [&_button]:text-card-header-foreground/85 hover:[&_button]:bg-white/10 hover:[&_button]:text-card-header-foreground">
            <BetsHistoryDialog />
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
          <ScrollArea className="h-full w-full">
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
                      value={global}
                      className="h-8 w-[174px] rounded-none border-0 border-x bg-white pl-6 pr-6 text-center text-[16px] tabular-nums text-black shadow-none focus-visible:ring-0"
                      onChange={(e) => setGlobal(parseFloat(e.target.value))}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-black">
                      {currencySymbol}
                    </span>
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
                  {potentialWinning.toFixed(2)} {currencySymbol}
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
                  className="border-none bg-muted"
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
                                value={systemDistributeStake}
                                onChange={(e) =>
                                  setSystemDistributeStake(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                                className="h-8 w-full min-w-0 rounded-none border-0 bg-white pl-6 pr-6 text-center text-[13px] text-black shadow-none focus-visible:ring-0"
                              />
                              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-black">
                                {currencySymbol}
                              </span>
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
                                              Math.max(group.stake - 0.05, 0),
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
                                            betTemplate.exactStakeDistribution
                                              ? Number(group.stake.toFixed(2))
                                              : group.stake
                                          }
                                          onChange={(e) =>
                                            updateSystemGroupStake(
                                              group.name,
                                              parseFloat(e.target.value) || 0,
                                            )
                                          }
                                          className="h-8 w-[142px] rounded-none border-0 bg-white pl-6 pr-6 text-center text-[13px] text-black shadow-none focus-visible:ring-0"
                                          step="0.5"
                                          min="0"
                                        />
                                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-black">
                                          {currencySymbol}
                                        </span>
                                      </div>
                                      {betTemplate.showGroupStakeIncrement && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-7 rounded-none bg-tertiary p-3 text-[19px] text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                                          onClick={() =>
                                            updateSystemGroupStake(
                                              group.name,
                                              group.stake + 0.05,
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
                                        {(group.minWin * group.stake).toFixed(
                                          2,
                                        )}{' '}
                                        {currencySymbol}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[12px] font-semibold capitalize">
                                        {t('max_win')}
                                      </div>
                                      <div className="text-[13px] font-normal tabular-nums">
                                        {(group.maxWin * group.stake).toFixed(
                                          2,
                                        )}{' '}
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
                      value={systemDistributeStake}
                      onChange={(e) =>
                        setSystemDistributeStake(
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-8 w-[220px] rounded-none border bg-white pl-6 pr-6 text-center text-[16px] tabular-nums text-black shadow-none focus-visible:ring-0"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-black">
                      {currencySymbol}
                    </span>
                  </div>
                ) : (
                  <span className="text-[16px] font-semibold tabular-nums">
                    {systemTotalPlayed.toFixed(2)} {currencySymbol}
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
                      {systemMinWin.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                  <div className="flex w-full flex-row items-center justify-between">
                    <span className="text-[17px] font-semibold tabular-nums">
                      {t('max_win').toUpperCase()}
                    </span>
                    <span className="text-[17px] font-semibold tabular-nums">
                      {systemMaxWin.toFixed(2)} {currencySymbol}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="relative top-[3px] flex w-full flex-row items-center justify-between px-4 py-3">
                  <span className="text-[17px] font-semibold tabular-nums">
                    {t('potential_win').toUpperCase()}
                  </span>
                  <span className="text-[17px] font-semibold tabular-nums">
                    {systemDistributeStake.toFixed(2)} {currencySymbol}
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
