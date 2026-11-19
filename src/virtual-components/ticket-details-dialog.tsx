'use client'

// Dettaglio ticket del web (aperto da DETTAGLI nella Lista ticket): copia del
// dettaglio ticket del pannello admin (pgPlatformAdmin, ramo gen2-demopg,
// src/components/shared-components/TicketDetailsDialog.tsx) — stessi colori,
// misure, font, testi e versione mobile — alimentato con /api/ticket/{id}.
// Sola lettura: l'admin mostra Paga / Annulla / Stampa solo agli operatori.
import { RootContext } from '@/retail-contexts/root-context'
import type {
  TicketDetailInfo,
  TicketDetailResponse,
  TicketDetailSelection,
} from '@/retail-lib/types'
import { utcTicketTimeToLocal } from '@/retail-lib/ticket-list-source'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import {
  saveTicketSummary,
  ticketDetailCache,
} from '@/virtual-lib/ticket-history'
import { computeTicketSystem } from '@/virtual-lib/ticket-system'
import useMediaQuery from '@/virtual-lib/use-media-query'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Palette dell'admin (src/scss/_colors.scss)
const COLORS = {
  primary: '#12324a',
  secondary: '#0f4b7a',
  third: '#2f6188',
  divider: 'rgba(255, 255, 255, 0.12)',
  textMuted: '#9db9cf',
  textFaint: '#7396b1',
}

// Colori di stato dell'admin (getStatusColor / PayTicketModal)
const STATUS_COLORS = {
  won_paid: '#52c41a',
  won_unpaid: '#faad14',
  lost: '#ff4d4f',
  void: '#8c8c8c',
  open: '#1890ff',
  default: '#8c8c8c',
}

// Font dell'admin (antd / index.css)
const ADMIN_FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif"

// Testi dell'admin (src/lang/locales/*.json), per avere le stesse parole
type AdminTexts = {
  ticket: string
  code: string
  dateAndTime: string
  terminal: string
  amount: string
  minWin: string
  maxWin: string
  potentialWin: string
  betType: Record<'SINGLE' | 'MULTIPLE' | 'SYSTEM', string>
  event: string
  combinations: string
  totalCombinations: string
  win: string
  status: Record<'collected' | 'win' | 'open' | 'lost' | 'cancel', string>
  combinationSize: string[]
  dogRacing: string
  horseRacing: string
  track: (n: string) => string
  markets: Record<string, string>
  selections: Record<string, string>
  oddsPrefix: string
}

const TEXTS: Record<'it' | 'en' | 'es' | 'fr', AdminTexts> = {
  it: {
    ticket: 'Ticket',
    code: 'Codice',
    dateAndTime: 'Data e Ora',
    terminal: 'Terminale',
    amount: 'Importo',
    minWin: 'Vincita Minima',
    maxWin: 'Vincita Massima',
    potentialWin: 'Vincita Potenziale',
    betType: { SINGLE: 'SINGOLA', MULTIPLE: 'MULTIPLA', SYSTEM: 'SISTEMA' },
    event: 'Evento',
    combinations: 'Combinazioni',
    totalCombinations: 'TOTALE COMBINAZIONI',
    win: 'Vincita',
    status: {
      collected: 'Pagato',
      win: 'Vincente',
      open: 'Aperto',
      lost: 'Perdente',
      cancel: 'Annullato',
    },
    combinationSize: [
      '',
      'Singola',
      'Doppia',
      'Tripla',
      'Quadrupla',
      'Quintupla',
      'Sestupla',
      'Settupla',
      'Ottupla',
      'Novupla',
      'Decupla',
    ],
    dogRacing: 'Corse di Levrieri {racers}',
    horseRacing: 'Corse di Cavalli 6',
    track: (n) => `Circuito a ${n}`,
    markets: {
      winner: 'Vincente',
      placed: 'Piazzato 1° 2°',
      show: 'Podio 1° 2° 3°',
      exacta: 'Accoppiata in Ordine',
      quinella: 'Accoppiata a Girare',
      trifecta: 'Trio in Ordine',
      underover6: 'Under / Over 3.5',
      underover8: 'Under / Over 4.5',
      evenodd: 'Pari / Dispari',
    },
    selections: { even: 'Pari', odd: 'Dispari', under: 'Under', over: 'Over' },
    oddsPrefix: 'Q.',
  },
  en: {
    ticket: 'Ticket',
    code: 'Code',
    dateAndTime: 'Date and Time',
    terminal: 'Terminal',
    amount: 'Amount',
    minWin: 'Min Win',
    maxWin: 'Max Win',
    potentialWin: 'Potential Win',
    betType: { SINGLE: 'SINGLE', MULTIPLE: 'MULTIPLE', SYSTEM: 'SYSTEM' },
    event: 'Event',
    combinations: 'Combinations',
    totalCombinations: 'TOTAL COMBINATIONS',
    win: 'Winning',
    status: {
      collected: 'Paid',
      win: 'Winner',
      open: 'Open',
      lost: 'Lost',
      cancel: 'Canceled',
    },
    combinationSize: [
      '',
      'Single',
      'Double',
      'Treble',
      'Fourfold',
      'Fivefold',
      'Sixfold',
      'Sevenfold',
      'Eightfold',
      'Ninefold',
      'Tenfold',
    ],
    dogRacing: 'Dog Racing {racers}',
    horseRacing: 'Horse Racing 6',
    track: (n) => `Track ${n}`,
    markets: {
      winner: 'Win',
      placed: 'Place',
      show: 'Show',
      exacta: 'Exacta',
      quinella: 'Quinella',
      trifecta: 'Trifecta',
      underover6: 'Under / Over 3.5',
      underover8: 'Under / Over 4.5',
      evenodd: 'Even / Odd',
    },
    selections: { even: 'Even', odd: 'Odd', under: 'Under', over: 'Over' },
    oddsPrefix: 'O.',
  },
  es: {
    ticket: 'Ticket',
    code: 'Código',
    dateAndTime: 'Fecha y Hora',
    terminal: 'Terminal',
    amount: 'Monto',
    minWin: 'Pago Mínimo',
    maxWin: 'Pago Máximo',
    potentialWin: 'Pago Potencial',
    betType: { SINGLE: 'SIMPLE', MULTIPLE: 'MULTIPLE', SYSTEM: 'SISTEMA' },
    event: 'Evento',
    combinations: 'Combinaciones',
    totalCombinations: 'TOTAL COMBINACIONES',
    win: 'Pago',
    status: {
      collected: 'Cobrado',
      win: 'Ganador',
      open: 'Abierto',
      lost: 'Perdido',
      cancel: 'Cancelado',
    },
    combinationSize: [
      '',
      'Simple',
      'Doble',
      'Triple',
      'Cuádruple',
      'Quíntuple',
      'Séxtuple',
      'Séptuple',
      'Óctuple',
      'Nónuple',
      'Décuple',
    ],
    dogRacing: 'Carreras de Galgos {racers}',
    horseRacing: 'Carreras de Caballos 6',
    track: (n) => `Circuito de ${n}`,
    markets: {
      winner: 'Ganador',
      placed: 'Colocado 1° 2°',
      show: 'Colocado 1° 2° 3°',
      exacta: 'Exacta',
      quinella: 'Quinella',
      trifecta: 'Trifecta',
      underover6: 'Menos / Más 3,5',
      underover8: 'Menos / Más 4,5',
      evenodd: 'Par / Impar',
    },
    selections: { even: 'Par', odd: 'Impar', under: 'Menos', over: 'Más' },
    oddsPrefix: 'C.',
  },
  fr: {
    ticket: 'Ticket',
    code: 'code',
    dateAndTime: 'Date et heure',
    terminal: 'Terminal',
    amount: 'Montant',
    minWin: 'Gain minimum',
    maxWin: 'Gain maximum',
    potentialWin: 'Gain potentiel',
    betType: { SINGLE: 'SIMPLE', MULTIPLE: 'MULTIPLE', SYSTEM: 'SYSTÈME' },
    event: 'Événement',
    combinations: 'Combinaisons',
    totalCombinations: 'TOTAL DES COMBINAISONS',
    win: 'Gain',
    status: {
      collected: 'Payé',
      win: 'Gagnant',
      open: 'Ouvert',
      lost: 'Perdant',
      cancel: 'Annulé',
    },
    combinationSize: [
      '',
      'Simple',
      'Double',
      'Triple',
      'Quadruple',
      'Quintuple',
      'Sextuple',
      'Septuple',
      'Octuple',
      'Nonuple',
      'Décuple',
    ],
    dogRacing: 'Course de Chiens {racers}',
    horseRacing: 'Course de Chevaux 6',
    track: (n) => `Circuit à ${n}`,
    markets: {
      winner: 'Gagnant',
      placed: 'Placé 1er 2e',
      show: 'Placé 1er 2e 3e',
      exacta: 'Couplé Ordre',
      quinella: 'Couplé Désordre',
      trifecta: 'Trio Ordre',
      underover6: 'Moins / Plus 3.5',
      underover8: 'Moins / Plus 4.5',
      evenodd: 'Pair / Impair',
    },
    selections: { even: 'Pair', odd: 'Impair', under: 'Moins', over: 'Plus' },
    oddsPrefix: 'Q.',
  },
}

const LOCALES = { it: 'it-IT', en: 'en-US', es: 'es-ES', fr: 'fr-FR' }

export type TicketDetailsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: number | null
  ticketCandidates?: Array<string | number>
  terminalId?: string
}

type StatusInfo = { color: string; label: string }

// stati di /api/ticket: 1 aperto, 4 vincente, 6 vincente pagato, 5/9 perdente
function resolveStatus(status: number, texts: AdminTexts): StatusInfo {
  switch (status) {
    case 1:
      return { color: STATUS_COLORS.open, label: texts.status.open }
    case 4:
      return { color: STATUS_COLORS.won_unpaid, label: texts.status.win }
    case 6:
      return { color: STATUS_COLORS.won_paid, label: texts.status.collected }
    case 5:
    case 9:
      return { color: STATUS_COLORS.lost, label: texts.status.lost }
    default:
      return { color: STATUS_COLORS.void, label: texts.status.cancel }
  }
}

const pad = (value: number | string) => String(value).padStart(2, '0')

// formato data/ora dell'admin: inglese MM/DD/YYYY con 12h, altrimenti DD/MM/YYYY 24h
function formatDateTime(date: Date, lang: string, withSeconds = true) {
  const isEn = lang === 'en'
  const datePart = isEn
    ? `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
  let timePart: string
  if (isEn) {
    const h = date.getHours() % 12 || 12
    const suffix = date.getHours() < 12 ? 'AM' : 'PM'
    timePart = `${pad(h)}:${pad(date.getMinutes())}${withSeconds ? `:${pad(date.getSeconds())}` : ''} ${suffix}`
  } else {
    timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}${withSeconds ? `:${pad(date.getSeconds())}` : ''}`
  }
  return { datePart, timePart, full: `${datePart} - ${timePart}` }
}

// "€ 1.234,56": simbolo a sinistra, separatore delle migliaia "." (admin)
function formatCurrencySymbolLeft(
  value: number,
  currency: string,
  locale: string,
  // simbolo configurato in cassa: se presente sostituisce quello della valuta
  // del ticket, così il dettaglio usa la stessa valuta di betslip e lista
  symbolOverride?: string,
) {
  const safe = isNaN(value) ? 0 : value
  let parts: Intl.NumberFormatPart[]
  try {
    parts = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).formatToParts(safe)
  } catch {
    return `${symbolOverride || currency} ${safe.toFixed(2)}`
  }
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.'
  const group = decimal === '.' ? undefined : '.'
  let sign = ''
  let symbol = ''
  let number = ''
  for (const part of parts) {
    if (part.type === 'minusSign' || part.type === 'plusSign')
      sign += part.value
    else if (part.type === 'currency') symbol += part.value
    else if (part.type === 'group') number += group ?? part.value
    else if (part.type === 'literal' && part.value.trim() === '') continue
    else number += part.value
  }
  return `${symbolOverride || symbol} ${sign}${number}`
}

// numero di corridori: canale 5 = levrieri a 8, altrimenti dal circuito
function racersOf(sel: TicketDetailSelection) {
  if (sel.channelId === 5) return '8'
  return sel.trackName?.match(/\d+/)?.[0] ?? '6'
}

const MARKET_ALIASES: Record<string, string> = {
  winner: 'winner',
  win: 'winner',
  placed: 'placed',
  place: 'placed',
  show: 'show',
  exacta: 'exacta',
  quinella: 'quinella',
  trifecta: 'trifecta',
  evenodd: 'evenodd',
  even_odd: 'evenodd',
  underover: 'underover',
  under_over: 'underover',
}

export default function TicketDetailsDialog({
  open,
  onOpenChange,
  ticketId,
  ticketCandidates,
  terminalId,
}: TicketDetailsDialogProps) {
  const { t, i18n } = useTranslation()
  const rootContext = useContext(RootContext)
  // versione mobile dell'admin: sotto il breakpoint lg (992px)
  const compact = useMediaQuery('(max-width: 991px)')
  const sp = <T,>(desktop: T, mobile: T): T => (compact ? mobile : desktop)

  const lang = (
    (i18n.language || 'en').slice(0, 2) in TEXTS
      ? (i18n.language || 'en').slice(0, 2)
      : 'en'
  ) as keyof typeof TEXTS
  const texts = TEXTS[lang]
  const locale = LOCALES[lang]

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
            // la Lista ticket mostrerà lo stato aggiornato
            saveTicketSummary(initCode, data.info)
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

  const currency = info?.intl?.currency || 'EUR'
  const currencySymbol = rootContext?.getCurrencySymbol?.()
  const fmt = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return formatCurrencySymbolLeft(num, currency, locale, currencySymbol)
  }

  // orario del ticket in UTC: mostrato nel fuso del dispositivo
  const ticketTime = info ? utcTicketTimeToLocal(info.time) : null
  const ticketDate = ticketTime
    ? new Date(
        Number(ticketTime[0]),
        Number(ticketTime[1]),
        Number(ticketTime[2]),
        Number(ticketTime[3]),
        Number(ticketTime[4]),
        Number(ticketTime[5]) || 0,
      )
    : null
  const status = info ? resolveStatus(info.status, texts) : null
  const systemKeys = Object.keys(info?.system ?? {})
  const isSystemTicket = info?.betType === '2' || systemKeys.length > 1
  // colonne, importi per colonna e vincite con gli stessi calcoli della
  // schedina (fisse, più mercati sulla stessa corsa, HALF_UP per colonna)
  const ticketSystem = info
    ? computeTicketSystem(info, isSystemTicket)
    : { groups: [], minWin: 0, maxWin: 0 }
  const { minWin, maxWin } = ticketSystem
  const eventsCount = info
    ? new Set(info.selections.map((sel) => sel.eventId)).size
    : 0
  const betType: 'SINGLE' | 'MULTIPLE' | 'SYSTEM' = isSystemTicket
    ? 'SYSTEM'
    : eventsCount > 1
      ? 'MULTIPLE'
      : 'SINGLE'

  const systemGroups = isSystemTicket ? ticketSystem.groups : []

  const eventName = (sel: TicketDetailSelection) =>
    sel.channelId === 3
      ? texts.horseRacing
      : texts.dogRacing.replace('{racers}', racersOf(sel))

  const marketName = (sel: TicketDetailSelection, description: string) => {
    const key = MARKET_ALIASES[description.toLowerCase()]
    if (key === 'underover')
      return texts.markets[racersOf(sel) === '8' ? 'underover8' : 'underover6']
    return (
      (key && texts.markets[key]) ||
      sel.game.dict.markets[description] ||
      description
    )
  }

  const selectionName = (
    sel: TicketDetailSelection,
    market: string,
    selection: string,
  ) => {
    const key = MARKET_ALIASES[market.toLowerCase()]
    if (key === 'evenodd' || key === 'underover')
      return texts.selections[selection.toLowerCase()] ?? selection
    if (key === 'exacta' || key === 'quinella' || key === 'trifecta')
      return selection
    const runner = sel.game.dict.runners?.[selection]
    return runner ? `${selection} - ${runner}` : selection
  }

  const rowLabel: CSSProperties = {
    marginBottom: sp(4, 2),
    fontSize: sp(16, 11),
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: sp(0.8, 0.5),
    color: COLORS.textMuted,
    ...(compact ? { whiteSpace: 'nowrap' as const } : {}),
  }

  const rowValue: CSSProperties = {
    fontSize: sp(16, 14),
    fontWeight: 700,
    color: '#fff',
  }

  const hr = (margin?: string): CSSProperties => ({
    border: 'none',
    borderTop: `1px solid ${COLORS.divider}`,
    margin,
  })

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          // come l'admin: non si chiude cliccando fuori né con Esc
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-[600px] max-w-[calc(100vw-16px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden focus:outline-none"
          style={{
            padding: 0,
            background: COLORS.primary,
            borderRadius: '1px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            fontFamily: ADMIN_FONT,
            fontSize: 14,
            lineHeight: 1.5715,
            color: '#fff',
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: sp('calc(100vh - 80px)', 'calc(100dvh - 24px)'),
            }}
          >
            {/* HEADER */}
            <div
              style={{
                padding: sp('18px 20px', '10px 16px'),
                textAlign: 'center',
                background: COLORS.primary,
                flexShrink: 0,
              }}
            >
              <DialogPrimitive.Title
                style={{
                  fontSize: sp(18, 16),
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: '#fff',
                  margin: 0,
                }}
              >
                {texts.ticket}
              </DialogPrimitive.Title>
            </div>

            {loading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '64px 0',
                  background: COLORS.secondary,
                }}
              >
                <div className="size-8 animate-spin rounded-full border-4 border-white/30 border-t-[#1677ff]" />
              </div>
            )}

            {!loading && error && (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  background: COLORS.secondary,
                  color: COLORS.textMuted,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {!loading && info && status && ticketDate && (
              <div
                className="thin-scrollbar"
                style={{
                  minHeight: 0,
                  flex: 1,
                  overflowY: 'auto',
                  background: COLORS.secondary,
                }}
              >
                <div style={{ padding: sp('0 20px', '0 16px') }}>
                  {/* CODICE + STATO */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingBottom: sp(16, 8),
                      paddingTop: sp(20, 12),
                    }}
                  >
                    <div>
                      <div style={rowLabel}>{texts.code}</div>
                      <div style={rowValue}>{info.ticket_id}</div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 1,
                        padding: sp('10px 18px', '5px 12px'),
                        fontSize: sp(14, 12),
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: '#fff',
                        background: `${status.color}33`,
                        border: `2px solid ${status.color}`,
                      }}
                    >
                      {status.label}
                      <span
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: '50%',
                          background: status.color,
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  </div>

                  {/* DATA / ORA + TERMINALE */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      justifyContent: 'space-between',
                      padding: sp('14px 0', '6px 0'),
                    }}
                  >
                    <div>
                      <div style={rowLabel}>{texts.dateAndTime}</div>
                      <div style={rowValue}>
                        {formatDateTime(ticketDate, lang).full}
                      </div>
                    </div>
                    {terminalId && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={rowLabel}>{texts.terminal}</div>
                        <div style={rowValue}>{terminalId}</div>
                      </div>
                    )}
                  </div>

                  {/* IMPORTO / MIN / MAX (o VINCITA POTENZIALE) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      paddingBottom: sp(20, 10),
                      paddingTop: sp(14, 6),
                    }}
                  >
                    <div style={{ flex: 1, position: 'relative', bottom: 1 }}>
                      <div style={rowLabel}>{texts.amount}</div>
                      <div style={rowValue}>{fmt(info.amount)}</div>
                    </div>
                    {isSystemTicket ? (
                      <>
                        <div
                          style={{
                            flex: 1,
                            textAlign: 'center',
                            position: 'relative',
                            bottom: 1,
                          }}
                        >
                          <div style={rowLabel}>{texts.minWin}</div>
                          <div style={rowValue}>{fmt(minWin)}</div>
                        </div>
                        <div
                          style={{
                            flex: 1,
                            textAlign: 'right',
                            position: 'relative',
                            bottom: 1,
                          }}
                        >
                          <div style={rowLabel}>{texts.maxWin}</div>
                          <div style={rowValue}>{fmt(maxWin)}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                          <div style={rowLabel}>{texts.potentialWin}</div>
                          <div style={rowValue}>{fmt(maxWin)}</div>
                        </div>
                        <div style={{ flex: 1 }} />
                      </>
                    )}
                  </div>

                  <hr style={hr(sp(undefined, '0'))} />

                  {/* TIPO */}
                  <div
                    style={{
                      padding: sp('13px 0', '6px 0'),
                      textAlign: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontSize: sp(17, 14),
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 1.5,
                        color: COLORS.textMuted,
                        position: 'relative',
                        bottom: sp(4, 0),
                      }}
                    >
                      {texts.betType[betType]}
                    </span>
                  </div>

                  {/* EVENTI */}
                  {info.selections.map((sel, idx) => {
                    const [datePart, timePart] = sel.startTime.includes(' - ')
                      ? sel.startTime.split(' - ')
                      : [
                          formatDateTime(ticketDate, lang).datePart,
                          sel.startTime,
                        ]
                    const rows = sel.markets.flatMap((market) =>
                      market.selections.map((s) => ({
                        market: market.description,
                        selection: s,
                      })),
                    )
                    return (
                      <div
                        key={idx}
                        style={{
                          marginBottom: sp(30, 10),
                          borderRadius: 1,
                          padding: sp('14px 16px', '8px 12px'),
                          background: COLORS.third,
                        }}
                      >
                        <div
                          style={{
                            marginBottom: sp(14, 4),
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div
                            style={{
                              fontSize: sp(15, 13),
                              fontWeight: 700,
                              lineHeight: sp(1.6, 1.35),
                              letterSpacing: 0.5,
                              color: '#e3edf5',
                              position: 'relative',
                              top: sp(3, 0),
                              left: 1,
                              textTransform: 'uppercase',
                            }}
                          >
                            {eventName(sel)}
                            {sel.isBanker === 'true' && (
                              <span
                                style={{
                                  fontWeight: 700,
                                  fontSize: 15,
                                  marginLeft: 4,
                                  verticalAlign: 'baseline',
                                }}
                              >
                                [F]
                              </span>
                            )}
                            <br />
                            <span
                              style={{
                                fontWeight: 400,
                                color: COLORS.textFaint,
                                fontSize: sp(14, 12),
                              }}
                            >
                              {texts.track(racersOf(sel))}
                            </span>
                          </div>
                          <div
                            style={{
                              textAlign: 'right',
                              fontSize: sp(15, 13),
                              fontWeight: 600,
                              lineHeight: sp(1.6, 1.35),
                              letterSpacing: 0.4,
                              color: '#e3edf5',
                              position: 'relative',
                              top: sp(3, 0),
                              right: 1,
                            }}
                          >
                            {`${datePart} - ${timePart}`}
                            <br />
                            <span
                              style={{
                                color: COLORS.textFaint,
                                fontSize: sp(14, 12),
                              }}
                            >
                              {`${texts.event} ${sel.eventId}`}
                            </span>
                          </div>
                        </div>

                        {rows.map((row, mIdx) => (
                          <div
                            key={mIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: sp('11px 0', '6px 0'),
                              borderTop:
                                mIdx === 0
                                  ? undefined
                                  : `1px solid ${COLORS.divider}`,
                            }}
                          >
                            <span
                              style={{
                                flex: 1,
                                fontSize: 12.5,
                                fontWeight: 600,
                                letterSpacing: 0.4,
                                color: '#dbe7ef',
                              }}
                            >
                              {marketName(sel, row.market)}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: 12.5,
                                fontWeight: 600,
                                letterSpacing: 0.4,
                                color: '#dbe7ef',
                              }}
                            >
                              {selectionName(
                                sel,
                                row.market,
                                row.selection.description,
                              )}
                            </span>
                            <span
                              style={{
                                flex: 1,
                                textAlign: 'right',
                                fontSize: 12.5,
                                fontWeight: 600,
                                letterSpacing: 0.4,
                                color: '#dbe7ef',
                                position: 'relative',
                                right: 2,
                              }}
                            >
                              {texts.oddsPrefix}{' '}
                              {(parseFloat(row.selection.odds) || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}

                  {/* COMBINAZIONI (sistemi) */}
                  {isSystemTicket && (
                    <>
                      <hr style={hr(sp('0 0 16px', '0 0 6px'))} />

                      <div
                        style={{
                          fontSize: sp(17, 13),
                          fontWeight: 700,
                          color: '#fff',
                          marginBottom: sp(14, 6),
                          textAlign: 'center',
                          textTransform: 'uppercase',
                        }}
                      >
                        {texts.combinations}
                      </div>

                      <hr style={hr('0')} />

                      {systemGroups.map((group, gIdx) => (
                        <div
                          key={group.size}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            alignItems: 'center',
                            borderTop:
                              gIdx === 0
                                ? 'none'
                                : `1px solid ${COLORS.divider}`,
                            padding: sp('8px 0', '5px 0'),
                          }}
                        >
                          <div
                            style={{
                              fontSize: sp(14, 13),
                              fontWeight: 600,
                              color: '#dbe7ef',
                              textAlign: 'left',
                            }}
                          >
                            {group.combinations}{' '}
                            {texts.combinationSize[group.size] ?? group.size}
                          </div>
                          <div
                            style={{
                              fontSize: sp(14, 13),
                              fontWeight: 600,
                              color: '#dbe7ef',
                              textAlign: 'center',
                            }}
                          >
                            {fmt(group.stake)}
                          </div>
                          <div
                            style={{
                              fontSize: sp(14, 13),
                              fontWeight: 700,
                              color: '#fff',
                              textAlign: 'right',
                            }}
                          >
                            TOT. {fmt(group.total)}
                          </div>
                        </div>
                      ))}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 8,
                          borderTop: `1px solid ${COLORS.divider}`,
                          padding: sp('9px 0 20px', '6px 0 10px'),
                          height: sp<number | 'auto'>(55, 'auto'),
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            ...rowLabel,
                            fontSize: sp(15, 12),
                            position: 'relative',
                            top: sp(16, 0),
                          }}
                        >
                          {texts.totalCombinations}
                        </span>
                        <span
                          style={{
                            ...rowValue,
                            fontSize: sp(15, 13),
                            position: 'relative',
                            top: sp(16, 0),
                          }}
                        >
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
            )}

            {/* FOOTER */}
            {!loading && info && (
              <div
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  background: COLORS.primary,
                  padding: sp('20px 20px 16px', '10px 16px'),
                }}
              >
                <div
                  style={{
                    marginBottom: sp(17, 4),
                    textAlign: 'center',
                    fontSize: sp(22, 16),
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#fff',
                    textTransform: 'uppercase',
                    position: 'relative',
                    top: -3,
                  }}
                >
                  {texts.win} {fmt(info.amount_won)}
                </div>
                {/* riga dei pulsanti dell'admin (vuota: il web è in sola lettura) */}
                <div style={{ marginBottom: sp(8, 0) }} />
              </div>
            )}

            <DialogPrimitive.Close
              aria-label={t('close')}
              style={{
                position: 'absolute',
                top: sp(16, 6),
                right: sp(16, 8),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 1,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#dbe7ef',
              }}
            >
              <X style={{ width: 18, height: 18 }} />
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
