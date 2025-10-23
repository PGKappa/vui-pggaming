'use client'

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { generateSystemGroups } from '@/retail-lib/system-bets'
import {
  SubmittedTicket,
  UpcomingEvent,
  Discipline,
  BetEntry,
} from '@/retail-lib/types'
import {
  RotateCcwIcon,
  PlusIcon,
  MinusIcon,
  DivideIcon,
  CornerDownLeft,
} from 'lucide-react'
import { useContext, useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import EventBets from './event-bets'
import RacingFastBet from './racing-fast-bet'
import StakeInputDialog from './stake-input-dialog'
import { Separator } from './ui/separator'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { toast } from 'sonner'
import SoccerFastBet from './soccer-fast-bet'
import Image from 'next/image'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

const getEventStatus = (event: any): 'active' | 'expired' => {
  if (!event) {
    return 'active'
  }

  if (!event.startingAt) {
    return 'active'
  }

  const now = new Date()
  const eventTime = new Date(event.startingAt)

  if (event.discipline === 'SOCCER') {
    return 'active'
  }

  const isExpired = now >= eventTime

  return isExpired ? 'expired' : 'active'
}

// function getDisciplineFromPath(): 'soccer' | 'racing' | undefined {
//   if (typeof window === 'undefined') return 'soccer'

//   const path = window.location.pathname
//   if (
//     path.includes('/horses') ||
//     path.includes('/dogs') ||
//     path.includes('/dogs-horses')
//   ) {
//     return 'racing'
//   }
//   return undefined
// }

export default function BettingSlip({
  selectedEvent,
}: {
  selectedEvent?: UpcomingEvent
}) {
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

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    1,
  )

  const [global, setGlobal] = useState(0)

  const potentialWinning = global * totalOdds

  const { t } = useTranslation()

  const [systemGroupStakes, setSystemGroupStakes] = useState<
    Record<string, number>
  >({})

  // Stato per il controllo "Dividi/Aggiungi" delle combinazioni
  const [systemDistributeStake, setSystemDistributeStake] = useState(0)

  // Stati per i checkbox dei gruppi
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>(
    {},
  )
  const [allGroupsSelected, setAllGroupsSelected] = useState(false)

  const baseSystemGroups = useMemo(() => {
    if (betMode !== 'SYSTEM') {
      return []
    }
    return generateSystemGroups(betEntries)
  }, [betMode, betEntries])

  const systemGroups = useMemo(() => {
    return baseSystemGroups.map((group) => ({
      ...group,
      stake: systemGroupStakes[group.name] ?? 0,
    }))
  }, [baseSystemGroups, systemGroupStakes])

  const [isSubmitting, setIsSubmitting] = useState(false)
  // const discipline = useMemo(() => getDisciplineFromPath(), [])

  // Reset toggle when it's no longer enabled
  useEffect(() => {
    if (!isSystemToggleEnabled && systemToggleMode === 'SYSTEM') {
      setSystemToggleMode('MULTIPLE')
    }
  }, [isSystemToggleEnabled, systemToggleMode, setSystemToggleMode])

  // Inizializza i checkbox quando cambiano i gruppi di sistema
  useEffect(() => {
    if (betMode === 'SYSTEM' && baseSystemGroups.length > 0) {
      const initialSelections: Record<string, boolean> = {}
      const initialStakes: Record<string, number> = {}

      baseSystemGroups.forEach((group) => {
        // Per default, tutti i gruppi sono selezionati con importo minimo
        initialSelections[group.name] = true
        initialStakes[group.name] = MINIMUM_STAKE
      })

      setSelectedGroups(initialSelections)
      setAllGroupsSelected(true)
      setSystemGroupStakes(initialStakes)
    } else {
      // Reset quando non è più SYSTEM mode
      setSelectedGroups({})
      setAllGroupsSelected(false)
      setSystemGroupStakes({})
    }
  }, [betMode, baseSystemGroups])

  // Funzione per calcolare il type basato sulle discipline nel ticket
  const getTicketType = (entries: BetEntry[]): string => {
    const disciplines = new Set(entries.map((entry) => entry.bet.discipline))

    if (disciplines.has(Discipline.SOCCER)) {
      return 'football'
    }

    const hasDogs = disciplines.has(Discipline.DOGS)
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
  const getTicketMode = (mode: BetMode, entries: BetEntry[]): string => {
    if (mode === 'SYSTEM') {
      return 'system'
    } else if (mode === 'MULTIPLE' && entries.length > 1) {
      return 'multiple'
    } else {
      return 'single'
    }
  }

  // Funzioni per gestire la distribuzione degli importi nel sistema
  const handleDistributeStake = () => {
    if (systemDistributeStake <= 0 || systemGroups.length === 0) return

    // Opera solo sui gruppi selezionati
    const selectedGroupsList = systemGroups.filter(
      (group) => selectedGroups[group.name],
    )
    if (selectedGroupsList.length === 0) return

    const stakePerGroup = systemDistributeStake / selectedGroupsList.length
    const newStakes: Record<string, number> = {}

    selectedGroupsList.forEach((group) => {
      newStakes[group.name] = stakePerGroup
    })

    setSystemGroupStakes((prev) => ({
      ...prev,
      ...newStakes,
    }))
  }

  const handleAddStakeToAll = () => {
    if (systemDistributeStake <= 0) return

    const newStakes: Record<string, number> = {}

    // Opera solo sui gruppi selezionati
    systemGroups.forEach((group) => {
      if (selectedGroups[group.name]) {
        newStakes[group.name] =
          (systemGroupStakes[group.name] || 0) + systemDistributeStake
      }
    })

    setSystemGroupStakes((prev) => ({
      ...prev,
      ...newStakes,
    }))
  }

  const handleUpdateGroupStake = (groupName: string, value: number) => {
    setSystemGroupStakes((prev) => ({
      ...prev,
      [groupName]: Math.max(0, value),
    }))
  }

  // Importo minimo per combinazione
  const MINIMUM_STAKE = 0.5

  // Funzioni per gestire i checkbox
  // Azione 4: Checkbox principale (DIVIDI/AGGIUNGI) - seleziona/deseleziona tutti
  const handleAllGroupsToggle = (checked: boolean) => {
    setAllGroupsSelected(checked)
    const newSelectedGroups: Record<string, boolean> = {}
    const newStakes: Record<string, number> = {}

    systemGroups.forEach((group) => {
      newSelectedGroups[group.name] = checked

      if (checked) {
        // Quando viene selezionato, sempre importo minimo (anche se riflaggato)
        newStakes[group.name] = MINIMUM_STAKE
      } else {
        // Quando viene deselezionato, azzera
        newStakes[group.name] = 0
      }
    })

    setSelectedGroups(newSelectedGroups)
    setSystemGroupStakes((prev) => ({
      ...prev,
      ...newStakes,
    }))
  }

  // Azione 1 & 2: Checkbox singolo gruppo - comportamento secondo guida
  const handleGroupToggle = (groupName: string, checked: boolean) => {
    setSelectedGroups((prev) => ({
      ...prev,
      [groupName]: checked,
    }))

    // Azione 2: Comportamento secondo la guida
    if (checked) {
      // Quando viene selezionato/riselezionato, SEMPRE importo minimo
      setSystemGroupStakes((prev) => ({
        ...prev,
        [groupName]: MINIMUM_STAKE,
      }))
    } else {
      // Quando viene deselezionato, va a 0
      setSystemGroupStakes((prev) => ({
        ...prev,
        [groupName]: 0,
      }))
    }

    // Aggiorna lo stato del checkbox "tutti" in base ai singoli
    const updatedSelections = { ...selectedGroups, [groupName]: checked }
    const allSelected = systemGroups.every(
      (group) => updatedSelections[group.name],
    )
    setAllGroupsSelected(allSelected)
  }

  // Calcoli per il sistema - solo gruppi selezionati
  const totalSystemStake = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name])
      .reduce((sum, group) => sum + group.stake, 0)
  }, [systemGroups, selectedGroups])

  const totalSystemCombinations = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name])
      .reduce((sum, group) => sum + group.combinations.length, 0)
  }, [systemGroups, selectedGroups])

  const totalSystemPotentialWin = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name])
      .reduce((sum, group) => {
        if (group.stake === 0) return sum
        // Calcolo della vincita potenziale basata su minWin e maxWin
        return sum + group.maxWin * group.stake
      }, 0)
  }, [systemGroups, selectedGroups])

  const handleBetNow = async () => {
    if (betEntries.length === 0) {
      toast.error(t('no_bet_selected'))
      return
    }

    const expiredEvents: string[] = []
    betEntries.forEach((entry) => {
      const eventStatus = getEventStatus(entry.bet.event)

      if (eventStatus === 'expired') {
        expiredEvents.push(entry.bet.event.name)
      }
    })

    if (expiredEvents.length > 0) {
      toast.error(t('cannot_bet_expired_events'))
      return
    }

    if (betMode !== 'SYSTEM' && global <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    if (betMode === 'SYSTEM') {
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
      // Raggruppa le scommesse per evento
      const groupedByEvent = betEntries.reduce(
        (acc, entry) => {
          const eventId = entry.bet.event.number.toString()
          if (!acc[eventId]) {
            acc[eventId] = []
          }
          acc[eventId].push(entry)
          return acc
        },
        {} as Record<string, typeof betEntries>,
      )

      // Mappa i nomi dei mercati (sia tradotti che in inglese) ai nomi API
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

      // Crea le selections nel formato richiesto dall'API
      const selections = Object.entries(groupedByEvent).map(
        ([eventId, entries]) => {
          // Raggruppa per market all'interno dell'evento
          const marketGroups = entries.reduce(
            (acc, entry) => {
              const apiMarketName = getAPIMarketName(entry.market)
              if (!acc[apiMarketName]) {
                acc[apiMarketName] = []
              }
              acc[apiMarketName].push({
                description: entry.bet.option.outcome,
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
            firstEntry.bet.discipline === 'HORSES'
              ? 'horses6'
              : firstEntry.bet.discipline === 'DOGS'
                ? 'dogs6'
                : 'soccer'
          const channelId =
            firstEntry.bet.discipline === 'HORSES'
              ? 3
              : firstEntry.bet.discipline === 'DOGS'
                ? 4
                : 1

          // DINAMICO: Prendi palimpsestId dall'evento se disponibile
          const eventAny = firstEntry.bet.event as any
          const palimpsestId =
            eventAny.palimpsestId ||
            eventAny.extId ||
            selectedEvent?.extId ||
            selectedEvent?.palimpsestId ||
            (firstEntry.bet.discipline === 'HORSES'
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
      const ticketMode = getTicketMode(betMode, betEntries)

      // Prepara il payload nel formato esatto dell'API
      const ticketData = {
        placeBet: {
          currency: 'USD', // Cambiare valuta se necessario
          type: ticketType,
          mode: ticketMode,
          ...(betMode === 'SYSTEM'
            ? {
                system: Object.fromEntries(
                  systemGroups
                    .filter((group) => group.stake > 0)
                    .map((group) => [group.size.toString(), group.stake]),
                ),
              }
            : {
                system: { '1': betMode === 'SINGLE' ? global : global },
              }),
          selections: selections,
        },
      }

      console.log(
        'Submitting ticket with payload:',
        JSON.stringify(ticketData, null, 2),
      )

      const response = await fetch(
        'https://apisuprema.pgvirtual.eu/api/ticket/add',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            authorization: `Bearer ${rootContext.initCode}`,
            'content-type': 'application/json',
            operator: 'pg',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
          },
          referrer: 'https://test.pgvirtual.eu/',
          body: JSON.stringify(ticketData),
          mode: 'cors',
          credentials: 'include',
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

      // Salva per storico
      const newTicket: SubmittedTicket = {
        date: new Date(),
        amount:
          betMode === 'SYSTEM'
            ? systemGroups.reduce((sum, group) => sum + group.stake, 0)
            : global,
        winning:
          betMode === 'SYSTEM'
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

  return (
    <Card
      className="flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
      data-testid="betting-slip"
    >
      <div className="grid grid-cols-2 text-center">
        <div className="col-span-2 flex h-[74.2px] w-full flex-row items-center justify-between bg-accent px-5">
          <span className="items-start text-[16px] font-semibold text-accent-foreground">
            {t('bet_slip').toUpperCase()} ({betEntries.length})
          </span>
          <Button
            variant="ghost"
            className="group size-7"
            size="icon"
            onClick={removeAllBets}
          >
            <Image
              src="/bin.svg"
              alt="Bin"
              width={40}
              height={20}
              className="size-6 object-contain brightness-0 invert filter"
            />
          </Button>
        </div>

        <div
          className={`relative flex h-16 w-full flex-col items-center justify-center ${
            isSystemToggleEnabled ? 'cursor-pointer' : ''
          } ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'bg-betSlip' : 'bg-gray-100'}`}
          onClick={
            isSystemToggleEnabled
              ? () => setSystemToggleMode('MULTIPLE')
              : undefined
          }
        >
          <span
            className={`text-[15px] ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'font-semibold text-betSlip-header-foreground' : 'text-betSlip-foreground'}`}
          >
            {betMode === 'SINGLE'
              ? `${t('single').toUpperCase()}`
              : `${t('multiple').toUpperCase()} (${Object.entries(betsByEvent).length})`}
          </span>

          {betMode === 'SINGLE' ||
            (betMode === 'MULTIPLE' && (
              <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
            ))}
        </div>

        <div
          className={`relative flex w-full flex-col items-center justify-center ${
            isSystemToggleEnabled ? 'cursor-pointer' : ''
          } ${betMode === 'SYSTEM' ? 'bg-betSlip-header' : 'bg-gray-100'}`}
          onClick={
            isSystemToggleEnabled
              ? () => setSystemToggleMode('SYSTEM')
              : undefined
          }
        >
          <span
            className={`text-[15px] ${betMode === 'SYSTEM' ? 'font-semibold text-betSlip-header-foreground' : 'text-betSlip-foreground'}`}
          >
            {t('system').toUpperCase()}
          </span>
          {betMode === 'SYSTEM' && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
          )}
        </div>
      </div>

      <CardContent className="h-full overflow-hidden bg-muted-foreground p-2 text-betSlip-foreground">
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
            <ul className="flex flex-col gap-1 bg-background">
              {Object.entries(betsByEvent).map(([matchKey, matchBets]) => (
                <EventBets
                  key={matchKey}
                  betMode={betMode}
                  eventKey={matchKey}
                  eventBets={matchBets}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col bg-background">
        {betMode !== 'SYSTEM' ? (
          <>
            <div className="bg-accent py-3"></div>

            {/* TOTALE QUOTA section */}
            <div className="flex flex-row items-center justify-between px-4 py-3 text-foreground">
              <span className="text-[15px] font-semibold">
                {t('total_odd')}
              </span>
              <span className="text-[15px] font-bold">
                {totalOdds.toFixed(2)}
              </span>
            </div>
            <Separator />

            {/* Quick stake buttons */}
            <div className="grid grid-cols-5 gap-2 p-2 pt-4">
              {[5, 10, 20, 30, 50].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-muted-foreground text-[14px]"
                  onClick={() => setGlobal((prev) => prev + amount)}
                >
                  € {amount}
                </Button>
              ))}
            </div>

            {/* IMPORTO section */}
            <div className="flex flex-row items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">
                  {t('amount')}
                </span>
              </div>
              <StakeInputDialog value={global} setValue={setGlobal} />
            </div>

            <Separator />

            {/* VINCITA POTENZIALE section */}
            <div className="flex flex-row items-center justify-between px-4 py-4 text-foreground">
              <span className="text-[15px] font-semibold">
                {t('potential_win')}
              </span>
              <span className="text-[15px] font-bold">
                € {potentialWinning.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* HEADER ACCORDION GENERALE */}
            <Accordion
              type="single"
              collapsible
              defaultValue="combinations"
              className="w-full"
            >
              <AccordionItem value="combinations" className="border-none">
                <AccordionTrigger className="bg-accent px-4 py-1 text-accent-foreground hover:no-underline">
                  {t('combinations').toUpperCase()}
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  {/* CONTROLLI DISTRIBUZIONE STAKE */}
                  <div className="space-y-3 px-4 pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Checkbox
                        checked={allGroupsSelected}
                        onCheckedChange={handleAllGroupsToggle}
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {t('divide').toUpperCase()}
                        </span>
                        <div className="flex w-44 items-center border border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDistributeStake}
                            disabled={systemDistributeStake <= 0}
                            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
                          >
                            <DivideIcon className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            placeholder="0"
                            value={systemDistributeStake || ''}
                            onChange={(e) =>
                              setSystemDistributeStake(
                                Number(e.target.value) || 0,
                              )
                            }
                            className="flex-1 border-none text-center focus-visible:ring-0"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddStakeToAll}
                            disabled={systemDistributeStake <= 0}
                            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
                          >
                            <CornerDownLeft className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="text-sm">
                          {t('add').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ACCORDION GRUPPI con altezza fissa */}
                  <div className="max-h-[200px] overflow-y-auto">
                    <Accordion type="multiple" className="w-full">
                      {systemGroups.map((group) => (
                        <AccordionItem
                          key={group.name}
                          value={group.name}
                          className="border-none bg-bet-foreground"
                        >
                          <AccordionTrigger className="bg-background px-4 py-2 hover:no-underline data-[state=open]:bg-muted">
                            <div className="flex w-full items-center justify-between pr-4">
                              <div className="flex items-center gap-2">
                                {/* Checkbox singolo gruppo (Azione 1) */}
                                <Checkbox
                                  checked={selectedGroups[group.name] || false}
                                  onCheckedChange={(checked) =>
                                    handleGroupToggle(
                                      group.name,
                                      checked as boolean,
                                    )
                                  }
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="font-bold">{group.name}</span>
                                <span className="text-muted-background font-bold">
                                  ({group.combinations.length})
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 border">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateGroupStake(
                                        group.name,
                                        Math.max(0, group.stake - 0.5),
                                      )
                                    }}
                                    className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </Button>
                                  <Input
                                    type="number"
                                    value={group.stake.toFixed(2)}
                                    className="bg-background-foreground h-8 w-20 text-center"
                                    readOnly
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleUpdateGroupStake(
                                        group.name,
                                        group.stake + 0.5,
                                      )
                                    }}
                                    className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            <div className="grid grid-cols-3 text-sm">
                              <div className="text-center">
                                <div className="text-foreground">
                                  {t('min').toUpperCase()}
                                </div>
                                <div className="font-semibold">
                                  € {(group.minWin * group.stake).toFixed(2)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-foreground">
                                  {t('max').toUpperCase()}
                                </div>
                                <div className="font-semibold">
                                  € {(group.maxWin * group.stake).toFixed(2)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-foreground">
                                  {t('total_played').toUpperCase()}
                                </div>
                                <div className="font-semibold">
                                  €{' '}
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
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator />

            {/* TOTALE COMBINAZIONI */}
            <div className="flex flex-row items-center justify-between px-4 py-3 text-foreground">
              <span className="text-[16px] font-semibold">
                {t('total_combinations').toUpperCase()}
              </span>
              <span className="text-[16px] font-bold">
                {totalSystemCombinations}/{totalSystemCombinations}
              </span>
            </div>

            <Separator />

            {/* IMPORTO */}
            <div className="flex flex-row items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">
                  {t('amount').toUpperCase()}
                </span>
              </div>
              <StakeInputDialog value={global} setValue={setGlobal} />
            </div>

            <Separator />

            {/* VINCITA POTENZIALE */}
            <div className="flex flex-row items-center justify-between px-4 py-3 text-foreground">
              <span className="text-[16px] font-semibold">
                {t('potential_win').toUpperCase()}
              </span>
              <span className="text-[16px] font-bold">
                € {totalSystemPotentialWin.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </CardFooter>

      <div className="px-1 py-3">
        <Button
          variant="betNow"
          onClick={handleBetNow}
          disabled={
            isSubmitting ||
            (betMode !== 'SYSTEM' && global <= 0) ||
            (betMode === 'SYSTEM' && totalSystemStake <= 0)
          }
          className="h-12 w-full text-[18px] font-bold"
        >
          {isSubmitting ? t('submitting') : t('bet_now').toUpperCase()}
        </Button>
      </div>

      {/* FASTBET section */}
      {selectedEvent && (
        <div className="bg-background">
          {selectedEvent?.discipline === 'SOCCER' ? (
            <SoccerFastBet selectedEvent={selectedEvent} />
          ) : (
            <RacingFastBet selectedEvent={selectedEvent} />
          )}
        </div>
      )}
    </Card>
  )
}
