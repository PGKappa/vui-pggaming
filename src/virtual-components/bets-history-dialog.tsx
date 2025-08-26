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
import { Ticket } from '@/virtual-lib/types'
import { t } from 'i18next'
import React, { useContext, useMemo } from 'react'
import TicketDetailsDialog from './ticket-details-dialog'
import { Button } from './ui/button'

export default function BetsHistoryDialog() {
  const { betsHistory } = useContext(RootContext)

  const groupedBets = useMemo(() => {
    return betsHistory.reduce(
      (acc, bet) => {
        const dateKey = new Date(bet.date).toLocaleDateString()
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(bet)
        return acc
      },
      {} as Record<string, Ticket[]>,
    )
  }, [betsHistory])

  return (
    <Dialog>
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

        {betsHistory.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            {' '}
            <span className="text-betHistory-foreground">
              {t('no_bets_placed')}
            </span>
          </div>
        ) : (
          <ScrollArea>
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
                  <TableHead className="text-center text-primary"></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {Object.entries(groupedBets).map(([date, bets]) => (
                  <React.Fragment key={date}>
                    <TableRow key={date}>
                      <TableCell
                        colSpan={6}
                        className="py-2 text-center text-md text-primary"
                      >
                        {date}
                      </TableCell>
                    </TableRow>

                    {bets.map((bet) => (
                      <TableRow
                        key={bet.id}
                        className="border-b border-border text-primary"
                      >
                        <TableCell className="text-center">{bet.id}</TableCell>
                        <TableCell className="text-center">
                          {new Date(bet.date).toLocaleDateString()} -{' '}
                          {new Date(bet.date).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="text-center">
                          € {bet.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          € {bet.winning.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          {bet.status}
                        </TableCell>
                        <TableCell>
                          <TicketDetailsDialog ticket={bet} />
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
