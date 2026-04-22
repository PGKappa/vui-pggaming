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
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import TicketCheckDialog from '@/retail-components/ticket-check-dialog'

interface TicketListPageContentProps {
  returnPath: string
  variant?: 'standard' | 'calcio'
}

export default function TicketListPageContent({
  returnPath,
  variant = 'standard',
}: TicketListPageContentProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
  const [selectedTicketCandidates, setSelectedTicketCandidates] = useState<
    Array<string | number>
  >([])
  const {
    terminal,
    setTerminal,
    status,
    setStatus,
    payment,
    setPayment,
    from,
    setFrom,
    to,
    setTo,
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

  const handleDetailsClick = (item: { ticket_id: number }) => {
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
    setDialogOpen(true)
  }

  const isCalcio = variant === 'calcio'

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
          'relative flex items-center justify-center bg-accent text-accent-foreground',
          isCalcio ? 'h-16' : 'h-10 shrink-0 lg:h-16',
        )}
      >
        <h2
          className={cn(
            'font-bold',
            isCalcio ? 'text-[20px]' : 'text-[12px] lg:text-[16px]',
          )}
        >
          {t('ticket_list')}
        </h2>
        <Button
          variant="ghost"
          className={cn(
            'absolute text-secondary-foreground',
            isCalcio
              ? 'right-4 bg-secondary text-xl'
              : 'right-2 bg-accent text-base lg:right-4 lg:text-xl',
          )}
          onClick={() => router.push(returnPath)}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
      {isCalcio ? (
        <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-10">
          <div className="flex items-center gap-8">
            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                {t('terminal')}
              </span>
              <Select value={terminal} onValueChange={setTerminal}>
                <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                  <SelectValue placeholder={t('terminal')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {availableTerminals.map((tid) => (
                    <SelectItem key={tid} value={tid}>
                      {tid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mr-20 flex items-center gap-4">
              <div className="flex flex-row items-center gap-2 bg-badge text-background">
                <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                  {t('status')}
                </span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                    <SelectValue placeholder={t('status')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white p-0">
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="won">{t('won')}</SelectItem>
                    <SelectItem value="lost">{t('lost')}</SelectItem>
                    <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-row items-center gap-2 bg-badge text-background">
                <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                  {t('payment')}
                </span>
                <Select value={payment} onValueChange={setPayment}>
                  <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                    <SelectValue placeholder={t('payment')} />
                  </SelectTrigger>
                  <SelectContent className="bg-white p-0">
                    <SelectItem value="all">{t('all')}</SelectItem>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mr-20 flex items-center gap-4">
              <div className="flex flex-row items-center gap-2 bg-badge text-background">
                <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                  {t('from')}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ticketFilter"
                      className="w-[100px] justify-center text-[12px]"
                    >
                      {from ? format(from, 'dd/MM/yyyy') : '-'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-white">
                    <Calendar
                      mode="single"
                      selected={from}
                      onSelect={setFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-row items-center gap-2 bg-badge text-background">
                <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                  {t('to')}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ticketFilter"
                      className="w-[100px] justify-center text-[12px]"
                    >
                      {to ? format(to, 'dd/MM/yyyy') : '-'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-white">
                    <Calendar
                      mode="single"
                      selected={to}
                      onSelect={setTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
              <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
                {t('page_size')}
              </span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="w-[80px] bg-background text-[12px] text-foreground">
                  <SelectValue placeholder="Dim." />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
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
        <div className="flex shrink-0 justify-center bg-secondary pb-3 lg:pb-5">
          <div className="relative top-2 flex flex-wrap items-center space-x-5 lg:top-2.5 lg:space-x-10">
            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('terminal')}
              </span>
              <Select value={terminal} onValueChange={setTerminal}>
                <SelectTrigger className="h-7 w-[70px] bg-background text-[10px] text-foreground lg:h-9 lg:w-[100px] lg:text-[12px]">
                  <SelectValue placeholder={t('terminal')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {availableTerminals.map((tid) => (
                    <SelectItem key={tid} value={tid}>
                      {tid}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('status')}
              </span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-7 w-[70px] bg-background text-[10px] text-foreground lg:h-9 lg:w-[100px] lg:text-[12px]">
                  <SelectValue placeholder={t('status')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="won">{t('won')}</SelectItem>
                  <SelectItem value="lost">{t('lost')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('payment')}
              </span>
              <Select value={payment} onValueChange={setPayment}>
                <SelectTrigger className="h-7 w-[70px] bg-background text-[10px] text-foreground lg:h-9 lg:w-[100px] lg:text-[12px]">
                  <SelectValue placeholder={t('payment')} />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="all">{t('all')}</SelectItem>
                  <SelectItem value="paid">{t('paid')}</SelectItem>
                  <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('from')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ticketFilter"
                    className="h-7 w-[80px] justify-center text-[10px] lg:h-9 lg:w-[100px] lg:text-[12px]"
                  >
                    {from ? format(from, 'dd/MM/yyyy') : '-'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-white">
                  <Calendar
                    mode="single"
                    selected={from}
                    onSelect={setFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('to')}
              </span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ticketFilter"
                    className="h-7 w-[80px] justify-center text-[10px] lg:h-9 lg:w-[100px] lg:text-[12px]"
                  >
                    {to ? format(to, 'dd/MM/yyyy') : '-'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="bg-white">
                  <Calendar
                    mode="single"
                    selected={to}
                    onSelect={setTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-row items-center space-x-1 bg-accent text-background lg:space-x-2">
              <span className="whitespace-nowrap pl-1 text-[10px] font-semibold lg:pl-2 lg:text-[12px]">
                {t('page_size')}
              </span>
              <Select value={pageSize} onValueChange={setPageSize}>
                <SelectTrigger className="h-7 w-[55px] bg-background text-[10px] text-foreground lg:h-9 lg:w-[80px] lg:text-[12px]">
                  <SelectValue placeholder="Dim." />
                </SelectTrigger>
                <SelectContent className="bg-white p-0">
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchTickets}
              className="text-bold h-7 w-[60px] bg-tertiary text-[10px] text-tertiary-foreground lg:h-9 lg:w-[80px] lg:text-[14px]"
            >
              {t('reload')}
            </Button>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className={cn('w-full', isCalcio ? 'text-[12px]' : '')}>
          <thead
            className={cn(
              'bg-secondary text-white',
              isCalcio ? '' : 'sticky top-0 z-10',
            )}
          >
            <tr>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('ticket_id')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('terminal')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('date_n_time')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('staked_amount')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('cancelled')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('won')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('ticket_status')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              >
                {t('payment')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th
                className={cn(
                  'text-[16px]',
                  isCalcio
                    ? 'bg-badge p-2'
                    : 'bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]',
                )}
              ></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={17} className="p-8 text-center text-gray-400">
                  {t('loading')}...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={17} className="p-8 text-center text-gray-400">
                  {t('no_tickets_found')}
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const date = parseTicketTime(item.time)
                const statusInfo = getStatusDisplay(item.status)
                return (
                  <tr
                    key={item.ticket_id}
                    className={cn(
                      'border-b text-center',
                      isCalcio ? 'text-[16px]' : 'text-[12px] lg:text-[16px]',
                    )}
                  >
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {item.ticket_id}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {item.terminal_id}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {format(date, 'dd/MM/yy')} - {format(date, 'HH:mm:ss')}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {formatCurrency(item.amount, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {formatCurrency('0.00', currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {formatCurrency(item.amount_won, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      <div
                        className={cn(
                          'flex items-center justify-center',
                          isCalcio ? 'gap-2' : 'space-x-1 lg:space-x-2',
                        )}
                      >
                        <div
                          className={cn(
                            isCalcio
                              ? 'h-3 w-3 rounded-sm'
                              : 'h-2 w-2 rounded-sm lg:h-3 lg:w-3',
                            statusInfo.colorClass,
                          )}
                        />
                        <span
                          className={cn(
                            'font-medium',
                            isCalcio ? 'text-[16px]' : '',
                          )}
                        >
                          {t(statusInfo.translationKey)}
                        </span>
                      </div>
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      {parseFloat(item.amount_won) > 0 && item.status === 4
                        ? t('unpaid')
                        : '-'}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className={cn(isCalcio ? 'p-2' : 'p-1 lg:p-2')}>
                      <Button
                        onClick={() => handleDetailsClick(item)}
                        className={cn(
                          'bg-tertiary text-tertiary-foreground',
                          isCalcio
                            ? 'h-8 w-20 text-[16px]'
                            : 'h-6 w-14 text-[10px] lg:h-8 lg:w-20 lg:text-[16px]',
                        )}
                      >
                        {t('details')}
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        className={cn(
          isCalcio
            ? 'grid grid-cols-9'
            : 'grid h-[90px] shrink-0 grid-cols-9 lg:h-[122px]',
        )}
      >
        <div
          className={cn(
            isCalcio
              ? 'col-span-2 flex flex-row items-center bg-accent p-4'
              : 'col-span-2 flex flex-row items-center bg-accent p-2 lg:p-4',
          )}
        >
          <Pagination className="justify-start">
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
        </div>
        <table
          className={cn(
            isCalcio
              ? 'col-span-7 border-collapse'
              : 'col-span-7 h-full border-collapse',
          )}
        >
          <tbody>
            <tr className="bg-accent text-xs font-medium text-white">
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle font-bold',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {t('page_total')}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(info?.tot_in ?? '0.00', currencySymbol)}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(info?.tot_cancelled ?? '0.00', currencySymbol)}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(info?.tot_out ?? '0.00', currencySymbol)}
              </td>
              <td
                className={cn(
                  'border border-muted text-center align-middle font-bold',
                  isCalcio
                    ? 'bg-accent px-3 py-2'
                    : 'bg-searchResButton px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {t('cash_total')}
              </td>
              <td
                className={cn(
                  'border border-muted text-center align-middle font-bold',
                  isCalcio
                    ? 'bg-accent px-3 py-2'
                    : 'bg-searchResButton px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {t('paid_won')}
              </td>
              <td
                className={cn(
                  'border border-muted text-center align-middle font-bold',
                  isCalcio
                    ? 'bg-accent px-3 py-2'
                    : 'bg-searchResButton px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {t('total_tickets')}
              </td>
            </tr>
            <tr className="bg-accent text-xs font-medium text-white">
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle font-bold',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {t('totals')}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(info?.grandtotal?.in ?? 0, currencySymbol)}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(
                  info?.grandtotal?.cancelled ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency(
                  info?.grandtotal?.out ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {formatCurrency('0.00', currencySymbol)}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {info?.count_paid ?? 0} / {info?.count_won ?? 0}
              </td>
              <td
                className={cn(
                  'border border-muted bg-accent text-center align-middle',
                  isCalcio
                    ? 'px-3 py-2'
                    : 'px-1 py-1 text-[10px] lg:px-3 lg:py-2 lg:text-md',
                )}
              >
                {info?.count ?? 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <TicketCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        ticketId={selectedTicketId}
        ticketCandidates={selectedTicketCandidates}
      />
    </div>
  )
}
