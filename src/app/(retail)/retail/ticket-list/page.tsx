'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/retail-components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/retail-components/ui/popover'
import { Calendar } from '@/retail-components/ui/calendar'
import { Button } from '@/retail-components/ui/button'
import { cn } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TicketListPage() {
  const [terminal, setTerminal] = useState('all')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [from, setFrom] = useState<Date | undefined>(new Date())
  const [to, setTo] = useState<Date | undefined>(new Date())
  const [pageSize, setPageSize] = useState('15')
  const [page, setPage] = useState(1)
  const router = useRouter()

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-accent text-accent-foreground">
      <div className="relative flex h-12 items-center justify-center bg-accent text-accent-foreground">
        <h2 className="text-lg font-bold">Ticket List</h2>
        <Button
          variant="ghost"
          className="absolute right-4 text-xl text-white"
          onClick={() => router.back()}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-center px-4 pb-8 pt-10">
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              Terminal
            </span>
            <Select value={terminal} onValueChange={setTerminal}>
              <SelectTrigger className="w-[100px] text-xs bg-background text-foreground">
                <SelectValue placeholder="Terminal" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="203">203</SelectItem>
                <SelectItem value="205">205</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              Status
            </span>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[100px] text-xs bg-background text-foreground">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          </div>

          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              Payment
            </span>
          <Select value={payment} onValueChange={setPayment}>
            <SelectTrigger className="w-[100px] text-xs bg-background text-foreground">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
          </div>

          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              From
            </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ticketFilter"
                className="w-[100px] justify-center text-xs"
              >
                {from ? format(from, 'dd/MM/yyyy') : 'From'}
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

          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              To
            </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ticketFilter"
                className="w-[100px] justify-center text-xs"
              >
                {to ? format(to, 'dd/MM/yyyy') : 'To'}
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

          <div className="flex flex-row items-center gap-2 text-background">
            <span className="whitespace-nowrap text-xs font-semibold">
              Page Size
            </span>
          <Select value={pageSize} onValueChange={setPageSize}>
            <SelectTrigger className="w-[80px] text-xs bg-background text-foreground">
              <SelectValue placeholder="Page Size" />
            </SelectTrigger>
            <SelectContent className="bg-white p-0">
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          </div>

          <Button variant="navbarSelected" className="text-bold w-[70px]">
            Reload
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-xs">
          <thead className="bg-accent text-white">
            <tr>
              <th className="p-2">Ticket ID</th>
              <th className="p-2">Terminal</th>
              <th className="p-2">Date and Time</th>
              <th className="p-2">Staked</th>
              <th className="p-2">Cancelled</th>
              <th className="p-2">Won</th>
              <th className="p-2">Status</th>
              <th className="p-2">Payment</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: parseInt(pageSize) }).map((_, i) => (
              <tr key={i} className="border-b text-center">
                <td className="p-2">{1400 - i}</td>
                <td className="p-2">203</td>
                <td className="p-2">21/05/2025 10:00</td>
                <td className="p-2">€ {(5 + i).toFixed(2)}</td>
                <td className="p-2">€ 0.00</td>
                <td className="p-2">
                  € {(i % 2 === 0 ? 3.2 : 0.0).toFixed(2)}
                </td>
                <td className="p-2">
                  <span
                    className={cn(
                      'font-semibold',
                      i % 2 === 0 ? 'text-green-600' : 'text-red-600',
                    )}
                  >
                    {i % 2 === 0 ? 'Won' : 'Lost'}
                  </span>
                </td>
                <td className="p-2">Paid</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex flex-col bg-accent px-4 py-2 text-xs text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>{page}</span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-2 border-t border-white pt-2">
          <span>Page Total</span>
          <span>€ 86.50</span>
          <span>€ 0.00</span>
          <span>€ 47.28</span>
          <span>€ 0.00</span>
          <span>0 / 7</span>
          <span>22</span>
        </div>
      </div>
    </div>
  )
}
