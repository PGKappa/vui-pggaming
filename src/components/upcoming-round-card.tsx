import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UpcomingRound } from '@/lib/types'
import { format, isToday, isTomorrow } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { PlusIcon } from 'lucide-react'

export default function UpcomingRoundCard(props: { round: UpcomingRound }) {
  return (
    <Card className="shadow-d border">
      <CardHeader className="mx-6 flex items-center justify-between pb-0 pt-4">
        <CardTitle className="flex w-full items-center justify-between">
          <span>
            {props.round.name} Round {props.round.number}
          </span>
          <span>30:00</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b">
              <TableHead></TableHead>
              <TableHead></TableHead>
              <TableHead className="text-center">1</TableHead>
              <TableHead className="text-center">X</TableHead>
              <TableHead className="text-center">2</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.round.matches.map((match, index) => {
              const roundStart = new Date(props.round.startingAt)
              const matchStart = new Date(roundStart.getTime())
              let dayLabel = format(matchStart, 'EEE', {
                locale: enUS,
              }).toUpperCase()
              if (isToday(matchStart)) {
                dayLabel = 'TODAY'
              } else if (isTomorrow(matchStart)) {
                dayLabel = 'TOMORROW'
              }

              const formattedDate = format(matchStart, 'HH:mm')
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Badge className="flex flex-col">
                      <span>{dayLabel}</span>
                      <span>{formattedDate}</span>
                    </Badge>
                  </TableCell>

                  <TableCell className="text-left">{match.teams}</TableCell>

                  {match.odds.map((odd, i) => (
                    <TableCell key={i} className="text-center">
                      <Button>{odd}</Button>
                    </TableCell>
                  ))}

                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon">
                      <PlusIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
