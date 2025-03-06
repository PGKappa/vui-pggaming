import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@radix-ui/react-scroll-area'
import { BetsHistory } from '@/lib/types'

export default function TicketDetailsDialog({
  ticket,
}: {
  ticket: BetsHistory
}) {
  if (!ticket || !ticket.id) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="history"
            size="icon-history"
            className="font-semibold"
          >
            Dettagli
          </Button>
        </DialogTrigger>
        <DialogContent
          className="w-full max-w-lg p-6 text-center text-primary"
          aria-describedby={undefined}
        >
          <p className="font-semibold">Errore! Dettagli non disponibili</p>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="history" size="icon-history" className="font-semibold">
          Dettagli
        </Button>
      </DialogTrigger>

      <DialogContent
        className="w-full max-w-lg bg-foreground text-primary"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            Ticket {ticket.id}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea>
          <Table>
            <TableHeader>
              <TableRow className="h-14 bg-betSlip">
                <TableHead className="text-center text-lg text-primary">
                  Data e Ora - {new Date(ticket.date).toLocaleString()}
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
                          Football
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
                          € {ticket.amount.toFixed(2)}
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
