'use client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/retail-components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/retail-components/ui/table'
import { Button } from '@/retail-components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { Ticket } from '@/retail-lib/types'
import { t } from 'i18next'
import { useContext } from 'react'
import { RootContext } from '@/retail-contexts/root-context'

export default function TicketDetailsDialog({ ticket }: { ticket: Ticket }) {
  const rootContext = useContext(RootContext)
  const currencySymbol = rootContext?.getCurrencySymbol?.() || '$'

  if (!ticket || !ticket.id) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="history"
            size="icon-history"
            className="font-semibold"
          >
            {t('details')}
          </Button>
        </DialogTrigger>
        <DialogContent
          className="w-full max-w-lg p-6 text-center text-primary"
          aria-describedby={undefined}
        >
          <p className="font-semibold">{t('details_not_available')}</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="history" size="icon-history" className="font-semibold">
          {t('details')}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-full max-w-lg text-primary"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {t('ticket')} {ticket.id}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow className="h-14 bg-betSlip">
                <TableHead className="text-center text-lg text-primary">
                  {t('date_hour')} - {new Date(ticket.date).toLocaleString()}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={1} className="p-4">
                  <Table className="border border-border">
                    <TableHeader>
                      <TableRow className="h-14">
                        <TableHead className="text-left text-base text-primary">
                          {t('football')}
                          <span className="block text-sm">
                            INT -{' '}
                            <span className="text-xs">ID {ticket.id}</span>
                          </span>
                        </TableHead>
                        <TableHead />
                        <TableHead className="pr-5 text-right text-2xl text-primary">
                          {new Date(ticket.date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="h-10 border border-border">
                      <TableRow>
                        <TableCell className="text-left">
                          {ticket.status}
                        </TableCell>
                        <TableCell className="text-center">
                          {currencySymbol} {ticket.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {ticket.winning.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
