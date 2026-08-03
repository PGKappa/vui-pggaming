'use client'

import { Button } from '@/retail-components/ui/button'
import { Calendar } from '@/retail-components/ui/calendar'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/retail-components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/retail-components/ui/select'
import {
  useTicketList,
  parseTicketTime,
  getStatusDisplay,
  formatCurrency,
} from '@/retail-lib/use-ticket-list'
import { TicketListItem } from '@/retail-lib/types'
import { cn } from '@/retail-lib/utils'
import { ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import TicketCheckDialog from '@/retail-components/ticket-check-dialog'
import { type DateRange } from 'react-day-picker'

interface TicketListPageContentProps {
  returnPath: string
  variant?: 'standard' | 'calcio'
}

export default function TicketListPageContent({
  variant = 'standard',
}: TicketListPageContentProps) {
  const { t } = useTranslation()
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('range')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicketCandidates, setSelectedTicketCandidates] = useState<
    Array<string | number>
  >([])
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(
    null,
  )

  const {
    terminal,
    setTerminal,
    status,
    setStatus,
    payment,
    setPayment,
    discipline,
    setDiscipline,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    items,
    info,
    loading,
    availableTerminals,
    currencySymbol,
    fetchTickets,
    disciplineMap,
  } = useTicketList()

  const buildTicketCandidates = (
    item: Pick<
      TicketListItem,
      | 'ticket_id'
      | 'ticket_code'
      | 'code'
      | 'ticketId'
      | 'ext_ticket_id'
      | 'ticket_ref'
    >,
  ) => {
    const candidates = [
      item.ticket_code,
      item.code,
      item.ticketId,
      item.ext_ticket_id,
      item.ticket_ref,
      item.ticket_id,
    ]
      .filter(
        (v): v is string | number =>
          typeof v === 'string' || typeof v === 'number',
      )
      .map((v) => (typeof v === 'string' ? v.trim() : v))
      .filter((v) => (typeof v === 'string' ? v.length > 0 : true))
    return Array.from(new Set(candidates))
  }

  const handleDetailsClick = (item: {
    ticket_id: number
    terminal_id?: string
  }) => {
    const candidates = buildTicketCandidates(item)
    const primary = candidates.find((v) => typeof v === 'number')
    const fallbackNumber = Number(item.ticket_id)
    setSelectedTicketCandidates(candidates)
    setSelectedTicketId(
      typeof primary === 'number'
        ? primary
        : Number.isFinite(fallbackNumber)
          ? fallbackNumber
          : null,
    )
    setSelectedTerminalId(item.terminal_id ?? null)
    setDialogOpen(true)
  }

  const handleStatusChange = (value: string) => {
    if (value === 'paid') {
      setStatus('all')
      setPayment('paid')
    } else if (value === 'unpaid') {
      setStatus('all')
      setPayment('unpaid')
    } else {
      setStatus(value)
      setPayment('all')
    }
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateFrom(range?.from)
    setDateTo(range?.to)
  }

  const handleSingleDateSelect = (date: Date | undefined) => {
    setDateFrom(date)
    setDateTo(date)
  }

  const handleModeSwitch = (mode: 'single' | 'range') => {
    setCalendarMode(mode)
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  const dateRangeLabel = () => {
    if (dateFrom && dateTo) {
      const from = format(dateFrom, 'dd/MM/yy')
      const to = format(dateTo, 'dd/MM/yy')
      return from === to ? from : `${from} - ${to}`
    }
    if (dateFrom) return `${format(dateFrom, 'dd/MM/yy')} - ...`
    return '-'
  }

  const statusSelectValue =
    payment === 'paid' ? 'paid' : payment === 'unpaid' ? 'unpaid' : status

  const isCalcio = variant === 'calcio'

  const tableWrapperRef = useRef<HTMLDivElement>(null)
  const [rowHeight, setRowHeight] = useState(0)

  useEffect(() => {
    const measure = () => {
      if (!tableWrapperRef.current || items.length === 0) return
      const firstRow = tableWrapperRef.current.querySelector(
        'tbody tr',
      ) as HTMLTableRowElement | null
      if (!firstRow) return
      const h = firstRow.offsetHeight
      if (h > 0) setRowHeight(h)
    }
    measure()
    const obs = new ResizeObserver(measure)
    if (tableWrapperRef.current) obs.observe(tableWrapperRef.current)
    return () => obs.disconnect()
  }, [items])

  useEffect(() => {
    if (!isDatePickerOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(e.target as Node)
      ) {
        setIsDatePickerOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDatePickerOpen])

  const fillerCount = Math.max(0, parseInt(pageSize) - items.length)

  const calendarClassNames = {
    months: 'flex flex-row space-x-4 w-full',
    month: 'space-y-4 flex-1',
    head_cell: 'text-gray-600 flex-1 font-semibold text-[0.8rem] text-center',
    cell: 'relative p-0 text-center text-sm text-gray-800 flex-1 focus-within:relative focus-within:z-20',
    day: 'h-8 w-full p-0 font-normal text-gray-800 bg-white border-0 aria-selected:opacity-100 hover:bg-gray-100 rounded-md',
    day_selected:
      'bg-red-700 text-white hover:bg-red-800 focus:bg-red-700 focus:text-white rounded-md',
    day_today: dateFrom
      ? ''
      : 'border border-red-700 font-bold text-red-700 rounded-md',
    day_outside: 'text-gray-300 opacity-50',
    day_disabled: 'text-gray-300 opacity-30',
    day_range_start:
      '!bg-red-700 !text-white hover:!bg-red-800 rounded-l-md rounded-r-none',
    day_range_end:
      '!bg-red-700 !text-white hover:!bg-red-800 rounded-r-md rounded-l-none',
    day_range_middle: '!bg-red-100 !text-black rounded-none',
    caption_label: 'text-sm font-semibold text-gray-800',
    nav_button:
      'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 border border-gray-300 rounded flex items-center justify-center',
  }

  const dateRangeButton = (extraClass: string) => (
    <div className="relative" ref={datePickerRef}>
      <Button
        variant="ticketFilter"
        className={cn(extraClass, 'justify-between pl-[15px] pr-[9px]')}
        onClick={() => setIsDatePickerOpen((prev) => !prev)}
      >
        <span>{dateFrom ? dateRangeLabel() : t('date', 'DATA')}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {isDatePickerOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-auto min-w-full border bg-white shadow-md">
          {/* Toggle single / range */}
          <div className="flex" style={{ backgroundColor: '#EDEDED' }}>
            <button
              className={cn(
                'flex-1 border-b-[4px] py-2 text-sm font-semibold uppercase transition-colors',
                calendarMode === 'single'
                  ? 'border-b-red-700 text-red-700'
                  : 'border-b-transparent text-gray-600 hover:bg-gray-100',
              )}
              onClick={() => handleModeSwitch('single')}
            >
              {t('day', 'Giorno')}
            </button>
            <button
              className={cn(
                'flex-1 border-b-[4px] py-2 text-sm font-semibold uppercase transition-colors',
                calendarMode === 'range'
                  ? 'border-b-red-700 text-red-700'
                  : 'border-b-transparent text-gray-600 hover:bg-gray-100',
              )}
              onClick={() => handleModeSwitch('range')}
            >
              {t('period', 'Periodo')}
            </button>
          </div>

          {/* Calendario */}
          {calendarMode === 'single' ? (
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={handleSingleDateSelect}
              initialFocus
              showOutsideDays={false}
              locale={it}
              classNames={calendarClassNames}
              className="w-full p-3"
            />
          ) : (
            <Calendar
              mode="range"
              selected={{ from: dateFrom, to: dateTo }}
              onSelect={handleDateRangeSelect}
              initialFocus
              showOutsideDays={false}
              locale={it}
              classNames={calendarClassNames}
              modifiersStyles={{
                range_middle: { backgroundColor: '#fee2e2', color: '#000000' },
              }}
              className="w-full p-3"
            />
          )}
        </div>
      )}
    </div>
  )

  const ticketFilterFieldClass =
    'h-[38px] w-[170px] text-[13px] min-[1400px]:w-[200px] min-[1400px]:text-[14px] min-[1600px]:w-[235px] min-[1750px]:w-[270px] 3xl:h-[44px] 3xl:w-[286px] 3xl:text-[15px]'

  const ticketFilterSelectTriggerClass = cn(
    'w-full bg-background pl-[15px] pr-[12px] uppercase text-foreground [&>span]:truncate',
    ticketFilterFieldClass,
  )

  const ticketFilterReloadClass =
    'text-bold shrink-0 bg-tertiary uppercase text-tertiary-foreground h-[34px] min-w-[72px] px-2 text-[11px] min-[1400px]:min-w-[85px] min-[1400px]:text-[12px] min-[1600px]:min-w-[95px] 3xl:h-[42px] 3xl:w-[106px] 3xl:min-w-[106px] 3xl:text-[15px]'

  const calcioFilterDateClass =
    'h-[38px] w-[165px] justify-center text-[14px] min-[1400px]:w-[185px] min-[1600px]:w-[200px] 3xl:h-[38px] 3xl:w-[209px] 3xl:text-[15px]'

  const calcioFilterSelectClass =
    'h-[38px] w-[120px] bg-background pl-[15px] pr-[12px] text-[14px] text-foreground min-[1400px]:w-[135px] min-[1600px]:w-[145px] 3xl:h-[38px] 3xl:w-[149px] 3xl:text-[15px] [&>span]:truncate'

  const getDisciplineLabel = (ticketId: number) => {
    const d = disciplineMap[ticketId]
    if (!d) return '...'
    return d
      .split(',')
      .map((discipline) => {
        if (discipline === 'dogs') return t('dog_racing')
        if (discipline === 'horses') return t('horse_racing')
        if (discipline === 'soccer') return t('football')
        return discipline
      })
      .join(' / ')
  }

  const thClass = (extra?: string) =>
    cn(
      'border-r border-card-header-foreground last:border-r-0',
      isCalcio
        ? 'bg-badge p-2 text-[16px]'
        : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px] uppercase',
      extra,
    )

  const tdClass = (extra?: string) =>
    cn(
      'border-r border-muted last:border-r-0',
      isCalcio ? 'p-2' : 'px-1 py-0.5 lg:px-2 lg:pt-[7px] lg:pb-[6px]',
      extra,
    )

  // Saldo = vinto - giocato (segno reale): positivo solo se la vincita supera
  // l'importo giocato. Usiamo SEMPRE questo confronto per decidere il colore,
  // non lo status del ticket — uno stato "vincente" (4/6) può comunque avere
  // vinto meno di quanto giocato (es. sistema con solo alcune combinazioni
  // vincenti), quindi lo status da solo non basta a decidere rosso/nero.
  const getItemSaldo = (item: (typeof items)[number]) =>
    item.saldo !== undefined
      ? parseFloat(item.saldo)
      : parseFloat(item.amount_won || '0') - parseFloat(item.amount || '0')

  const totalPlayed = items.reduce(
    (acc, item) => acc + (parseFloat(item.amount || '0') || 0),
    0,
  )
  const totalWon = items.reduce(
    (acc, item) => acc + (parseFloat(item.amount_won || '0') || 0),
    0,
  )
  // Come per il singolo ticket: il valore mostrato è sempre senza segno
  // (giocato - vinto), rosso solo quando il totale vinto supera il totale
  // giocato.
  const netSaldo = Math.abs(totalPlayed - totalWon)
  const totalIsProfit = totalWon > totalPlayed

  const totalBorder = '0.5px solid rgba(255,255,255,0.4)'
  const totalCellStyle = { border: totalBorder }
  const totalCellClass = (extra?: string) =>
    cn(
      'bg-secondary text-center align-middle',
      isCalcio
        ? 'px-3 py-2 text-[14px]'
        : 'px-1 py-1 text-[9px] lg:px-3 lg:text-[17px] relative bottom-[1px]',
      extra,
    )

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 flex flex-col bg-accent text-accent-foreground',
        isCalcio ? 'top-[60px]' : 'bottom-0 top-[64px]',
      )}
    >
      {/* Header Bar */}
      <div
        className={cn(
          'relative flex items-center justify-center bg-secondary text-accent-foreground',
          isCalcio ? 'h-16' : 'h-10 shrink-0 lg:h-[56px]',
        )}
        style={{ borderLeft: '1px solid white' }}
      >
        <h2
          className={cn(
            'font-bold uppercase',
            isCalcio
              ? 'text-[20px]'
              : 'relative bottom-[1px] text-[12px] lg:text-[16px]',
          )}
        >
          {t('ticket_list')}
        </h2>
      </div>

      {/* Filter Bar */}
      {isCalcio ? (
        <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-10 3xl:px-8" style={{ borderLeft: '1px solid white' }}>
          <div className="flex w-full max-w-[1100px] flex-wrap items-center justify-center gap-3 3xl:max-w-none 3xl:gap-8">
            {/* Data - calcio */}
            <div className="inline-flex items-center bg-badge text-background 3xl:mr-20">
              {dateRangeButton(calcioFilterDateClass)}
            </div>

            {/* Terminale - calcio */}
            <div className="inline-flex items-center bg-badge text-background 3xl:mr-20">
              <Select
                value={terminal === 'all' ? '' : terminal}
                onValueChange={(v) => setTerminal(v || 'all')}
              >
                <SelectTrigger className={calcioFilterSelectClass}>
                  <SelectValue placeholder={t('terminal')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {availableTerminals.map((tid) => (
                    <SelectItem key={tid} value={tid}>
                      {tid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stato - calcio */}
            <div className="inline-flex items-center bg-badge text-background 3xl:mr-20">
              <Select
                value={statusSelectValue === 'all' ? '' : statusSelectValue}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className={calcioFilterSelectClass}>
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="won">{t('won')}</SelectItem>
                  <SelectItem value="lost">{t('lost')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Disciplina - calcio */}
            <div className="inline-flex items-center bg-badge text-background 3xl:mr-20">
              <Select
                value={discipline === 'all' ? '' : discipline}
                onValueChange={(v) => setDiscipline(v || 'all')}
              >
                <SelectTrigger className={calcioFilterSelectClass}>
                  <SelectValue placeholder={t('discipline')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="dogs">{t('dog_racing')}</SelectItem>
                  <SelectItem value="horses">{t('horse_racing')}</SelectItem>
                  <SelectItem value="real">
                    {t('dog_racing')} / {t('horse_racing')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchTickets}
              className="text-bold shrink-0 bg-tertiary text-[13px] text-tertiary-foreground min-[1400px]:text-[14px] 3xl:w-[80px] 3xl:text-[14px]"
            >
              {t('reload')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex h-[61px] shrink-0 justify-center bg-secondary px-4 pb-3 3xl:px-16 3xl:pb-5" style={{ borderLeft: '1px solid white' }}>
          <div className="flex items-center justify-center !space-x-4 3xl:space-x-2 3xl:relative 3xl:bottom-[3px] 3xl:left-[61px]">
            {/* Data - standard */}
            <div className="inline-flex items-center bg-accent text-background">
              {dateRangeButton(
                cn(ticketFilterFieldClass, 'justify-center uppercase'),
              )}
            </div>

            {/* Disciplina - standard */}
            <div className="inline-flex items-center bg-accent text-background">
              <Select
                value={discipline === 'all' ? '' : discipline}
                onValueChange={(v) => setDiscipline(v || 'all')}
              >
                <SelectTrigger className={ticketFilterSelectTriggerClass}>
                  <SelectValue placeholder={t('discipline')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="dogs">{t('dog_racing')}</SelectItem>
                  <SelectItem value="horses">{t('horse_racing')}</SelectItem>
                  <SelectItem value="real">
                    {t('dog_racing')} / {t('horse_racing')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terminale - standard */}
            <div className="inline-flex items-center bg-accent text-background">
              <Select
                value={terminal === 'all' ? '' : terminal}
                onValueChange={(v) => setTerminal(v || 'all')}
              >
                <SelectTrigger className={ticketFilterSelectTriggerClass}>
                  <SelectValue placeholder={t('terminal')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {availableTerminals.map((tid) => (
                    <SelectItem key={tid} value={tid}>
                      {tid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stato - standard */}
            <div className="inline-flex items-center bg-accent text-background">
              <Select
                value={statusSelectValue === 'all' ? '' : statusSelectValue}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className={ticketFilterSelectTriggerClass}>
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="won">{t('won')}</SelectItem>
                  <SelectItem value="lost">{t('lost')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchTickets} className={ticketFilterReloadClass}>
              {t('reload')}
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────
          Tabella dati + riga TOTALI nello STESSO contenitore di scroll.
          Questo è l'unico modo per garantire allineamento perfetto delle colonne:
          entrambe le tabelle condividono esattamente la stessa larghezza effettiva
          (larghezza contenitore − larghezza eventuale scrollbar), senza bisogno
          di sincronizzare percentuali o pixel. La riga TOTALI è sticky bottom-0
          quindi rimane sempre visibile durante lo scroll.
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white text-black">
        {/* Tabella dati — flex-1 per occupare lo spazio residuo quando ci sono poche righe */}
        <div className="flex-1" ref={tableWrapperRef}>
          <table
            className={cn(
              // h-full solo con pageSize 15: riempie lo schermo senza compressione.
              // Con 50/100 l'altezza segue il contenuto così overflow-y-auto può scrollare.
              'w-full table-fixed border-collapse',
              pageSize === '15' && 'h-full',
              isCalcio ? 'text-[12px]' : '',
            )}
          >
            <colgroup>
              <col style={{ width: '11.11%' }} /> {/* ticket_id  */}
              <col style={{ width: '11.11%' }} /> {/* data/ora   */}
              <col style={{ width: '11.11%' }} /> {/* terminale  */}
              <col style={{ width: '11.11%' }} /> {/* prodotto   */}
              <col style={{ width: '11.11%' }} /> {/* puntata    */}
              <col style={{ width: '11.11%' }} /> {/* vinto      */}
              <col style={{ width: '11.11%' }} /> {/* stato      */}
              <col style={{ width: '11.11%' }} /> {/* saldo      */}
              <col style={{ width: '11.12%' }} /> {/* bottone    */}
            </colgroup>
            <thead
              className={cn(
                'bg-secondary text-white',
                isCalcio ? '' : 'sticky top-0 z-10',
              )}
            >
              <tr>
                <th className={thClass()}>{t('ticket_id')}</th>
                <th className={thClass()}>{t('date_n_time')}</th>
                <th className={thClass()}>{t('terminal')}</th>
                <th className={thClass()}>{t('product')}</th>
                <th className={thClass()}>{t('staked_amount')}</th>
                <th className={thClass()}>{t('won')}</th>
                <th className={thClass()}>{t('ticket_status')}</th>
                <th className={thClass()}>{t('balance')}</th>
                <th className={thClass()}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    {t('loading')}...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    {info === null
                      ? t(
                          'set_filters_and_reload',
                          'Imposta i filtri e premi Reload per cercare',
                        )
                      : t('no_tickets_found')}
                  </td>
                </tr>
              ) : (
                <>
                  {items.map((item) => {
                    const date = parseTicketTime(item.time)
                    const statusInfo = getStatusDisplay(item.status)
                    return (
                      <tr
                        key={item.ticket_id}
                        className={cn(
                          'border-b text-center',
                          isCalcio
                            ? 'text-[16px]'
                            : 'text-[12px] lg:text-[15px]',
                        )}
                      >
                        <td className={tdClass()}>{item.ticket_id}</td>
                        <td className={tdClass()}>
                          {format(date, 'dd/MM/yy')} -{' '}
                          {format(date, 'HH:mm:ss')}
                        </td>
                        <td className={tdClass()}>{item.terminal_id}</td>
                        <td className={tdClass()}>
                          {getDisciplineLabel(item.ticket_id)}
                        </td>
                        <td className={tdClass()}>
                          {formatCurrency(item.amount, currencySymbol)}
                        </td>
                        <td className={tdClass()}>
                          {formatCurrency(item.amount_won, currencySymbol)}
                        </td>
                        <td className={tdClass()}>
                          <div
                            className={cn(
                              'flex items-center justify-center',
                              isCalcio ? 'gap-2' : 'space-x-1 lg:space-x-2',
                            )}
                          >
                            <span
                              className={cn(
                                'font-medium',
                                isCalcio ? 'text-[16px]' : '',
                              )}
                            >
                              {t(statusInfo.translationKey)}
                            </span>
                            <div
                              className={cn(
                                isCalcio
                                  ? 'h-3 w-3 rounded-sm'
                                  : 'h-2 w-2 rounded-sm lg:h-3 lg:w-3',
                                statusInfo.colorClass,
                              )}
                            />
                          </div>
                        </td>
                        <td className={tdClass()}>
                          <span
                            className={cn(
                              'font-medium tabular-nums',
                              getItemSaldo(item) > 0 ? 'text-ticket-lost' : '',
                            )}
                          >
                            {formatCurrency(
                              Math.abs(getItemSaldo(item)),
                              currencySymbol,
                            )}
                          </span>
                        </td>
                        <td className={tdClass()}>
                          <Button
                            onClick={() => handleDetailsClick(item)}
                            className={cn(
                              'bg-tertiary text-tertiary-foreground',
                              isCalcio
                                ? 'h-8 w-20 text-[16px]'
                                : 'h-6 w-14 text-[10px] uppercase lg:h-8 lg:w-[106px] lg:text-[15px]',
                            )}
                          >
                            {t('details')}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                  {Array.from({ length: fillerCount }).map((_, rowIdx) => (
                    <tr
                      key={`filler-${rowIdx}`}
                      className="border-b"
                      style={rowHeight > 0 ? { height: rowHeight } : undefined}
                    >
                      {Array.from({ length: 9 }).map((_, i) => (
                        <td key={i} className={tdClass()} />
                      ))}
                    </tr>
                  ))}
                  {/* Spacer invisibile: assorbe lo spazio residuo senza stirare le righe dati */}
                  <tr className="h-full">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <td key={i} />
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Riga TOTALI — sticky bottom-0 nello stesso contenitore scroll.
            Stessa larghezza effettiva della tabella dati → colonne sempre allineate. */}
        <div className="sticky bottom-0 shrink-0 bg-secondary uppercase text-white" style={{ borderLeft: '1px solid white' }}>
          <table className="w-full table-fixed border-collapse">
            <colgroup>
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.11%' }} />
              <col style={{ width: '11.12%' }} />
            </colgroup>
            <tbody>
              <tr className="h-[49px]">
                <td colSpan={2} className="bg-secondary px-3 align-middle"></td>
                <td style={totalCellStyle} className={totalCellClass()} />
                <td
                  style={totalCellStyle}
                  className={totalCellClass('font-bold')}
                >
                  {t('totals')}
                </td>
                <td style={totalCellStyle} className={totalCellClass()}>
                  {formatCurrency(info?.grandtotal?.in ?? 0, currencySymbol)}
                </td>
                <td style={totalCellStyle} className={totalCellClass()}>
                  {formatCurrency(
                    info?.grandtotal?.out ?? '0.00',
                    currencySymbol,
                  )}
                </td>
                <td style={totalCellStyle} className={totalCellClass()} />
                <td
                  style={{
                    ...totalCellStyle,
                    backgroundColor:
                      'color-mix(in srgb, hsl(var(--secondary)) 90%, white)',
                  }}
                  className={totalCellClass(
                    totalIsProfit ? 'text-ticket-lost' : '',
                  )}
                >
                  {formatCurrency(netSaldo, currencySymbol)}
                </td>
                <td style={totalCellStyle} className={totalCellClass()} />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra paginazione — fuori dal contenitore scroll, sempre in fondo alla pagina */}
      <div className="relative h-[59px] shrink-0 bg-secondary" style={{ borderLeft: '1px solid white' }}>
        <div className="relative top-[21px] ml-[24px] flex flex-row space-x-3">
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                'text-white',
                isCalcio
                  ? 'text-[11px]'
                  : 'text-[9px] uppercase lg:text-[12px]',
              )}
            >
              {t('collected')}
            </span>
            <div className="h-4 w-4 rounded-sm bg-ticket-won" />
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                'text-white',
                isCalcio
                  ? 'text-[11px]'
                  : 'text-[9px] uppercase lg:text-[12px]',
              )}
            >
              {t('not_collected')}
            </span>
            <div className="h-4 w-4 rounded-sm bg-notCollected" />
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={cn(
                'text-white',
                isCalcio
                  ? 'text-[11px]'
                  : 'text-[9px] uppercase lg:text-[12px]',
              )}
            >
              {t('cancelled')}
            </span>
            <div className="h-4 w-4 rounded-sm bg-ticket-lost" />
          </div>
        </div>
        <div className="absolute bottom-[7px] right-4 flex items-center space-x-3 bg-secondary px-2 py-1">
          <Pagination className="w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) setCurrentPage(currentPage - 1)
                  }}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum: number
                if (totalPages <= 5) pageNum = i + 1
                else if (currentPage <= 3) pageNum = i + 1
                else if (currentPage >= totalPages - 2)
                  pageNum = totalPages - 4 + i
                else pageNum = currentPage - 2 + i
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={pageNum === currentPage}
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNum)
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < totalPages)
                      setCurrentPage(currentPage + 1)
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger
              className={cn(
                'bg-background text-foreground',
                isCalcio
                  ? 'h-8 w-[80px] text-[12px]'
                  : 'h-7 w-[55px] text-[10px] lg:h-9 lg:w-[80px] lg:text-[12px]',
              )}
            >
              <SelectValue placeholder="Dim." />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TicketCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketId={selectedTicketId}
        ticketCandidates={selectedTicketCandidates}
        terminalId={selectedTerminalId ?? undefined}
        onPaid={fetchTickets}
      />
    </div>
  )
}
