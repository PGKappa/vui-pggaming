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
    /* Modificato: rimosse dimensioni fisse e inset-0, aggiunte coordinate esplicite */
    <div className="fixed top-[60px] left-0 right-0 bottom-0 z-50 flex flex-col bg-accent text-accent-foreground">
      
      {/* Header Bar */}
      <div className="relative flex h-16 items-center justify-center bg-accent text-accent-foreground shrink-0">
        <h2 className="text-[16px] font-bold uppercase tracking-widest">{t('ticket_list')}</h2>
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
          {/* Terminal Select */}
          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">{t('terminal')}</span>
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

          {/* Status Select */}
          <div className="flex flex-row items-center gap-2 bg-accent text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">{t('status')}</span>
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

          {/* Altri filtri... (omessi per brevità ma mantieni la tua logica) */}
          
          <Button className="font-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground">
            {t('reload')}
          </Button>
        </div>
      </div>

      {/* Table Content - flex-1 permette alla tabella di occupare lo spazio rimanente */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-[12px] border-collapse">
          <thead className="sticky top-0 z-10 bg-secondary text-white">
            <tr className="bg-accent">
              <th className="p-2 text-[16px] border-r border-white/10">{t('ticket_id')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('terminal')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('date_n_time')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('staked_amount')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('cancelled')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('won')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('ticket_status')}</th>
              <th className="p-2 text-[16px] border-r border-white/10">{t('payment')}</th>
              <th className="p-2 text-[16px]"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: parseInt(pageSize) }).map((_, i) => (
              <tr key={i} className="border-b text-center text-[16px] hover:bg-gray-50">
                <td className="p-2 border-r">{1400 - i}</td>
                <td className="p-2 border-r">203</td>
                <td className="p-2 border-r">21/05/2025 10:00</td>
                <td className="p-2 border-r">$ {(5 + i).toFixed(2)}</td>
                <td className="p-2 border-r">$ 0.00</td>
                <td className="p-2 border-r">$ {(i % 2 === 0 ? 3.2 : 0.0).toFixed(2)}</td>
                <td className="p-2 border-r">
                   <div className="flex items-center justify-center gap-2">
                    <div className={cn('h-3 w-3 rounded-sm', i % 2 === 0 ? 'bg-green-600' : 'bg-red-600')} />
                    <span className="font-medium">{i % 2 === 0 ? t('won') : t('lost')}</span>
                  </div>
                </td>
                <td className="p-2 border-r">{t('paid')}</td>
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

      {/* Footer - h-[122px] fisso come da tuo design */}
      <div className="grid grid-cols-9 h-[122px] shrink-0 border-t border-muted">
        <div className="col-span-2 flex items-center bg-accent p-4">
          <Pagination className="justify-start">
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
              <PaginationItem><PaginationLink href="#" isActive={true}>1</PaginationLink></PaginationItem>
              <PaginationItem><PaginationNext href="#" /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        
        <table className="col-span-7 border-collapse h-full">
          <tbody>
            <tr className="bg-accent text-white border-b border-muted">
              <td className="border-r border-muted px-3 py-2 text-center font-bold text-md">{t('page_total')}</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 86.50</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 0.00</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 47.28</td>
              <td className="border-r border-muted bg-searchResButton px-3 py-2 text-center font-bold text-md">{t('cash_total')}</td>
              <td className="border-r border-muted bg-searchResButton px-3 py-2 text-center font-bold text-md">{t('paid_won')}</td>
              <td className="bg-searchResButton px-3 py-2 text-center font-bold text-md">{t('total_tickets')}</td>
            </tr>
            <tr className="bg-accent text-white">
              <td className="border-r border-muted px-3 py-2 text-center font-bold text-md">{t('totals')}</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 86.50</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 0.00</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 47.28</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">$ 0.00</td>
              <td className="border-r border-muted px-3 py-2 text-center text-md">0 / 7</td>
              <td className="px-3 py-2 text-center text-md">22</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}