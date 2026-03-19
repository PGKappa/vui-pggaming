'use client'

// Declare window.Bubble type
declare global {
  interface Window {
    Bubble?: (command: string, content: any) => void
  }
}

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
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
import { ScrollAreaB } from './ui/betting-slip-scroll-area'
import { getLayoutConfig } from '@/retail-lib/layout-config'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

const getEventStatus = (event: any): 'active' | 'expired' => {
  if (!event) return 'active'
  if (!event.startingAt) return 'active'

  const now = new Date()
  const eventTime = new Date(event.startingAt)

  if (event.discipline === 'SOCCER') return 'active'

  return now >= eventTime ? 'expired' : 'active'
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

  const currencySymbol = rootContext?.getCurrencySymbol?.() || '$'
  const stakeButtons = rootContext?.getStakeButtons?.() || [1000, 2000, 3000, 5000, 10000]
  const minStake = Number(rootContext?.getMinStake?.()) || 0.5
  const minBet = Number(rootContext?.getMinBet?.()) || 0
  const maxWin = Number(rootContext?.getMaxWin?.()) || 1000000000
  const minStakeIncrement = Number(rootContext?.getMinStakeIncrement?.()) || 0.5
  const systemStakeIncrement = Number(rootContext?.getSystemStakeIncrement?.()) || 0.1

  const [accordionOpen, setAccordionOpen] = useState<string>('combinations')
  const [systemGroupsOpen, setSystemGroupsOpen] = useState<string[]>([])

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    1,
  )

  const [global, setGlobal] = useState(0)
  const potentialWinning = global * totalOdds
  const { t } = useTranslation()

  const [systemGroupStakes, setSystemGroupStakes] = useState<Record<string, number>>({})
  const [systemDistributeStake, setSystemDistributeStake] = useState(0)
  const [selectedGroups, setSelectedGroups] = useState<Record<string, boolean>>({})
  const [allGroupsSelected, setAllGroupsSelected] = useState(false)

  const currentLanguage = rootContext?.userData?.lang || 'en'
  const layoutConfig = getLayoutConfig(currentLanguage)

  const baseSystemGroups = useMemo(() => {
    if (betMode !== 'SYSTEM') return []
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
  const [printFunctionName, setPrintFunctionName] = useState('Bubble')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const funcName = params.get('print_function') || 'Bubble'
      setPrintFunctionName(funcName)
    }
  }, [])

  useEffect(() => {
    if (!isSystemToggleEnabled && systemToggleMode === 'SYSTEM') {
      setSystemToggleMode('MULTIPLE')
    }
  }, [isSystemToggleEnabled, systemToggleMode, setSystemToggleMode])

  useEffect(() => {
    if (betMode === 'SYSTEM' && baseSystemGroups.length > 0) {
      const initialSelections: Record<string, boolean> = {}
      const initialStakes: Record<string, number> = {}

      baseSystemGroups.forEach((group) => {
        initialSelections[group.name] = false
        initialStakes[group.name] = 0
      })

      setSelectedGroups(initialSelections)
      setAllGroupsSelected(false)
      setSystemGroupStakes(initialStakes)
    } else {
      setSelectedGroups({})
      setAllGroupsSelected(false)
      setSystemGroupStakes({})
    }
  }, [betMode, baseSystemGroups])

  const getTicketType = (entries: BetEntry[]): string => {
    const disciplines = new Set(entries.map((entry) => entry.bet.discipline))
    if (disciplines.has(Discipline.SOCCER)) return 'football'
    const hasDogs = disciplines.has(Discipline.DOGS)
    const hasHorses = disciplines.has(Discipline.HORSES)
    if (hasDogs && hasHorses) return 'dogs-horses'
    else if (hasDogs) return 'dogs'
    else if (hasHorses) return 'horses'
    return 'football'
  }

  const getTicketMode = (mode: BetMode, entries: BetEntry[]): string => {
    if (mode === 'SYSTEM') return 'system'
    else if (mode === 'MULTIPLE' && entries.length > 1) return 'multiple'
    else return 'single'
  }

  const handleDistributeStake = () => {
    if (systemDistributeStake <= 0) { toast.error(t('enter_valid_amount')); return }
    if (systemDistributeStake < minStake) { toast.error(t('min_stake_error', { min: minStake })); return }
    if (systemGroups.length === 0) return

    const selectedGroupsList = systemGroups.filter((group) => selectedGroups[group.name])
    if (selectedGroupsList.length === 0) { toast.error(t('select_at_least_one_group')); return }

    const totalCombinations = selectedGroupsList.reduce((sum, group) => sum + group.combinations.length, 0)
    const minIncrement = systemStakeIncrement
    const target = systemDistributeStake
    const baseStake = Math.floor(target / totalCombinations / minIncrement) * minIncrement
    const totalBaseUsed = baseStake * totalCombinations
    let remaining = target - totalBaseUsed

    const stakes: Record<string, number> = {}
    for (const group of selectedGroupsList) { stakes[group.name] = baseStake }

    const groupsByPriority = [...selectedGroupsList].sort((a, b) => a.combinations.length - b.combinations.length)

    for (const group of groupsByPriority) {
      if (remaining <= 0) break
      const additionalStakePerCombination = remaining / group.combinations.length
      const roundedAdditional = Math.floor(additionalStakePerCombination / minIncrement) * minIncrement
      if (roundedAdditional >= minIncrement) {
        const totalCost = roundedAdditional * group.combinations.length
        stakes[group.name] += roundedAdditional
        remaining -= totalCost
        remaining = Math.round(remaining / minIncrement) * minIncrement
      }
    }

    if (remaining >= minIncrement) {
      for (const group of groupsByPriority) {
        if (remaining < minIncrement) break
        const additionalStakePerCombination = remaining / group.combinations.length
        const roundedAdditional = Math.floor(additionalStakePerCombination / minIncrement) * minIncrement
        if (roundedAdditional >= minIncrement) {
          const totalCost = roundedAdditional * group.combinations.length
          stakes[group.name] += roundedAdditional
          remaining -= totalCost
          remaining = Math.round(remaining / minIncrement) * minIncrement
        }
      }
    }

    const newSelections: Record<string, boolean> = {}
    const groupsWithoutStake: string[] = []

    for (const group of selectedGroupsList) {
      if (stakes[group.name] > 0) {
        newSelections[group.name] = true
      } else {
        newSelections[group.name] = false
        groupsWithoutStake.push(group.name)
      }
    }

    setSystemGroupStakes((prev) => ({ ...prev, ...stakes }))
    setSelectedGroups((prev) => ({ ...prev, ...newSelections }))

    if (groupsWithoutStake.length > 0) {
      const minNeededForAll = totalCombinations * minStake
      const difference = minNeededForAll - systemDistributeStake
      if (difference > 0) {
        toast.error(t('min_stake_per_combination_not_met', { amount: `${currencySymbol}${difference}` }))
      }
    }

    setTimeout(() => {
      const allSelected = systemGroups.every((group) => newSelections[group.name] && stakes[group.name] > 0)
      setAllGroupsSelected(allSelected)
    }, 0)
  }

  const handleAddStakeToAll = () => {
    if (systemDistributeStake <= 0) { toast.error(t('enter_valid_amount')); return }
    if (systemDistributeStake < minStake) { toast.error(t('min_stake_error', { min: minStake })); return }

    const hasSelectedGroups = systemGroups.some((group) => selectedGroups[group.name])
    if (!hasSelectedGroups) { toast.error(t('select_at_least_one_group')); return }

    const newStakes = { ...systemGroupStakes }
    const newSelections = { ...selectedGroups }

    Object.keys(selectedGroups).forEach((groupName) => {
      if (selectedGroups[groupName]) {
        newStakes[groupName] = systemDistributeStake
        newSelections[groupName] = true
      }
    })

    setSystemGroupStakes(newStakes)
    setSelectedGroups(newSelections)

    setTimeout(() => {
      const allSelected = systemGroups.every((group) => newSelections[group.name] && newStakes[group.name] > 0)
      setAllGroupsSelected(allSelected)
    }, 0)
  }

  const handleUpdateGroupStake = (groupName: string, value: number) => {
    const numValue = Number(value)
    const finalValue = Math.max(0, isNaN(numValue) ? 0 : numValue)
    const roundedValue = Math.round(finalValue * 100) / 100
    setSystemGroupStakes((prev) => ({ ...prev, [groupName]: roundedValue }))
  }

  const handleDirectAmountInput = (value: number) => {
    if (value <= 0) {
      setGlobal(0)
      setSystemGroupStakes({})
      setSelectedGroups({})
      setAllGroupsSelected(false)
      return
    }

    const largestGroup = systemGroups.reduce((largest, current) => {
      return current.size > largest.size ? current : largest
    }, systemGroups[0])

    if (!largestGroup) return

    const stakePerCombination = value / largestGroup.combinations.length
    const newSelectedGroups: Record<string, boolean> = {}
    const newStakes: Record<string, number> = {}

    systemGroups.forEach((group) => {
      if (group.size === largestGroup.size) {
        newSelectedGroups[group.name] = true
        newStakes[group.name] = stakePerCombination
      } else {
        newSelectedGroups[group.name] = false
        newStakes[group.name] = 0
      }
    })

    setSelectedGroups(newSelectedGroups)
    setSystemGroupStakes((prev) => ({ ...prev, ...newStakes }))
    setAllGroupsSelected(false)
    setGlobal(value)
  }

  const handleAllGroupsToggle = (checked: boolean) => {
    setAllGroupsSelected(checked)
    const newSelectedGroups: Record<string, boolean> = {}
    const newStakes: Record<string, number> = {}

    systemGroups.forEach((group) => {
      newSelectedGroups[group.name] = checked
      newStakes[group.name] = checked ? minStake : 0
    })

    setSelectedGroups(newSelectedGroups)
    setSystemGroupStakes((prev) => ({ ...prev, ...newStakes }))
  }

  const handleGroupToggle = (groupName: string, checked: boolean) => {
    setSelectedGroups((prev) => ({ ...prev, [groupName]: checked }))

    if (checked) {
      setSystemGroupStakes((prev) => ({ ...prev, [groupName]: minStake }))
    } else {
      setSystemGroupStakes((prev) => ({ ...prev, [groupName]: 0 }))
    }

    const updatedSelections = { ...selectedGroups, [groupName]: checked }
    const allSelected = systemGroups.every((group) => updatedSelections[group.name])
    setAllGroupsSelected(allSelected)
  }

  const totalSystemStake = useMemo(() => {
    return systemGroups.filter((group) => selectedGroups[group.name]).reduce((sum, group) => sum + group.stake, 0)
  }, [systemGroups, selectedGroups])

  const actualTotalStake = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name] && group.stake > 0)
      .reduce((sum, group) => sum + group.stake * group.combinations.length, 0)
  }, [systemGroups, selectedGroups])

  const totalSystemCombinations = useMemo(() => {
    return systemGroups.filter((group) => selectedGroups[group.name]).reduce((sum, group) => sum + group.combinations.length, 0)
  }, [systemGroups, selectedGroups])

  const totalSystemPotentialWin = useMemo(() => {
    return systemGroups
      .filter((group) => selectedGroups[group.name])
      .reduce((sum, group) => {
        if (group.stake === 0) return sum
        return sum + group.maxWin * group.stake
      }, 0)
  }, [systemGroups, selectedGroups])

  const scrollAreaHeight = useMemo(() => {
    const numGroups = systemGroups.length
    const groupHeight = 59
    const groupsToShow = Math.min(Math.max(numGroups, 1), 3)
    return groupHeight * groupsToShow
  }, [systemGroups.length])

  useEffect(() => {
    if (betMode === 'SYSTEM') {
      setGlobal(actualTotalStake)
    }
  }, [actualTotalStake, betMode])

  const handleBetNow = async () => {
    if (!rootContext.initCode) { toast.error(t('login_required')); return }
    if (betEntries.length === 0) { toast.error(t('no_bet_selected')); return }

    const expiredEntries = betEntries.filter((entry) => getEventStatus(entry.bet.event) === 'expired')

    if (expiredEntries.length > 0) {
      if (betEntries.length === expiredEntries.length) {
        toast.warning(t('event_started_single'))
      } else {
        const removedCount = expiredEntries.length
        toast.warning(
          removedCount > 1
            ? t('event_started_removed_plural', { count: removedCount })
            : t('event_started_removed', { count: removedCount }),
        )
      }
      return
    }

    if (betMode !== 'SYSTEM' && global <= 0) { toast.error(t('enter_valid_amount')); return }

    if (betMode !== 'SYSTEM' && minStakeIncrement > 0) {
      const stakeSteps = Math.round(global / minStakeIncrement)
      const reconstructed = stakeSteps * minStakeIncrement
      if (Math.abs(global - reconstructed) > 0.0001) {
        toast.error(t('stake_increment_error', { increment: minStakeIncrement }))
        return
      }
    }

    if (betMode !== 'SYSTEM' && Math.round(global * 100) < Math.round(minStake * 100)) {
      toast.error(t('min_stake_error', { min: minStake }))
      return
    }

    if (betMode !== 'SYSTEM' && minBet > 0 && global < minBet) {
      toast.error(t('min_bet_error', { min: minBet }))
      return
    }

    if (betMode !== 'SYSTEM' && potentialWinning > maxWin) {
      toast.error(t('max_win_error', { max: maxWin }))
      return
    }

    if (betMode === 'SYSTEM') {
      const totalSystemStake = systemGroups.reduce((sum, group) => sum + group.stake, 0)
      if (totalSystemStake <= 0) { toast.error(t('enter_system_amount')); return }

      const invalidGroups = systemGroups.filter(
        (group) => selectedGroups[group.name] && group.stake > 0 && group.stake < minStake,
      )
      if (invalidGroups.length > 0) { toast.error(t('min_stake_error', { min: minStake })); return }

      if (systemStakeIncrement > 0) {
        const invalidIncrementGroups = systemGroups.filter((group) => {
          if (!selectedGroups[group.name] || group.stake <= 0) return false
          const stakeSteps = Math.round(group.stake / systemStakeIncrement)
          const reconstructed = stakeSteps * systemStakeIncrement
          return Math.abs(group.stake - reconstructed) > 0.0001
        })
        if (invalidIncrementGroups.length > 0) {
          toast.error(t('stake_increment_error', { increment: systemStakeIncrement }))
          return
        }
      }

      if (minBet > 0 && totalSystemStake < minBet) { toast.error(t('min_bet_error', { min: minBet })); return }
      if (totalSystemPotentialWin > maxWin) { toast.error(t('max_win_error', { max: maxWin })); return }
    }

    setIsSubmitting(true)

    try {
      if (!rootContext?.cashierData || rootContext?.cashierData?.ret_code !== 1024) {
        toast.error(t('cashier_not_initialized'))
        setIsSubmitting(false)
        return
      }

      if (!rootContext?.initCode) {
        toast.error(t('login_required'))
        setIsSubmitting(false)
        return
      }

      if (!rootContext?.operator) {
        toast.error(t('operator_required'))
        setIsSubmitting(false)
        return
      }

      const groupedByEvent = betEntries.reduce((acc, entry) => {
        const eventId = entry.bet.event.number.toString()
        if (!acc[eventId]) acc[eventId] = []
        acc[eventId].push(entry)
        return acc
      }, {} as Record<string, typeof betEntries>)

      const getAPIMarketName = (marketName: string): string => {
        const normalized = marketName.toLowerCase().trim()
        const API_MARKET_NAMES: Record<string, string> = {
          winner: 'winner', placed: 'placed', show: 'show', exacta: 'exacta',
          quinella: 'quinella', trifecta: 'trifecta', 'boxed trifecta': 'boxedtrifecta',
          'box trifecta': 'boxedtrifecta', boxedtrifecta: 'boxedtrifecta',
          'even/odd': 'evenodd', evenodd: 'evenodd', 'under/over': 'underover', underover: 'underover',
          ganador: 'winner', colocado: 'placed', 'colocado 1º 2º': 'placed',
          'colocado 1º 2º 3º': 'show', 'colocado 1 2': 'placed', 'colocado 1 2 3': 'show',
          tercero: 'show', 'par/impar': 'evenodd', par: 'evenodd', impar: 'evenodd',
          'menos/mas': 'underover', 'menos / mas': 'underover', 'menos / más': 'underover',
          'menos / más 3.5': 'underover', place: 'placed', couples: 'exacta',
          triplets: 'trifecta', even_odd: 'evenodd', under_over: 'underover',
        }
        return API_MARKET_NAMES[normalized] || normalized
      }

      const selections = Object.entries(groupedByEvent).map(([eventId, entries]) => {
        const marketGroups = entries.reduce((acc, entry) => {
          const apiMarketName = getAPIMarketName(entry.apiMarket || entry.market)
          if (!acc[apiMarketName]) acc[apiMarketName] = []
          let cleanOutcome = entry.bet.option.outcome.replace(/ any$/, '')

          if (apiMarketName === 'evenodd' || apiMarketName === 'underover') {
            const lowerOutcome = cleanOutcome.toLowerCase()
            if (['par', 'pari', 'even'].includes(lowerOutcome)) cleanOutcome = 'even'
            else if (['impar', 'dispari', 'odd'].includes(lowerOutcome)) cleanOutcome = 'odd'
            else if (['menos', 'under'].includes(lowerOutcome)) cleanOutcome = 'under'
            else if (['más', 'mas', 'over'].includes(lowerOutcome)) cleanOutcome = 'over'
            else cleanOutcome = lowerOutcome
          }

          acc[apiMarketName].push({
            description: cleanOutcome,
            odds: entry.bet.option.decPrice.toString(),
            status: 1,
          })
          return acc
        }, {} as Record<string, any[]>)

        const markets = Object.entries(marketGroups).map(([marketName, selections]) => ({
          description: marketName,
          selections: selections,
        }))

        const firstEntry = entries[0]
        const gameId = firstEntry.bet.discipline === 'HORSES' ? 'horses6' : firstEntry.bet.discipline === 'DOGS' ? 'dogs6' : 'soccer'
        const channelId = firstEntry.bet.discipline === 'HORSES' ? 3 : firstEntry.bet.discipline === 'DOGS' ? 4 : 1
        const eventAny = firstEntry.bet.event as any
        const palimpsestId =
          eventAny.palimpsestId || eventAny.extId || selectedEvent?.extId || selectedEvent?.palimpsestId ||
          (firstEntry.bet.discipline === 'HORSES' ? '1000003504' : '1000003502')

        return {
          gameId,
          channelId,
          palimpsestId,
          eventId: parseInt(eventId, 10),
          isBanker: false,
          markets,
        }
      })

      const ticketType = getTicketType(betEntries)
      const ticketMode = getTicketMode(betMode, betEntries)
      const terminalId = rootContext?.cashierData?.configs?.terminals?.[0]

      const ticketData = {
        ...(terminalId ? { terminal_id: terminalId } : {}),
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
                      Math.round(group.stake * group.combinations.length * 100) / 100,
                    ]),
                ),
              }
            : { system: { '1': global } }),
          selections,
        },
      }

      const response = await createPGVirtualAPICall(
        '/api/ticket/add',
        rootContext.initCode || '',
        { method: 'POST', body: JSON.stringify(ticketData) },
        rootContext.operator,
      )

      if (!response.ok) {
        const errorText = await response.text()
        try {
          const errorJson = JSON.parse(errorText)
          const errorMsg = (errorJson.ret_msg || errorJson.message || errorJson.error || '').toLowerCase()
          if (
            errorMsg.includes('event started') || errorMsg.includes('event_started') ||
            errorMsg.includes('market closed') || errorMsg.includes('not available') ||
            errorMsg.includes('odds not found') || errorMsg.includes('event is closed') ||
            errorMsg.includes('event closed')
          ) {
            toast.warning(t('backend_event_started'))
          } else if (errorJson.ret_msg) {
            toast.error(errorJson.ret_msg)
          } else if (errorJson.message) {
            toast.error(errorJson.message)
          }
        } catch {
          const lowerError = errorText.toLowerCase()
          if (
            lowerError.includes('event started') || lowerError.includes('market closed') ||
            lowerError.includes('odds not found') || lowerError.includes('not available') ||
            lowerError.includes('event closed')
          ) {
            toast.warning(t('backend_event_started'))
          } else {
            toast.error(`${t('http_error')}: ${response.status} - ${errorText}`)
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      const retCode = parseInt(result.ret_code) || 0

      if (retCode === 1024) {
        if (result.print) {
          try {
            if (typeof window.Bubble === 'function') window.Bubble('sell', result.print)
          } catch { /* silent */ }

          try {
            const getTranslatedEventName = (discipline: string) => {
              switch (discipline) {
                case 'DOGS': return `${t('dog')} ${t('racing')}`
                case 'HORSES': return `${t('horse')} ${t('racing')}`
                case 'SOCCER': return t('football')
                default: return ''
              }
            }

            const getTranslatedMarket = (market: string) => {
              const marketLower = market.toLowerCase()
              switch (marketLower) {
                case 'winner': return t('winner')
                case 'placed': return t('place_2')
                case 'show': return t('show_3')
                case 'exacta': return t('exacta')
                case 'quinella': return t('quinella')
                case 'trifecta': return t('trifecta')
                case 'boxed trifecta': return t('boxed_trifecta')
                case 'even/odd': return t('even_odd')
                case 'under/over': return t('under_over')
                default: return market
              }
            }

            const getChannelId = (discipline: string) => {
              switch (discipline) {
                case 'DOGS': return 4
                case 'HORSES': return 3
                case 'DOGS8': return 2
                case 'SOCCER': return 1
                default: return 0
              }
            }

            const buildTrackName = (entry: (typeof betEntries)[0]) => {
              const track = entry.bet.track
              if (track) {
                const num = track.match(/\d+/)?.[0]
                if (num) return t(`track_${num}`)
                return track
              }
              return t('track_6')
            }

            const eventGroups = betEntries.reduce((groups, entry) => {
              const eventId = entry.bet.event.number
              if (!groups[eventId]) {
                groups[eventId] = {
                  eventId,
                  eventName: getTranslatedEventName(entry.bet.discipline),
                  eventStartTime: entry.bet.event.startingAt,
                  discipline: entry.bet.discipline,
                  channelId: getChannelId(entry.bet.discipline),
                  trackName: buildTrackName(entry),
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
            }, {} as Record<number, any>)

            const betsInfo = Object.values(eventGroups)

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
                        const comboOdds = combo.reduce((total, entry) => total * entry.bet.option.decPrice, 1)
                        return {
                          odds: comboOdds,
                          potentialWin: comboOdds * group.stake,
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
                betMode,
                bets: betsInfo,
                ...(betMode === 'SINGLE' || betMode === 'MULTIPLE'
                  ? { totalOdds, stake: global, potentialWin: potentialWinning }
                  : {}),
                ...(systemGroupsInfo && { systemGroups: systemGroupsInfo }),
              },
            }

            window.parent.postMessage(postMessagePayload, '*')
          } catch { /* silent */ }
        }

        toast.success(t('bet_submitted_successfully'))
      } else {
        const desc = (result.description || result.ret_msg || '').toLowerCase()
        if (
          desc.includes('event started') || desc.includes('market closed') ||
          desc.includes('odds not found') || desc.includes('not available') ||
          desc.includes('event closed')
        ) {
          toast.warning(t('backend_event_started'))
        } else {
          toast.error(result.description || t('bet_submission_error'))
        }
        setIsSubmitting(false)
        return
      }

      const newTicket: SubmittedTicket = {
        date: new Date(),
        amount: betMode === 'SYSTEM'
          ? systemGroups.reduce((sum, group) => sum + group.stake, 0)
          : global,
        winning: betMode === 'SYSTEM'
          ? systemGroups.reduce((sum, group) => sum + group.maxWin * group.stake, 0)
          : potentialWinning,
        betEntries,
      }

      localStorage.setItem('lastSubmittedTicket', JSON.stringify(newTicket))
      removeAllBets()
      setGlobal(0)
      setSystemGroupStakes({})
    } catch {
      toast.error(t('bet_submission_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
  className="ml-2 flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
  data-testid="betting-slip"
>
      <div className="grid grid-cols-2 text-center">
        <div className="relative top-[5px] col-span-2 flex h-[52px] w-full flex-row items-center justify-between bg-accent px-5">
          <span className="items-start pb-1 pl-[135px] text-[14px] font-semibold text-accent-foreground">
            {t('bet_slip').toUpperCase()} ({betEntries.length})
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="group size-7" size="icon" onClick={removeAllBets}>
                  <Image
                    src="/bin.svg"
                    alt="Bin"
                    width={40}
                    height={20}
                    className="relative bottom-1 ml-[18px] h-[20px] w-6 object-contain brightness-0 invert filter bg-transparent"
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
            } ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'border-b-4 border-betSlip-header bg-accent pb-1 font-semibold text-betSlip-header' : 'font border-accent bg-accent text-white'}`}
            onClick={isSystemToggleEnabled ? () => setSystemToggleMode('MULTIPLE') : undefined}
          >
            <span className={`pt-1 text-[14px] ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'font-semibold text-betSlip-header' : isSystemToggleEnabled ? 'pb-1 font-semibold text-white' : 'pb-1 font-normal text-white'}`}>
              {betMode === 'SINGLE' ? `${t('single').toUpperCase()}` : `${t('multiple').toUpperCase()} (${Object.entries(betsByEvent).length})`}
            </span>
            {betMode === 'SINGLE' || (betMode === 'MULTIPLE' && (
              <div className="absolute bottom-0.5 h-[0px] w-[156px] bg-navbarButton text-betSlip-header"></div>
            ))}
          </div>

          <div
            className={`relative flex w-full flex-col items-center justify-center border-b-4 ${
              isSystemToggleEnabled ? 'cursor-pointer' : ''
            } ${betMode === 'SYSTEM' ? 'border-betSlip-header bg-accent font-semibold' : 'border-accent bg-accent text-betSlip-header'}`}
            onClick={isSystemToggleEnabled ? () => setSystemToggleMode('SYSTEM') : undefined}
          >
            <span className={`pt-1 text-[14px] ${betMode === 'SYSTEM' ? 'font-semibold text-betSlip-header' : isSystemToggleEnabled ? 'font-semibold text-white' : 'font-normal text-white'}`}>
              {t('system').toUpperCase()}
            </span>
            {betMode === 'SYSTEM' && (
              <div className="absolute bottom-0.5 h-[0px] w-[156px] bg-navbarButton text-white"></div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="h-full w-full overflow-hidden bg-white p-2 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="relative flex h-full items-start justify-center pt-2">
            <span className="text-[15px] font-normal leading-none">{t('no_selection')}</span>
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
          <ScrollAreaB className="h-full w-full">
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
          </ScrollAreaB>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="relative mb-[26px] flex flex-col bg-background">
        {betMode !== 'SYSTEM' ? (
          <>
            <div className="relative h-[30px] w-full bg-accent py-3"></div>

            <div className="relative top-[12px] flex w-full flex-row items-center justify-between px-4 pt-[9px] text-foreground">
              <span className="relative bottom-[3px] text-[15px] font-semibold">
                {t('total_odd').toUpperCase()}
              </span>
              <span className="relative bottom-[3px] text-[15px] font-bold">
                {totalOdds.toFixed(2)}
              </span>
            </div>
            <Separator />

            <div className="relative top-[19px] grid w-full grid-cols-5 gap-2 p-2">
              {stakeButtons.map((amount, index) => {
                let numericAmount = 0
                if (typeof amount === 'string') {
                  numericAmount = parseFloat((amount as string).replace(/[^\d.]/g, ''))
                } else if (typeof amount === 'number') {
                  numericAmount = amount as number
                }
                if (isNaN(numericAmount) || numericAmount <= 0) return null

                return (
                  <Button
                    key={`stake-${index}-${numericAmount}`}
                    variant="outline"
                    size="sm"
                    className="h-8 bg-muted-foreground text-[14px] tabular-nums"
                    onClick={() => setGlobal((prev) => prev + numericAmount)}
                  >
                    {amount}
                  </Button>
                )
              })}
            </div>

            <div className="relative top-[17px] flex w-full flex-row items-center justify-between px-4 py-[18px]">
              <div className="flex items-center gap-2">
                <span className="pt-[1px] text-[15px] font-semibold">{t('amount').toUpperCase()}</span>
              </div>
              <NumericKeypadDrawer
                value={global}
                setValue={setGlobal}
                inputWidth="w-[174px] text-[16px] tabular-nums"
                triggerLabel={t('amount').toUpperCase()}
                showPlusMinus={true}
                drawerId="global-amount"
                currencySymbol={currencySymbol}
              />
            </div>

            <Separator />

            <div className="relative top-[27px] flex w-full flex-row items-center justify-between px-4 py-[12px] pb-[16px] pt-0 text-foreground">
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
            <Accordion
              type="single"
              value={accordionOpen}
              onValueChange={setAccordionOpen}
              className="relative top-3 w-full"
            >
              <AccordionItem value="combinations" className="border-none">
                <div className="relative bottom-[4px] h-[30px] w-full bg-accent px-4 text-[13px] text-accent-foreground hover:no-underline">
                  <span className="relative bottom-1">{t('combinations').toUpperCase()}</span>
                  <button
                    onClick={() => setAccordionOpen(accordionOpen === 'combinations' ? '' : 'combinations')}
                    className={`relative ${layoutConfig.bettingSlip.combinationsButtonLeft} top-[3px] transition-transform duration-200`}
                    style={{ transform: accordionOpen === 'combinations' ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown className="w-5 shrink-0" />
                  </button>
                </div>
                <AccordionContent className="pb-0">
                  <div className="h-[50px] border-b px-4 pb-2">
                    <div className="relative top-[2px] flex items-center justify-between gap-2">
                      <Checkbox checked={allGroupsSelected} onCheckedChange={handleAllGroupsToggle} />
                      <div className="relative top-[1px] mr-[3px] flex h-[33px] items-center gap-2">
                        <span className="mr-[4px] text-[12px] font-semibold">{t('divide').toUpperCase()}</span>
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
                            inputWidth="w-[142px] pr-2 text-[13px]"
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
                        <span className="relative right-[2px] text-[12px] font-semibold">{t('add').toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <ScrollAreaB className="overflow-hidden" style={{ height: `${scrollAreaHeight}px` }}>
                    <Accordion
                      type="multiple"
                      value={systemGroupsOpen}
                      onValueChange={setSystemGroupsOpen}
                      className="w-full"
                    >
                      {systemGroups.map((group) => (
                        <AccordionItem key={group.name} value={group.name} className="bg-bet-foreground">
                          <div className={`relative h-[59px] border-b px-4 py-[7px] ${systemGroupsOpen.includes(group.name) ? 'bg' : 'bg-background'}`}>
                            <div className="mt-[3px] flex w-full items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={selectedGroups[group.name] || false}
                                  onCheckedChange={(checked) => handleGroupToggle(group.name, checked as boolean)}
                                />
                                <span className="pt-0.5 text-[12px] font-semibold">{group.name.toUpperCase()}</span>
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
                                      const newValue = group.stake - systemStakeIncrement
                                      const finalValue = Math.max(0, newValue)
                                      handleUpdateGroupStake(group.name, newValue)
                                      if (finalValue === 0) {
                                        setSelectedGroups((prev) => ({ ...prev, [group.name]: false }))
                                        setTimeout(() => {
                                          const updatedSelections = { ...selectedGroups, [group.name]: false }
                                          setAllGroupsSelected(systemGroups.every((g) => updatedSelections[g.name] && (systemGroupStakes[g.name] || 0) > 0))
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
                                    setValue={(value) => handleUpdateGroupStake(group.name, value)}
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
                                      const newValue = group.stake + systemStakeIncrement
                                      handleUpdateGroupStake(group.name, newValue)
                                      if (newValue > 0) {
                                        setSelectedGroups((prev) => ({ ...prev, [group.name]: true }))
                                        setTimeout(() => {
                                          const updatedSelections = { ...selectedGroups, [group.name]: true }
                                          setAllGroupsSelected(systemGroups.every((g) => updatedSelections[g.name] && (systemGroupStakes[g.name] || newValue) > 0))
                                        }, 0)
                                      }
                                    }}
                                    className="h-8 w-7 bg-bet p-3 text-[19px] text-bet-foreground hover:opacity-90"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                                <button
                                  onClick={() => {
                                    const isOpen = systemGroupsOpen.includes(group.name)
                                    if (isOpen) {
                                      setSystemGroupsOpen((prev) => prev.filter((name) => name !== group.name))
                                    } else {
                                      setSystemGroupsOpen((prev) => [...prev, group.name])
                                    }
                                  }}
                                  className="ml-2 flex items-center justify-center"
                                  style={{ width: '20px', height: '20px' }}
                                >
                                  <svg
                                    className="relative left-1"
                                    width="20" height="20" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round"
                                    style={{
                                      animation: systemGroupsOpen.includes(group.name)
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
                                <div className="relative bottom-[2px] text-[12px] font-semibold capitalize text-foreground">{t('min')} {t('win')}</div>
                                <div className="relative top-[0px] text-[13px] font-normal">{currencySymbol} {(group.minWin * group.stake).toFixed(2)}</div>
                              </div>
                              <div className="relative right-[12px] text-center text-[12px] font-semibold">
                                <div className="relative bottom-[2px] capitalize text-foreground">{t('max')} {t('win')}</div>
                                <div className="relative top-[0px] text-[13px] font-normal">{currencySymbol} {(group.maxWin * group.stake).toFixed(2)}</div>
                              </div>
                              <div className="relative right-[16px] text-center text-[12px] font-semibold">
                                <div className="relative bottom-[2px] capitalize text-foreground">{t('total_played')}</div>
                                <div className="relative top-[0px] text-[13px] font-normal">{currencySymbol} {(group.stake * group.combinations.length).toFixed(2)}</div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </ScrollAreaB>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Separator />

            <div className="relative bottom-[1px] flex w-full flex-row items-center justify-between px-4 py-[27px] pb-[15px] text-foreground">
              <span className="text-[15px] font-semibold">{t('total_combinations').toUpperCase()}</span>
              <span className="text-[15px] font-semibold">{totalSystemCombinations}/{totalSystemCombinations}</span>
            </div>

            <Separator />

            <div className="relative top-[2px] flex w-full flex-row items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-semibold">{t('amount').toUpperCase()}</span>
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

            <div className="relative top-[29px] flex w-full flex-row items-center justify-between px-4 pb-[19px] text-foreground">
              <span className="text-[17px] font-semibold">{t('potential_win').toUpperCase()}</span>
              <span className="text-[17px] font-semibold">{currencySymbol} {totalSystemPotentialWin.toFixed(2)}</span>
            </div>
          </>
        )}
      </CardFooter>

      <div className="bg-tertiary-foreground">
        <div className="w-full p-[12px] pb-[24px] pt-[9px]">
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

        <div className="w-full bg-betSlip-header p-[12px] pb-[15px] pt-[9px]">
          {selectedEvent?.discipline === 'SOCCER' ? (
            <SoccerFastBet selectedEvent={selectedEvent} />
          ) : (
            <RacingFastBet selectedEvent={selectedEvent} />
          )}
        </div>
      </div>

      {selectedEvent && <div className="w-full bg-white"></div>}
    </Card>
  )
}