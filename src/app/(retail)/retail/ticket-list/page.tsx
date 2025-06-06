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

  const handleDetailsClick = (ticketId: number) => {
    console.log('Details for ticket:', ticketId)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-accent text-accent-foreground">
      <div className="relative flex h-16 items-center justify-center bg-accent text-accent-foreground">
        <h2 className="text-[20px] font-bold">Ticket List</h2>
        <Button
          variant="ghost"
          className="absolute right-4 bg-secondary text-xl text-secondary-foreground hover:bg-secondary/70"
          onClick={() => router.back()}
        >
          ✕
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex justify-center px-4 pb-8 pt-10">
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Terminal
            </span>
            <Select value={terminal} onValueChange={setTerminal}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Terminal" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="203">203</SelectItem>
                <SelectItem value="205">205</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Status
            </span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
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

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Payment
            </span>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              From
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ticketFilter"
                  className="w-[100px] justify-center text-[12px]"
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

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              To
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ticketFilter"
                  className="w-[100px] justify-center text-[12px]"
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

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Page Size
            </span>
            <Select value={pageSize} onValueChange={setPageSize}>
              <SelectTrigger className="w-[80px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground hover:bg-tertiary/70">
            Reload
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-[12px]">
          <thead className="bg-secondary text-white">
            <tr>
              <th className="bg-badge p-2 text-[16px]">Ticket ID</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Terminal</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Date and Time</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Staked</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Cancelled</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Won</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Status</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Payment</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]"></th>
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
                <td className="p-2">€ {(5 + i).toFixed(2)}</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">€ 0.00</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  € {(i % 2 === 0 ? 3.2 : 0.0).toFixed(2)}
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
                      {i % 2 === 0 ? 'Won' : 'Lost'}
                    </span>
                  </div>
                </td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">Paid</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  <Button
                    onClick={() => handleDetailsClick(1400 - i)}
                    className="h-8 w-20 bg-tertiary text-[16px] text-tertiary-foreground hover:bg-tertiary/80"
                  >
                    Details
                  </Button>
                </td>
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
