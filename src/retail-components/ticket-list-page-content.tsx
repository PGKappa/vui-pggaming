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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/retail-components/ui/popover'
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

  const buildTicketCandidates = (item: { ticket_id: number }) => {
    const raw = item as unknown as Record<string, unknown>
    const candidates = [
      raw.ticket_code,
      raw.code,
      raw.ticketId,
      raw.ext_ticket_id,
      raw.ticket_ref,
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
      const firstRow = tableWrapperRef.current.querySelector('tbody tr') as HTMLTableRowElement | null
      if (!firstRow) return
      const h = firstRow.offsetHeight
      if (h > 0) setRowHeight(h)
    }
    measure()
    const obs = new ResizeObserver(measure)
    if (tableWrapperRef.current) obs.observe(tableWrapperRef.current)
    return () => obs.disconnect()
  }, [items])

  const fillerCount = Math.max(0, parseInt(pageSize) - items.length)

  const calendarClassNames = {
    months: 'flex flex-row space-x-4',
    head_cell: 'text-gray-600 w-8 font-semibold text-[0.8rem]',
    cell: 'relative p-0 text-center text-sm text-gray-800 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-red-100 [&:has([aria-selected].day-outside)]:bg-red-50',
    day: 'h-8 w-8 p-0 font-normal text-gray-800 aria-selected:opacity-100 hover:bg-gray-100 rounded-md',
    day_selected:
      'bg-red-700 text-white hover:bg-red-800 focus:bg-red-700 focus:text-white rounded-md',
    day_today: dateFrom ? '' : 'border border-red-700 font-bold text-red-700 rounded-md',
    day_outside: 'text-gray-300 opacity-50',
    day_disabled: 'text-gray-300 opacity-30',
    day_range_start:
      'bg-red-700 text-white hover:bg-red-800 rounded-l-md rounded-r-none',
    day_range_end:
      'bg-red-700 text-white hover:bg-red-800 rounded-r-md rounded-l-none',
    day_range_middle:
      'aria-selected:bg-red-100 aria-selected:text-gray-800 rounded-none',
    caption_label: 'text-sm font-semibold text-gray-800',
    nav_button:
      'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 border border-gray-300 rounded flex items-center justify-center',
  }

  const dateRangeButton = (extraClass: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ticketFilter"
          className={cn(extraClass, 'justify-between pl-[15px] pr-[9px]')}
        >
          <span>{dateFrom ? dateRangeLabel() : t('date', 'DATA')}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto bg-white p-0">
        {/* Toggle single / range */}
        <div className="flex" style={{ backgroundColor: '#EDEDED' }}>
          <button
            className={cn(
              'flex-1 py-2 text-sm font-semibold uppercase transition-colors border-b-[4px]',
              calendarMode === 'single'
                ? 'text-red-700 border-b-red-700'
                : 'text-gray-600 border-b-transparent hover:bg-gray-100',
            )}
            onClick={() => handleModeSwitch('single')}
          >
            {t('day', 'Giorno')}
          </button>
          <button
            className={cn(
              'flex-1 py-2 text-sm font-semibold uppercase transition-colors border-b-[4px]',
              calendarMode === 'range'
                ? 'text-red-700 border-b-red-700'
                : 'text-gray-600 border-b-transparent hover:bg-gray-100',
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
          />
        )}
      </PopoverContent>
    </Popover>
  )

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
      >
        <h2
          className={cn(
            'font-bold uppercase',
            isCalcio ? 'text-[20px]' : 'text-[12px] lg:text-[16px] relative bottom-[1px]',
          )}
        >
          {t('ticket_list')}
        </h2>
      </div>

      {/* Filter Bar */}
      {isCalcio ? (
        <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-10">
          <div className="flex items-center gap-8">
            {/* Data - calcio */}
            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              {dateRangeButton('h-[38px] w-[209px] justify-center text-[15px]')}
            </div>

            {/* Terminale - calcio */}
            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              <Select
                value={terminal === 'all' ? '' : terminal}
                onValueChange={(v) => setTerminal(v || 'all')}
              >
                <SelectTrigger className="h-[38px] w-[149px] bg-background text-[15px] text-foreground pl-[15px] pr-[12px]">
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
            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              <Select
                value={statusSelectValue === 'all' ? '' : statusSelectValue}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-[38px] w-[149px] bg-background text-[15px] text-foreground pl-[15px] pr-[12px]">
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
            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              <Select
                value={discipline === 'all' ? '' : discipline}
                onValueChange={(v) => setDiscipline(v || 'all')}
              >
                <SelectTrigger className="h-[38px] w-[149px] bg-background text-[15px] text-foreground pl-[15px] pr-[12px]">
                  <SelectValue placeholder={t('discipline')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="dogs">{t('dog_racing')}</SelectItem>
                  <SelectItem value="horses">{t('horse_racing')}</SelectItem>
                  <SelectItem value="real">{t('dog_racing')} / {t('horse_racing')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchTickets}
              className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground"
            >
              {t('reload')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 justify-center bg-secondary pb-3 lg:pb-5 h-[61px]">
          <div className="relative  left-[60px] flex flex-wrap items-center space-x-5  lg:bottom-[3px] lg:space-x-4 uppercase">
            {/* Data - standard */}
            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              {dateRangeButton(
                'h-[38px] w-[149px] justify-center text-[15px] lg:h-[44px] lg:w-[286px] uppercase',
              )}
            </div>

            {/* Disciplina - standard */}
            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <Select
                value={discipline === 'all' ? '' : discipline}
                onValueChange={(v) => setDiscipline(v || 'all')}
              >
                <SelectTrigger className="h-[38px] w-[84px] bg-background text-[15px] text-foreground lg:h-[44px] lg:w-[286px] uppercase pl-[15px] pr-[12px]">
                  <SelectValue placeholder={t('discipline')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0 text-[13px] uppercase">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="dogs">{t('dog_racing')}</SelectItem>
                  <SelectItem value="horses">{t('horse_racing')}</SelectItem>
                  <SelectItem value="real">{t('dog_racing')} / {t('horse_racing')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Terminale - standard */}
            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <Select
                value={terminal === 'all' ? '' : terminal}
                onValueChange={(v) => setTerminal(v || 'all')}
              >
                <SelectTrigger className="h-[38px] w-[84px] bg-background text-[15px] text-foreground lg:h-[44px] lg:w-[286px] uppercase pl-[15px] pr-[12px]">
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
            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <Select
                value={statusSelectValue === 'all' ? '' : statusSelectValue}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="h-[38px] w-[79px] bg-background text-[15px] text-foreground lg:h-[44px] lg:w-[286px] uppercase pl-[15px] pr-[12px]">
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
            <Button
              onClick={fetchTickets}
              className="text-bold h-7 w-[60px] bg-tertiary text-[10px] uppercase text-tertiary-foreground lg:h-[42px] lg:w-[106px] lg:text-[15px] relative left-2"
            >
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
      <div className="flex-1 overflow-y-hidden flex flex-col bg-white text-black">

        {/* Tabella dati — flex-1 per occupare lo spazio residuo quando ci sono poche righe */}
        <div className="flex-1" ref={tableWrapperRef}>
          <table
            className={cn(
              'w-full h-full table-fixed border-collapse',
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
                    {t('no_tickets_found')}
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
                        isCalcio ? 'text-[16px]' : 'text-[12px] lg:text-[15px]',
                      )}
                    >
                      <td className={tdClass()}>{item.ticket_id}</td>
                      <td className={tdClass()}>
                        {format(date, 'dd/MM/yy')} - {format(date, 'HH:mm:ss')}
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
                        {(() => {
                          const saldo =
                            item.saldo !== undefined
                              ? parseFloat(item.saldo)
                              : parseFloat(item.amount_won || '0') -
                                parseFloat(item.amount || '0')
                          return (
                            <span
                              className={cn(
                                'font-medium tabular-nums',
                                saldo > 0
                                  ? 'text-ticket-won'
                                  : saldo < 0
                                    ? 'text-ticket-lost'
                                    : '',
                              )}
                            >
                              {formatCurrency(Math.abs(saldo), currencySymbol)}
                            </span>
                          )
                        })()}
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
        <div className="sticky bottom-0 shrink-0 bg-secondary text-white uppercase">
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
                <td colSpan={2} className="bg-secondary px-3 align-middle">
                  
                </td>
                <td style={totalCellStyle} className={totalCellClass()} />
                <td style={totalCellStyle} className={totalCellClass('font-bold')}>
                  {t('totals')}
                </td>
                <td style={totalCellStyle} className={totalCellClass()}>
                  {formatCurrency(info?.grandtotal?.in ?? 0, currencySymbol)}
                </td>
                <td style={totalCellStyle} className={totalCellClass()}>
                  {formatCurrency(info?.grandtotal?.out ?? '0.00', currencySymbol)}
                </td>
                <td style={totalCellStyle} className={totalCellClass()} />
                <td style={{ ...totalCellStyle, backgroundColor: 'color-mix(in srgb, hsl(var(--secondary)) 90%, white)' }} className={totalCellClass()}>
                  {formatCurrency(
                    parseFloat(String(info?.grandtotal?.out ?? '0')) -
                      (info?.grandtotal?.in ?? 0),
                    currencySymbol,
                  )}
                </td>
                <td style={totalCellStyle} className={totalCellClass()} />
              </tr>
            </tbody>
          </table>
        </div>

      </div>

      {/* Barra paginazione — fuori dal contenitore scroll, sempre in fondo alla pagina */}
      <div className="relative h-[59px] shrink-0 bg-secondary">
        <div className="ml-[24px] flex flex-row space-x-3 relative top-[21px]">
                    <div className="flex items-center space-x-2">
                      <span
                        className={cn(
                          'text-white',
                          isCalcio ? 'text-[11px]' : 'text-[9px] lg:text-[12px] uppercase',
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
                          isCalcio ? 'text-[11px]' : 'text-[9px] lg:text-[12px] uppercase',
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
                          isCalcio ? 'text-[11px]' : 'text-[9px] lg:text-[12px] uppercase',
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
      />
    </div>
  )
}