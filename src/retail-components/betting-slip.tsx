'use client'

// Declare window.Bubble type
declare global {
  interface Window {
    Bubble?: (command: string, content: any) => void
  }
}

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { generateSystemGroups } from '@/retail-lib/system-bets'
import {
  BetEntry,
  Discipline,
  SubmittedTicket,
  UpcomingEvent,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import {
  ChevronDown,
  CornerDownLeft,
  DivideIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
} from 'lucide-react'
import Image from 'next/image'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import EventBets from './event-bets'
import NumericKeypadDrawer from './numeric-keypad-drawer'
import RacingFastBet from './racing-fast-bet'
import SoccerFastBet from './soccer-fast-bet'
import { Accordion, AccordionContent, AccordionItem } from './ui/accordion'
import { Checkbox } from './ui/checkbox'
import { Separator } from './ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/retail-components/ui/tooltip'

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

  // Ottieni il simbolo della valuta dall'API cashier
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'

  // Ottieni i valori dei pulsanti stake dall'API
  const stakeButtons = rootContext?.getStakeButtons?.() || [
    1000, 2000, 3000, 5000, 10000,
  ]

  // Ottieni i limiti di stake e vincita dall'API
  const minStake = rootContext?.getMinStake?.() || 50
  const minBet = rootContext?.getMinBet?.() || 0
  const maxWin = rootContext?.getMaxWin?.() || 1000000000
  const minStakeIncrement = rootContext?.getMinStakeIncrement?.() || 50

  const [accordionOpen, setAccordionOpen] = useState<string>('combinations')
  const [systemGroupsOpen, setSystemGroupsOpen] = useState<string[]>([])

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
    return baseSystemGroups
      .map((group) => ({
        ...group,
        stake: systemGroupStakes[group.name] ?? 0,
      }))
      .sort((a, b) => b.size - a.size)
  }, [baseSystemGroups, systemGroupStakes])

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get print function name from URL parameter (default: 'Bubble')
  const [printFunctionName, setPrintFunctionName] = useState('Bubble')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const funcName = params.get('print_function') || 'Bubble'
      setPrintFunctionName(funcName)
    }
  }, [])

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
        // Per default, tutti i gruppi NON sono selezionati
        initialSelections[group.name] = false
        initialStakes[group.name] = 0
      })

      setSelectedGroups(initialSelections)
      setAllGroupsSelected(false)
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
    if (systemDistributeStake <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    // Validazione min_stake
    if (systemDistributeStake < minStake) {
      toast.error(
        t('min_stake_error', { min: minStake }) ||
          `Minimum stake is ${currencySymbol} ${minStake.toFixed(2)}`,
      )
      return
    }

    if (systemGroups.length === 0) return

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

    // Usa minStakeIncrement dall'API
    const minIncrement = minStakeIncrement
    const target = systemDistributeStake

    // Formula originale: divide per combinazioni totali, arrotonda al minIncrement
    const baseStake =
      Math.floor(target / totalCombinations / minIncrement) * minIncrement
    const totalBaseUsed = baseStake * totalCombinations
    let remaining = target - totalBaseUsed

    // Inizializza tutti con base stake
    const stakes: Record<string, number> = {}
    for (const group of selectedGroupsList) {
      stakes[group.name] = baseStake
    }

    const groupsByPriority = [...selectedGroupsList].sort(
      (a, b) => a.combinations.length - b.combinations.length,
    )

    // PRIMO GIRO: Prova a dare il massimo possibile a ciascun gruppo
    for (const group of groupsByPriority) {
      if (remaining <= 0) break

      // Calcola quanto stake aggiuntivo questo gruppo può prendere
      const additionalStakePerCombination =
        remaining / group.combinations.length

      // Arrotonda DOWN al minIncrement più vicino
      const roundedAdditional =
        Math.floor(additionalStakePerCombination / minIncrement) * minIncrement

      if (roundedAdditional >= minIncrement) {
        const totalCost = roundedAdditional * group.combinations.length
        stakes[group.name] += roundedAdditional
        remaining -= totalCost
        // Fix floating point errors
        remaining = Math.round(remaining / minIncrement) * minIncrement
      }
    }

    // SECONDO GIRO: Se rimane ancora qualcosa, riprova tutti i gruppi
    if (remaining >= minIncrement) {
      for (const group of groupsByPriority) {
        if (remaining < minIncrement) break

        const additionalStakePerCombination =
          remaining / group.combinations.length

        const roundedAdditional =
          Math.floor(additionalStakePerCombination / minIncrement) *
          minIncrement

        if (roundedAdditional >= minIncrement) {
          const totalCost = roundedAdditional * group.combinations.length
          stakes[group.name] += roundedAdditional
          remaining -= totalCost
          // Fix floating point errors
          remaining = Math.round(remaining / minIncrement) * minIncrement
        }
      }
    }

    // Applica i risultati e deflagga i gruppi con stake = 0
    const newSelections: Record<string, boolean> = {}
    const groupsWithStake: string[] = []
    const groupsWithoutStake: string[] = []

    for (const group of selectedGroupsList) {
      if (stakes[group.name] > 0) {
        newSelections[group.name] = true
        groupsWithStake.push(group.name)
      } else {
        newSelections[group.name] = false
        groupsWithoutStake.push(group.name)
      }
    }

    setSystemGroupStakes((prev) => ({ ...prev, ...stakes }))
    setSelectedGroups((prev) => ({ ...prev, ...newSelections }))

    // Se alcuni gruppi sono stati deflaggeri, calcola quanto manca
    if (groupsWithoutStake.length > 0) {
      // Calcola il minimo necessario per includere tutti i gruppi
      const minNeededForAll = totalCombinations * minStake
      const difference = minNeededForAll - systemDistributeStake

      if (difference > 0) {
        toast.error(
          t('min_stake_per_combination_not_met', {
            amount: `${currencySymbol}${difference}`,
          }),
        )
      }
    }

    setTimeout(() => {
      const allSelected = systemGroups.every(
        (group) => newSelections[group.name] && stakes[group.name] > 0,
      )
      setAllGroupsSelected(allSelected)
    }, 0)
  }

  const handleAddStakeToAll = () => {
    if (systemDistributeStake <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    // Validazione min_stake
    if (systemDistributeStake < minStake) {
      toast.error(
        t('min_stake_error', { min: minStake }) ||
          `Minimum stake is ${currencySymbol} ${minStake.toFixed(2)}`,
      )
      return
    }

    // Controlla se almeno un gruppo è selezionato
    const hasSelectedGroups = systemGroups.some(
      (group) => selectedGroups[group.name],
    )
    if (!hasSelectedGroups) {
      toast.error(t('select_at_least_one_group'))
      return
    }

    const newStakes = { ...systemGroupStakes }
    const newSelections = { ...selectedGroups }

    // Itera sui gruppi selezionati e sostituisce il valore
    Object.keys(selectedGroups).forEach((groupName) => {
      if (selectedGroups[groupName]) {
        // sostituisce completamente il valore
        newStakes[groupName] = systemDistributeStake
        newSelections[groupName] = true
      }
    })

    // Sostituisce completamente lo stato invece di fare merge
    setSystemGroupStakes(newStakes)
    setSelectedGroups(newSelections)

    // Aggiorna checkbox "tutti"
    setTimeout(() => {
      const allSelected = systemGroups.every(
        (group) => newSelections[group.name] && newStakes[group.name] > 0,
      )
      setAllGroupsSelected(allSelected)
    }, 0)
  }

  const handleUpdateGroupStake = (groupName: string, value: number) => {
    const finalValue = Math.max(0, value)

    // Validazione: se il valore è maggiore di 0 ma minore di minStake, mostra errore
    if (finalValue > 0 && finalValue < minStake) {
      toast.error(
        t('min_stake_error', { min: minStake }) ||
          `Minimum stake is ${currencySymbol} ${minStake.toFixed(2)}`,
      )
      return
    }

    setSystemGroupStakes((prev) => ({
      ...prev,
      [groupName]: finalValue,
    }))
  }

  // Funzione per gestire l'input diretto nell'AMOUNT (va sul gruppo più grande)
  const handleDirectAmountInput = (value: number) => {
    if (value <= 0) {
      setGlobal(0)
      setSystemGroupStakes({})
      setSelectedGroups({})
      setAllGroupsSelected(false)
      return
    }

    // Trova il gruppo con il size più grande
    const largestGroup = systemGroups.reduce((largest, current) => {
      return current.size > largest.size ? current : largest
    }, systemGroups[0])

    if (!largestGroup) return

    // Calcola stake per combinazione: valore totale / numero combinazioni del gruppo più grande
    const stakePerCombination = value / largestGroup.combinations.length

    // Deseleziona tutti i gruppi
    const newSelectedGroups: Record<string, boolean> = {}
    const newStakes: Record<string, number> = {}

    systemGroups.forEach((group) => {
      if (group.size === largestGroup.size) {
        // Solo il gruppo più grande attivo
        newSelectedGroups[group.name] = true
        newStakes[group.name] = stakePerCombination
      } else {
        // Altri gruppi disattivati
        newSelectedGroups[group.name] = false
        newStakes[group.name] = 0
      }
    })

    setSelectedGroups(newSelectedGroups)
    setSystemGroupStakes((prev) => ({ ...prev, ...newStakes }))
    setAllGroupsSelected(false)
    setGlobal(value)
  }

  // Funzioni per gestire i checkbox
  const handleAllGroupsToggle = (checked: boolean) => {
    setAllGroupsSelected(checked)
    const newSelectedGroups: Record<string, boolean> = {}
    const newStakes: Record<string, number> = {}

    systemGroups.forEach((group) => {
      newSelectedGroups[group.name] = checked

      if (checked) {
        newStakes[group.name] = minStake
      } else {
        newStakes[group.name] = 0
      }
    })

    setSelectedGroups(newSelectedGroups)
    setSystemGroupStakes((prev) => ({
      ...prev,
      ...newStakes,
    }))
  }

  const handleGroupToggle = (groupName: string, checked: boolean) => {
    setSelectedGroups((prev) => ({
      ...prev,
      [groupName]: checked,
    }))

    if (checked) {
      setSystemGroupStakes((prev) => ({
        ...prev,
        [groupName]: minStake,
      }))
    } else {
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

  // Calcolo del totale effettivo di tutte le giocate (per il display)
  const actualTotalStake = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name] && group.stake > 0)
      .reduce((sum, group) => sum + group.stake * group.combinations.length, 0)
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
        return sum + group.maxWin * group.stake
      }, 0)
  }, [systemGroups, selectedGroups])

  // Calcola altezza dinamica dello ScrollArea in base al numero di gruppi
  const scrollAreaHeight = useMemo(() => {
    const numGroups = systemGroups.length
    const groupHeight = 59 // h-[59px] per ogni gruppo header

    // Mostra massimo 3 gruppi, minimo 1
    const groupsToShow = Math.min(Math.max(numGroups, 1), 3)
    const calculatedHeight = groupHeight * groupsToShow

    return calculatedHeight
  }, [systemGroups.length])

  // Sincronizza automaticamente global con il totale effettivo quando cambiano i gruppi
  useEffect(() => {
    if (betMode === 'SYSTEM') {
      // Aggiorna global solo se non è un input diretto dall'utente
      setGlobal(actualTotalStake)
    }
  }, [actualTotalStake, betMode])

  const handleBetNow = async () => {
    // Check if initCode is available (user is authenticated)
    if (!rootContext.initCode) {
      toast.error(t('login_required'))
      return
    }

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

    // Validazione min_stake per single/multiple
    if (betMode !== 'SYSTEM' && global < minStake) {
      toast.error(
        t('min_stake_error', { min: minStake }) ||
          `Minimum stake is ${currencySymbol} ${minStake.toFixed(2)}`,
      )
      return
    }

    // Validazione min_bet per il totale del ticket
    if (betMode !== 'SYSTEM' && minBet > 0 && global < minBet) {
      toast.error(
        t('min_bet_error', { min: minBet }) ||
          `Minimum ticket amount is ${currencySymbol} ${minBet.toFixed(2)}`,
      )
      return
    }

    // Validazione max_win per single/multiple
    if (betMode !== 'SYSTEM' && potentialWinning > maxWin) {
      toast.error(
        t('max_win_error', { max: maxWin }) ||
          `Maximum potential win is ${currencySymbol} ${maxWin.toFixed(2)}`,
      )
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

      // Validazione min_stake per ogni gruppo sistema
      const invalidGroups = systemGroups.filter(
        (group) =>
          selectedGroups[group.name] &&
          group.stake > 0 &&
          group.stake < minStake,
      )
      if (invalidGroups.length > 0) {
        toast.error(
          t('min_stake_error', { min: minStake }) ||
            `Minimum stake per combination is ${currencySymbol} ${minStake.toFixed(2)}`,
        )
        return
      }

      // Validazione min_bet per il totale del ticket sistema
      if (minBet > 0 && totalSystemStake < minBet) {
        toast.error(
          t('min_bet_error', { min: minBet }) ||
            `Minimum ticket amount is ${currencySymbol} ${minBet.toFixed(2)}`,
        )
        return
      }

      // Validazione max_win per sistema
      if (totalSystemPotentialWin > maxWin) {
        toast.error(
          t('max_win_error', { max: maxWin }) ||
            `Maximum potential win is ${currencySymbol} ${maxWin.toFixed(2)}`,
        )
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

      // Mappa i nomi dei mercati ai nomi API (normalizza spazi e case)
      const getAPIMarketName = (marketName: string): string => {
        const normalized = marketName.toLowerCase().trim()

        const API_MARKET_NAMES: Record<string, string> = {
          // Normalizza variazioni in inglese
          winner: 'winner',
          placed: 'placed',
          show: 'show',
          exacta: 'exacta',
          quinella: 'quinella',
          trifecta: 'trifecta',
          'boxed trifecta': 'boxedtrifecta',
          'box trifecta': 'boxedtrifecta',
          boxedtrifecta: 'boxedtrifecta',
          'even/odd': 'evenodd',
          evenodd: 'evenodd',
          'under/over': 'underover',
          underover: 'underover',

          // FastBet codes
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
              // Rimuovi " any" dall'outcome per i mercati boxed (quinella, boxedtrifecta)
              let cleanOutcome = entry.bet.option.outcome.replace(/ any$/, '')

              // Normalizza outcome per Even/Odd e Under/Over in lowercase
              if (
                apiMarketName === 'evenodd' ||
                apiMarketName === 'underover'
              ) {
                cleanOutcome = cleanOutcome.toLowerCase()
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
          currency: rootContext?.getCurrencyCode?.() || 'USD',
          type: ticketType,
          mode: ticketMode,
          ...(betMode === 'SYSTEM'
            ? {
                system: Object.fromEntries(
                  systemGroups
                    .filter((group) => group.stake > 0)
                    .map((group) => [
                      group.size.toString(),
                      group.stake * group.combinations.length,
                    ]),
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

      const response = await createPGVirtualAPICall(
        '/api/ticket/add',
        rootContext.initCode || '',
        {
          method: 'POST',
          body: JSON.stringify(ticketData),
        },
        rootContext.operator,
      )

      if (!response.ok) {
        const errorText = await response.text()

        try {
          const errorJson = JSON.parse(errorText)
          if (errorJson.ret_msg) {
            toast.error(errorJson.ret_msg)
          }
        } catch {
          toast.error(`Error: ${response.status}`)
        }

        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      // Check ret_code per successo (1024 = success)
      const retCode = parseInt(result.ret_code) || 0

      if (retCode === 1024) {
        // Successo - gestisci stampa
        if (result.print) {
          try {
            // Opzione 1: Funzione window.Bubble (se esiste)
            if (typeof window.Bubble === 'function') {
              window.Bubble('sell', result.print)
            }
          } catch {
            // Silently fail
          }

          // Opzione 2: PostMessage al parent (sempre, come fallback)
          try {
            // Helper to get translated event name based on discipline
            const getTranslatedEventName = (discipline: string) => {
              switch (discipline) {
                case 'DOGS':
                  return `${t('dog')} ${t('racing')}`
                case 'HORSES':
                  return `${t('horse')} ${t('racing')}`
                case 'SOCCER':
                  return t('football')
                default:
                  return ''
              }
            }

            // Helper to translate market names
            const getTranslatedMarket = (market: string) => {
              const marketLower = market.toLowerCase()
              switch (marketLower) {
                case 'winner':
                  return t('winner')
                case 'placed':
                  return t('place_2')
                case 'show':
                  return t('show_3')
                case 'exacta':
                  return t('exacta')
                case 'quinella':
                  return t('quinella')
                case 'trifecta':
                  return t('trifecta')
                case 'boxed trifecta':
                  return t('boxed_trifecta')
                case 'even/odd':
                  return t('even_odd')
                case 'under/over':
                  return t('under_over')
                default:
                  return market
              }
            }

            // Helper to get channelId based on discipline
            const getChannelId = (discipline: string) => {
              switch (discipline) {
                case 'DOGS':
                  return 4
                case 'HORSES':
                  return 3
                case 'DOGS8':
                  return 2
                case 'SOCCER':
                  return 1
                default:
                  return 0
              }
            }

            // Helper to get track number (6 or 8 runners) based on discipline
            const getTrackNumber = (discipline: string) => {
              switch (discipline) {
                case 'DOGS':
                case 'HORSES':
                  return 6
                default:
                  return 6
              }
            }

            // Helper to build trackName with translation
            const buildTrackName = (discipline: string) => {
              const trackNumber = getTrackNumber(discipline)
              return t(`track_${trackNumber}`)
            }

            // Prepare bet details for all modes - group by event
            const eventGroups = betEntries.reduce(
              (groups, entry) => {
                const eventId = entry.bet.event.number
                if (!groups[eventId]) {
                  const channelId = getChannelId(entry.bet.discipline)
                  const trackName = buildTrackName(entry.bet.discipline)
                  groups[eventId] = {
                    eventId: eventId,
                    eventName: getTranslatedEventName(entry.bet.discipline),
                    eventStartTime: entry.bet.event.startingAt,
                    discipline: entry.bet.discipline,
                    channelId: channelId,
                    trackName: trackName,
                    markets: [],
                  }
                }
                groups[eventId].markets.push({
                  market: getTranslatedMarket(entry.market),
                  competitorName: entry.bet.competitors || '',
                  selection: entry.bet.option.outcome,
                  odds: entry.bet.option.decPrice,
                })
                return groups
              },
              {} as Record<
                number,
                {
                  eventId: number
                  eventName: string
                  eventStartTime: Date
                  discipline: string
                  channelId: number
                  trackName: string
                  markets: Array<{
                    market: string
                    competitorName: string
                    selection: string
                    odds: number
                  }>
                }
              >,
            )

            const betsInfo = Object.values(eventGroups)

            // Prepare system groups info if in SYSTEM mode
            const systemGroupsInfo =
              betMode === 'SYSTEM'
                ? systemGroups
                    .filter((group) => group.stake > 0)
                    .map((group) => ({
                      name: group.name,
                      size: group.size,
                      stake: group.stake,
                      minWin: group.minWin,
                      maxWin: group.maxWin,
                      totalCombinations: group.combinations.length,
                      combinations: group.combinations.map((combo) => {
                        // Calculate odds for this combination
                        const comboOdds = combo.reduce(
                          (total, entry) => total * entry.bet.option.decPrice,
                          1,
                        )
                        const comboPotentialWin = comboOdds * group.stake

                        return {
                          odds: comboOdds,
                          potentialWin: comboPotentialWin,
                          entries: combo.map((entry) => ({
                            eventName: entry.bet.event.name || '',
                            competitorName: entry.bet.competitors || '',
                            selection: entry.bet.option.outcome,
                            odds: entry.bet.option.decPrice,
                          })),
                        }
                      }),
                    }))
                : undefined

            const postMessagePayload = {
              source: 'v-ui',
              func: printFunctionName,
              command: 'sell',
              content: {
                ticket: result.ticket,
                print: result.print,
                language: rootContext?.userData?.lang || 'en',
                betMode: betMode,
                bets: betsInfo,
                ...(betMode === 'SINGLE' || betMode === 'MULTIPLE'
                  ? {
                      totalOdds: totalOdds,
                      stake: global,
                      potentialWin: potentialWinning,
                    }
                  : {}),
                ...(systemGroupsInfo && { systemGroups: systemGroupsInfo }),
              },
            }

            console.log(
              '📤 PostMessage JSON:',
              JSON.stringify(postMessagePayload, null, 2),
            )

            window.parent.postMessage(postMessagePayload, '*')
          } catch {
            // Silently fail
          }
        }

        toast.success(t('bet_submitted_successfully'))
      } else {
        toast.error(result.description || t('bet_submission_error'))
        setIsSubmitting(false)
        return
      }

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
        <div className="relative top-[5px] col-span-2 flex h-[52px] w-[396px] flex-row items-center justify-between bg-accent px-5">
          <span className="items-start pb-1 pl-[135px] text-[14px] font-semibold text-accent-foreground">
            {t('bet_slip').toUpperCase()} ({betEntries.length})
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
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
                    className="relative bottom-1 ml-[18px] h-[20px] w-6 object-contain brightness-0 invert filter"
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('remove_all_bets')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex h-[41px] w-[396px] flex-row">
          <div
            className={`relative flex w-full flex-col items-center justify-center border-b-4 pb-0${
              isSystemToggleEnabled ? 'cursor-pointer' : ''
            } ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'border-betSlip-header bg-accent font-semibold text-betSlip-header border-b-4 pb-1' : 'font border-accent bg-  accent text-white'}`}
            onClick={
              isSystemToggleEnabled
                ? () => setSystemToggleMode('MULTIPLE')
                : undefined
            }
          >
            <span
              className={`pt-1 text-[14px] ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'font-semibold text-betSlip-header' : 'text-betSlip-header font-semibold pb-1'}`}
            >
              {betMode === 'SINGLE'
                ? `${t('single').toUpperCase()}`
                : `${t('multiple').toUpperCase()} (${Object.entries(betsByEvent).length})`}
            </span>

            {betMode === 'SINGLE' ||
              (betMode === 'MULTIPLE' && (
                <div className="absolute bottom-0.5 h-[0px] w-[156px] bg-navbarButton text-betSlip-header"></div>
              ))}
          </div>

          <div
            className={`relative flex w-full flex-col items-center justify-center border-b-4 ${
              isSystemToggleEnabled ? 'cursor-pointer' : ''
            } ${betMode === 'SYSTEM' ? 'font-normal border-betSlip-header bg-accent' : 'border-accent bg-accent font-normal text-betSlip-header'}`}
            onClick={
              isSystemToggleEnabled
                ? () => setSystemToggleMode('SYSTEM')
                : undefined
            }
          >
            <span
              className={`pt-1 text-[14px] ${betMode === 'SYSTEM' ? 'font-normal text-betSlip-header' : 'font-semibold text-betSlip-header'}`}
            >
              {t('system').toUpperCase()}
            </span>
            {betMode === 'SYSTEM' && (
              <div className="absolute bottom-0.5 h-[0px] w-[156px] bg-navbarButton text-background"></div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="h-full w-[396px] overflow-hidden bg-white p-2 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="relative flex h-full items-start justify-center pt-2">
            <span className="text-[15px] font-normal leading-none">
              {t('no_selection')}
            </span>
            <Button
              variant="betNow"
              size="icon-sm"
              className="absolute right-0 top-1 font-bold"
              onClick={restoreLastSubmittedTicket}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-2 bg-background">
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

      <CardFooter className="relative bottom-[26px] flex flex-col bg-background">
        {betMode !== 'SYSTEM' ? (
          <>
            <div className="relative h-[30px] bg-accent py-3"></div>

            {/* TOTALE QUOTA section */}
            <div className="relative top-[12px] flex flex-row items-center justify-between px-4 pt-[9px] text-foreground">
              <span className="relative bottom-[3px] text-[15px] font-semibold">
                {t('total_odd').toUpperCase()}
              </span>
              <span className="relative bottom-[3px] text-[15px] font-bold">
                {totalOdds.toFixed(2)}
              </span>
            </div>
            <Separator />

            {/* Quick stake buttons */}
            <div className="relative top-[19px] grid grid-cols-5 gap-2 p-2">
              {stakeButtons.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  className="h-8 bg-muted-foreground text-[14px] tabular-nums"
                  onClick={() => setGlobal((prev) => prev + amount)}
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* IMPORTO section */}
            <div className="relative top-[17px] flex flex-row items-center justify-between px-4 py-[18px]">
              <div className="flex items-center gap-2">
                <span className="pt-[1px] text-[16px] font-semibold">
                  {t('amount').toUpperCase()}
                </span>
              </div>
              <NumericKeypadDrawer
                value={global}
                setValue={setGlobal}
                inputWidth="w-[164px] text-[16px] tabular-nums"
                triggerLabel={t('amount').toUpperCase()}
                showPlusMinus={true}
                drawerId="global-amount"
                currencySymbol={currencySymbol}
              />
            </div>

            <Separator />

            {/* VINCITA POTENZIALE section */}
            <div className="relative top-[27px] flex flex-row items-center justify-between px-4 py-[12px] pb-[16px] pt-0 text-foreground">
              <span className="relative bottom-[1px] text-[17px] font-semibold">
                {t('potential_win').toUpperCase()}
              </span>
              <span className="text-[17px] font-semibold">
                {currencySymbol} {potentialWinning.toFixed(2)}
              </span>
            </div>
          </>
        ) : (
          <>
            {/* HEADER ACCORDION GENERALE */}
            <Accordion
              type="single"
              value={accordionOpen}
              onValueChange={setAccordionOpen}
              className="relative top-3 w-[396px]"
            >
              <AccordionItem value="combinations" className="border-none">
                <div className="relative bottom-[4px] h-[30px] bg-accent px-4 text-[13px] text-accent-foreground hover:no-underline">
                  <span className="relative bottom-1">
                    {t('combinations').toUpperCase()}
                  </span>
                  <button
                    onClick={() => {
                      setAccordionOpen(
                        accordionOpen === 'combinations' ? '' : 'combinations',
                      )
                    }}
                    className="relative left-[251px] top-[3px] transition-transform duration-200"
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
                  {/* CONTROLLI DISTRIBUZIONE STAKE */}
                  <div className="h-[50px] border-b px-4 pb-2">
                    <div className="relative top-[2px] flex items-center justify-between gap-2">
                      <Checkbox
                        checked={allGroupsSelected}
                        onCheckedChange={handleAllGroupsToggle}
                      />
                      <div className="relative top-[1px] mr-[3px] flex h-[33px] items-center gap-2">
                        <span className="mr-[4px] text-[12px] font-semibold">
                          {t('divide').toUpperCase()}
                        </span>
                        <div className="relative right-[3px] flex w-full items-center border border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDistributeStake}
                            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground hover:opacity-90"
                          >
                            <DivideIcon className="h-4 w-4" />
                          </Button>
                          <NumericKeypadDrawer
                            value={systemDistributeStake}
                            setValue={setSystemDistributeStake}
                            inputWidth="w-[142px] pr-2 text-[13px] "
                            triggerLabel={t('divide/add_amount')}
                            showPlusMinus={false}
                            drawerId="system-divide-add"
                            currencySymbol={currencySymbol}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleAddStakeToAll}
                            className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground hover:opacity-90"
                          >
                            <CornerDownLeft className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="relative right-[2px] text-[12px] font-semibold">
                          {t('add').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* ACCORDION GRUPPI con ScrollArea */}
                  <ScrollArea
                    className="overflow-hidden"
                    style={{ height: `${scrollAreaHeight}px` }}
                  >
                    <Accordion
                      type="multiple"
                      value={systemGroupsOpen}
                      onValueChange={setSystemGroupsOpen}
                      className="w-[396px]"
                    >
                      {systemGroups.map((group) => (
                        <AccordionItem
                          key={group.name}
                          value={group.name}
                          className="bg-bet-foreground"
                        >
                          <div
                            className={`relative h-[59px] border-b px-4 py-[7px] ${systemGroupsOpen.includes(group.name) ? 'bg' : 'bg-background'}`}
                          >
                            <div className="mt-[3px] flex w-full items-center justify-between">
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
                                />
                                <span className="pt-0.5 text-[12px] font-semibold">
                                  {group.name.toUpperCase()}
                                </span>
                                <span className="text-muted-background relative right-[5px] mt-[1px] text-[12px] font-semibold">
                                  (x{group.combinations.length})
                                </span>
                              </div>
                              <div className="relative flex items-center">
                                <div className="mr-[12px] mt-[2px] flex items-center gap-0 border">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const newValue =
                                        group.stake - minStakeIncrement
                                      const finalValue = Math.max(0, newValue)

                                      // Aggiorna il valore
                                      handleUpdateGroupStake(
                                        group.name,
                                        newValue,
                                      )

                                      // Se il valore va a zero o sotto, deseleziona immediatamente
                                      if (finalValue === 0) {
                                        setSelectedGroups((prev) => ({
                                          ...prev,
                                          [group.name]: false,
                                        }))

                                        // Aggiorna checkbox "tutti"
                                        setTimeout(() => {
                                          const updatedSelections = {
                                            ...selectedGroups,
                                            [group.name]: false,
                                          }
                                          const allSelected =
                                            systemGroups.every(
                                              (g) =>
                                                updatedSelections[g.name] &&
                                                (systemGroupStakes[g.name] ||
                                                  0) > 0,
                                            )
                                          setAllGroupsSelected(allSelected)
                                        }, 0)
                                      }
                                    }}
                                    disabled={group.stake <= 0}
                                    className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground hover:opacity-90"
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </Button>
                                  <NumericKeypadDrawer
                                    value={group.stake}
                                    setValue={(value) =>
                                      handleUpdateGroupStake(group.name, value)
                                    }
                                    inputWidth="w-[142px] pr-2 text-[13px]"
                                    triggerLabel={group.name}
                                    showPlusMinus={false}
                                    drawerId={`system-group-${group.name}`}
                                    currencySymbol={currencySymbol}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const newValue =
                                        group.stake + minStakeIncrement

                                      // Aggiorna il valore
                                      handleUpdateGroupStake(
                                        group.name,
                                        newValue,
                                      )

                                      // Se il valore è maggiore di zero, seleziona
                                      if (newValue > 0) {
                                        setSelectedGroups((prev) => ({
                                          ...prev,
                                          [group.name]: true,
                                        }))

                                        // Aggiorna checkbox "tutti"
                                        setTimeout(() => {
                                          const updatedSelections = {
                                            ...selectedGroups,
                                            [group.name]: true,
                                          }
                                          const allSelected =
                                            systemGroups.every(
                                              (g) =>
                                                updatedSelections[g.name] &&
                                                (systemGroupStakes[g.name] ||
                                                  newValue) > 0,
                                            )
                                          setAllGroupsSelected(allSelected)
                                        }, 0)
                                      }
                                    }}
                                    className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground hover:opacity-90"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                                {/* Chevron */}
                                <button
                                  onClick={() => {
                                    const isOpen = systemGroupsOpen.includes(
                                      group.name,
                                    )
                                    if (isOpen) {
                                      setSystemGroupsOpen((prev) =>
                                        prev.filter(
                                          (name) => name !== group.name,
                                        ),
                                      )
                                    } else {
                                      setSystemGroupsOpen((prev) => [
                                        ...prev,
                                        group.name,
                                      ])
                                    }
                                  }}
                                  className="ml-2 flex items-center justify-center"
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                  }}
                                >
                                  <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    style={{
                                      animation: systemGroupsOpen.includes(
                                        group.name,
                                      )
                                        ? 'chevron-rotate-open 0.2s ease-out forwards'
                                        : 'chevron-rotate-close 0.2s ease-out forwards',
                                    }}
                                  >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                          <AccordionContent className="h-[55px] border-b px-4">
                            <div className="relative top-1.5 grid grid-cols-3 text-[13px]">
                              <div className="relative left-[4px] text-center">
                                <div className="relative bottom-[2px] text-[12px] font-semibold capitalize text-foreground">
                                  {t('min')} {t('win')}
                                </div>
                                <div className="relative top-[0px] text-[13px] font-normal">
                                  {currencySymbol}{' '}
                                  {(group.minWin * group.stake).toFixed(2)}
                                </div>
                              </div>
                              <div className="relative right-[12px] text-center text-[12px] font-semibold">
                                <div className="relative bottom-[2px] capitalize text-foreground">
                                  {t('max')} {t('win')}
                                </div>
                                <div className="relative top-[0px] text-[13px] font-normal">
                                  {currencySymbol}{' '}
                                  {(group.maxWin * group.stake).toFixed(2)}
                                </div>
                              </div>
                              <div className="relative right-[16px] text-center text-[12px] font-semibold">
                                <div className="relative bottom-[2px] capitalize text-foreground">
                                  {t('total_played')}
                                </div>
                                <div className="relative top-[0px] text-[13px] font-normal">
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
                  </ScrollArea>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator />

            {/* TOTALE COMBINAZIONI */}
            <div className="relative bottom-[1px] flex w-[396px] flex-row items-center justify-between px-4 py-[27px] pb-[15px] text-foreground">
              <span className="text-[15px] font-semibold">
                {t('total_combinations').toUpperCase()}
              </span>
              <span className="text-[15px] font-semibold">
                {totalSystemCombinations}/{totalSystemCombinations}
              </span>
            </div>

            <Separator />

            {/* IMPORTO */}
            <div className="relative top-[2px] flex w-[396px] flex-row items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">
                  {t('amount').toUpperCase()}
                </span>
              </div>
              <NumericKeypadDrawer
                value={global}
                setValue={handleDirectAmountInput}
                inputWidth="w-[220px] border text-[16px] relative left-[4px]"
                triggerLabel={t('amount')}
                showPlusMinus={false}
                drawerId="system-amount"
                currencySymbol={currencySymbol}
              />
            </div>

            <Separator />

            {/* VINCITA POTENZIALE */}
            <div className="relative top-[29px] flex w-[396px] flex-row items-center justify-between px-4 pb-[19px] text-foreground">
              <span className="text-[17px] font-semibold">
                {t('potential_win').toUpperCase()}
              </span>
              <span className="text-[17px] font-semibold">
                {currencySymbol} {totalSystemPotentialWin.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </CardFooter>

      <div className="bg-tertiary-foreground">
        <div className="w-[396px] p-[12px] pb-[24px] pt-[9px]">
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

        <div className="w-[396px] bg-betSlip-header p-[12px] pb-[15px] pt-[9px]">
          {selectedEvent?.discipline === 'SOCCER' ? (
            <SoccerFastBet selectedEvent={selectedEvent} />
          ) : (
            <RacingFastBet selectedEvent={selectedEvent} />
          )}
        </div>
      </div>

      {/* FASTBET section */}
      {selectedEvent && <div className="w-[396px] bg-white"></div>}
    </Card>
  )
}
