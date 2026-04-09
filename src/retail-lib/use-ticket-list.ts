'use client'

import { RootContext } from '@/retail-contexts/root-context'
import {
  TicketListItem,
  TicketListInfo,
  TicketListResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { format } from 'date-fns'
import React, { useCallback, useContext, useEffect, useState } from 'react'

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

  // Refs to read current filter values without causing re-renders
  const filtersRef = React.useRef({ from, to, status, payment, terminal })
  filtersRef.current = { from, to, status, payment, terminal }

  // Applied filters: only updated when user clicks search button
  const [appliedFilters, setAppliedFilters] = useState({
    from,
    to,
    status,
    payment,
    terminal,
  })

  // Only called explicitly by the user clicking the reload button.
  const fetchTickets = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator) return

    const {
      from: f,
      to: t,
      status: s,
      payment: p,
      terminal: term,
    } = filtersRef.current

    // Snapshot current filters so the UI reflects what was searched
    setAppliedFilters({ from: f, to: t, status: s, payment: p, terminal: term })
    setCurrentPage(1)

    setLoading(true)
    try {
      const body = {
        dateStart: f
          ? format(f, 'dd-MM-yyyy')
          : format(new Date(), 'dd-MM-yyyy'),
        dateEnd: t ? format(t, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
        offset: 0,
        itemsPerPage: 9999,
        terminal: -1,
        status: STATUS_MAP[s] ?? 0,
        payment: PAYMENT_MAP[p] ?? 0,
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
  }, [rootContext.initCode, rootContext.operator])

  // Initial fetch on mount only
  const didMount = React.useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      fetchTickets()
    }
  }, [fetchTickets])

  // Client-side: filter by applied terminal, then paginate
  const filteredItems =
    appliedFilters.terminal === 'all'
      ? allItems
      : allItems.filter(
          (i) => String(i.terminal_id) === appliedFilters.terminal,
        )

  const perPage = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
  const items = filteredItems.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage,
  )

  const setPageSizeAndReset = useCallback((v: string) => {
    setPageSize(v)
    setCurrentPage(1)
  }, [])

  return {
    // Filter state
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
