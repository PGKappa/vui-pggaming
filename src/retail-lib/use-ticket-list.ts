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
      return { label: 'Active', colorClass: 'bg-ticket-active', translationKey: 'active' }
    case 4:
      return { label: 'Won', colorClass: 'bg-ticket-won', translationKey: 'won' }
    case 5:
    case 9:
      return { label: 'Lost', colorClass: 'bg-ticket-lost', translationKey: 'lost' }
    default:
      return { label: String(status), colorClass: 'bg-ticket-active', translationKey: 'pending' }
  }
}

export function formatCurrency(amount: string | number, currencySymbol: string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return `${currencySymbol} 0.00`
  return `${currencySymbol} ${num.toFixed(2)}`
}

export function useTicketList() {
  const rootContext = useContext(RootContext)

  const [terminal, setTerminal] = useState('all')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date())
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date())
  const [pageSize, setPageSize] = useState('15')
  const [currentPage, setCurrentPage] = useState(1)

  const [allItems, setAllItems] = useState<TicketListItem[]>([])
  const [info, setInfo] = useState<TicketListInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableTerminals, setAvailableTerminals] = useState<string[]>([])
  const [disciplineMap, setDisciplineMap] = useState<Record<number, string>>({})

  const currencySymbol = rootContext.getCurrencySymbol?.() ?? '€'

  const filtersRef = React.useRef({ dateFrom, dateTo, status, payment, terminal })
  filtersRef.current = { dateFrom, dateTo, status, payment, terminal }

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom,
    dateTo,
    status,
    payment,
    terminal,
  })

  const fetchDisciplines = useCallback(async (items: TicketListItem[]) => {
    if (!rootContext.initCode || !rootContext.operator) return

    const BATCH_SIZE = 10

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)
      const batchMap: Record<number, string> = {}

      await Promise.all(
        batch.map(async (item) => {
          try {
            const response = await createPGVirtualAPICall(
              `/api/ticket/${item.ticket_id}`,
              rootContext.initCode!,
              undefined,
              rootContext.operator,
            )
            const data = await response.json()
            if (data.ret_code === 1024 && data.info?.selections?.length > 0) {
              const gameIds = data.info.selections.map((s: any) => s.gameId ?? '')
              const hasDogs = gameIds.some((g: string) => g.startsWith('dogs'))
              const hasHorses = gameIds.some((g: string) => g.startsWith('horse'))
              const hasSoccer = gameIds.some((g: string) => g.startsWith('soccer') || g.startsWith('calcio'))

              if (hasDogs && hasHorses && hasSoccer) batchMap[item.ticket_id] = 'dogs,horses,soccer'
              else if (hasDogs && hasHorses) batchMap[item.ticket_id] = 'dogs,horses'
              else if (hasDogs && hasSoccer) batchMap[item.ticket_id] = 'dogs,soccer'
              else if (hasHorses && hasSoccer) batchMap[item.ticket_id] = 'horses,soccer'
              else if (hasDogs) batchMap[item.ticket_id] = 'dogs'
              else if (hasHorses) batchMap[item.ticket_id] = 'horses'
              else if (hasSoccer) batchMap[item.ticket_id] = 'soccer'
              else batchMap[item.ticket_id] = 'other'
            }
          } catch {
            // skip silently
          }
        })
      )

      setDisciplineMap((prev) => ({ ...prev, ...batchMap }))
    }
  }, [rootContext.initCode, rootContext.operator])

  const fetchTickets = useCallback(async () => {
    if (!rootContext.initCode || !rootContext.operator) return

    const { dateFrom: df, dateTo: dt, status: s, payment: p, terminal: term } = filtersRef.current

    setAppliedFilters({ dateFrom: df, dateTo: dt, status: s, payment: p, terminal: term })
    setCurrentPage(1)
    setLoading(true)
    setDisciplineMap({})

    try {
      const body = {
        dateStart: df ? format(df, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
        dateEnd: dt ? format(dt, 'dd-MM-yyyy') : format(new Date(), 'dd-MM-yyyy'),
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
        if (rawItems.length) {
          const terminalIds = [...new Set(rawItems.map((i) => String(i.terminal_id)))].sort(
            (a, b) => parseInt(a) - parseInt(b),
          )
          setAvailableTerminals((prev) => {
            const merged = [...new Set([...prev, ...terminalIds])].sort(
              (a, b) => parseInt(a) - parseInt(b),
            )
            return merged
          })
          fetchDisciplines(rawItems)
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
  }, [rootContext.initCode, rootContext.operator, fetchDisciplines])

  const didMount = React.useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      fetchTickets()
    }
  }, [fetchTickets])

  const filteredItems =
    appliedFilters.terminal === 'all'
      ? allItems
      : allItems.filter((i) => String(i.terminal_id) === appliedFilters.terminal)

  const perPage = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
  const items = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage)

  const setPageSizeAndReset = useCallback((v: string) => {
    setPageSize(v)
    setCurrentPage(1)
  }, [])

  return {
    terminal, setTerminal,
    status, setStatus,
    payment, setPayment,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    pageSize,
    setPageSize: setPageSizeAndReset,
    currentPage, setCurrentPage,
    totalPages,
    items,
    info,
    loading,
    availableTerminals,
    currencySymbol,
    fetchTickets,
    disciplineMap,
  }
}