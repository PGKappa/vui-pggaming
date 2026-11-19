'use client'

import { RootContext } from '@/retail-contexts/root-context'
import {
  TicketListItem,
  TicketListInfo,
  TicketListResponse,
} from '@/retail-lib/types'
import { createPGVirtualAPICall } from '@/retail-lib/utils'
import { TicketListSourceContext } from '@/retail-lib/ticket-list-source'
import { endOfDay, format, startOfDay, startOfToday } from 'date-fns'
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// Stato e pagamento si filtrano in locale (come su stanleybet2026): la lista
// si scarica una volta sola per il periodo e cambiare filtro non rifà la
// chiamata. "Stato" e "Pagato/Non pagato" si escludono a vicenda nella UI
// (handleStatusChange in ticket-list-page-content.tsx).
function statusMatchesItem(itemStatus: number, filterStatus: string): boolean {
  switch (filterStatus) {
    case 'active':
      return itemStatus === 0 || itemStatus === 1
    case 'won':
      return itemStatus === 4 || itemStatus === 6
    case 'lost':
      return itemStatus === 5 || itemStatus === 9
    case 'cancelled':
      return itemStatus === 2 || itemStatus === 3
    case 'all':
    default:
      return true
  }
}

function paymentMatchesItem(
  itemStatus: number,
  filterPayment: string,
): boolean {
  switch (filterPayment) {
    case 'paid':
      return itemStatus === 6
    case 'unpaid':
      return itemStatus === 4
    case 'all':
    default:
      return true
  }
}

// Disciplina del ticket dai prefissi dei suoi gameId. I valori devono restare
// allineati a quelli del filtro "Disciplina" e della colonna in tabella.
function classifyDisciplines(gameIds: string[]): string {
  const hasDogs = gameIds.some((g) => g.startsWith('dogs'))
  const hasHorses = gameIds.some((g) => g.startsWith('horse'))
  const hasSoccer = gameIds.some(
    (g) => g.startsWith('soccer') || g.startsWith('calcio'),
  )
  const parts: string[] = []
  if (hasDogs) parts.push('dogs')
  if (hasHorses) parts.push('horses')
  if (hasSoccer) parts.push('soccer')
  return parts.length > 0 ? parts.join(',') : 'other'
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
    case 0: // CREATED
      return {
        label: 'Created',
        colorClass: 'bg-notCollected',
        translationKey: 'pending',
      }
    case 1: // ACTIVE
      return {
        label: 'Active',
        colorClass: 'bg-notCollected',
        translationKey: 'active',
      }
    case 2: // CANCELLED
      return {
        label: 'Cancelled',
        colorClass: 'bg-ticket-lost',
        translationKey: 'cancelled',
      }
    case 3: // VOID
      return {
        label: 'Void',
        colorClass: 'bg-ticket-lost',
        translationKey: 'void',
      }
    case 4: // WON (unpaid)
      return {
        label: 'Won',
        colorClass: 'bg-notCollected',
        translationKey: 'won',
      }
    case 5: // LOST
      return {
        label: 'Lost',
        colorClass: 'bg-ticket-lost',
        translationKey: 'lost',
      }
    case 6: // PAID
      return {
        label: 'Paid',
        colorClass: 'bg-ticket-won',
        translationKey: 'won',
      }
    default:
      console.warn(
        `[TicketList] Unknown status code: ${status} — add to getStatusDisplay()`,
      )
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
  const source = useContext(TicketListSourceContext)

  const [terminal, setTerminal] = useState('all')
  const [status, setStatus] = useState('all')
  const [payment, setPayment] = useState('all')
  const [discipline, setDiscipline] = useState('all')
  // all'apertura la lista mostra la giornata odierna
  const [dateFrom, setDateFrom] = useState<Date | undefined>(startOfToday)
  const [dateTo, setDateTo] = useState<Date | undefined>(startOfToday)
  const [pageSize, setPageSize] = useState('15')
  const [currentPage, setCurrentPage] = useState(1)

  const [allItems, setAllItems] = useState<TicketListItem[]>([])
  const [info, setInfo] = useState<TicketListInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [availableTerminals, setAvailableTerminals] = useState<string[]>([])
  // i game_ids arrivano già con la lista: la disciplina è un dato derivato,
  // nessuna chiamata aggiuntiva
  const disciplineMap = useMemo(() => {
    const map: Record<number, string> = {}
    for (const item of allItems) {
      if (item.game_ids?.length) {
        map[item.ticket_id] = classifyDisciplines(item.game_ids)
      }
    }
    return map
  }, [allItems])

  const currencySymbol = rootContext.getCurrencySymbol?.() ?? '€'

  const filtersRef = React.useRef({
    dateFrom,
    dateTo,
    status,
    payment,
    terminal,
    discipline,
  })
  filtersRef.current = {
    dateFrom,
    dateTo,
    status,
    payment,
    terminal,
    discipline,
  }

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom,
    dateTo,
    status,
    payment,
    terminal,
    discipline,
  })

  // ultima ricerca avviata: le risposte (o gli aggiornamenti) di una ricerca
  // precedente non sovrascrivono la lista
  const requestIdRef = React.useRef(0)

  // reload: "Ricarica" premuto. Una sorgente alternativa (web) riscarica
  // allora i ticket aperti di tutto il periodo; all'apertura la lista si
  // mostra subito e si aggiornano in background solo quelli di oggi.
  const runSearch = useCallback(
    async (reload: boolean) => {
      if (!rootContext.initCode || !rootContext.operator) return

      const {
        dateFrom: df,
        dateTo: dt,
        status: s,
        payment: p,
        terminal: term,
        discipline: disc,
      } = filtersRef.current

      setAppliedFilters({
        dateFrom: df,
        dateTo: dt,
        status: s,
        payment: p,
        terminal: term,
        discipline: disc,
      })
      setCurrentPage(1)
      setLoading(true)
      const requestId = ++requestIdRef.current
      const isCurrent = () => requestId === requestIdRef.current
      // lista vuota ma ticket ancora in arrivo (web): resta il caricamento
      // fino all'aggiornamento, invece di "nessun ticket trovato"
      let waitingForUpdate = false

      try {
        const body = {
          dateStart: df
            ? format(df, 'dd-MM-yyyy')
            : format(new Date(), 'dd-MM-yyyy'),
          dateEnd: dt
            ? format(dt, 'dd-MM-yyyy')
            : format(new Date(), 'dd-MM-yyyy'),
          offset: 0,
          itemsPerPage: 9999,
          terminal: -1,
          // stato e pagamento filtrati in locale (filteredItems): si scarica
          // sempre tutto il periodo
          status: 0,
          payment: 0,
          enablePagination: true,
          accountingMode: false,
        }

        const data: TicketListResponse = source.fetchList
          ? await source.fetchList(
              body,
              (updated) => {
                if (!isCurrent()) return
                if (updated.ret_code === 1024) {
                  setAllItems(updated.items ?? [])
                  setInfo(updated.info ?? null)
                }
                setLoading(false)
              },
              reload,
            )
          : await (
              await createPGVirtualAPICall(
                '/api/ticket/list',
                rootContext.initCode,
                { method: 'POST', body: JSON.stringify(body) },
                rootContext.operator,
              )
            ).json()

        if (!isCurrent()) return
        if (data.ret_code === 1024) {
          const rawItems = data.items ?? []
          waitingForUpdate =
            rawItems.length === 0 &&
            (data as { pending?: boolean }).pending === true
          const knownStatuses = new Set([1, 4, 5, 6, 9])
          const unknownStatuses = [
            ...new Set(rawItems.map((i) => i.status)),
          ].filter((s) => !knownStatuses.has(s))
          if (unknownStatuses.length > 0) {
            console.warn(
              '[TicketList] Unknown status codes in response:',
              unknownStatuses,
            )
          }
          setAllItems(rawItems)
          setInfo(data.info ?? null)
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
        if (!isCurrent()) return
        console.error('Failed to fetch ticket list:', err)
        setAllItems([])
        setInfo(null)
      } finally {
        if (isCurrent() && !waitingForUpdate) setLoading(false)
      }
    },
    [rootContext.initCode, rootContext.operator, source],
  )

  const fetchTickets = useCallback(() => runSearch(true), [runSearch])

  const didMount = React.useRef(false)
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      runSearch(false)
    }
  }, [runSearch])

  const filteredItems = useMemo(() => {
    const rangeStart = startOfDay(
      appliedFilters.dateFrom ?? new Date(),
    ).getTime()
    const rangeEnd = endOfDay(appliedFilters.dateTo ?? new Date()).getTime()
    return allItems.filter((i) => {
      // solo i ticket del periodo cercato (di default oggi)
      const ticketTime = parseTicketTime(i.time).getTime()
      const dateMatch =
        !Number.isFinite(ticketTime) ||
        (ticketTime >= rangeStart && ticketTime <= rangeEnd)
      const terminalMatch =
        appliedFilters.terminal === 'all' ||
        String(i.terminal_id) === appliedFilters.terminal
      const disciplineMatch = (() => {
        if (appliedFilters.discipline === 'all') return true
        const d = disciplineMap[i.ticket_id]
        if (d === undefined) return true
        if (appliedFilters.discipline === 'real')
          return d.includes('dogs') && d.includes('horses')
        return d.includes(appliedFilters.discipline)
      })()
      const statusMatch =
        appliedFilters.payment !== 'all'
          ? paymentMatchesItem(i.status, appliedFilters.payment)
          : statusMatchesItem(i.status, appliedFilters.status)
      return dateMatch && terminalMatch && disciplineMatch && statusMatch
    })
  }, [allItems, appliedFilters, disciplineMap])

  const perPage = parseInt(pageSize)
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / perPage))
  const items = useMemo(
    () =>
      filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filteredItems, currentPage, perPage],
  )

  const setPageSizeAndReset = useCallback((v: string) => {
    setPageSize(v)
    setCurrentPage(1)
  }, [])

  return {
    terminal,
    setTerminal,
    status,
    setStatus,
    payment,
    setPayment,
    discipline,
    setDiscipline,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    pageSize,
    setPageSize: setPageSizeAndReset,
    currentPage,
    setCurrentPage,
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
