'use client'
import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import LoadingSpinner from './loading-spinner'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from './ui/table'
import { Badge } from './ui/badge'
import { t } from 'i18next'

export default function LiveRoundScores() {
  const { liveRound } = useContext(RootContext)

  if (!liveRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("live_round_loading")}...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="h-5">
          {liveRound.name} {t("round")} {liveRound.number}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader />
          {/* <TableHeader>
            <TableRow>
              <TableHead className="text-center">Stato</TableHead>
              <TableHead className="text-center">Partita</TableHead>
              <TableHead className="text-center">Punteggio</TableHead>
            </TableRow>
          </TableHeader> */}
          <TableBody className="border-b border-t border-card-foreground">
            {liveRound.scores.map((score, index) => (
              <TableRow
                key={index}
                className="border-b border-t border-card-foreground"
              >
                <TableCell className="flex flex-row items-center gap-2">
                  <Badge>LIVE</Badge>
                  <span className="text-nowrap font-bold">
                    {score.team1} - {score.team2}
                  </span>
                </TableCell>
                <TableCell className="text-left font-bold">
                  {score.score1} - {score.score2}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
