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
import { useTranslation } from 'react-i18next'

export default function TicketListPage() {
  const { t } = useTranslation()
  const router = useRouter()
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

  const handleDetailsClick = (ticketId: number) => {
    console.log('Details for ticket:', ticketId)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 top-[64px] z-50 flex flex-col bg-accent text-accent-foreground">
      {/* Header Bar */}
      <div className="relative flex h-10 shrink-0 items-center justify-center bg-accent text-accent-foreground lg:h-16">
        <h2 className="text-[12px] font-bold lg:text-[16px]">
          {t('ticket_list')}
        </h2>
        <Button
          variant="ghost"
          className="absolute right-2 bg-accent text-base text-secondary-foreground lg:right-4 lg:text-xl"
          onClick={() => router.back()}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
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

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full">
          <thead className="sticky top-0 z-10 bg-secondary text-white">
            <tr>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('ticket_id')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('terminal')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('date_n_time')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('staked_amount')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('cancelled')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('won')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('ticket_status')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]">
                {t('payment')}
              </th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-1 text-[12px] lg:p-2 lg:text-[16px]"></th>
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
                    className="border-b text-center text-[12px] lg:text-[16px]"
                  >
                    <td className="p-1 lg:p-2">{item.ticket_id}</td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">{item.terminal_id}</td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      {format(date, 'dd/MM/yy')} - {format(date, 'HH:mm:ss')}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      {formatCurrency(item.amount, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      {formatCurrency('0.00', currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      {formatCurrency(item.amount_won, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      <div className="flex items-center justify-center space-x-1 lg:space-x-2">
                        <div
                          className={cn(
                            'h-2 w-2 rounded-sm lg:h-3 lg:w-3',
                            statusInfo.colorClass,
                          )}
                        />
                        <span className="font-medium">
                          {t(statusInfo.translationKey)}
                        </span>
                      </div>
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      {parseFloat(item.amount_won) > 0 && item.status === 4
                        ? t('unpaid')
                        : '-'}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-1 lg:p-2">
                      <Button
                        onClick={() => handleDetailsClick(item.ticket_id)}
                        className="h-6 w-14 bg-tertiary text-[10px] text-tertiary-foreground lg:h-8 lg:w-20 lg:text-[16px]"
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
      <div className="grid h-[90px] shrink-0 grid-cols-9 lg:h-[122px]">
        <div className="col-span-2 flex flex-row items-center bg-accent p-2 lg:p-4">
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
        <table className="col-span-7 h-full border-collapse">
          <tbody>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] font-bold lg:px-3 lg:py-2 lg:text-md">
                {t('page_total')}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(info?.tot_in ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(info?.tot_cancelled ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(info?.tot_out ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-searchResButton px-1 py-1 text-center align-middle text-[10px] font-bold lg:px-3 lg:py-2 lg:text-md">
                {t('cash_total')}
              </td>
              <td className="border border-muted bg-searchResButton px-1 py-1 text-center align-middle text-[10px] font-bold lg:px-3 lg:py-2 lg:text-md">
                {t('paid_won')}
              </td>
              <td className="border border-muted bg-searchResButton px-1 py-1 text-center align-middle text-[10px] font-bold lg:px-3 lg:py-2 lg:text-md">
                {t('total_tickets')}
              </td>
            </tr>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] font-bold lg:px-3 lg:py-2 lg:text-md">
                {t('totals')}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(info?.grandtotal?.in ?? 0, currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(
                  info?.grandtotal?.cancelled ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency(
                  info?.grandtotal?.out ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {formatCurrency('0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {info?.count_paid ?? 0} / {info?.count_won ?? 0}
              </td>
              <td className="border border-muted bg-accent px-1 py-1 text-center align-middle text-[10px] lg:px-3 lg:py-2 lg:text-md">
                {info?.count ?? 0}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
