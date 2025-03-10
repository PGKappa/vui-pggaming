'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RootContext } from '@/contexts/root-context'
import { format } from 'date-fns'
import React, { useContext, useMemo } from 'react'
import { Button } from './ui/button'
import { BetsHistory } from '@/lib/types'
import TicketDetailsDialog from './ticket-details-dialog'

export default function BetsHistoryDialog() {
  const { betsHistory } = useContext(RootContext)

  const groupedBets = useMemo(() => {
    return betsHistory.reduce(
      (acc, bet) => {
        const dateKey = format(bet.date, 'dd/MM/yyyy')
        if (!acc[dateKey]) {
          acc[dateKey] = []
        }
        acc[dateKey].push(bet)
        return acc
      },
      {} as Record<string, BetsHistory[]>,
    )
  }, [betsHistory])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="whitespace-normal py-6 text-md leading-tight"
        >
          Le mie scommesse
        </Button>
      </DialogTrigger>

      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Storico Tickets</DialogTitle>
        </DialogHeader>

        {betsHistory.length === 0 ? (
          <div className="flex h-40 items-center justify-center">
            {' '}
            Nessuna scomessa effettuata.
          </div>
        ) : (
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow className="h-12 bg-betSlip text-md">
                  <TableHead className="text-center text-primary">
                    Codice Ticket
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    Data e Ora
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    Importo Giocato
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    Vincita
                  </TableHead>
                  <TableHead className="text-center text-primary">
                    Stato Ticket
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
