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
import { cn } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function TicketListPage() {
  const { t } = useTranslation()
  const [terminal, setTerminal] = useState('all')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [from, setFrom] = useState<Date | undefined>(new Date())
  const [to, setTo] = useState<Date | undefined>(new Date())
  const [pageSize, setPageSize] = useState('15')
  const router = useRouter()

  const handleDetailsClick = (ticketId: number) => {
    console.log('Details for ticket:', ticketId)
  }

  return (
    /* MODIFICA: Coordinate fisse per centrare il contenitore come l'altra pagina */
    <div className="fixed top-[64px] left-0 right-0 bottom-0 z-50 flex flex-col bg-accent text-accent-foreground">
      
      {/* Header Bar */}
      <div className="relative flex h-16 items-center justify-center bg-accent text-accent-foreground shrink-0">
        <h2 className="text-[16px] font-bold">{t('ticket_list')}</h2>
        <Button
          variant="ghost"
          className="absolute right-4 bg-accent text-xl text-secondary-foreground"
          onClick={() => router.back()}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-center pb-5 bg-secondary shrink-0">
        <div className="flex flex-wrap items-center gap-10 relative top-2.5">
          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              {t('terminal')}
            </span>
            <Select value={terminal} onValueChange={setTerminal}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder={t('terminal')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="203">203</SelectItem>
                <SelectItem value="205">205</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              {t('status')}
            </span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder={t('status')} />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="won">{t('won')}</SelectItem>
                <SelectItem value="lost">{t('lost')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-accent text-background">
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

          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              {t('from')}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ticketFilter"
                  className="w-[100px] justify-center text-[12px]"
                >
                  {from ? format(from, 'dd/MM/yyyy') : 'Da'}
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

          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              {t('to')}
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ticketFilter"
                  className="w-[100px] justify-center text-[12px]"
                >
                  {to ? format(to, 'dd/MM/yyyy') : 'A'}
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

          <div className="flex flex-row items-center gap-2 bg-accent text-background">
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

          <Button className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground">
            {t('reload')}
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-[12px]">
          <thead className="bg-secondary text-white sticky top-0 z-10">
            <tr>
              <th className="bg-accent p-2 text-[16px]">{t('ticket_id')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('terminal')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('date_n_time')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('staked_amount')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('cancelled')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('won')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('ticket_status')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]">{t('payment')}</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-accent p-2 text-[16px]"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: parseInt(pageSize) }).map((_, i) => (
              <tr key={i} className="border-b text-center text-[16px]">
                <td className="p-2">{1400 - i}</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">203</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">21/05/2025 10:00</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">$ {(5 + i).toFixed(2)}</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">$ 0.00</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  $ {(i % 2 === 0 ? 3.2 : 0.0).toFixed(2)}
                </td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-2">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-sm',
                        i % 2 === 0 ? 'bg-green-600' : 'bg-red-600',
                      )}
                    />
                    <span className="text-[16px] font-medium">
                      {i % 2 === 0 ? t('won') : t('lost')}
                    </span>
                  </div>
                </td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">{t('paid')}</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  <Button
                    onClick={() => handleDetailsClick(1400 - i)}
                    className="h-8 w-20 bg-tertiary text-[16px] text-tertiary-foreground"
                  >
                    {t('details')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-9 h-[122px] shrink-0 overflow-hidden">
        {/* Pagination */}
        <div className="col-span-2 flex flex-row items-center bg-accent p-4">
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive={true}>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        {/* Totals Table */}
        <table className="col-span-7 border-collapse">
          <tbody>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold text-md">
                {t('page_total')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 86.50
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 47.28
              </td>
              <td className="border border-muted bg-searchResButton px-3 py-2 text-center align-middle font-bold text-md">
                {t('cash_total')}
              </td>
              <td className="border border-muted bg-searchResButton px-3 py-2 text-center align-middle font-bold text-md">
                {t('paid_won')}
              </td>
              <td className="border border-muted bg-searchResButton px-3 py-2 text-center align-middle font-bold text-md">
                {t('total_tickets')}
              </td>
            </tr>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold text-md">
                {t('totals')}
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 86.50
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 47.28
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                $ 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                0 / 7
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle text-md">
                22
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}