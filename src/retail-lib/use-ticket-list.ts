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

  const [allItems, setAllItems] = useState<TicketListItem[]>([])
  const [info, setInfo] = useState<TicketListInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableTerminals, setAvailableTerminals] = useState<string[]>([])

  const currencySymbol = rootContext.getCurrencySymbol?.() ?? '€'

  // Fetch ALL items from API (terminal filter is client-side only).
  // Status and payment filters work server-side.
  // We fetch everything (itemsPerPage=9999) and paginate client-side.
  const fetchTickets = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator) return

    setLoading(true)
    try {
      const body = {
        dateStart: from
          ? format(from, 'dd-MM-yyyy')
          : format(new Date(), 'dd-MM-yyyy'),
        dateEnd: to
          ? format(to, 'dd-MM-yyyy')
          : format(new Date(), 'dd-MM-yyyy'),
        offset: 0,
        itemsPerPage: 9999,
        terminal: -1,
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
        const rawItems = data.items ?? []
        setAllItems(rawItems)
        setInfo(data.info ?? null)
        // Extract unique terminal IDs from the full result
        if (rawItems.length) {
          const terminalIds = [
            ...new Set(rawItems.map((i) => String(i.terminal_id))),
          ].sort((a, b) => parseInt(a) - parseInt(b))
          setAvailableTerminals((prev) => {
            const merged = [...new Set([...prev, ...terminalIds])].sort(
              (a, b) => parseInt(a) - parseInt(b),
            )
            return merged
          })
        }
      } else {
        setAllItems([])
        setInfo(data.info ?? null)
      }
    } catch (err) {
      console.error('Failed to fetch ticket list:', err)
      setAllItems([])
      setInfo(null)
    } finally {
      setLoading(false)
    }
  }, [rootContext.initCode, rootContext.operator, from, to, status, payment])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Client-side: filter by terminal, then paginate
  const filteredItems =
    terminal === 'all'
      ? allItems
      : allItems.filter((i) => String(i.terminal_id) === terminal)

  const perPage = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
  const items = filteredItems.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  )

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
    availableTerminals,
    // Helpers
    currencySymbol,
    fetchTickets,
  }
}
