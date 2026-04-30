'use client'

// Declare window.Bubble type
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
import { ScrollArea } from '@radix-ui/react-scroll-area'
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

// Status mapping for ticket detail API:
// 1 = active/in_progress, 4 = won (unpaid), 5 = lost, 6 = won (paid), 9 = lost
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
  const [year, month, day, hour, min] = time
  const d = String(day).padStart(2, '0')
  const m = String(month + 1).padStart(2, '0')
  const y = String(year).slice(-2)
  const h = String(hour).padStart(2, '0')
  const mi = String(min).padStart(2, '0')
  return `${d}/${m}/${y} - ${h}:${mi}`
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
    try {
      const response = await createPGVirtualAPICall(
        `/api/ticket/pay/${ticketInfo.ticket_id}`,
        rootContext.initCode,
        undefined,
        rootContext.operator,
      )
      const data: TicketPayResponse = await response.json()

      // CDD required: API returns ret_code 1027 with print field containing CDD XML
      if (String(data.ret_code) === '1027' && data.print) {
        handlePrintCdd(data.print)
        return
      }

      // Normal pay success
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
        // 1028 = PIN errato, 1027 = PIN mancante, qualsiasi altro errore
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

  // Fetch ticket when dialog opens with a ticketId
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
    }
  }, [open, ticketId, ticketCandidates, fetchTicket])

  const fmt = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(num)) return `0,00 ${currencySymbol}`
    return `${num.toFixed(2).replace('.', ',')} ${currencySymbol}`
  }

  const statusInfo = ticketInfo ? getDetailStatus(ticketInfo.status) : null
  const betTypeKey = ticketInfo
    ? getBetTypeLabel(ticketInfo.betType, ticketInfo.system)
    : 'single'

  // Calculate total system amount ("Importo per Tipologia")
  const systemTotal = ticketInfo
    ? Object.values(ticketInfo.system).reduce(
        (sum, v) => sum + parseFloat(v || '0'),
        0,
      )
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-lg overflow-hidden p-0 text-primary"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-xl font-bold">
            {t('ticket')} {ticketId}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="px-6 py-12 text-center">
            <p className="text-lg font-semibold">{error}</p>
          </div>
        )}

        {ticketInfo && statusInfo && (
          <ScrollArea className="max-h-[70vh] overflow-y-auto">
            {/* Summary rows */}
            <div className="flex flex-col">
              <div className="flex h-12 items-center bg-betSlip px-4">
                <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                <span className="flex-1 text-center font-bold text-primary">
                  {formatTicketTime(ticketInfo.time)}
                </span>
              </div>
              <div className="flex h-12 items-center bg-betSlip/80 px-4">
                <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                <span className="flex-1 text-center font-bold text-primary">
                  {t(betTypeKey)}
                </span>
              </div>
              <div className="flex h-12 items-center bg-betSlip px-4">
                <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                <span className="flex-1 text-center font-bold text-primary">
                  {fmt(ticketInfo.amount)}
                </span>
              </div>
              <div className="flex h-12 items-center bg-betSlip/80 px-4">
                <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                <span className="flex-1 text-center font-bold text-primary">
                  {fmt(ticketInfo.amount_won)}
                </span>
              </div>
              <div className="flex h-12 items-center bg-betSlip px-4">
                <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                <span className="flex-1 text-center font-bold text-primary">
                  {statusInfo.isWinner
                    ? t('winner', 'Vincente')
                    : statusInfo.translationKey === 'lost'
                      ? t('lost', 'Perdente')
                      : t('pending', 'In Attesa')}
                </span>
              </div>
              {statusInfo.isPaid && (
                <div className="flex h-12 items-center bg-betSlip/80 px-4">
                  <div className="mr-3 h-6 w-2 rounded bg-primary/50" />
                  <span className="flex-1 text-center font-bold text-primary">
                    {t('paid', 'Pagato')}
                  </span>
                </div>
              )}
              <div className="flex h-12 items-center bg-betSlip px-4">
                <span className="font-bold text-primary">
                  {t('amount_by_type', 'Importo per Tipologia')}
                </span>
                <div className="mx-3 h-6 w-2 rounded bg-primary/50" />
                <span className="ml-auto font-bold text-primary">
                  {fmt(systemTotal)}
                </span>
              </div>
            </div>

            {/* Pay / CDD / PIN section */}
            {statusInfo.isWinner && !statusInfo.isPaid && (
              <div className="flex flex-col items-center gap-2 py-3">
                {/* DEBUG: simulate CDD response */}
                {isDebug && !cddXml && (
                  <button
                    className="mb-1 rounded border border-dashed border-amber-500 px-3 py-1 text-xs text-amber-600"
                    onClick={() =>
                      handlePrintCdd(
                        `<printCDDTicket><body><CDDData TransactionId="TEST-${ticketInfo.ticket_id}" TransactionType="P" Amount="${ticketInfo.amount_won}" Pin="" WinCode="TEST-${ticketInfo.ticket_id}" /></body></printCDDTicket>`,
                      )
                    }
                  >
                    [DEBUG] Simula CDD
                  </button>
                )}
                {cddXml ? (
                  pinMode ? (
                    // PIN keypad — styled like numeric-keypad-drawer
                    <div className="w-full">
                      {/* Red header bar */}
                      <div className="flex h-[45px] items-center justify-center bg-accent">
                        <span className="font-semibold text-accent-foreground">
                          {t('insert_pin_cdd', 'Inserisci PIN CDD')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-3 p-3">
                        {/* Display row: masked input + backspace */}
                        <div className="flex items-center gap-2">
                          <div className="flex h-12 flex-1 items-center justify-end rounded border px-3 text-[22px] font-bold tracking-widest">
                            {pinInput.length > 0 ? (
                              '●'.repeat(pinInput.length)
                            ) : (
                              <span className="w-full text-center text-sm text-foreground/40">
                                PIN CDD
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            className="h-12 w-[90px]"
                            onClick={() => setPinInput((p) => p.slice(0, -1))}
                          >
                            <Delete className="h-5 w-5" style={{ zoom: 2 }} />
                          </Button>
                        </div>
                        {pinError && (
                          <p className="text-center text-sm text-destructive">
                            {pinError}
                          </p>
                        )}
                        {/* Keypad grid */}
                        <div className="grid grid-cols-3 gap-2">
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(
                            (d) => (
                              <Button
                                key={d}
                                variant="outline"
                                size="lg"
                                className="h-12 text-[20px] font-semibold tabular-nums"
                                onClick={() => setPinInput((p) => p + d)}
                              >
                                {d}
                              </Button>
                            ),
                          )}
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-12 text-[20px] font-semibold tabular-nums"
                            onClick={() => setPinInput('')}
                          >
                            C
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-12 text-[20px] font-semibold tabular-nums"
                            onClick={() => setPinInput((p) => p + '0')}
                          >
                            0
                          </Button>
                          <Button
                            variant="outline"
                            size="lg"
                            className="h-12 text-[20px] font-semibold tabular-nums"
                            onClick={() => {
                              setPinMode(false)
                              setPinInput('')
                              setPinError(null)
                            }}
                          >
                            {t('close', 'Chiudi')}
                          </Button>
                        </div>
                        {/* Confirm button */}
                        <Button
                          className="h-12 w-full bg-secondary text-[18px] tabular-nums text-accent-foreground hover:opacity-95"
                          onClick={handlePayWithPin}
                          disabled={paying || !pinInput}
                        >
                          {paying ? '...' : t('confirm', 'Conferma')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // CDD active: ristampa + inserisci PIN
                    <>
                      <Button
                        className="h-12 w-56 bg-amber-600 text-lg font-bold text-white"
                        onClick={() => handlePrintCdd(cddXml)}
                      >
                        {t('reprint_cdd', 'Ristampa CDD')}
                      </Button>
                      <Button
                        className="h-12 w-56 text-lg font-bold"
                        onClick={() => {
                          setPinMode(true)
                          setPinInput('')
                          setPinError(null)
                        }}
                      >
                        {t('insert_pin_cdd', 'Inserisci PIN CDD')}
                      </Button>
                    </>
                  )
                ) : (
                  <Button
                    className="h-12 w-48 bg-ticket-won text-lg font-bold text-white"
                    onClick={handlePay}
                    disabled={paying}
                  >
                    {paying ? '...' : t('pay', 'Paga')}
                  </Button>
                )}
              </div>
            )}

            {payResult && payResult !== 'success' && (
              <p className="px-4 pb-2 text-center text-sm text-destructive">
                {payResult}
              </p>
            )}

            {/* Selections */}
            <div className="space-y-4 p-4">
              {ticketInfo.selections.map((sel, idx) => (
                <div key={idx} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Image
                        src={
                          sel.gameId.startsWith('dogs')
                            ? '/cane_blu.png'
                            : sel.gameId.startsWith('horse')
                              ? '/cavallo_blu.png'
                              : '/calciatore_blu.png'
                        }
                        alt={sel.gameId}
                        width={40}
                        height={40}
                        className="size-10 object-contain"
                      />
                      <div>
                        <p className="font-bold text-foreground">
                          {sel.game.dict.misc.name} {sel.channelName}
                        </p>
                        <p className="text-sm text-foreground/60">
                          {sel.trackName}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {sel.startTime}
                      </p>
                      <p className="text-xs text-foreground/60">
                        Pal. {sel.palimpsestId} / ID {sel.eventId}
                      </p>
                    </div>
                  </div>

                  {sel.markets.map((market, mIdx) => (
                    <div key={mIdx} className="mt-3 border-t pt-2">
                      {market.selections.map((s, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-sm text-foreground">
                            {sel.game.dict.markets[market.description] ||
                              market.description}
                          </span>
                          <span className="text-sm text-foreground">
                            {s.description}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {s.odds}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
