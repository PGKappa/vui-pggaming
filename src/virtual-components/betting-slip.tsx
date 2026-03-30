'use client'

import { Button } from '@/virtual-components/ui/button'
import { Card, CardContent, CardFooter } from '@/virtual-components/ui/card'
import { Input } from '@/virtual-components/ui/input'
import { Separator } from '@/virtual-components/ui/separator'
import { BetsContext } from '@/virtual-contexts/bets-context'
import { RootContext } from '@/virtual-contexts/root-context'
import { generateSystemGroups } from '@/virtual-lib/system-bets'
import { BetEntry, Discipline, SubmittedTicket } from '@/virtual-lib/types'
import { createPGVirtualAPICall } from '@/virtual-lib/utils'
import {
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
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

  const updateSystemGroupStake = (groupName: string, value: number) => {
    setSystemGroupStakes((prev) => ({
      ...prev,
      [groupName]: value >= 0 ? value : 0,
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

    const totalCombinations = selectedGroupsList.reduce(
      (sum, group) => sum + group.combinations.length,
      0,
    )

    const stakePerCombination = systemDistributeStake / totalCombinations
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
        newStakes[groupName] = systemDistributeStake
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

  return (
    <Card
      className="flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
      data-testid="betting-slip"
    >
      <div className="grid grid-cols-2 grid-rows-2 text-center">
        <span className="flex w-full flex-col items-center justify-center text-md">
          {t('bet_slip')} ({betEntries.length})
        </span>
        <BetsHistoryDialog />

        <div
          className={`relative flex h-12 w-full flex-col items-center justify-center transition-colors ${
            isSystemMandatory
              ? 'cursor-not-allowed bg-gray-100 opacity-50'
              : !isSystemToggleEnabled || systemToggleMode === 'multiple'
                ? 'cursor-pointer bg-betSlip'
                : 'cursor-pointer bg-gray-100'
          }`}
          onClick={() =>
            !isSystemMandatory &&
            isSystemToggleEnabled &&
            setSystemToggleMode('multiple')
          }
        >
          <span
            className={`text-[16px] ${
              isSystemMandatory
                ? 'text-gray-600'
                : !isSystemToggleEnabled || systemToggleMode === 'multiple'
                  ? 'font-semibold text-betSlip-header-foreground'
                  : 'text-gray-600'
            }`}
          >
            {effectiveMode === 'SINGLE'
              ? t('single')
              : `${t('multiple')} (${Object.entries(betsByEvent).length})`}
          </span>

          {!isSystemMandatory &&
            (!isSystemToggleEnabled || systemToggleMode === 'multiple') && (
              <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-accent"></div>
            )}
        </div>

        <div
          className={`relative flex w-full flex-col items-center justify-center transition-colors ${
            isSystemMandatory ||
            (isSystemToggleEnabled && systemToggleMode === 'system')
              ? 'cursor-pointer bg-betSlip-header'
              : 'bg-gray-100'
          } ${!isSystemToggleEnabled && !isSystemMandatory ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          onClick={() =>
            !isSystemMandatory &&
            isSystemToggleEnabled &&
            setSystemToggleMode('system')
          }
        >
          <span
            className={`text-[16px] ${
              isSystemMandatory ||
              (isSystemToggleEnabled && systemToggleMode === 'system')
                ? 'font-semibold text-betSlip-header-foreground'
                : 'text-gray-600'
            }`}
          >
            {t('system')}
          </span>
          {(isSystemMandatory ||
            (isSystemToggleEnabled && systemToggleMode === 'system')) && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-accent"></div>
          )}
        </div>
      </div>

      <CardContent className="overflow-hidden p-3 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="relative flex h-full items-start justify-center pt-2">
            <span className="text-[16px] font-medium leading-none">
              {t('no_selection')}
            </span>
            <Button
              variant="betNow"
              size="icon-sm"
              className="absolute right-0 top-0 font-bold"
              onClick={restoreLastSubmittedTicket}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-1 bg-primary-foreground">
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

      <Separator />

      <CardFooter className="flex flex-col gap-2 p-0">
        {effectiveMode !== 'SYSTEM' ? (
          // SINGLE/MULTIPLE - Input diretto per importo
          <>
            <div className="flex w-full justify-end bg-betSlip p-2 pr-8">
              <span className="font-semibold">{t('amount')}</span>
            </div>

            <div className="flex w-full flex-row items-center justify-between gap-20 p-2">
              <span className="text-sm font-semibold">{t('total')}</span>
              <div className="flex w-fit items-center border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 rounded-none bg-betSlip p-3"
                  onClick={() => setGlobal((prev) => Math.max(prev - 1, 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={global}
                  className="bg-background-foreground w-16 border-x text-center"
                  onChange={(e) => setGlobal(parseFloat(e.target.value))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-4 rounded-none bg-betSlip p-3"
                  onClick={() => setGlobal((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="w-full px-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-20 py-1 text-sm font-semibold">
                  <span>{t('total')}</span>
                  <span>
                    {currencySymbol} {global.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm">
                  <span>{t('total_odd')}</span>
                  <span>{totalOdds.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm font-bold">
                  <span>{t('potential_win')}</span>
                  <span>
                    {currencySymbol} {potentialWinning.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          // SYSTEM - Accordion con gruppi
          <div className="flex h-full w-full flex-col">
            {/* Accordion principale COMBINATIONS */}
            <Accordion
              type="single"
              collapsible
              value={accordionOpen}
              onValueChange={setAccordionOpen}
              className="w-full"
            >
              <AccordionItem value="combinations" className="gap-0 border-none">
                <AccordionTrigger className="bg-betSlip-header px-3 py-2 text-[14px] font-bold text-betSlip-header-foreground hover:no-underline">
                  <div className="flex w-full items-center justify-between pr-2">
                    <span>{t('combinations').toUpperCase()}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="space-y-3 border-b px-3 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <Checkbox
                        id="all-groups"
                        checked={allGroupsSelected}
                        onCheckedChange={handleAllGroupsToggle}
                      />
                      <div className="mr-1.5 flex h-[33px] items-center gap-2">
                        <span>{t('divide').toUpperCase()}</span>
                        <div className="relative flex w-full items-center border border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-7 rounded-none bg-accent px-3 text-white"
                            onClick={handleDistributeStake}
                          >
                            <DivideIcon className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={systemDistributeStake}
                            onChange={(e) =>
                              setSystemDistributeStake(
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="h-8 w-32 flex-1 rounded-none bg-white text-center text-[13px]"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-7 rounded-none bg-accent px-3 text-white"
                            onClick={handleAddStakeToAll}
                          >
                            <CornerDownLeft className="h-4 w-4" />
                          </Button>
                        </div>
                        <span>{t('add').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-accordion per ogni gruppo */}
                  <Accordion
                    type="multiple"
                    value={systemGroupsOpen}
                    onValueChange={setSystemGroupsOpen}
                    className="w-full"
                  >
                    {systemGroups.map((group) => (
                      <AccordionItem
                        key={group.name}
                        value={group.name}
                        className="bg-white"
                      >
                        <AccordionTrigger className="bg-betSlip-header px-3 py-2 hover:no-underline">
                          <div className="flex w-full items-center justify-between pr-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`group-${group.name}`}
                                checked={selectedGroups[group.name] || false}
                                onCheckedChange={(checked) =>
                                  handleGroupToggle(
                                    group.name,
                                    checked as boolean,
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="text-[13px] font-semibold">
                                {group.name.toUpperCase()} (
                                {group.combinations.length})
                              </span>
                            </div>
                            <span className="relative flex items-center">
                              <div className="flex items-center gap-0 border">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-7 rounded-none bg-accent px-3 text-white"
                                  onClick={() =>
                                    updateSystemGroupStake(
                                      group.name,
                                      Math.max(group.stake - 0.05, 0),
                                    )
                                  }
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </Button>
                                <Input
                                  type="number"
                                  value={group.stake}
                                  onChange={(e) =>
                                    updateSystemGroupStake(
                                      group.name,
                                      parseFloat(e.target.value) || 0,
                                    )
                                  }
                                  className="h-8 w-32 flex-1 rounded-none bg-white text-center text-[13px]"
                                  step="0.5"
                                  min="0"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-7 rounded-none bg-accent px-3 text-white"
                                  onClick={() =>
                                    updateSystemGroupStake(
                                      group.name,
                                      group.stake + 0.05,
                                    )
                                  }
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="border-b bg-white px-4">
                          {/* Input stake per questo gruppo */}
                          <div className="relative top-1.5 grid grid-cols-3">
                            <div className="relative left-[1px] text-center">
                              <div className="text-[11px] text-primary">
                                {t('min win').toUpperCase()}
                              </div>
                              <div className="relative top-[1px] text-[13px] font-semibold">
                                {currencySymbol}{' '}
                                {(group.minWin * group.stake).toFixed(2)}
                              </div>
                            </div>
                            <div className="relative right-[16px] text-center text-[11px]">
                              <div className="text-primary">
                                {t('max win').toUpperCase()}
                              </div>
                              <div className="relative top-[1px] text-[13px] font-semibold">
                                {currencySymbol}{' '}
                                {(group.maxWin * group.stake).toFixed(2)}
                              </div>
                            </div>
                            <div className="relative right-[18px] text-center text-[11px]">
                              <div className="text-primary">
                                {t('total_played').toUpperCase()}
                              </div>
                              <div className="relative top-[1px] text-[13px] font-semibold">
                                {currencySymbol}{' '}
                                {(
                                  group.stake * group.combinations.length
                                ).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* COMBINACIONES TOTALES */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[13px] font-bold">
                {t('total_combinations')}
              </span>
              <span className="text-[13px] font-bold">
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

            {/* IMPORTE */}
            <div className="flex flex-row items-center justify-between px-3">
              <span className="text-[13px] font-semibold">
                {t('amount').toUpperCase()}
              </span>
              <div className="flex items-center bg-white">
                <Input
                  type="number"
                  value={systemDistributeStake}
                  onChange={(e) =>
                    setSystemDistributeStake(parseFloat(e.target.value) || 0)
                  }
                  className="h-8 w-[240px] flex-1 rounded-none border bg-white text-center text-[13px]"
                />
              </div>
            </div>

            {/* GANANCIA POTENCIAL */}
            <div className="flex flex-row items-center justify-between px-3 pt-2">
              <span className="text-[13px] font-semibold">
                {t('potential_win').toUpperCase()}
              </span>
              <div className="flex items-center bg-white">
                <Input
                  type="number"
                  value={systemDistributeStake}
                  onChange={(e) =>
                    setSystemDistributeStake(parseFloat(e.target.value) || 0)
                  }
                  className="h-8 w-[240px] flex-1 rounded-none border bg-white text-center text-[13px]"
                />
              </div>
            </div>
          </div>
        )}
      </CardFooter>

      <div className="flex items-center justify-end gap-1 px-2 py-2">
        <span className="text-sm">{t('remove_all')}</span>
        <Button variant="ghost" size="icon-sm" onClick={removeAllBets}>
          <CircleXIcon className="h-10 w-10" />
        </Button>
      </div>

      <Button
        variant="betNow"
        disabled={betEntries.length === 0 || isSubmitting}
        size="lg"
        className="m-1 w-full rounded-none text-[16px] font-bold"
        onClick={handleSubmitTicket}
      >
        {isSubmitting ? t('submitting') : t('bet_now')}
      </Button>
    </Card>
  )
}
