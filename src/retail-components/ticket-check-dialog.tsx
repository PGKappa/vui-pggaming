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

function formatTicketTime(time: TicketDetailInfo['time']): string {
  const [year, month, day, hour, min, sec] = time
  const d = String(day).padStart(2, '0')
  const m = String(month + 1).padStart(2, '0')
  const y = String(year)
  const h = String(hour).padStart(2, '0')
  const mi = String(min).padStart(2, '0')
  const s = String(sec ?? 0).padStart(2, '0')
  return `${d}/${m}/${y} - ${h}:${mi}:${s}`
}

function formatTicketDate(time: TicketDetailInfo['time']): string {
  const [year, month, day] = time
  const d = String(day).padStart(2, '0')
  const m = String(month + 1).padStart(2, '0')
  return `${d}/${m}/${year}`
}

// sel.startTime a volte arriva come timestamp ISO (es. "2026-07-11T08:40:00.000Z",
// in UTC) invece che come stringa già formattata in orario locale — se lo
// trattiamo come testo e basta, l'orario mostrato resta in UTC e diverge
// dalla ricevuta stampata (che converte correttamente in orario locale).
// Se sel.startTime è un vero timestamp, lo convertiamo esplicitamente
// all'orario locale; altrimenti lo lasciamo come arriva (già formattato).
function toLocalEventTime(rawStartTime: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T/.test(rawStartTime)) return rawStartTime
  const parsed = new Date(rawStartTime)
  if (isNaN(parsed.getTime())) return rawStartTime
  return `${format(parsed, 'dd/MM/yyyy')} - ${format(parsed, 'HH:mm')}`
}

// Prodotti delle quote di tutte le combinazioni REALI di dimensione `size`,
// rispettando il vincolo che le selezioni fisse (banker) sono sempre incluse
// in ogni combinazione — le uniche scelte libere sono fra le non fisse.
// Mirror di getCombinations/generateSystemGroups in retail-lib/system-bets.ts,
// adattato a lavorare su semplici array di quote invece che su BetEntry[].
function comboOddsProductsForSize(
  fixedOdds: number[],
  nonFixedOdds: number[],
  size: number,
): number[] {
  const needed = size - fixedOdds.length
  if (needed < 0 || needed > nonFixedOdds.length) return []
  const fixedProduct = fixedOdds.reduce((a, b) => a * b, 1)
  if (needed === 0) return [fixedProduct]

  const products: number[] = []
  function enumerate(start: number, product: number, depth: number) {
    if (depth === needed) {
      products.push(product)
      return
    }
    for (let i = start; i < nonFixedOdds.length; i++) {
      enumerate(i + 1, product * nonFixedOdds[i], depth + 1)
    }
  }
  enumerate(0, fixedProduct, 0)
  return products
}

function getSelectionOddsAndBanker(
  info: TicketDetailInfo,
): { odds: number; isBanker: boolean }[] {
  const distinctEvents = new Set(info.selections.map((sel) => sel.eventId))

  if (distinctEvents.size === 1 && info.selections.length > 0) {
    const sel = info.selections[0]
    const isBanker = String(sel.isBanker) === 'true'
    const flattened: { odds: number; isBanker: boolean }[] = []
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) flattened.push({ odds: o, isBanker })
      }
    }
    return flattened.length > 0 ? flattened : [{ odds: 1, isBanker }]
  }

  return info.selections.map((sel) => {
    let odds = 1
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) {
          odds = o
          break
        }
      }
    }
    return { odds, isBanker: String(sel.isBanker) === 'true' }
  })
}

// Riepilogo del sistema per il Dettaglio Ticket: quali taglie sono state
// giocate, importo e numero di combinazioni per ciascuna, totale
// combinazioni, e quante selezioni sono fisse — mirror di come queste
// informazioni vengono già mostrate sulla ricevuta stampata (systemGroupsInfo
// in betting-slip.tsx).
function computeSystemSummary(info: TicketDetailInfo): {
  totalSelections: number
  levels: { size: number; stakeTotal: number; combinations: number }[]
  totalCombinations: number
  fixedCount: number
} | null {
  const systemKeys = Object.keys(info.system)
  if (systemKeys.length === 0) return null

  const selectionOdds = getSelectionOddsAndBanker(info)
  const n = selectionOdds.length
  const fixedOdds = selectionOdds.filter((s) => s.isBanker).map((s) => s.odds)
  const nonFixedOdds = selectionOdds
    .filter((s) => !s.isBanker)
    .map((s) => s.odds)

  const levels = systemKeys
    .map((k) => {
      const size = parseInt(k)
      if (isNaN(size) || size < 1 || size > n) return null
      const combos = comboOddsProductsForSize(fixedOdds, nonFixedOdds, size)
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
    fixedCount: fixedOdds.length,
  }
}

function computeMinMaxWin(info: TicketDetailInfo): {
  minWin: number
  maxWin: number
} {
  const amount = parseFloat(String(info.amount)) || 0
  const systemKeys = Object.keys(info.system)
  const selectionOdds = getSelectionOddsAndBanker(info)
  const n = selectionOdds.length
  if (n === 0) return { minWin: 0, maxWin: 0 }
  if (systemKeys.length === 0) {
    const prod = selectionOdds.reduce((a, s) => a * s.odds, 1)
    return { minWin: prod * amount, maxWin: prod * amount }
  }
  const fixedOdds = selectionOdds.filter((s) => s.isBanker).map((s) => s.odds)
  const nonFixedOdds = selectionOdds
    .filter((s) => !s.isBanker)
    .map((s) => s.odds)

  let minWin = Infinity
  let maxWin = 0
  for (const k of systemKeys) {
    const kNum = parseInt(k)
    if (isNaN(kNum) || kNum < 1 || kNum > n) continue
    const combos = comboOddsProductsForSize(fixedOdds, nonFixedOdds, kNum)
    if (combos.length === 0) continue
    // info.system[k] è la puntata TOTALE per questa taglia di sistema (stesso
    // valore inviato in placeBet.system in betting-slip.tsx, già arrotondato
    // a 2 decimali in quel momento) — va quindi divisa per il numero REALE
    // di combinazioni per ottenere la puntata per combinazione. La puntata
    // per combinazione è sempre un valore "pulito" a 2 decimali (viene
    // sempre arrotondata così quando l'operatore la inserisce), quindi
    // arrotondiamo subito il risultato della divisione: altrimenti il rumore
    // di virgola mobile introdotto dalla divisione si accumula su centinaia
    // di combinazioni e può spostare l'ultimo centesimo del totale rispetto
    // alla ricevuta stampata (che usa la puntata per combinazione originale,
    // già pulita, non ricavata da una divisione).
    const tierTotalStake = parseFloat(info.system[k]) || 0
    const stakePerCombo =
      Math.round((tierTotalStake / combos.length) * 100) / 100
    const minProduct = Math.min(...combos)
    minWin = Math.min(minWin, minProduct * stakePerCombo)
    const combsSum = combos.reduce((a, b) => a + b, 0)
    maxWin += combsSum * stakePerCombo
  }
  return {
    minWin: Math.round((minWin === Infinity ? 0 : minWin) * 100) / 100,
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
        const seen = new Set<number>()
        return ticketInfo.selections.filter((sel) => {
          if (seen.has(sel.eventId)) return false
          seen.add(sel.eventId)
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
          className="flex max-h-[calc(100vh-40px)] w-[500px] max-w-[500px] flex-col overflow-hidden rounded-xl border-0 p-0 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
          style={{ background: '#1e1e1e' }}
        >
          {/* HEADER */}
          <DialogHeader
            className="shrink-0 bg-accent"
            style={{ padding: '18px 20px' }}
          >
            <DialogTitle className="m-0 text-[22px] font-bold tracking-[1px] text-white">
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
              style={{ background: '#212121' }}
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
                <div className="px-5">
                  {/* CODICE + STATO */}
                  <div className="flex items-center justify-between pb-4 pt-5">
                    <div>
                      <div
                        className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('code', 'CODICE')}
                      </div>
                      <div className="text-[26px] font-bold tracking-[1px] text-white">
                        {ticketInfo.ticket_id}
                      </div>
                    </div>
                    {statusInfo.isWinner && (
                      <div
                        className="flex items-center gap-2 rounded-lg px-[18px] py-[10px] text-[13px] font-bold uppercase tracking-[1px] text-white"
                        style={{
                          background: '#2d7a3a',
                          border: '2px solid #3a9e4a',
                        }}
                      >
                        {statusInfo.isPaid
                          ? t('paid', 'PAGATO')
                          : t('winning', 'VINCENTE')}
                        <span
                          className="h-[9px] w-[9px] shrink-0 rounded-full"
                          style={{ background: '#4cce5e' }}
                        />
                      </div>
                    )}
                    {!statusInfo.isWinner &&
                      statusInfo.translationKey === 'lost' && (
                        <div
                          className="flex items-center gap-2 rounded-lg px-[18px] py-[10px] text-[13px] font-bold uppercase tracking-[1px] text-white"
                          style={{
                            background: '#7a2d2d',
                            border: '2px solid #9e3a3a',
                          }}
                        >
                          {t('lost', 'PERDENTE')}
                          <span
                            className="h-[9px] w-[9px] shrink-0 rounded-full"
                            style={{ background: '#cc4444' }}
                          />
                        </div>
                      )}
                    {!statusInfo.isWinner &&
                      statusInfo.translationKey === 'pending' && (
                        <div
                          className="flex items-center gap-2 rounded-lg px-[18px] py-[10px] text-[13px] font-bold uppercase tracking-[1px] text-white"
                          style={{
                            background: '#5a5a1a',
                            border: '2px solid #8a8a2a',
                          }}
                        >
                          {t('pending', 'IN ATTESA')}
                          <span
                            className="h-[9px] w-[9px] shrink-0 rounded-full"
                            style={{ background: '#cccc44' }}
                          />
                        </div>
                      )}
                  </div>

                  {/* DATA E ORA */}
                  <div className="flex items-end justify-between py-[14px]">
                    <div>
                      <div
                        className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('date_hour', 'DATA E ORA')}
                      </div>
                      <div className="text-[19px] font-bold text-white">
                        {formatTicketTime(ticketInfo.time)}
                      </div>
                    </div>
                    {terminalId && (
                      <div className="text-right">
                        <div
                          className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('terminal', 'TERMINALE')}
                        </div>
                        <div className="text-[19px] font-bold text-white">
                          {terminalId}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PUNTATA / MIN WIN / MAX WIN — per le Multiple si mostra
                      solo il Pagamento Potenziale. */}
                  <div className="flex items-end pb-5 pt-[14px]">
                    <div className="flex-1">
                      <div
                        className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                        style={{ color: '#888' }}
                      >
                        {t('stake', 'PUNTATA')}
                      </div>
                      <div className="text-[19px] font-bold text-white">
                        {fmt(ticketInfo.amount)}
                      </div>
                    </div>
                    {betTypeKey === 'multiple' ? (
                      <div className="flex-1 text-right">
                        <div
                          className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: '#888' }}
                        >
                          {t('potential_payout', 'PAGAMENTO POTENZIALE')}
                        </div>
                        <div className="text-[19px] font-bold text-background">
                          {fmt(minMaxWin.maxWin)}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <div
                            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                            style={{ color: '#888' }}
                          >
                            {t('min_win', 'MIN WIN')}
                          </div>
                          <div className="text-[19px] font-bold text-white">
                            {fmt(minMaxWin.minWin)}
                          </div>
                        </div>
                        <div className="flex-1 text-right">
                          <div
                            className="mb-1 text-[11px] font-semibold uppercase tracking-[0.8px]"
                            style={{ color: '#888' }}
                          >
                            {t('max_win', 'MAX WIN')}
                          </div>
                          <div className="text-[19px] font-bold text-white">
                            {fmt(minMaxWin.maxWin)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <hr style={{ borderColor: '#3a3a3a' }} />

                  {/* TIPO label */}
                  <div className="py-[18px] text-center">
                    <span
                      className="text-[12px] font-semibold uppercase tracking-[1.5px]"
                      style={{ color: '#888' }}
                    >
                      {t(betTypeKey)}
                    </span>
                  </div>

                  {/* RIEPILOGO SISTEMA: taglie giocate, importo e
                      combinazioni per taglia, totale combinazioni e
                      selezioni fisse — le stesse informazioni già presenti
                      sulla ricevuta stampata (systemGroupsInfo). */}
                  {systemSummary && betTypeKey === 'system' && (
                    <div
                      className="mb-4 rounded-xl p-[14px] px-4"
                      style={{ background: '#2a2a2a' }}
                    >
                      <div
                        className="mb-3 text-center text-[13px] font-bold uppercase tracking-[0.8px]"
                        style={{ color: '#ccc' }}
                      >
                        {t('system', 'Sistema')}{' '}
                        {systemSummary.levels.map((l) => l.size).join(',')}{' '}
                        {t('of', 'di')} {systemSummary.totalSelections}
                      </div>

                      {systemSummary.levels.map((level) => (
                        <div
                          key={level.size}
                          className="flex items-center justify-between py-[8px]"
                          style={{ borderTop: '1px solid #363636' }}
                        >
                          <span
                            className="text-[12.5px] font-semibold tracking-[0.4px]"
                            style={{ color: '#ccc' }}
                          >
                            {level.size} {t('comb', 'Comb.')}:{' '}
                            {level.combinations}
                          </span>
                          <span
                            className="text-[12.5px] font-semibold tracking-[0.4px]"
                            style={{ color: '#ccc' }}
                          >
                            {fmt(level.stakeTotal)}
                          </span>
                        </div>
                      ))}

                      <div
                        className="flex items-center justify-between pt-[10px]"
                        style={{
                          marginTop: '4px',
                          borderTop: '1px solid #444',
                        }}
                      >
                        <span
                          className="text-[12.5px] font-bold uppercase tracking-[0.4px]"
                          style={{ color: '#aaa' }}
                        >
                          {t('total_combinations', 'Totale Combinazioni')}
                        </span>
                        <span
                          className="text-[12.5px] font-bold tracking-[0.4px]"
                          style={{ color: '#aaa' }}
                        >
                          {systemSummary.totalCombinations}
                        </span>
                      </div>

                      {systemSummary.fixedCount > 0 && (
                        <div
                          className="mt-2 text-center text-[11.5px] font-semibold uppercase tracking-[0.4px]"
                          style={{ color: '#f0a500' }}
                        >
                          {systemSummary.fixedCount}{' '}
                          {t('fixed_selections', 'Selezioni Fisse')}
                        </div>
                      )}
                    </div>
                  )}

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
                      className="mb-4 rounded-xl p-[14px] px-4"
                      style={{ background: '#2a2a2a' }}
                    >
                      {/* Card header */}
                      <div className="mb-[14px] flex items-start justify-between">
                        <div
                          className="text-[12px] font-bold leading-[1.6] tracking-[0.5px]"
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
                            className="font-normal"
                            style={{ color: '#777' }}
                          >
                            {sel.trackName}
                          </span>
                        </div>
                        <div
                          className="text-right text-[12px] font-semibold leading-[1.6] tracking-[0.4px]"
                          style={{ color: '#aaa' }}
                        >
                          {(() => {
                            const normalizedStartTime = toLocalEventTime(
                              sel.startTime,
                            )
                            const [datePart, timePart] =
                              normalizedStartTime.includes(' - ')
                                ? normalizedStartTime.split(' - ')
                                : [
                                    formatTicketDate(ticketInfo.time),
                                    normalizedStartTime,
                                  ]
                            return (
                              <>
                                {datePart && (
                                  <>
                                    {datePart}
                                    <br />
                                  </>
                                )}
                                {timePart}
                              </>
                            )
                          })()}
                          <br />
                          <span style={{ color: '#666' }}>
                            {t('event', 'Evento')} {sel.eventId}
                          </span>
                        </div>
                      </div>

                      {/* Markets / Selections */}
                      {sel.markets.map((market, mIdx) =>
                        market.selections.map((s, sIdx) => (
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
                              {sel.game.dict.markets[market.description] ||
                                market.description}
                            </span>
                            <span
                              className="flex-1 text-center text-[12.5px] font-semibold tracking-[0.4px]"
                              style={{ color: '#ccc' }}
                            >
                              {(() => {
                                const num = parseInt(s.description)
                                const name = !isNaN(num) && sel.competitors?.[num - 1]
                                  ? sel.competitors[num - 1]
                                  : sel.game.dict.runners?.[s.description]
                                return name ? `${s.description} - ${name}` : s.description
                              })()}
                            </span>
                            <span
                              className="flex flex-1 items-center justify-end gap-2 text-[12.5px] font-semibold tracking-[0.4px]"
                              style={{ color: '#ccc' }}
                            >
                              Q. {s.odds}
                            </span>
                          </div>
                        )),
                      )}
                    </div>
                  ))}

                  {/* SELEZIONI TOTALI */}
                  {totalSelections > 0 && (
                    <div className="pb-5 pt-2">
                      <span
                        className="text-[12px] font-semibold tracking-[0.6px]"
                        style={{ color: '#888' }}
                      >
                        {t('total_selections', 'SELEZIONI TOTALI')}:{' '}
                        {totalSelections}
                      </span>
                    </div>
                  )}

                  {/* VIDEO REPLAY */}
                  <div className="pb-4">
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
                      <div className="text-center">
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
                          <div className="flex flex-col gap-3 p-4">
                            <div className="flex items-center gap-2">
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

              {/* FOOTER */}
              {!pinMode && (
                <div className="relative shrink-0 bg-accent px-5 pb-[16px] pt-[20px]">
                  <div className="mb-[30px] text-center text-[25px] font-bold tracking-[1px] text-white">
                    {t('total_winning', 'TOTALE VINCITA')}{' '}
                    {fmt(ticketInfo.amount_won)}
                  </div>
                  {/* PAGA: winner, not paid, no CDD pending */}
                  {statusInfo.isWinner &&
                    !statusInfo.isPaid &&
                    !cddRequired &&
                    !cddXml && (
                      <button
                        onClick={() => setShowPayConfirm(true)}
                        disabled={paying}
                        className="mx-auto mb-[35px] block w-[160px] cursor-pointer rounded-lg border-0 py-3 text-center text-[15px] font-bold uppercase tracking-[2px] text-white"
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
                      <div className="mb-4 flex gap-2">
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
                  {(!statusInfo.isWinner || statusInfo.isPaid) && (
                    <div className="mb-[35px] h-[46px]" />
                  )}
                  {/* Print button */}
                  <button
                    className="absolute bottom-[14px] right-[16px] flex cursor-pointer items-center justify-center rounded-lg border-0 p-[10px] px-[12px]"
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
                      className="h-5 w-5"
                      style={{ fill: '#ccc' }}
                    >
                      <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                    </svg>
                  </button>
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
            <div className="flex gap-3">
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
