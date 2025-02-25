'use client'
import { RootContext } from '@/contexts/root-context'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useContext } from 'react'
import LoadingSpinner from './loading-spinner'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export default function LiveRoundStatistics() {
  const { roundStatistics } = useContext(RootContext)

  if (!roundStatistics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Round Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader>
        <CardTitle>
          {roundStatistics[0].name} Round {roundStatistics[0].number}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader className="bg-card-header">
            <TableRow className="hover:bg-card-header border-card-foreground transition-none *:text-card-foreground">
              <TableHead></TableHead>
              <TableHead className="text-center">1</TableHead>
              <TableHead className="text-center">X</TableHead>
              <TableHead className="text-center">2</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {roundStatistics[0].matches.map((match, index) => {
              const formattedTime = format(match.startTime, 'HH:mm', {
                locale: enUS,
              })
              return (
                <TableRow key={index} className="border-card-foreground">
                  <TableCell className="flex flex-row items-center gap-2">
                    <Badge>{formattedTime}</Badge>
                    <span className="text-nowrap font-bold">{match.teams}</span>
                  </TableCell>
                  {match.probabilities.map((probability, index) => (
                    <TableCell key={index} className="text-center">
                      {probability}%
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
