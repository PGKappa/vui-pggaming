'use client'

declare global {
  interface Window {
    Bubble?: (command: string, content: any) => void
  }
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/retail-components/ui/dialog'
import { Delete, X, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  TicketDetailInfo,
  TicketDetailResponse,
  TicketDetailSelection,
  TicketPayResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { computeSameEventOddsRange } from '@/retail-lib/system-bets'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useCallback, useContext, useEffect, useState } from 'react'
import { RootContext } from '@/retail-contexts/root-context'

function getDetailStatus(status: number): {
  translationKey: string
  isWinner: boolean
  isPaid: boolean
} {
  switch (status) {
    case 1:
      return { translationKey: 'pending', isWinner: false, isPaid: false }
    case 4:
      return { translationKey: 'winner', isWinner: true, isPaid: false }
    case 5:
    case 9:
      return { translationKey: 'lost', isWinner: false, isPaid: false }
    case 6:
      return { translationKey: 'winner', isWinner: true, isPaid: true }
    default:
      return { translationKey: 'pending', isWinner: false, isPaid: false }
  }
}

const COMBO_SIZE_LABELS: Record<number, { key: string; label: string }> = {
  1: { key: 'combo_single', label: 'Singola' },
  2: { key: 'combo_double', label: 'Doppia' },
  3: { key: 'combo_treble', label: 'Tripla' },
  4: { key: 'combo_fourfold', label: 'Quadrupla' },
  5: { key: 'combo_fivefold', label: 'Quintupla' },
  6: { key: 'combo_sixfold', label: 'Sestupla' },
  7: { key: 'combo_sevenfold', label: 'Settupla' },
  8: { key: 'combo_eightfold', label: 'Ottupla' },
  9: { key: 'combo_ninefold', label: 'Novupla' },
  10: { key: 'combo_tenfold', label: 'Decupla' },
}
function getComboSizeLabel(
  size: number,
  t: (key: string, fallback: string) => string,
): string {
  const entry = COMBO_SIZE_LABELS[size]
  return entry ? t(entry.key, entry.label) : `${t('system', 'Sistema')} ${size}`
}

function getBetTypeLabel(
  betType: string,
  system: Record<string, string>,
  totalSelections: number,
): 'single' | 'multiple' | 'system' {
  const keys = Object.keys(system)
  if (betType === '2' || keys.length > 1) return 'system'
  if (keys.length === 1) {
    const tierSize = parseInt(keys[0])
    if (!isNaN(tierSize) && tierSize < totalSelections) return 'system'
  }
  if (totalSelections > 1) return 'multiple'
  return 'single'
}

// ticketInfo.time arriva dal backend in UTC (stesso pattern già corretto in
// parseTicketTime, use-ticket-list.ts) — va convertito in orario locale con
// Date.UTC, non semplicemente formattato come se fosse già locale, altrimenti
// il Dettaglio Ticket mostra un orario indietro di 2 ore (GMT 0 invece di
// GMT+2) rispetto all'orario evento mostrato correttamente altrove.
function toLocalDateFromTicketTime(time: TicketDetailInfo['time']): Date {
  const [year, month, day, hour, min, sec] = time
  return new Date(Date.UTC(year, month, day, hour, min, sec ?? 0))
}

function formatTicketTime(time: TicketDetailInfo['time']): string {
  const date = toLocalDateFromTicketTime(time)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String(date.getFullYear())
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${d}/${m}/${y} - ${h}:${mi}:${s}`
}

function formatTicketDate(time: TicketDetailInfo['time']): string {
  const date = toLocalDateFromTicketTime(time)
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${d}/${m}/${date.getFullYear()}`
}

function toLocalEventTime(rawStartTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(rawStartTime)) return rawStartTime
  const parsed = new Date(rawStartTime)
  if (isNaN(parsed.getTime())) return rawStartTime
  return `${format(parsed, 'dd/MM/yyyy')} - ${format(parsed, 'HH:mm')}`
}

function crossProduct(groups: number[][]): number[] {
  let products: number[] = [1]
  for (const group of groups) {
    const next: number[] = []
    for (const base of products) {
      for (const odd of group) next.push(base * odd)
    }
    products = next
  }
  return products
}


function comboOddsProductsForSize(
  fixedSlots: number[][],
  nonFixedSlots: number[][],
  size: number,
): number[] {
  const needed = size - fixedSlots.length
  if (needed < 0 || needed > nonFixedSlots.length) return []

  const fixedProducts = crossProduct(fixedSlots)
  if (needed === 0) return fixedProducts

  const restProducts: number[] = []
  function enumerate(start: number, chosen: number[][], depth: number) {
    if (depth === needed) {
      restProducts.push(...crossProduct(chosen))
      return
    }
    for (let i = start; i < nonFixedSlots.length; i++) {
      enumerate(i + 1, [...chosen, nonFixedSlots[i]], depth + 1)
    }
  }
  enumerate(0, [], 0)

  const result: number[] = []
  for (const fp of fixedProducts) {
    for (const rp of restProducts) result.push(fp * rp)
  }
  return result
}

function selectionEventKey(sel: TicketDetailSelection): string {
  return `${sel.channelId}-${sel.gameId}-${sel.eventId}`
}

function selectionFieldSize(sel: TicketDetailSelection): number | undefined {
  if (sel.competitors?.length) return sel.competitors.length
  const runnersCount = Object.keys(sel.game?.dict?.runners ?? {}).length
  return runnersCount > 0 ? runnersCount : undefined
}

type EventOddsGroup = {
  entries: { odds: number; market: string }[]
  fieldSize?: number
}

// Un evento per gruppo (fisso o variabile), con TUTTE le sue selezioni
// (odds + nome mercato) e, se disponibile, il numero totale di partecipanti
// alla gara — serve a computeSameEventOddsRange per capire se il campo è
// coperto per intero (vedi lo stesso ragionamento in system-bets.ts).
function getEventOddsGroups(info: TicketDetailInfo): {
  fixedGroups: EventOddsGroup[]
  nonFixedGroups: EventOddsGroup[]
} {
  const fixedGroups: EventOddsGroup[] = []
  const nonFixedGroups: EventOddsGroup[] = []
  for (const sel of info.selections) {
    const isBanker = String(sel.isBanker) === 'true'
    const entries: { odds: number; market: string }[] = []
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) entries.push({ odds: o, market: market.description })
      }
    }
    if (entries.length === 0) entries.push({ odds: 1, market: '' })
    const group: EventOddsGroup = { entries, fieldSize: selectionFieldSize(sel) }
    if (isBanker) fixedGroups.push(group)
    else nonFixedGroups.push(group)
  }
  return { fixedGroups, nonFixedGroups }
}

// Quote realmente raggiungibili nel caso migliore/peggiore per un singolo
// evento — se l'evento ha una sola selezione non c'è nulla da capire, è
// sempre quella.
function eventOddsRange(group: EventOddsGroup): {
  minAssigned: number[]
  maxAssigned: number[]
  positiveOdds: number
  canBeZero: boolean
} {
  if (group.entries.length === 1) {
    return {
      minAssigned: [group.entries[0].odds],
      maxAssigned: [group.entries[0].odds],
      positiveOdds: group.entries[0].odds,
      canBeZero: false,
    }
  }
  const { minAssigned, maxAssigned, minOdds, canBeZero } =
    computeSameEventOddsRange(group.entries, group.fieldSize)
  return {
    minAssigned: minAssigned.map((e) => e.odds),
    maxAssigned: maxAssigned.map((e) => e.odds),
    positiveOdds: minOdds,
    canBeZero,
  }
}

function buildMinScenarioLists(
  fixedGroups: EventOddsGroup[],
  nonFixedGroups: EventOddsGroup[],
  rangeOf: (group: EventOddsGroup) => ReturnType<typeof eventOddsRange>,
): Map<EventOddsGroup, number[]> {
  const scenario = new Map<EventOddsGroup, number[]>()
  const allGroups = [...fixedGroups, ...nonFixedGroups]
  const someGroupAlwaysWins = allGroups.some((g) => !rangeOf(g).canBeZero)

  if (someGroupAlwaysWins) {
    for (const group of allGroups) {
      const range = rangeOf(group)
      scenario.set(group, range.canBeZero ? [] : range.minAssigned)
    }
    return scenario
  }

  const active = new Set<EventOddsGroup>()
  if (fixedGroups.length > 0) {
    for (const group of fixedGroups) active.add(group)
  } else {
    let cheapest: EventOddsGroup | null = null
    let cheapestOdds = Infinity
    for (const group of allGroups) {
      const odds = rangeOf(group).positiveOdds
      if (odds < cheapestOdds) {
        cheapestOdds = odds
        cheapest = group
      }
    }
    if (cheapest) active.add(cheapest)
  }

  for (const group of allGroups) {
    scenario.set(group, active.has(group) ? rangeOf(group).minAssigned : [])
  }
  return scenario
}

function sumRoundedCrossProduct(oddsLists: number[][], stake: number): number {
  return crossProduct(oddsLists).reduce(
    (sum, product) => sum + Math.round(product * stake * 100) / 100,
    0,
  )
}

function getEventSlots(info: TicketDetailInfo): {
  fixedSlots: number[][]
  nonFixedSlots: number[][]
} {
  const distinctEvents = new Set(info.selections.map(selectionEventKey))
  const fixedSlots: number[][] = []
  const nonFixedSlots: number[][] = []

  if (distinctEvents.size === 1 && info.selections.length > 0) {
    const sel = info.selections[0]
    const isBanker = String(sel.isBanker) === 'true'
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) {
          if (isBanker) fixedSlots.push([o])
          else nonFixedSlots.push([o])
        }
      }
    }
    if (fixedSlots.length === 0 && nonFixedSlots.length === 0) {
      if (isBanker) fixedSlots.push([1])
      else nonFixedSlots.push([1])
    }
    return { fixedSlots, nonFixedSlots }
  }

  for (const sel of info.selections) {
    const isBanker = String(sel.isBanker) === 'true'
    const odds: number[] = []
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) odds.push(o)
      }
    }
    if (odds.length === 0) odds.push(1)
    if (isBanker) fixedSlots.push(odds)
    else nonFixedSlots.push(odds)
  }

  return { fixedSlots, nonFixedSlots }
}

export function computeSystemSummary(info: TicketDetailInfo): {
  totalSelections: number
  levels: { size: number; stakeTotal: number; combinations: number }[]
  totalCombinations: number
  fixedCount: number
} | null {
  const systemKeys = Object.keys(info.system)
  if (systemKeys.length === 0) return null

  const { fixedSlots, nonFixedSlots } = getEventSlots(info)
  const n = fixedSlots.length + nonFixedSlots.length

  const levels = systemKeys
    .map((k) => {
      const size = parseInt(k)
      if (isNaN(size) || size < 1 || size > n) return null
      const combos = comboOddsProductsForSize(fixedSlots, nonFixedSlots, size)
      if (combos.length === 0) return null
      return {
        size,
        stakeTotal: parseFloat(info.system[k]) || 0,
        combinations: combos.length,
      }
    })
    .filter((l): l is { size: number; stakeTotal: number; combinations: number } =>
      l !== null,
    )
    .sort((a, b) => a.size - b.size)

  return {
    totalSelections: n,
    levels,
    totalCombinations: levels.reduce((sum, l) => sum + l.combinations, 0),
    fixedCount: fixedSlots.length,
  }
}

export function computeMinMaxWin(info: TicketDetailInfo): {
  minWin: number
  maxWin: number
} {
  const amount = parseFloat(String(info.amount)) || 0
  const systemKeys = Object.keys(info.system)
  const distinctEvents = new Set(info.selections.map(selectionEventKey))

  if (distinctEvents.size === 1 && info.selections.length > 0) {
    const sel = info.selections[0]
    const oddsEntries = sel.markets.flatMap((market) =>
      market.selections
        .map((s) => ({ odds: parseFloat(s.odds), market: market.description }))
        .filter((e) => e.odds > 0),
    )
    if (oddsEntries.length === 0) return { minWin: 0, maxWin: 0 }
    if (oddsEntries.length === 1) {
      const win = Math.round(oddsEntries[0].odds * amount * 100) / 100
      return { minWin: win, maxWin: win }
    }

    const totalStake =
      systemKeys.length > 0
        ? Object.values(info.system).reduce(
            (sum, v) => sum + (parseFloat(v) || 0),
            0,
          )
        : amount
    const stakePerSelection =
      Math.round((totalStake / oddsEntries.length) * 100) / 100
    const { minOdds, maxAssigned } = computeSameEventOddsRange(
      oddsEntries,
      selectionFieldSize(sel),
    )
    const maxWin = maxAssigned.reduce(
      (sum, e) =>
        sum + Math.round(e.odds * stakePerSelection * 100) / 100,
      0,
    )
    return {
      minWin: Math.round(minOdds * stakePerSelection * 100) / 100,
      maxWin: Math.round(maxWin * 100) / 100,
    }
  }

  const { fixedGroups, nonFixedGroups } = getEventOddsGroups(info)
  const n = fixedGroups.length + nonFixedGroups.length
  if (n === 0) return { minWin: 0, maxWin: 0 }

  if (systemKeys.length === 0) {
    const allGroups = [...fixedGroups, ...nonFixedGroups]
    const maxLists = allGroups.map((g) => eventOddsRange(g).maxAssigned)
    const minLists = allGroups.map((g) => eventOddsRange(g).minAssigned)
    return {
      minWin: Math.round(sumRoundedCrossProduct(minLists, amount) * 100) / 100,
      maxWin: Math.round(sumRoundedCrossProduct(maxLists, amount) * 100) / 100,
    }
  }

  const { fixedSlots, nonFixedSlots } = getEventSlots(info)

  const rangeCache = new Map<
    EventOddsGroup,
    ReturnType<typeof eventOddsRange>
  >()
  const rangeOf = (group: EventOddsGroup) => {
    let range = rangeCache.get(group)
    if (!range) {
      range = eventOddsRange(group)
      rangeCache.set(group, range)
    }
    return range
  }
  const minScenario = buildMinScenarioLists(
    fixedGroups,
    nonFixedGroups,
    rangeOf,
  )

  let minWin = 0
  let maxWin = 0
  for (const k of systemKeys) {
    const kNum = parseInt(k)
    if (isNaN(kNum) || kNum < 1 || kNum > n) continue
    // Il numero di combinazioni grezze (per dividere la puntata della
    // taglia in parti uguali) resta quello "classico": non cambia col fix,
    // cambia solo QUALI di quelle combinazioni possono vincere insieme.
    const rawCombosCount = comboOddsProductsForSize(
      fixedSlots,
      nonFixedSlots,
      kNum,
    ).length
    if (rawCombosCount === 0) continue
    const tierTotalStake = parseFloat(info.system[k]) || 0
    const stakePerCombo =
      Math.round((tierTotalStake / rawCombosCount) * 100) / 100

    const needed = kNum - fixedGroups.length
    if (needed < 0 || needed > nonFixedGroups.length) continue

    const fixedMaxLists = fixedGroups.map((g) => rangeOf(g).maxAssigned)
    const fixedMinLists = fixedGroups.map((g) => minScenario.get(g) ?? [])

    let tierMaxWin = 0
    let tierMinWin = 0
    const chosen: number[] = []
    const enumerate = (start: number, depth: number) => {
      if (depth === needed) {
        const maxLists = [
          ...fixedMaxLists,
          ...chosen.map((i) => rangeOf(nonFixedGroups[i]).maxAssigned),
        ]
        tierMaxWin += sumRoundedCrossProduct(maxLists, stakePerCombo)

        const minLists = [
          ...fixedMinLists,
          ...chosen.map((i) => minScenario.get(nonFixedGroups[i]) ?? []),
        ]
        tierMinWin += sumRoundedCrossProduct(minLists, stakePerCombo)
        return
      }
      for (let i = start; i < nonFixedGroups.length; i++) {
        chosen.push(i)
        enumerate(i + 1, depth + 1)
        chosen.pop()
      }
    }
    enumerate(0, 0)

    minWin += tierMinWin
    maxWin += tierMaxWin
  }
  return {
    minWin: Math.round(minWin * 100) / 100,
    maxWin: Math.round(maxWin * 100) / 100,
  }
}

export default function TicketCheckDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCandidates,
  terminalId,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: number | null
  ticketCandidates?: Array<string | number>
  terminalId?: string
  onPaid?: () => void
}) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'

  const [ticketInfo, setTicketInfo] = useState<TicketDetailInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState<string | null>(null)
  const [cddXml, setCddXml] = useState<string | null>(null)
  const [cddRequired, setCddRequired] = useState(false)
  const [pinMode, setPinMode] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)
  const [showPayConfirm, setShowPayConfirm] = useState(false)

  const isDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1'

  const fetchTicket = useCallback(
    async (id: number, candidates: Array<string | number> = []) => {
      if (!rootContext?.initCode || !rootContext?.operator) return
      setLoading(true)
      setError(null)
      setTicketInfo(null)
      setPayResult(null)

      const idsToTry = Array.from(
        new Set<string | number>([...candidates, id].filter(Boolean)),
      )

      try {
        for (const currentId of idsToTry) {
          const response = await createPGVirtualAPICall(
            `/api/ticket/${currentId}`,
            rootContext.initCode,
            undefined,
            rootContext.operator,
          )
          const data: TicketDetailResponse = await response.json()
          if (data.ret_code === 1024 && data.info) {
            setTicketInfo(data.info)
            return
          }
          if (data.description) {
            console.warn('Ticket detail lookup failed', {
              currentId,
              retCode: data.ret_code,
              description: data.description,
            })
          }
        }
        setError(
          t('ticket_not_found', 'Ticket non trovato') +
            (idsToTry.length ? ` (${idsToTry.join(', ')})` : ''),
        )
      } catch {
        setError(t('ticket_not_found', 'Ticket non trovato'))
      } finally {
        setLoading(false)
      }
    },
    [rootContext?.initCode, rootContext?.operator, t],
  )

  const handlePrintCdd = useCallback((xml: string) => {
    if (typeof window.Bubble === 'function') {
      window.Bubble('printcdd', xml)
    }
    setCddXml(xml)
  }, [])

  const handlePay = useCallback(async () => {
    if (!ticketInfo || !rootContext?.initCode || !rootContext?.operator) return
    setPaying(true)
    setPayResult(null)
    setShowPayConfirm(false)
    try {
      const response = await createPGVirtualAPICall(
        `/api/ticket/pay/${ticketInfo.ticket_id}`,
        rootContext.initCode,
        undefined,
        rootContext.operator,
      )
      const data: TicketPayResponse = await response.json()
      console.log('[TicketPay] API response:', data)
      if (String(data.ret_code) === '1027') {
        setCddRequired(true)
        if (data.print) {
          handlePrintCdd(data.print)
        }
        return
      }
      if (String(data.ret_code) === '1024') {
        if (data.print && typeof window.Bubble === 'function') {
          window.Bubble('pay', data.print)
        }
        setPayResult('success')
        fetchTicket(ticketInfo.ticket_id)
        onPaid?.()
      } else {
        setPayResult(data.description || t('pay_error', 'Errore nel pagamento'))
      }
    } catch {
      setPayResult(t('pay_error', 'Errore nel pagamento'))
    } finally {
      setPaying(false)
    }
  }, [
    ticketInfo,
    rootContext?.initCode,
    rootContext?.operator,
    fetchTicket,
    handlePrintCdd,
    onPaid,
    t,
  ])

  const handlePayWithPin = useCallback(async () => {
    if (
      !ticketInfo ||
      !rootContext?.initCode ||
      !rootContext?.operator ||
      !pinInput
    )
      return
    setPaying(true)
    setPinError(null)
    try {
      const response = await createPGVirtualAPICall(
        `/api/ticket/pay/${ticketInfo.ticket_id}?pin=${encodeURIComponent(pinInput)}`,
        rootContext.initCode,
        undefined,
        rootContext.operator,
      )
      const data: TicketPayResponse = await response.json()
      if (String(data.ret_code) === '1024') {
        if (data.print && typeof window.Bubble === 'function') {
          window.Bubble('pay', data.print)
        }
        setPayResult('success')
        setPinMode(false)
        setPinInput('')
        fetchTicket(ticketInfo.ticket_id)
        onPaid?.()
      } else {
        setPinError(data.description || t('pin_error', 'PIN non corretto'))
        setPinInput('')
      }
    } catch {
      setPinError(t('pay_error', 'Errore nel pagamento'))
      setPinInput('')
    } finally {
      setPaying(false)
    }
  }, [
    ticketInfo,
    rootContext?.initCode,
    rootContext?.operator,
    pinInput,
    fetchTicket,
    onPaid,
    t,
  ])

  useEffect(() => {
    if (open && ticketId) {
      fetchTicket(ticketId, ticketCandidates)
    }
    if (!open) {
      setTicketInfo(null)
      setError(null)
      setPayResult(null)
      setCddXml(null)
      setCddRequired(false)
      setPinMode(false)
      setPinInput('')
      setPinError(null)
      setShowPayConfirm(false)
      setShowReplayPlayer(false)
      setReplayVideos([])
      setReplayIndex(0)
    }
  }, [open, ticketId, ticketCandidates, fetchTicket])

  const fmt = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return `0.00 ${currencySymbol}`
    return `${num.toFixed(2)} ${currencySymbol}`
  }

  const [showReplayPlayer, setShowReplayPlayer] = useState(false)
  const [replayIndex, setReplayIndex] = useState(0)
  const [replayVideos, setReplayVideos] = useState<
    Array<{ url: string | null; loading: boolean; sel: TicketDetailSelection }>
  >([])

  // Deduplicated unique events for replay (computed once ticketInfo is available)
  const uniqueReplaySelections = ticketInfo
    ? (() => {
        const seen = new Set<string>()
        return ticketInfo.selections.filter((sel) => {
          const key = selectionEventKey(sel)
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      })()
    : []

  const fetchReplayForIndex = async (index: number) => {
    if (!ticketInfo || !rootContext?.initCode || !rootContext?.operator) return
    const sel = uniqueReplaySelections[index]
    if (!sel) return

    // Mark this slot as loading
    setReplayVideos((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], loading: true }
      return next
    })

    try {
      const response = await createPGVirtualAPICall(
        '/api/event/results/replay',
        rootContext.initCode!,
        {
          method: 'POST',
          body: JSON.stringify({
            gameId: sel.gameId,
            channelId: sel.channelId,
            palimpsestId: sel.palimpsestId,
            eventId: sel.eventId,
          }),
        },
        rootContext.operator,
      )
      const data = response.ok ? await response.json() : null
      setReplayVideos((prev) => {
        const next = [...prev]
        next[index] = { url: data?.video?.src ?? null, loading: false, sel }
        return next
      })
    } catch {
      setReplayVideos((prev) => {
        const next = [...prev]
        next[index] = { url: null, loading: false, sel }
        return next
      })
    }
  }

  const handleOpenReplay = async () => {
    if (!ticketInfo || uniqueReplaySelections.length === 0) return
    // Initialise slots (all loading: false, url: null) then fetch index 0
    const slots = uniqueReplaySelections.map((sel) => ({
      url: null as string | null,
      loading: false,
      sel,
    }))
    setReplayVideos(slots)
    setReplayIndex(0)
    setShowReplayPlayer(true)
    // Fetch first event immediately
    await fetchReplayForIndex(0)
  }

  const handleReplayNav = async (direction: 'prev' | 'next') => {
    const newIndex =
      direction === 'next'
        ? Math.min(replayIndex + 1, uniqueReplaySelections.length - 1)
        : Math.max(replayIndex - 0 - 1, 0)
    setReplayIndex(newIndex)
    // Lazy-load if not yet fetched
    if (!replayVideos[newIndex]?.url && !replayVideos[newIndex]?.loading) {
      await fetchReplayForIndex(newIndex)
    }
  }

  const statusInfo = ticketInfo ? getDetailStatus(ticketInfo.status) : null

  const totalSelections =
    ticketInfo?.selections.reduce(
      (acc, sel) =>
        acc + sel.markets.reduce((a, m) => a + m.selections.length, 0),
      0,
    ) ?? 0

  const betTypeKey = ticketInfo
    ? getBetTypeLabel(ticketInfo.betType, ticketInfo.system, totalSelections)
    : 'single'

  const minMaxWin = ticketInfo
    ? computeMinMaxWin(ticketInfo)
    : { minWin: 0, maxWin: 0 }

  const systemSummary = ticketInfo ? computeSystemSummary(ticketInfo) : null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="flex max-h-[calc(100vh-40px)] w-[600px] max-w-[600px] flex-col overflow-hidden border-0 p-0"
          style={{ background: '#1e1e1e', borderRadius: '1px 1px 0 0' }}
        >
          {/* HEADER */}
          <DialogHeader
            className="shrink-0 bg-accent text-center"
            style={{ padding: '18px 20px' }}
          >
            <DialogTitle className="m-0 text-[18px] font-bold tracking-[1px] text-white">
              {t('ticket_details', 'DETTAGLI TICKET')}
            </DialogTitle>
          </DialogHeader>

          {/* LOADING */}
          {loading && (
            <div
              className="flex items-center justify-center py-16"
              style={{ background: '#212121' }}
            >
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div
              className="px-6 py-12 text-center"
              style={{ background: '#212121', borderRadius: '1px' }}
            >
              <p className="text-lg font-semibold" style={{ color: '#ccc' }}>
                {error}
              </p>
            </div>
          )}

          {/* CONTENT */}
          {ticketInfo && statusInfo && (
            <>
              {/* BODY scrollabile */}
              <div
                className="min-h-0 flex-1 overflow-y-auto"
                style={{ background: '#212121' }}
              >
                <div className="flex min-h-full flex-col px-5">
                  {/* CODICE + STATO */}
                  <div className="flex items-center justify-between pb-4 pt-5">
                    <div>
                      <div
                        className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('code', 'CODICE')}
                      </div>
                      <div className="text-[16px] font-bold tracking-[1px] text-white">
                        {ticketInfo.ticket_id}
                      </div>
                    </div>
                    {statusInfo.isWinner && (
                      <div
                        className="flex items-center px-[18px] py-[10px] text-[14px] font-bold uppercase tracking-[1px] text-white"
                        style={{
                          background: 'rgba(58,158,74,0.2)',
                          border: '2px solid #3a9e4a',
                          borderRadius: '2px',
                        }}
                      >
                        {statusInfo.isPaid
                          ? t('paid', 'PAGATO')
                          : t('winning', 'VINCENTE')}
                        <span
                          className="ml-3 h-[9px] w-[9px] shrink-0 rounded-full"
                          style={{ background: '#3a9e4a' }}
                        />
                      </div>
                    )}
                    {!statusInfo.isWinner &&
                      statusInfo.translationKey === 'lost' && (
                        <div
                          className="flex items-center px-[18px] py-[10px] text-[14px] font-bold uppercase tracking-[1px] text-white"
                          style={{
                            background: 'rgba(158,58,58,0.2)',
                            border: '2px solid #9e3a3a',
                            borderRadius: '2px',
                          }}
                        >
                          {t('lost', 'PERDENTE')}
                          <span
                            className="ml-3 h-[9px] w-[9px] shrink-0 rounded-full"
                            style={{ background: '#9e3a3a' }}
                          />
                        </div>
                      )}
                    {!statusInfo.isWinner &&
                      statusInfo.translationKey === 'pending' && (
                        <div
                          className="flex items-center px-[18px] py-[10px] text-[14px] font-bold uppercase tracking-[1px] text-white"
                          style={{
                            background: 'rgba(138,138,42,0.2)',
                            border: '2px solid #8a8a2a',
                            borderRadius: '2px',
                          }}
                        >
                          {t('pending', 'IN ATTESA')}
                          <span
                            className="ml-3 h-[9px] w-[9px] shrink-0 rounded-full"
                            style={{ background: '#8a8a2a' }}
                          />
                        </div>
                      )}
                  </div>

                  {/* DATA E ORA */}
                  <div className="flex items-end justify-between py-[14px]">
                    <div>
                      <div
                        className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('date_hour', 'DATA E ORA')}
                      </div>
                      <div className="text-[16px] font-bold text-white">
                        {formatTicketTime(ticketInfo.time)}
                      </div>
                    </div>
                    {terminalId && (
                      <div className="text-right">
                        <div
                          className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('terminal', 'TERMINALE')}
                        </div>
                        <div className="text-[16px] font-bold text-white">
                          {terminalId}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PUNTATA / MIN WIN / MAX WIN — per le Multiple si mostra
                      solo il Pagamento Potenziale; per la Singola si mostra
                      un solo valore (Vincita Potenziale, min === max sempre);
                      solo per i Sistemi ha senso mostrare Min e Max distinti. */}
                  <div className="relative flex items-end pb-5 pt-[14px]">
                    <div className={betTypeKey === 'system' ? 'flex-1' : ''}>
                      <div
                        className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('stake', 'PUNTATA')}
                      </div>
                      <div className="text-[16px] font-bold text-white">
                        {fmt(ticketInfo.amount)}
                      </div>
                    </div>
                    {betTypeKey === 'multiple' ? (
                      <div className="absolute left-1/2 -translate-x-1/2 text-center">
                        <div
                          className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('potential_payout', 'PAGAMENTO POTENZIALE')}
                        </div>
                        <div className="text-[16px] font-bold text-white">
                          {fmt(minMaxWin.maxWin)}
                        </div>
                      </div>
                    ) : betTypeKey === 'single' ? (
                      <div className="absolute left-1/2 -translate-x-1/2 text-center">
                        <div
                          className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('potential_win', 'VINCITA POTENZIALE')}
                        </div>
                        <div className="text-[16px] font-bold text-white">
                          {fmt(minMaxWin.maxWin)}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <div
                            className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                            style={{ color: '#888' }}
                          >
                            {t('min_win', 'MIN WIN')}
                          </div>
                          <div className="text-[16px] font-bold text-white">
                            {fmt(minMaxWin.minWin)}
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <div
                            className="mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]"
                            style={{ color: '#888' }}
                          >
                            {t('max_win', 'MAX WIN')}
                          </div>
                          <div className="text-[16px] font-bold text-white">
                            {fmt(minMaxWin.maxWin)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <hr style={{ borderColor: '#3a3a3a' }} />

                  {/* TIPO label */}
                  <div
                    className="flex items-center justify-center text-center"
                    style={{ height: '60px' }}
                  >
                    <span
                      className="text-[17px] font-semibold uppercase tracking-[1.5px]"
                      style={{ color: '#888' }}
                    >
                      {t(betTypeKey)}
                    </span>
                  </div>

                  {/* DEBUG: simula CDD */}
                  {isDebug &&
                    !cddXml &&
                    statusInfo.isWinner &&
                    !statusInfo.isPaid && (
                      <div className="mb-3 text-center">
                        <button
                          className="rounded border border-dashed px-3 py-1 text-xs"
                          style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                          onClick={() =>
                            handlePrintCdd(
                              `<printCDDTicket><body><CDDData TransactionId="TEST-${ticketInfo.ticket_id}" TransactionType="P" Amount="${ticketInfo.amount_won}" Pin="" WinCode="TEST-${ticketInfo.ticket_id}" /></body></printCDDTicket>`,
                            )
                          }
                        >
                          [DEBUG] Simula CDD
                        </button>
                      </div>
                    )}

                  {/* EVENT CARDS */}
                  {ticketInfo.selections.map((sel, idx) => (
                    <div
                      key={idx}
                      className="mb-[30px] p-[14px] px-4"
                      style={{ background: '#2a2a2a' }}
                    >
                      {/* Card header */}
                      <div className="mb-[14px] flex items-start justify-between">
                        <div
                          className="text-[15px] font-bold uppercase leading-[1.6] tracking-[0.5px]"
                          style={{ color: '#aaa' }}
                        >
                          {sel.game.dict.misc.name} {sel.channelName}
                          {String(sel.isBanker) === 'true' && (
                            <span
                              className="ml-2 rounded px-[6px] py-[2px] text-[10px] font-bold uppercase tracking-[0.4px] text-white"
                              style={{ background: '#f0a500' }}
                            >
                              {t('fixed', 'Fissa')}
                            </span>
                          )}
                          <br />
                          <span
                            className="text-[14px] font-normal"
                            style={{ color: '#777' }}
                          >
                            {sel.trackName}
                          </span>
                        </div>
                        <div
                          className="text-right text-[15px] font-semibold leading-[1.6] tracking-[0.4px]"
                          style={{ color: '#aaa' }}
                        >
                          {(() => {
                            const normalizedStartTime = toLocalEventTime(
                              sel.startTime,
                            )
                            return normalizedStartTime.includes(' - ')
                              ? normalizedStartTime
                              : `${formatTicketDate(ticketInfo.time)} - ${normalizedStartTime}`
                          })()}
                          <br />
                          <span className="text-[14px]" style={{ color: '#666' }}>
                            {t('event', 'Evento')} {sel.eventId}
                          </span>
                        </div>
                      </div>

                      {/* Markets / Selections */}
                      {sel.markets.map((market, mIdx) => {
                        // Il backend restituisce il mercato Under/Over come
                        // codice generico "underover" — ma quando il
                        // dizionario del backend (sel.game.dict.markets) non
                        // include già la soglia, va aggiunta a mano (su
                        // questo branch esiste solo 3.5 per le corse a 6),
                        // altrimenti il Dettaglio Ticket mostra un generico
                        // "Under/Over" senza numero. Se il dizionario la
                        // include già, NON va duplicata.
                        const isUnderOver = /under|over|menos|más|mas/i.test(
                          market.description || '',
                        )
                        const rawMarketLabel =
                          sel.game.dict.markets[market.description] ||
                          market.description
                        const marketLabel =
                          isUnderOver && !/\d/.test(rawMarketLabel)
                            ? `${rawMarketLabel} 3.5`
                            : rawMarketLabel

                        return market.selections.map((s, sIdx) => (
                          <div
                            key={`${mIdx}-${sIdx}`}
                            className="flex items-center justify-between py-[11px]"
                            style={{
                              borderTop:
                                mIdx === 0 && sIdx === 0
                                  ? undefined
                                  : '1px solid #363636',
                            }}
                          >
                            <span
                              className="flex-1 text-[12.5px] font-semibold tracking-[0.4px]"
                              style={{ color: '#ccc' }}
                            >
                              {marketLabel}
                            </span>
                            <span
                              className="flex-1 text-center text-[12.5px] font-semibold tracking-[0.4px]"
                              style={{ color: '#ccc' }}
                            >
                              {(() => {
                                if (isUnderOver) {
                                  const outcome = (
                                    s.description || ''
                                  ).toLowerCase()
                                  if (
                                    outcome === 'under' ||
                                    outcome === 'menos' ||
                                    outcome === 'u'
                                  )
                                    return t('under_full', 'Under')
                                  if (
                                    outcome === 'over' ||
                                    outcome === 'más' ||
                                    outcome === 'mas' ||
                                    outcome === 'o'
                                  )
                                    return t('over_full', 'Over')
                                }
                                const num = parseInt(s.description)
                                const name = !isNaN(num) && sel.competitors?.[num - 1]
                                  ? sel.competitors[num - 1]
                                  : sel.game.dict.runners?.[s.description]
                                return name ? `${s.description} - ${name}` : s.description
                              })()}
                            </span>
                            <span
                              className="flex flex-1 items-center justify-end space-x-2 text-[12.5px] font-semibold tracking-[0.4px]"
                              style={{ color: '#ccc' }}
                            >
                              Q. {s.odds}
                            </span>
                          </div>
                        ))
                      })}
                    </div>
                  ))}

                  <div className="flex flex-1 flex-col justify-center">
                  {/* COMBINAZIONI: taglie giocate, importo e combinazioni
                      per taglia, totale combinazioni — le stesse
                      informazioni già presenti sulla ricevuta stampata
                      (systemGroupsInfo). */}
                  {systemSummary && betTypeKey === 'system' && (
                    <>
                      <hr style={{ borderColor: '#3a3a3a', marginBottom: '16px' }} />
                      <div
                        className="mb-[14px] text-center text-[17px] font-bold uppercase text-white"
                      >
                        {t('combinations', 'Combinazioni')}
                      </div>
                      <div className="mb-2 grid grid-cols-3">
                        <div
                          className="text-left text-[14px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('quantity', 'Quantità')}
                        </div>
                        <div
                          className="text-center text-[14px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('combination', 'Combinazione')}
                        </div>
                        <div
                          className="text-right text-[14px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('amount', 'Importo')}
                        </div>
                      </div>
                      {systemSummary.levels.map((level) => (
                        <div
                          key={level.size}
                          className="grid grid-cols-3 py-[8px]"
                          style={{ borderTop: '1px solid #363636' }}
                        >
                          <div
                            className="text-left text-[14px] font-semibold"
                            style={{ color: '#ccc' }}
                          >
                            {level.combinations}
                          </div>
                          <div
                            className="text-center text-[14px] font-semibold"
                            style={{ color: '#ccc' }}
                          >
                            {getComboSizeLabel(level.size, t)}
                          </div>
                          <div className="text-right text-[14px] font-bold text-white">
                            {fmt(level.stakeTotal)}
                          </div>
                        </div>
                      ))}
                      <div
                        className="flex items-baseline space-x-2 py-[9px]"
                        style={{ borderTop: '1px solid #444' }}
                      >
                        <span
                          className="text-[15px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888', position: 'relative', top: '17px' }}
                        >
                          {t('total_combinations', 'Totale Combinazioni')}
                        </span>
                        <span
                          className="text-[15px] font-bold text-white"
                          style={{ position: 'relative', top: '17px' }}
                        >
                          {systemSummary.totalCombinations}
                        </span>
                      </div>
                    </>
                  )}

                  {/* VIDEO REPLAY */}
                  <div>
                    {showReplayPlayer ? (
                      <div
                        className="overflow-hidden rounded-xl"
                        style={{ background: '#111' }}
                      >
                        {/* Event info header — matches event card style (#2a2a2a) */}
                        {(() => {
                          const currentSel = uniqueReplaySelections[replayIndex]
                          if (!currentSel) return null
                          return (
                            <div
                              className="flex items-center justify-between px-3 py-2"
                              style={{ background: '#2a2a2a' }}
                            >
                              <div className="flex flex-col">
                                <span
                                  className="text-[12px] font-bold"
                                  style={{ color: '#fff' }}
                                >
                                  {currentSel.game.dict.misc.name}{' '}
                                  {currentSel.channelName}
                                </span>
                                <span
                                  className="text-[11px]"
                                  style={{ color: '#aaa' }}
                                >
                                  {currentSel.trackName}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span
                                  className="text-[11px] font-semibold"
                                  style={{ color: '#ccc' }}
                                >
                                  {toLocalEventTime(currentSel.startTime)}
                                </span>
                                <span
                                  className="text-[11px]"
                                  style={{ color: '#888' }}
                                >
                                  {t('event', 'Evento')} {currentSel.eventId}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  setShowReplayPlayer(false)
                                  setReplayVideos([])
                                }}
                                className="ml-3 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:opacity-80"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        })()}

                        {/* Video area */}
                        <div className="relative flex h-[200px] items-center justify-center bg-black">
                          {replayVideos[replayIndex]?.loading ? (
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
                          ) : replayVideos[replayIndex]?.url ? (
                            <video
                              key={replayVideos[replayIndex].url!}
                              src={replayVideos[replayIndex].url!}
                              controls
                              autoPlay
                              playsInline
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span
                              className="text-[13px]"
                              style={{ color: '#666' }}
                            >
                              {t('no_video_available', 'Video non disponibile')}
                            </span>
                          )}
                        </div>

                        {/* Navigation bar — only shown when there are multiple events */}
                        {uniqueReplaySelections.length > 1 && (
                          <div
                            className="flex items-center justify-between px-3 py-2"
                            style={{ background: '#1a1a1a' }}
                          >
                            <button
                              disabled={replayIndex === 0}
                              onClick={() => handleReplayNav('prev')}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:opacity-80 disabled:opacity-30"
                              style={{ background: '#333' }}
                            >
                              <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span
                              className="text-[12px] font-semibold"
                              style={{ color: '#aaa' }}
                            >
                              {replayIndex + 1} /{' '}
                              {uniqueReplaySelections.length}
                            </span>
                            <button
                              disabled={
                                replayIndex ===
                                uniqueReplaySelections.length - 1
                              }
                              onClick={() => handleReplayNav('next')}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:opacity-80 disabled:opacity-30"
                              style={{ background: '#333' }}
                            >
                              <ChevronRight className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center" style={{ height: '33px' }}>
                        <button
                          className="w-[260px] cursor-pointer rounded-lg border-0 bg-replay py-3 text-[14px] font-bold uppercase tracking-[1.5px] text-white disabled:opacity-60"
                          style={{ display: 'none' }}
                          disabled={replayVideos[0]?.loading}
                          onClick={handleOpenReplay}
                        >
                          {replayVideos[0]?.loading
                            ? t('loading', 'Loading') + '...'
                            : t('show_replay', 'VIDEO REPLAY')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Errore pagamento */}
                  {payResult && payResult !== 'success' && (
                    <p
                      className="pb-4 text-center text-sm"
                      style={{ color: '#cc4444' }}
                    >
                      {payResult}
                    </p>
                  )}

                  {/* CDD PIN keypad — only shown in body when pinMode is active */}
                  {statusInfo.isWinner &&
                    !statusInfo.isPaid &&
                    (cddRequired || cddXml) &&
                    pinMode && (
                      <div className="mb-4">
                        <div
                          className="overflow-hidden rounded-xl"
                          style={{ background: '#2a2a2a' }}
                        >
                          <div className="flex h-[45px] items-center justify-center bg-accent">
                            <span className="font-semibold tracking-[1px] text-white">
                              {t('insert_pin_cdd', 'INSERISCI PIN CDD')}
                            </span>
                          </div>
                          <div className="flex flex-col space-y-3 p-4">
                            <div className="flex items-center space-x-2">
                              <div
                                className="flex h-12 flex-1 items-center justify-end rounded-lg px-3 text-[22px] font-bold tracking-widest text-white"
                                style={{
                                  background: '#1e1e1e',
                                  border: '1px solid #3a3a3a',
                                }}
                              >
                                {pinInput.length > 0 ? (
                                  '●'.repeat(pinInput.length)
                                ) : (
                                  <span
                                    className="w-full text-center text-sm"
                                    style={{ color: '#555' }}
                                  >
                                    PIN CDD
                                  </span>
                                )}
                              </div>
                              <button
                                className="flex h-12 w-[56px] items-center justify-center rounded-lg border-0"
                                style={{
                                  background: '#1e1e1e',
                                  border: '1px solid #3a3a3a',
                                }}
                                onClick={() =>
                                  setPinInput((p) => p.slice(0, -1))
                                }
                              >
                                <Delete
                                  className="h-5 w-5"
                                  style={{ color: '#ccc' }}
                                />
                              </button>
                            </div>
                            {pinError && (
                              <p
                                className="text-center text-sm"
                                style={{ color: '#cc4444' }}
                              >
                                {pinError}
                              </p>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                '1',
                                '2',
                                '3',
                                '4',
                                '5',
                                '6',
                                '7',
                                '8',
                                '9',
                              ].map((d) => (
                                <button
                                  key={d}
                                  className="h-12 rounded-lg border-0 text-[20px] font-semibold text-white"
                                  style={{
                                    background: '#1e1e1e',
                                    border: '1px solid #3a3a3a',
                                  }}
                                  onClick={() => setPinInput((p) => p + d)}
                                >
                                  {d}
                                </button>
                              ))}
                              <button
                                className="h-12 rounded-lg border-0 text-[18px] font-semibold text-white"
                                style={{
                                  background: '#1e1e1e',
                                  border: '1px solid #3a3a3a',
                                }}
                                onClick={() => setPinInput('')}
                              >
                                C
                              </button>
                              <button
                                className="h-12 rounded-lg border-0 text-[20px] font-semibold text-white"
                                style={{
                                  background: '#1e1e1e',
                                  border: '1px solid #3a3a3a',
                                }}
                                onClick={() => setPinInput((p) => p + '0')}
                              >
                                0
                              </button>
                              <button
                                className="h-12 rounded-lg border-0 text-[13px] font-semibold"
                                style={{
                                  background: '#1e1e1e',
                                  border: '1px solid #3a3a3a',
                                  color: '#aaa',
                                }}
                                onClick={() => {
                                  setPinMode(false)
                                  setPinInput('')
                                  setPinError(null)
                                }}
                              >
                                {t('close', 'Chiudi')}
                              </button>
                            </div>
                            <button
                              className="h-12 w-full rounded-lg border-0 text-[16px] font-bold uppercase tracking-[1.5px] text-white"
                              style={{
                                background:
                                  paying || !pinInput ? '#1a3a2a' : '#2d7a3a',
                                opacity: paying || !pinInput ? 0.5 : 1,
                              }}
                              onClick={handlePayWithPin}
                              disabled={paying || !pinInput}
                            >
                              {paying ? '...' : t('confirm', 'CONFERMA')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              {!pinMode && (
                <div
                  className="relative flex shrink-0 flex-col justify-center bg-accent px-5"
                  style={{ height: '128px' }}
                >
                  <div
                    className="relative mb-[17px] text-center text-[22px] font-bold uppercase tracking-[1px] text-white"
                    style={{ top: '2px' }}
                  >
                    {t('total_winning', 'TOTALE VINCITA')}{' '}
                    {fmt(ticketInfo.amount_won)}
                  </div>
                  <div
                    className="relative flex min-h-[44px] items-center justify-center"
                    style={{ top: '-4px' }}
                  >
                    {/* PAGA: winner, not paid, no CDD pending */}
                    {statusInfo.isWinner &&
                      !statusInfo.isPaid &&
                      !cddRequired &&
                      !cddXml && (
                        <button
                          onClick={() => setShowPayConfirm(true)}
                          disabled={paying}
                          className="flex h-[32px] w-[124px] cursor-pointer items-center justify-center rounded-lg border-0 text-center text-[14px] font-bold uppercase tracking-[1.5px] text-white"
                          style={{
                            background: '#2a2a2a',
                            opacity: paying ? 0.5 : 1,
                          }}
                        >
                          {paying ? '...' : t('pay', 'PAGA')}
                        </button>
                      )}
                    {/* CDD actions: winner, not paid, CDD required by server */}
                    {statusInfo.isWinner &&
                      !statusInfo.isPaid &&
                      (cddRequired || cddXml) && (
                        <div className="flex w-full space-x-2 pr-[52px]">
                          <button
                            className="flex-1 rounded-lg border-0 py-3 text-[13px] font-bold uppercase tracking-[1px] text-white"
                            style={{
                              background: '#7a5a1a',
                              border: '2px solid #9e7a2a',
                            }}
                            disabled={!cddXml}
                            onClick={() => cddXml && handlePrintCdd(cddXml)}
                          >
                            {t('reprint_cdd', 'RISTAMPA CDD')}
                          </button>
                          <button
                            className="flex-1 rounded-lg border-0 bg-accent py-3 text-[13px] font-bold uppercase tracking-[1px] text-white"
                            onClick={() => {
                              setPinMode(true)
                              setPinInput('')
                              setPinError(null)
                            }}
                          >
                            {t('insert_pin_cdd', 'INSERISCI PIN CDD')}
                          </button>
                        </div>
                      )}
                    {/* Print button */}
                    <button
                      className="absolute right-[18px] top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border-0 p-[10px] px-[12px]"
                      style={{ background: '#2a2a2a' }}
                      onClick={() => {
                        if (cddXml) {
                          handlePrintCdd(cddXml)
                        } else if (typeof window.Bubble === 'function') {
                          window.Bubble(
                            'print',
                            String(ticketInfo?.ticket_id ?? ''),
                          )
                        }
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-7 w-7"
                        style={{ fill: '#ccc' }}
                      >
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* POPUP CONFERMA PAGAMENTO — nested Radix Dialog so pointer events are handled correctly */}
      <Dialog open={showPayConfirm} onOpenChange={setShowPayConfirm}>
        <DialogContent
          aria-describedby={undefined}
          className="w-[340px] max-w-[340px] overflow-hidden rounded-xl border-0 p-0 shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          style={{ background: '#1e1e1e' }}
        >
          <DialogHeader className="bg-card-header px-5 py-4">
            <DialogTitle className="text-[16px] font-bold tracking-[1px] text-white">
              {t('confirm_payment', 'CONFERMA PAGAMENTO')}
            </DialogTitle>
          </DialogHeader>
          <div
            className="px-6 pb-6 pt-7 text-center"
            style={{ background: '#212121' }}
          >
            <div
              className="mb-[10px] text-[11px] font-semibold uppercase tracking-[0.8px]"
              style={{ color: '#888' }}
            >
              {t('total_winning_to_collect', 'Totale vincita da riscuotere')}
            </div>
            <div className="mb-2 text-[32px] font-bold tracking-[1px] text-white">
              {ticketInfo ? fmt(ticketInfo.amount_won) : ''}
            </div>
            <div
              className="mb-7 text-[13px] font-semibold tracking-[0.4px]"
              style={{ color: '#aaa' }}
            >
              {t('confirm_payment_question', 'Vuoi confermare il pagamento?')}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPayConfirm(false)}
                className="flex-1 cursor-pointer rounded-lg border-0 py-[14px] text-[13px] font-bold uppercase tracking-[1.5px]"
                style={{ background: '#2e2e2e', color: '#ccc' }}
              >
                {t('cancel', 'ANNULLA')}
              </button>
              <button
                onClick={handlePay}
                className="flex-1 cursor-pointer rounded-lg border-0 bg-accent py-[14px] text-[13px] font-bold uppercase tracking-[1.5px] text-white"
              >
                {t('confirm', 'CONFERMA')}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
