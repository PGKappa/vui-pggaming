'use client'
import { probabilitiesFromOdds } from '@/retail-lib/soccer-stats'
import { RootContext } from '@/virtual-contexts/root-context'
import { Market } from '@/virtual-lib/types'
import { PlusIcon } from 'lucide-react'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

// La partita scelta porta con se' i mercati e gli identificativi: servono al
// riquadro statistiche per le percentuali, la forma e i precedenti.
export type SelectedMatch = {
  teams: string
  markets: Market[]
  startTime: Date
  eventId?: number
  groupId?: number
}

export default function LiveRoundStatistics(props: {
  onMatchSelect: (match: SelectedMatch) => void
}) {
  const { upcomingRounds } = useContext(RootContext)
  const { t, i18n } = useTranslation()

  // Le percentuali sono le quote 1X2 della partita, normalizzate a 100:
  // nessun dato inventato e nessuna chiamata in piu'.
  const round = upcomingRounds?.[0]
  const matches = useMemo(() => {
    return (round?.mag_event ?? []).map((match) => ({
      teams: match.teams.team.map((team) => team.name || '').join(' - '),
      markets: match.markets.market,
      startTime: new Date(match.startTime),
      eventId: match.eventIdentity?.eventId,
      groupId: match.eventIdentity?.groupId,
      probabilities: probabilitiesFromOdds(match.markets.market),
    }))
  }, [round])

  if (!upcomingRounds) {
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

  if (!round || !matches.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('statistics')}</CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center text-sm opacity-70">
          {t('no_matches')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('statistics')} {round.scheduleName} {t('round')}{' '}
          {round.scheduleId}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader className="bg-card-header">
            <TableRow className="*:text-table-foreground border-card-foreground transition-none hover:bg-card-header">
              <TableHead></TableHead>
              <TableHead className="text-center font-bold">1</TableHead>
              <TableHead className="text-center font-bold">X</TableHead>
              <TableHead className="text-center font-bold">2</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="border-b border-t border-card-foreground">
            {matches.map((match, index) => {
              const formattedTime = match.startTime.toLocaleTimeString(
                i18n.language,
                {
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )
              const percentuali = match.probabilities
                ? [
                    match.probabilities.home,
                    match.probabilities.draw,
                    match.probabilities.away,
                  ]
                : undefined
              const select = () =>
                props.onMatchSelect({
                  teams: match.teams,
                  markets: match.markets,
                  startTime: match.startTime,
                  eventId: match.eventId,
                  groupId: match.groupId,
                })

              return (
                <TableRow
                  key={index}
                  className="relative cursor-pointer border-card-foreground hover:bg-muted lg:cursor-default lg:hover:bg-transparent"
                >
                  <TableCell>
                    <div className="flex flex-row items-center gap-2">
                      <Badge>{formattedTime}</Badge>
                      <span className="text-nowrap font-bold">
                        {match.teams}
                      </span>
                    </div>
                  </TableCell>

                  {(percentuali ?? [null, null, null]).map(
                    (probability, colonna) => (
                      <TableCell
                        key={colonna}
                        className="text-center font-bold tabular-nums"
                      >
                        {probability === null ? '–' : `${probability}%`}
                      </TableCell>
                    ),
                  )}

                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hidden text-center lg:flex"
                      onClick={select}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>

                    <div
                      className="absolute inset-0 h-full w-full lg:hidden"
                      onClick={select}
                    />
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
