'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/virtual-components/ui/dialog'
import { ScrollArea } from '@/virtual-components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/virtual-components/ui/table'
import { RootContext } from '@/virtual-contexts/root-context'
import {
  getStoredTicketIds,
  ticketStatusKey,
  toTicketHistoryItem,
  type TicketHistoryItem,
} from '@/virtual-lib/ticket-history'
import { createPGVirtualAPICall } from '@/virtual-lib/utils'
import { t } from 'i18next'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Button } from './ui/button'

export default function BetsHistoryDialog() {
  const rootContext = useContext(RootContext)
  const initCode = rootContext?.initCode
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '€'

  const [tickets, setTickets] = useState<TicketHistoryItem[]>([])
  const [loading, setLoading] = useState(false)

  // carica il dettaglio aggiornato dei ticket giocati da questo browser
  const loadTickets = useCallback(async () => {
    if (!initCode) return
    const ids = getStoredTicketIds(initCode)
    if (ids.length === 0) {
      setTickets([])
      return
    }
    setLoading(true)
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const response = await createPGVirtualAPICall(
              `/api/ticket/${id}`,
              initCode,
            )
            const data = await response.json()
            return toTicketHistoryItem(data?.info)
          } catch {
            return undefined
          }
        }),
      )
      setTickets(
        results
          .filter((item): item is TicketHistoryItem => !!item)
          .sort((a, b) => b.date.getTime() - a.date.getTime()),
      )
    } finally {
      setLoading(false)
    }
  }, [initCode])

  const groupedBets = useMemo(() => {
    return tickets.reduce(
      (acc, ticket) => {
        const dateKey = ticket.date.toLocaleDateString()
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(ticket)
        return acc
      },
      {} as Record<string, TicketHistoryItem[]>,
    )
  }, [tickets])

  return (
    <Dialog onOpenChange={(open) => open && loadTickets()}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="whitespace-normal py-6 text-md leading-tight"
        >
          {t('my_bets')}
        </Button>
      </DialogTrigger>

      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{t('ticket_history')}</DialogTitle>
        </DialogHeader>

        {loading && tickets.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <span className="text-betHistory-foreground">
              {t('loading')}...
            </span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            <span className="text-betHistory-foreground">
              {t('no_bets_placed')}
            </span>
          </div>
        ) : (
          <ScrollArea className="max-h-[70vh]">
            <Table>
              <TableHeader>
                <TableRow className="h-12 bg-betSlip text-md">
                  <TableHead className="text-center text-primary">
                    {t('ticket_code')}
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    {t('date_hour')}
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    {t('amount_played')}
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    {t('winning')}
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    {t('ticket_status')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Object.entries(groupedBets).map(([date, items]) => (
                  <React.Fragment key={date}>
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-2 text-center text-md text-primary"
                      >
                        {date}
                      </TableCell>
                    </TableRow>

                    {items.map((ticket) => (
                      <TableRow
                        key={ticket.ticketId}
                        className="border-b border-border text-primary"
                      >
                        <TableCell className="text-center tabular-nums">
                          {ticket.ticketId}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {ticket.date.toLocaleDateString()} -{' '}
                          {ticket.date.toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {currencySymbol} {ticket.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          {currencySymbol} {ticket.amountWon.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {t(ticketStatusKey(ticket.status))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
