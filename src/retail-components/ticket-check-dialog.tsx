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
import { Button } from '@/retail-components/ui/button'
import { Delete } from 'lucide-react'
import {
  TicketDetailInfo,
  TicketDetailResponse,
  TicketPayResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { useTranslation } from 'react-i18next'
import { useCallback, useContext, useEffect, useState } from 'react'
import { RootContext } from '@/retail-contexts/root-context'
import Image from 'next/image'

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

export default function TicketCheckDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCandidates,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: number | null
  ticketCandidates?: Array<string | number>
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
  }, [ticketInfo, rootContext?.initCode, rootContext?.operator, fetchTicket, handlePrintCdd, t])

  const handlePayWithPin = useCallback(async () => {
    if (!ticketInfo || !rootContext?.initCode || !rootContext?.operator || !pinInput) return
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
  }, [ticketInfo, rootContext?.initCode, rootContext?.operator, pinInput, fetchTicket, t])

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

  const systemTotal = ticketInfo
    ? Object.values(ticketInfo.system).reduce((sum, v) => sum + parseFloat(v || '0'), 0)
    : 0

  const totalSelections = ticketInfo?.selections.reduce(
    (acc, sel) => acc + sel.markets.reduce((a, m) => a + m.selections.length, 0),
    0,
  ) ?? 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          aria-describedby={undefined}
          className="p-0 border-0 overflow-hidden rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-[500px] max-w-[500px] flex flex-col max-h-[calc(100vh-40px)]"
          style={{ background: '#1e1e1e' }}
        >
          {/* HEADER */}
          <DialogHeader className="shrink-0" style={{ background: '#12324a', padding: '18px 20px' }}>
            <DialogTitle className="text-white text-[22px] font-bold tracking-[1px] m-0">
              {t('ticket_details', 'DETTAGLI TICKET')}
            </DialogTitle>
          </DialogHeader>

          {/* LOADING */}
          {loading && (
            <div className="flex items-center justify-center py-16" style={{ background: '#212121' }}>
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: '#12324a', borderTopColor: 'transparent' }} />
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="px-6 py-12 text-center" style={{ background: '#212121' }}>
              <p className="text-lg font-semibold" style={{ color: '#ccc' }}>{error}</p>
            </div>
          )}

          {/* CONTENT */}
          {ticketInfo && statusInfo && (
            <>
              {/* BODY scrollabile */}
              <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: '#212121' }}>
                <div className="px-5">

                  {/* CODICE + STATO */}
                  <div className="pt-5 pb-4 flex justify-between items-center">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1" style={{ color: '#888' }}>
                        {t('code', 'CODICE')}
                      </div>
                      <div className="text-white text-[26px] font-bold tracking-[1px]">
                        {ticketInfo.ticket_id}
                      </div>
                    </div>
                    {statusInfo.isWinner && (
                      <div
                        className="text-white text-[13px] font-bold tracking-[1px] px-[18px] py-[10px] rounded-lg flex items-center gap-2"
                        style={{ background: '#2d7a3a', border: '2px solid #3a9e4a' }}
                      >
                        {statusInfo.isPaid
                          ? t('paid', 'PAGATO')
                          : t('winning', 'VINCENTE')}
                        <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: '#4cce5e' }} />
                      </div>
                    )}
                    {!statusInfo.isWinner && statusInfo.translationKey === 'lost' && (
                      <div
                        className="text-white text-[13px] font-bold tracking-[1px] px-[18px] py-[10px] rounded-lg flex items-center gap-2"
                        style={{ background: '#7a2d2d', border: '2px solid #9e3a3a' }}
                      >
                        {t('lost', 'PERDENTE')}
                        <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: '#cc4444' }} />
                      </div>
                    )}
                    {!statusInfo.isWinner && statusInfo.translationKey === 'pending' && (
                      <div
                        className="text-white text-[13px] font-bold tracking-[1px] px-[18px] py-[10px] rounded-lg flex items-center gap-2"
                        style={{ background: '#5a5a1a', border: '2px solid #8a8a2a' }}
                      >
                        {t('pending', 'IN ATTESA')}
                        <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: '#cccc44' }} />
                      </div>
                    )}
                  </div>

                  {/* DATA E ORA */}
                  <div className="py-[14px] flex justify-between items-end">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1" style={{ color: '#888' }}>
                        {t('date_hour', 'DATA E ORA')}
                      </div>
                      <div className="text-white text-[19px] font-bold">
                        {formatTicketTime(ticketInfo.time)}
                      </div>
                    </div>
                  </div>

                  {/* PUNTATA / IMPORTO TIPOLOGIA / VINCITA */}
                  <div className="pt-[14px] pb-5 flex items-end">
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1" style={{ color: '#888' }}>
                        {t('stake', 'PUNTATA')}
                      </div>
                      <div className="text-white text-[19px] font-bold">
                        {fmt(ticketInfo.amount)}
                      </div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1" style={{ color: '#888' }}>
                        {t('amount_by_type', 'IMP. TIPOLOGIA')}
                      </div>
                      <div className="text-white text-[19px] font-bold">
                        {fmt(systemTotal)}
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-1" style={{ color: '#888' }}>
                        {t('winning', 'VINCITA')}
                      </div>
                      <div className="text-white text-[19px] font-bold">
                        {fmt(ticketInfo.amount_won)}
                      </div>
                    </div>
                  </div>

                  <hr style={{ borderColor: '#3a3a3a' }} />

                  {/* TIPO label */}
                  <div className="py-[18px] text-center">
                    <span className="text-[12px] font-semibold tracking-[1.5px] uppercase" style={{ color: '#888' }}>
                      {t(betTypeKey)}
                    </span>
                  </div>

                  {/* DEBUG: simula CDD */}
                  {isDebug && !cddXml && statusInfo.isWinner && !statusInfo.isPaid && (
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
                      className="rounded-xl p-[14px] px-4 mb-4"
                      style={{ background: '#2a2a2a' }}
                    >
                      {/* Card header */}
                      <div className="flex justify-between items-start mb-[14px]">
                        <div className="flex items-center gap-3">
                          <Image
                            src={
                              sel.gameId.startsWith('dogs')
                                ? '/cane_blu.png'
                                : sel.gameId.startsWith('horse')
                                  ? '/cavallo_blu.png'
                                  : '/calciatore_blu.png'
                            }
                            alt={sel.gameId}
                            width={28}
                            height={28}
                            className="object-contain opacity-70"
                          />
                          <div
                            className="text-[12px] font-bold tracking-[0.5px] leading-[1.6]"
                            style={{ color: '#aaa' }}
                          >
                            {sel.game.dict.misc.name} {sel.channelName}
                            <br />
                            <span className="font-normal" style={{ color: '#777' }}>
                              {sel.trackName}
                            </span>
                          </div>
                        </div>
                        <div
                          className="text-right text-[12px] font-semibold tracking-[0.4px] leading-[1.6]"
                          style={{ color: '#aaa' }}
                        >
                          {sel.startTime}
                          <br />
                          <span style={{ color: '#666' }}>
                            Pal. {sel.palimpsestId} / ID {sel.eventId}
                          </span>
                        </div>
                      </div>

                      {/* Markets / Selections */}
                      {sel.markets.map((market, mIdx) =>
                        market.selections.map((s, sIdx) => (
                          <div
                            key={`${mIdx}-${sIdx}`}
                            className="flex justify-between items-center py-[11px]"
                            style={{
                              borderTop:
                                mIdx === 0 && sIdx === 0
                                  ? undefined
                                  : '1px solid #363636',
                            }}
                          >
                            <span
                              className="text-[12.5px] font-semibold tracking-[0.4px] flex-1"
                              style={{ color: '#ccc' }}
                            >
                              {sel.game.dict.markets[market.description] ||
                                market.description}
                            </span>
                            <span
                              className="text-[12.5px] font-semibold tracking-[0.4px] flex-1 text-center"
                              style={{ color: '#ccc' }}
                            >
                              {s.description}
                            </span>
                            <span
                              className="text-[12.5px] font-semibold tracking-[0.4px] flex-1 flex items-center justify-end gap-2"
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
                    <div className="pt-2 pb-5">
                      <span className="text-[12px] font-semibold tracking-[0.6px]" style={{ color: '#888' }}>
                        {t('total_selections', 'SELEZIONI TOTALI')}: {totalSelections}
                      </span>
                    </div>
                  )}

                  {/* Errore pagamento */}
                  {payResult && payResult !== 'success' && (
                    <p className="pb-4 text-center text-sm" style={{ color: '#cc4444' }}>
                      {payResult}
                    </p>
                  )}

                  {/* CDD: ristampa + PIN mode */}
                  {statusInfo.isWinner && !statusInfo.isPaid && cddXml && (
                    <div className="mb-4">
                      {pinMode ? (
                        /* PIN keypad */
                        <div className="rounded-xl overflow-hidden" style={{ background: '#2a2a2a' }}>
                          <div
                            className="flex h-[45px] items-center justify-center"
                            style={{ background: '#12324a' }}
                          >
                            <span className="font-semibold text-white tracking-[1px]">
                              {t('insert_pin_cdd', 'INSERISCI PIN CDD')}
                            </span>
                          </div>
                          <div className="flex flex-col gap-3 p-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="flex h-12 flex-1 items-center justify-end rounded-lg px-3 text-[22px] font-bold tracking-widest text-white"
                                style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}
                              >
                                {pinInput.length > 0 ? (
                                  '●'.repeat(pinInput.length)
                                ) : (
                                  <span className="w-full text-center text-sm" style={{ color: '#555' }}>
                                    PIN CDD
                                  </span>
                                )}
                              </div>
                              <button
                                className="h-12 w-[56px] rounded-lg flex items-center justify-center border-0"
                                style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}
                                onClick={() => setPinInput((p) => p.slice(0, -1))}
                              >
                                <Delete className="h-5 w-5" style={{ color: '#ccc' }} />
                              </button>
                            </div>
                            {pinError && (
                              <p className="text-center text-sm" style={{ color: '#cc4444' }}>{pinError}</p>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                              {['1','2','3','4','5','6','7','8','9'].map((d) => (
                                <button
                                  key={d}
                                  className="h-12 rounded-lg text-[20px] font-semibold text-white border-0"
                                  style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}
                                  onClick={() => setPinInput((p) => p + d)}
                                >
                                  {d}
                                </button>
                              ))}
                              <button
                                className="h-12 rounded-lg text-[18px] font-semibold text-white border-0"
                                style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}
                                onClick={() => setPinInput('')}
                              >
                                C
                              </button>
                              <button
                                className="h-12 rounded-lg text-[20px] font-semibold text-white border-0"
                                style={{ background: '#1e1e1e', border: '1px solid #3a3a3a' }}
                                onClick={() => setPinInput((p) => p + '0')}
                              >
                                0
                              </button>
                              <button
                                className="h-12 rounded-lg text-[13px] font-semibold border-0"
                                style={{ background: '#1e1e1e', border: '1px solid #3a3a3a', color: '#aaa' }}
                                onClick={() => { setPinMode(false); setPinInput(''); setPinError(null) }}
                              >
                                {t('close', 'Chiudi')}
                              </button>
                            </div>
                            <button
                              className="h-12 w-full rounded-lg text-[16px] font-bold tracking-[1.5px] uppercase text-white border-0"
                              style={{ background: paying || !pinInput ? '#1a3a2a' : '#2d7a3a', opacity: paying || !pinInput ? 0.5 : 1 }}
                              onClick={handlePayWithPin}
                              disabled={paying || !pinInput}
                            >
                              {paying ? '...' : t('confirm', 'CONFERMA')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 items-center pb-2">
                          <button
                            className="w-full rounded-lg text-white text-[14px] font-bold tracking-[1.5px] py-3 uppercase border-0"
                            style={{ background: '#7a5a1a', border: '2px solid #9e7a2a' }}
                            onClick={() => handlePrintCdd(cddXml)}
                          >
                            {t('reprint_cdd', 'RISTAMPA CDD')}
                          </button>
                          <button
                            className="w-full rounded-lg text-white text-[14px] font-bold tracking-[1.5px] py-3 uppercase border-0"
                            style={{ background: '#12324a', border: '2px solid #1a4a6a' }}
                            onClick={() => { setPinMode(true); setPinInput(''); setPinError(null) }}
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
                <div
                  className="px-5 pt-[20px] pb-[16px] relative shrink-0"
                  style={{ background: '#12324a' }}
                >
                  <div className="text-white text-[25px] font-bold tracking-[1px] text-center mb-[30px]">
                    {t('total_winning', 'TOTALE VINCITA')} {fmt(ticketInfo.amount_won)}
                  </div>
                  {statusInfo.isWinner && !statusInfo.isPaid && !cddXml && (
                    <button
                      onClick={() => setShowPayConfirm(true)}
                      disabled={paying}
                      className="block w-[160px] mx-auto mb-[35px] rounded-lg text-white text-[15px] font-bold tracking-[2px] py-3 text-center uppercase cursor-pointer border-0"
                      style={{ background: '#2a2a2a', opacity: paying ? 0.5 : 1 }}
                    >
                      {paying ? '...' : t('pay', 'PAGA')}
                    </button>
                  )}
                  {(!statusInfo.isWinner || statusInfo.isPaid || cddXml) && (
                    <div className="mb-[35px] h-[46px]" />
                  )}
                  {/* Print button */}
                  <button
                    className="absolute right-[16px] bottom-[14px] rounded-lg p-[10px] px-[12px] cursor-pointer flex items-center justify-center border-0"
                    style={{ background: '#2a2a2a' }}
                  >
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" style={{ fill: '#ccc' }}>
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
      {showPayConfirm && (
        <div
          className="fixed inset-0 z-[200] flex justify-center items-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowPayConfirm(false) }}
        >
          <div className="w-[340px] rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.6)]" style={{ background: '#1e1e1e' }}>
            <div className="flex justify-between items-center px-5 py-4" style={{ background: '#12324a' }}>
              <h2 className="text-white text-[16px] font-bold tracking-[1px]">
                {t('confirm_payment', 'CONFERMA PAGAMENTO')}
              </h2>
              <span
                className="text-white text-[28px] font-light cursor-pointer leading-none"
                onClick={() => setShowPayConfirm(false)}
              >
                &#x2715;
              </span>
            </div>
            <div className="px-6 pt-7 pb-6 text-center" style={{ background: '#212121' }}>
              <div className="text-[11px] font-semibold tracking-[0.8px] uppercase mb-[10px]" style={{ color: '#888' }}>
                {t('total_winning_to_collect', 'Totale vincita da riscuotere')}
              </div>
              <div className="text-white text-[32px] font-bold tracking-[1px] mb-2">
                {fmt(ticketInfo!.amount_won)}
              </div>
              <div className="text-[13px] font-semibold tracking-[0.4px] mb-7" style={{ color: '#aaa' }}>
                {t('confirm_payment_question', 'Vuoi confermare il pagamento?')}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPayConfirm(false)}
                  className="flex-1 rounded-lg text-[13px] font-bold tracking-[1.5px] py-[14px] uppercase cursor-pointer border-0"
                  style={{ background: '#2e2e2e', color: '#ccc' }}
                >
                  {t('cancel', 'ANNULLA')}
                </button>
                <button
                  onClick={handlePay}
                  className="flex-1 rounded-lg text-white text-[13px] font-bold tracking-[1.5px] py-[14px] uppercase cursor-pointer border-0"
                  style={{ background: '#12324a', border: '2px solid #1a4a6a' }}
                >
                  {t('confirm', 'CONFERMA')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}