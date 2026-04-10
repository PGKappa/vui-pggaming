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

export default function TicketListPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null)
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
    setSelectedTicketId(ticketId)
    setDialogOpen(true)
  }

  return (
    <div className="fixed left-0 right-0 top-[60px] z-50 flex flex-col bg-accent text-accent-foreground">
      <div className="relative flex h-16 items-center justify-center bg-accent text-accent-foreground">
        <h2 className="text-[20px] font-bold">{t('ticket_list')}</h2>
        <Button
          variant="ghost"
          className="absolute right-4 bg-secondary text-xl text-secondary-foreground"
          onClick={() => router.push('/retail/calcio')}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col items-center gap-4 px-4 pb-8 pt-10">
        <div className="flex items-center gap-8">
          {/* Terminal */}
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

          {/* Status + Payment */}
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

          {/* From + To */}
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

          {/* Page Size */}
          <div className="mr-20 flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              {t('page_size')}
            </span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-[80px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Dimensione Pagina" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reload */}
          <Button
            onClick={fetchTickets}
            className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground"
          >
            {t('reload')}
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-[12px]">
          <thead className="bg-secondary text-white">
            <tr>
              <th className="bg-badge p-2 text-[16px]">{t('ticket_id')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('terminal')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('date_n_time')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('staked_amount')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('cancelled')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('won')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('ticket_status')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">{t('payment')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]"></th>
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
                    className="border-b text-center text-[16px]"
                  >
                    <td className="p-2">{item.ticket_id}</td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">{item.terminal_id}</td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      {format(date, 'dd/MM/yy')} - {format(date, 'HH:mm:ss')}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      {formatCurrency(item.amount, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      {formatCurrency('0.00', currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      {formatCurrency(item.amount_won, currencySymbol)}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={cn(
                            'h-3 w-3 rounded-sm',
                            statusInfo.colorClass,
                          )}
                        />
                        <span className="text-[16px] font-medium">
                          {t(statusInfo.translationKey)}
                        </span>
                      </div>
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      {parseFloat(item.amount_won) > 0 && item.status === 4
                        ? t('unpaid')
                        : '-'}
                    </td>
                    <td className="w-[1px] bg-muted p-0"></td>
                    <td className="p-2">
                      <Button
                        onClick={() => handleDetailsClick(item.ticket_id)}
                        className="h-8 w-20 bg-tertiary text-[16px] text-tertiary-foreground"
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
      <div className="grid grid-cols-9">
        {/* Pagination */}
        <div className="col-span-2 flex flex-row items-center bg-accent p-4">
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
        {/* Totals Table */}
        <table className="col-span-7 border-collapse">
          <tbody>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                {t('page_total')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(info?.tot_in ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(info?.tot_cancelled ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(info?.tot_out ?? '0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                {t('cash_total')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                {t('paid_won')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                {t('total_tickets')}
              </td>
            </tr>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                {t('totals')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(info?.grandtotal?.in ?? 0, currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(
                  info?.grandtotal?.cancelled ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency(
                  info?.grandtotal?.out ?? '0.00',
                  currencySymbol,
                )}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {formatCurrency('0.00', currencySymbol)}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                {info?.count_paid ?? 0} / {info?.count_won ?? 0}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
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
      />
    </div>
  )
}
