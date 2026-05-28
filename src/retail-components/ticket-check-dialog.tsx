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
import { Delete } from 'lucide-react'
import {
  TicketDetailInfo,
  TicketDetailResponse,
  TicketPayResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { useTranslation } from 'react-i18next'
import { useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
): string {
  const keys = Object.keys(system)
  if (betType === '2' || keys.length > 1) return 'system'
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

function combinationOddsSum(odds: number[], k: number): number {
  let total = 0
  function enumerate(start: number, current: number[], depth: number) {
    if (depth === k) {
      total += current.reduce((a, b) => a * b, 1)
      return
    }
    for (let i = start; i < odds.length; i++) {
      enumerate(i + 1, [...current, odds[i]], depth + 1)
    }
  }
  enumerate(0, [], 0)
  return total
}

function computeMinMaxWin(info: TicketDetailInfo): {
  minWin: number
  maxWin: number
} {
  const amount = parseFloat(String(info.amount)) || 0
  const systemKeys = Object.keys(info.system)
  const odds: number[] = info.selections.map((sel) => {
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) return o
      }
    }
    return 1
  })
  const n = odds.length
  if (n === 0) return { minWin: 0, maxWin: 0 }
  if (systemKeys.length === 0) {
    const prod = odds.reduce((a, b) => a * b, 1)
    return { minWin: prod * amount, maxWin: prod * amount }
  }
  const sorted = [...odds].sort((a, b) => a - b)
  let minWin = Infinity
  let maxWin = 0
  for (const k of systemKeys) {
    const kNum = parseInt(k)
    const stakePerCombo = parseFloat(info.system[k]) || 0
    if (isNaN(kNum) || kNum < 1 || kNum > n) continue
    const minProduct = sorted.slice(0, kNum).reduce((a, b) => a * b, 1)
    minWin = Math.min(minWin, minProduct * stakePerCombo)
    const combsSum = combinationOddsSum(odds, kNum)
    maxWin += combsSum * stakePerCombo
  }
  return { minWin: minWin === Infinity ? 0 : minWin, maxWin }
}

export default function TicketCheckDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCandidates,
  terminalId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: number | null
  ticketCandidates?: Array<string | number>
  terminalId?: string
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
      if (String(data.ret_code) === '1027' && data.print) {
        handlePrintCdd(data.print)
        return
      }
      if (String(data.ret_code) === '1024') {
        if (data.print && typeof window.Bubble === 'function') {
          window.Bubble('pay', data.print)
        }
        setPayResult('success')
        fetchTicket(ticketInfo.ticket_id)
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
      setPinMode(false)
      setPinInput('')
      setPinError(null)
      setShowPayConfirm(false)
    }
  }, [open, ticketId, ticketCandidates, fetchTicket])

  const fmt = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return `0.00 ${currencySymbol}`
    return `${num.toFixed(2)} ${currencySymbol}`
  }

  const statusInfo = ticketInfo ? getDetailStatus(ticketInfo.status) : null
  const betTypeKey = ticketInfo
    ? getBetTypeLabel(ticketInfo.betType, ticketInfo.system)
    : 'single'

  const minMaxWin = ticketInfo
    ? computeMinMaxWin(ticketInfo)
    : { minWin: 0, maxWin: 0 }

  const totalSelections =
    ticketInfo?.selections.reduce(
      (acc, sel) =>
        acc + sel.markets.reduce((a, m) => a + m.selections.length, 0),
      0,
    ) ?? 0

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

                  {/* PUNTATA / MIN WIN / MAX WIN */}
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
                            const [datePart, timePart] = sel.startTime.includes(
                              ' - ',
                            )
                              ? sel.startTime.split(' - ')
                              : [
                                  formatTicketDate(ticketInfo.time),
                                  sel.startTime,
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
                              {sel.game.dict.runners?.[s.description]
                                ? `${s.description} - ${sel.game.dict.runners[s.description]}`
                                : s.description}
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
                  <div className="pb-4 text-center">
                    <button
                      className="w-[260px] cursor-pointer rounded-lg border-0 bg-replay py-3 text-[14px] font-bold uppercase tracking-[1.5px] text-white"
                      onClick={() => {
                        if (typeof window.Bubble === 'function') {
                          window.Bubble('replay', String(ticketInfo.ticket_id))
                        }
                      }}
                    >
                      {t('show_replay', 'VIDEO REPLAY')}
                    </button>
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

                  {/* CDD: ristampa + PIN mode */}
                  {statusInfo.isWinner && !statusInfo.isPaid && cddXml && (
                    <div className="mb-4">
                      {pinMode ? (
                        /* PIN keypad */
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
                      ) : (
                        <div className="flex flex-col items-center gap-3 pb-2">
                          <button
                            className="w-full rounded-lg border-0 py-3 text-[14px] font-bold uppercase tracking-[1.5px] text-white"
                            style={{
                              background: '#7a5a1a',
                              border: '2px solid #9e7a2a',
                            }}
                            onClick={() => handlePrintCdd(cddXml)}
                          >
                            {t('reprint_cdd', 'RISTAMPA CDD')}
                          </button>
                          <button
                            className="w-full rounded-lg border-0 bg-accent py-3 text-[14px] font-bold uppercase tracking-[1.5px] text-white"
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
                  {statusInfo.isWinner && !statusInfo.isPaid && !cddXml && (
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
                  {(!statusInfo.isWinner || statusInfo.isPaid || cddXml) && (
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

      {/* POPUP CONFERMA PAGAMENTO */}
      {showPayConfirm &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)' }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowPayConfirm(false)
            }}
          >
            <div
              className="w-[340px] overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
              style={{ background: '#1e1e1e' }}
            >
              <div className="flex items-center justify-between bg-card-header px-5 py-4 text-card-header-foreground">
                <h2 className="text-[16px] font-bold tracking-[1px] text-white">
                  {t('confirm_payment', 'CONFERMA PAGAMENTO')}
                </h2>
                <span
                  className="cursor-pointer text-[28px] font-light leading-none text-white"
                  onClick={() => setShowPayConfirm(false)}
                >
                  &#x2715;
                </span>
              </div>
              <div
                className="px-6 pb-6 pt-7 text-center"
                style={{ background: '#212121' }}
              >
                <div
                  className="mb-[10px] text-[11px] font-semibold uppercase tracking-[0.8px]"
                  style={{ color: '#888' }}
                >
                  {t(
                    'total_winning_to_collect',
                    'Totale vincita da riscuotere',
                  )}
                </div>
                <div className="mb-2 text-[32px] font-bold tracking-[1px] text-white">
                  {fmt(ticketInfo!.amount_won)}
                </div>
                <div
                  className="mb-7 text-[13px] font-semibold tracking-[0.4px]"
                  style={{ color: '#aaa' }}
                >
                  {t(
                    'confirm_payment_question',
                    'Vuoi confermare il pagamento?',
                  )}
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
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
