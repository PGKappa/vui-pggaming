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
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between px-6">
        <CardTitle>
          <span>
            {props.round.name} Round {props.round.number}
          </span>
        </CardTitle>
        <span>30:00</span>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-card-header">
            <TableRow className="hover:bg-card-header border-card-foreground transition-none *:text-card-foreground">
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
                <TableRow key={index} className="border-card-foreground">
                  <TableCell className="flex flex-row items-center gap-2">
                    <Badge variant="secondary" className="flex w-fit flex-col">
                      <span>{dayLabel}</span>
                      <span>{formattedDate}</span>
                    </Badge>
                    <span className="font-bold">{match.teams}</span>
                  </TableCell>

                  {match.odds.map((odd, i) => (
                    <TableCell key={i} className="text-center">
                      <Button size="lg">{odd}</Button>
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
