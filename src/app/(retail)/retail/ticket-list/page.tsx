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

export default function TicketListPage() {
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
    <div className="fixed inset-0 z-50 flex flex-col bg-accent text-accent-foreground">
      <div className="relative flex h-16 items-center justify-center bg-accent text-accent-foreground">
        <h2 className="text-[20px] font-bold">Lista Biglietti</h2>
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
              Terminale
            </span>
            <Select value={terminal} onValueChange={setTerminal}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Terminale" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="203">203</SelectItem>
                <SelectItem value="205">205</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Stato
            </span>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Stato" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="won">Vinto</SelectItem>
                <SelectItem value="lost">Perso</SelectItem>
                <SelectItem value="cancelled">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Pagamento
            </span>
            <Select value={payment} onValueChange={setPayment}>
              <SelectTrigger className="w-[100px] bg-background text-[12px] text-foreground">
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white p-0">
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="paid">Pagato</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Da
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

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              A
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

          <div className="flex flex-row items-center gap-2 bg-badge text-background">
            <span className="whitespace-nowrap pl-2 text-[12px] font-semibold">
              Dimensione Pagina
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

          <Button className="text-bold w-[80px] bg-tertiary text-[14px] text-tertiary-foreground hover:bg-tertiary/70">
            Ricarica
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white text-black">
        <table className="w-full text-[12px]">
          <thead className="bg-secondary text-white">
            <tr>
              <th className="bg-badge p-2 text-[16px]">ID Biglietto</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Terminale</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Data e Ora</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Puntata</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Annullato</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Vinto</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Stato</th>
              <th className="w-[1px] bg-card-header-foreground p-0"></th>
              <th className="bg-badge p-2 text-[16px]">Pagamento</th>
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
                      {i % 2 === 0 ? 'Vinto' : 'Perso'}
                    </span>
                  </div>
                </td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">Pagato</td>
                <td className="w-[1px] bg-muted p-0"></td>
                <td className="p-2">
                  <Button
                    onClick={() => handleDetailsClick(1400 - i)}
                    className="h-8 w-20 bg-tertiary text-[16px] text-tertiary-foreground hover:bg-tertiary/80"
                  >
                    Dettagli
                  </Button>
                </td>
              </tr>
            ))}
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
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                Totale Pagina
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 86.50
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 47.28
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                Totale Cassa
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                Pagato / Vinto
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                Totale Biglietti
              </td>
            </tr>
            <tr className="bg-accent text-xs font-medium text-white">
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle font-bold">
                Totali
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 86.50
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 47.28
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                € 0.00
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                0 / 7
              </td>
              <td className="border border-muted bg-accent px-3 py-2 text-center align-middle">
                22
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
