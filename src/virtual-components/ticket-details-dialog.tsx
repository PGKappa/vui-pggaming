'use client'

// Dettaglio ticket del web (aperto da DETTAGLI nella Lista ticket): stessa
// grafica del dettaglio ticket del pannello admin (pgPlatformAdmin, ramo
// gen2-demopg, TicketDetailsDialog), con i dati di /api/ticket/{id}.
// Sola lettura: niente pagamento, stampa o annullo.
import { RootContext } from '@/retail-contexts/root-context'
import type { TicketDetailInfo, TicketDetailResponse } from '@/retail-lib/types'
import { utcTicketTimeToLocal } from '@/retail-lib/ticket-list-source'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { ticketDetailCache } from '@/virtual-lib/ticket-history'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Palette del pannello admin (src/scss/_colors.scss)
const COLORS = {
  primary: '#12324a',
  secondary: '#0f4b7a',
  third: '#2f6188',
  divider: 'rgba(255, 255, 255, 0.12)',
  textMuted: '#9db9cf',
  textFaint: '#7396b1',
}

const STATUS_COLORS = {
  won_paid: '#52c41a',
  won_unpaid: '#faad14',
  lost: '#ff4d4f',
  void: '#8c8c8c',
  open: '#1890ff',
}

export type TicketDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: number | null
  ticketCandidates?: Array<string | number>
  terminalId?: string
}

function resolveStatus(status: number, t: (key: string) => string) {
  switch (status) {
    case 1:
      return { color: STATUS_COLORS.open, label: t('pending') }
    case 4:
      return { color: STATUS_COLORS.won_unpaid, label: t('winning') }
    case 6:
      return { color: STATUS_COLORS.won_paid, label: t('paid') }
    case 5:
    case 9:
      return { color: STATUS_COLORS.lost, label: t('lost') }
    default:
      return { color: STATUS_COLORS.void, label: t('cancelled') }
  }
}

const pad = (value: number | string) => String(value).padStart(2, '0')

function formatTime(time: TicketDetailInfo['time']) {
  const [year, month, day, hour, min, sec] = time
  return `${pad(day)}/${pad(Number(month) + 1)}/${year} - ${pad(hour)}:${pad(min)}:${pad(sec ?? 0)}`
}

function formatDate(time: TicketDetailInfo['time']) {
  const [year, month, day] = time
  return `${pad(day)}/${pad(Number(month) + 1)}/${year}`
}

function binomial(n: number, k: number) {
  if (k < 0 || k > n) return 0
  let result = 1
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i
  return Math.round(result)
}

function combinationOddsSum(odds: number[], k: number): number {
  let total = 0
  const walk = (start: number, product: number, depth: number) => {
    if (depth === k) {
      total += product
      return
    }
    for (let i = start; i < odds.length; i++) {
      walk(i + 1, product * odds[i], depth + 1)
    }
  }
  walk(0, 1, 0)
  return total
}

// stessa logica di vincita min/max del dettaglio ticket della cassa
function computeMinMaxWin(info: TicketDetailInfo) {
  const amount = parseFloat(String(info.amount)) || 0
  const systemKeys = Object.keys(info.system ?? {})
  const odds = info.selections.map((sel) => {
    for (const market of sel.markets) {
      for (const s of market.selections) {
        const o = parseFloat(s.odds)
        if (o > 0) return o
      }
    }
    return 1
  })
  if (odds.length === 0) return { minWin: 0, maxWin: 0 }
  if (systemKeys.length === 0) {
    const product = odds.reduce((a, b) => a * b, 1)
    return { minWin: product * amount, maxWin: product * amount }
  }
  const sorted = [...odds].sort((a, b) => a - b)
  let minWin = Infinity
  let maxWin = 0
  for (const key of systemKeys) {
    const size = parseInt(key)
    const stake = parseFloat(info.system[key]) || 0
    if (isNaN(size) || size < 1 || size > odds.length) continue
    minWin = Math.min(
      minWin,
      sorted.slice(0, size).reduce((a, b) => a * b, 1) * stake,
    )
    maxWin += combinationOddsSum(odds, size) * stake
  }
  return { minWin: minWin === Infinity ? 0 : minWin, maxWin }
}

export default function TicketDetailsDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCandidates,
  terminalId,
}: TicketDetailsDialogProps) {
  const { t } = useTranslation()
  const rootContext = useContext(RootContext)
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'
  const [info, setInfo] = useState<TicketDetailInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !ticketId) {
      if (!open) {
        setInfo(null)
        setError(null)
      }
      return
    }
    const initCode = rootContext?.initCode
    if (!initCode) return

    let cancelled = false
    // già scaricato dalla Lista ticket: si mostra subito e si aggiorna in
    // background (lo stato può essere cambiato, es. corsa conclusa)
    const cached = ticketDetailCache.get(ticketId)
    setError(null)
    setInfo(cached ?? null)

    const load = async () => {
      if (!cached) setLoading(true)
      // prima l'ID del ticket (quello giusto sul web), poi gli eventuali altri
      const ids = Array.from(
        new Set<string | number>(
          [ticketId, ...(ticketCandidates ?? [])].filter(Boolean),
        ),
      )
      try {
        for (const id of ids) {
          const response = await createPGVirtualAPICall(
            `/api/ticket/${id}`,
            initCode,
            undefined,
            rootContext?.operator,
          )
          const data: TicketDetailResponse = await response.json()
          if (data.ret_code === 1024 && data.info) {
            ticketDetailCache.set(ticketId, data.info)
            if (!cancelled) setInfo(data.info)
            return
          }
        }
        if (!cancelled && !cached) setError(t('ticket_not_found'))
      } catch {
        if (!cancelled && !cached) setError(t('ticket_not_found'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [
    open,
    ticketId,
    ticketCandidates,
    rootContext?.initCode,
    rootContext?.operator,
    t,
  ])

  const fmt = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `${currencySymbol} ${(isNaN(num) ? 0 : num).toFixed(2)}`
  }

  // l'orario del ticket arriva in UTC: mostrato nel fuso del dispositivo
  const ticketTime = info ? utcTicketTimeToLocal(info.time) : null
  const status = info ? resolveStatus(info.status, t) : null
  const { minWin, maxWin } = info
    ? computeMinMaxWin(info)
    : { minWin: 0, maxWin: 0 }
  const systemKeys = Object.keys(info?.system ?? {})
  const isSystem = info?.betType === '2' || systemKeys.length > 1
  const eventsCount = info
    ? new Set(info.selections.map((sel) => sel.eventId)).size
    : 0
  const betTypeKey = isSystem
    ? 'system'
    : eventsCount > 1
      ? 'multiple'
      : 'single'

  const groupName = (size: number) =>
    size === 1
      ? t('single')
      : size === 2
        ? t('double')
        : size === 3
          ? t('triple')
          : `${size}${t('-ple')}`

  const systemGroups = isSystem
    ? systemKeys
        .map((key) => {
          const size = parseInt(key)
          const stake = parseFloat(info!.system[key]) || 0
          const combinations = binomial(eventsCount, size)
          return { size, stake, combinations }
        })
        .filter((group) => group.size > 0)
        .sort((a, b) => a.size - b.size)
    : []

  const label = 'mb-1 text-[16px] font-semibold uppercase tracking-[0.8px]'
  const value = 'text-[16px] font-bold text-white'
  const marketCell =
    'flex-1 text-[12.5px] font-semibold tracking-[0.4px] text-[#dbe7ef]'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-80px)] w-[600px] max-w-[calc(100vw-24px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[1px] font-inter text-white shadow-[0_8px_32px_rgba(0,0,0,0.5)] focus:outline-none"
          style={{ background: COLORS.primary }}
        >
          {/* HEADER */}
          <div className="shrink-0 px-5 py-[18px] text-center">
            <DialogPrimitive.Title className="text-[18px] font-bold uppercase tracking-[1px] text-white">
              {t('ticket_detail_title')}
            </DialogPrimitive.Title>
          </div>

          {loading && (
            <div
              className="flex justify-center py-16"
              style={{ background: COLORS.secondary }}
            >
              <div className="size-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
            </div>
          )}

          {!loading && error && (
            <div
              className="px-6 py-12 text-center text-[16px] font-semibold"
              style={{ background: COLORS.secondary, color: COLORS.textMuted }}
            >
              {error}
            </div>
          )}

          {!loading && info && status && ticketTime && (
            <>
              <div
                className="thin-scrollbar min-h-0 flex-1 overflow-y-auto"
                style={{ background: COLORS.secondary }}
              >
                <div className="px-5">
                  {/* CODICE + STATO */}
                  <div className="flex items-center justify-between pb-4 pt-5">
                    <div>
                      <div
                        className={label}
                        style={{ color: COLORS.textMuted }}
                      >
                        {t('code')}
                      </div>
                      <div className={value}>{info.ticket_id}</div>
                    </div>
                    <div
                      className="flex items-center gap-2 rounded-[1px] px-[18px] py-[10px] text-[14px] font-bold uppercase tracking-[1px] text-white"
                      style={{
                        background: `${status.color}33`,
                        border: `2px solid ${status.color}`,
                      }}
                    >
                      {status.label}
                      <span
                        className="size-[9px] shrink-0 rounded-full"
                        style={{ background: status.color }}
                      />
                    </div>
                  </div>

                  {/* DATA / ORA + TERMINALE */}
                  <div className="flex items-end justify-between py-[14px]">
                    <div>
                      <div
                        className={label}
                        style={{ color: COLORS.textMuted }}
                      >
                        {t('date_hour')}
                      </div>
                      <div className={value}>{formatTime(ticketTime)}</div>
                    </div>
                    {terminalId && (
                      <div className="text-right">
                        <div
                          className={label}
                          style={{ color: COLORS.textMuted }}
                        >
                          {t('terminal')}
                        </div>
                        <div className={value}>{terminalId}</div>
                      </div>
                    )}
                  </div>

                  {/* IMPORTO / VINCITA (MIN / MAX nei sistemi) */}
                  <div className="flex items-end pb-5 pt-[14px]">
                    <div className="flex-1">
                      <div
                        className={label}
                        style={{ color: COLORS.textMuted }}
                      >
                        {t('amount')}
                      </div>
                      <div className={value}>{fmt(info.amount)}</div>
                    </div>
                    {isSystem ? (
                      <>
                        <div className="flex-1 text-center">
                          <div
                            className={label}
                            style={{ color: COLORS.textMuted }}
                          >
                            {t('min_win')}
                          </div>
                          <div className={value}>{fmt(minWin)}</div>
                        </div>
                        <div className="flex-1 text-right">
                          <div
                            className={label}
                            style={{ color: COLORS.textMuted }}
                          >
                            {t('max_win')}
                          </div>
                          <div className={value}>{fmt(maxWin)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 text-center">
                          <div
                            className={label}
                            style={{ color: COLORS.textMuted }}
                          >
                            {t('potential_win')}
                          </div>
                          <div className={value}>{fmt(maxWin)}</div>
                        </div>
                        <div className="flex-1" />
                      </>
                    )}
                  </div>

                  <hr
                    style={{
                      border: 'none',
                      borderTop: `1px solid ${COLORS.divider}`,
                    }}
                  />

                  {/* TIPO */}
                  <div className="py-[13px] text-center">
                    <span
                      className="relative bottom-1 text-[17px] font-semibold uppercase tracking-[1.5px]"
                      style={{ color: COLORS.textMuted }}
                    >
                      {t(betTypeKey)}
                    </span>
                  </div>

                  {/* EVENTI */}
                  {info.selections.map((sel, idx) => {
                    const [datePart, timePart] = sel.startTime.includes(' - ')
                      ? sel.startTime.split(' - ')
                      : [formatDate(ticketTime), sel.startTime]
                    return (
                      <div
                        key={idx}
                        className="mb-[30px] rounded-[1px] px-4 py-[14px]"
                        style={{ background: COLORS.third }}
                      >
                        <div className="mb-[14px] flex items-start justify-between">
                          <div className="relative left-px top-[3px] text-[15px] font-bold uppercase leading-[1.6] tracking-[0.5px] text-[#e3edf5]">
                            {sel.game.dict.misc.name} {sel.channelName}
                            {sel.isBanker === 'true' && (
                              <span className="ml-1 text-[15px] font-bold">
                                [F]
                              </span>
                            )}
                            <br />
                            <span
                              className="text-[14px] font-normal normal-case"
                              style={{ color: COLORS.textFaint }}
                            >
                              {sel.trackName}
                            </span>
                          </div>
                          <div className="relative right-px top-[3px] text-right text-[15px] font-semibold leading-[1.6] tracking-[0.4px] text-[#e3edf5]">
                            {datePart ? `${datePart} - ${timePart}` : timePart}
                            <br />
                            <span
                              className="text-[14px] uppercase"
                              style={{ color: COLORS.textFaint }}
                            >
                              {t('event')} {sel.eventId}
                            </span>
                          </div>
                        </div>

                        {sel.markets.map((market, mIdx) =>
                          market.selections.map((s, sIdx) => (
                            <div
                              key={`${mIdx}-${sIdx}`}
                              className="flex items-center justify-between py-[11px]"
                              style={{
                                borderTop:
                                  mIdx === 0 && sIdx === 0
                                    ? undefined
                                    : `1px solid ${COLORS.divider}`,
                              }}
                            >
                              <span className={marketCell}>
                                {sel.game.dict.markets[market.description] ||
                                  market.description}
                              </span>
                              <span className={`${marketCell} text-center`}>
                                {sel.game.dict.runners?.[s.description]
                                  ? `${s.description} - ${sel.game.dict.runners[s.description]}`
                                  : s.description}
                              </span>
                              <span
                                className={`${marketCell} relative right-0.5 text-right`}
                              >
                                Q. {(parseFloat(s.odds) || 0).toFixed(2)}
                              </span>
                            </div>
                          )),
                        )}
                      </div>
                    )
                  })}

                  {/* COMBINAZIONI (sistemi) */}
                  {isSystem && systemGroups.length > 0 && (
                    <>
                      <hr
                        className="mb-4"
                        style={{
                          border: 'none',
                          borderTop: `1px solid ${COLORS.divider}`,
                        }}
                      />
                      <div className="mb-[14px] text-center text-[17px] font-bold uppercase text-white">
                        {t('combinations')}
                      </div>
                      <hr
                        style={{
                          border: 'none',
                          borderTop: `1px solid ${COLORS.divider}`,
                        }}
                      />
                      {systemGroups.map((group, gIdx) => (
                        <div
                          key={group.size}
                          className="grid grid-cols-3 items-center py-2"
                          style={{
                            borderTop:
                              gIdx === 0
                                ? 'none'
                                : `1px solid ${COLORS.divider}`,
                          }}
                        >
                          <div className="text-left text-[14px] font-semibold text-[#dbe7ef]">
                            {group.combinations} {groupName(group.size)}
                          </div>
                          <div className="text-center text-[14px] font-semibold text-[#dbe7ef]">
                            {fmt(group.stake)}
                          </div>
                          <div className="text-right text-[14px] font-bold text-white">
                            TOT. {fmt(group.stake * group.combinations)}
                          </div>
                        </div>
                      ))}
                      <div
                        className="flex h-[55px] items-baseline gap-2 pb-5 pt-[9px]"
                        style={{ borderTop: `1px solid ${COLORS.divider}` }}
                      >
                        <span
                          className="relative top-4 text-[15px] font-semibold uppercase tracking-[0.8px]"
                          style={{ color: COLORS.textMuted }}
                        >
                          {t('total_combinations')}
                        </span>
                        <span className="relative top-4 text-[15px] font-bold text-white">
                          {systemGroups.reduce(
                            (sum, group) => sum + group.combinations,
                            0,
                          )}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div className="shrink-0 px-5 pb-4 pt-5">
                <div className="relative -top-[3px] mb-2 text-center text-[22px] font-bold uppercase tracking-[1px] text-white">
                  {t('winning')} {fmt(info.amount_won)}
                </div>
              </div>
            </>
          )}

          <DialogPrimitive.Close
            className="absolute right-4 top-4 flex size-9 items-center justify-center text-[#dbe7ef] transition-opacity hover:opacity-75"
            aria-label={t('close')}
          >
            <X className="size-[18px]" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
