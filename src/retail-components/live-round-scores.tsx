'use client'
import { RootContext } from '@/retail-contexts/root-context'
import { t } from 'i18next'
import { useContext } from 'react'
import LoadingSpinner from './loading-spinner'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Table, TableBody, TableCell, TableRow } from './ui/table'

export default function LiveRoundScores() {
  const { liveRound } = useContext(RootContext)

  if (!liveRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('live_round_loading')}...</CardTitle>
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
          {liveRound.name} {t('round')} {liveRound.number}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
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
