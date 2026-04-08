'use client'

import { RootContext } from '@/retail-contexts/root-context'
import {
  TicketListItem,
  TicketListInfo,
  TicketListResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { format } from 'date-fns'
import { useCallback, useContext, useEffect, useState } from 'react'

const STATUS_MAP: Record<string, number> = {
  all: 0,
  active: 1,
  cancelled: 2,
  won: 3,
  lost: 4,
}

const PAYMENT_MAP: Record<string, number> = {
  all: 0,
  paid: 1,
  unpaid: 2,
}

export function parseTicketTime(time: TicketListItem['time']): Date {
  const [year, month, day, hour, min, sec] = time
  return new Date(
    parseInt(String(year)),
    Number(month),
    parseInt(String(day)),
    parseInt(String(hour)),
    parseInt(String(min)),
    parseInt(String(sec)),
  )
}

export function getStatusDisplay(status: number): {
  label: string
  colorClass: string
  translationKey: string
} {
  switch (status) {
    case 1:
      return {
        label: 'Active',
        colorClass: 'bg-ticket-active',
        translationKey: 'active',
      }
    case 4:
      return {
        label: 'Won',
        colorClass: 'bg-ticket-won',
        translationKey: 'won',
      }
    case 5:
    case 9:
      return {
        label: 'Lost',
        colorClass: 'bg-ticket-lost',
        translationKey: 'lost',
      }
    default:
      return {
        label: String(status),
        colorClass: 'bg-ticket-active',
        translationKey: 'pending',
      }
  }
}

export function formatCurrency(
  amount: string | number,
  currencySymbol: string,
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currencySymbol} 0.00`
  return `${currencySymbol} ${num.toFixed(2)}`
}

export function useTicketList() {
  const rootContext = useContext(RootContext)

  const [terminal, setTerminal] = useState('all')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [from, setFrom] = useState<Date | undefined>(new Date())
  const [to, setTo] = useState<Date | undefined>(new Date())
  const [pageSize, setPageSize] = useState('15')
  const [currentPage, setCurrentPage] = useState(1)

  const [items, setItems] = useState<TicketListItem[]>([])
  const [info, setInfo] = useState<TicketListInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const currencySymbol = rootContext.getCurrencySymbol?.() ?? '€'

  const fetchTickets = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator) return

    setLoading(true)
    try {
      const perPage = parseInt(pageSize)
      // API offset is page-based (0-indexed page number), not item offset
      const offset = currentPage - 1

      const body = {
        dateStart: from
          ? format(from, 'dd-MM-yyyy')
          : format(new Date(), 'dd-MM-yyyy'),
        dateEnd: to
          ? format(to, 'dd-MM-yyyy')
          : format(new Date(), 'dd-MM-yyyy'),
        offset,
        itemsPerPage: perPage,
        terminal: terminal === 'all' ? -1 : parseInt(terminal),
        status: STATUS_MAP[status] ?? 0,
        payment: PAYMENT_MAP[payment] ?? 0,
        enablePagination: true,
        accountingMode: false,
      }

      const response = await createPGVirtualAPICall(
        '/api/ticket/list',
        rootContext.initCode,
        { method: 'POST', body: JSON.stringify(body) },
        rootContext.operator,
      )

      const data: TicketListResponse = await response.json()

      if (data.ret_code === 1024) {
        setItems(data.items ?? [])
        setInfo(data.info ?? null)
      } else {
        setItems([])
        setInfo(data.info ?? null)
      }
    } catch (err) {
      console.error('Failed to fetch ticket list:', err)
      setItems([])
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [
    rootContext.initCode,
    rootContext.operator,
    pageSize,
    currentPage,
    from,
    to,
    terminal,
    status,
    payment,
  ])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const setTerminalAndReset = useCallback((v: string) => {
    setTerminal(v)
    setCurrentPage(1)
  }, [])
  const setStatusAndReset = useCallback((v: string) => {
    setStatus(v)
    setCurrentPage(1)
  }, [])
  const setPaymentAndReset = useCallback((v: string) => {
    setPayment(v)
    setCurrentPage(1)
  }, [])
  const setFromAndReset = useCallback((v: Date | undefined) => {
    setFrom(v)
    setCurrentPage(1)
  }, [])
  const setToAndReset = useCallback((v: Date | undefined) => {
    setTo(v)
    setCurrentPage(1)
  }, [])
  const setPageSizeAndReset = useCallback((v: string) => {
    setPageSize(v)
    setCurrentPage(1)
  }, [])

  const totalPages = info
    ? Math.max(1, Math.ceil(info.count / parseInt(pageSize)))
    : 1

  return {
    // Filter state
    terminal,
    setTerminal: setTerminalAndReset,
    status,
    setStatus: setStatusAndReset,
    payment,
    setPayment: setPaymentAndReset,
    from,
    setFrom: setFromAndReset,
    to,
    setTo: setToAndReset,
    pageSize,
    setPageSize: setPageSizeAndReset,
    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    // Data
    items,
    info,
    loading,
    // Helpers
    currencySymbol,
    fetchTickets,
  }
}
