'use client'

import type { StandingsState } from '@/retail-lib/soccer-standings'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export default function Leaderboard({
  highlightedTeams = [],
  standings,
}: {
  highlightedTeams: string[]
  standings: StandingsState
}) {
  const { t } = useTranslation()
  const rankings = standings.rankings

  const updatedAt = standings.updatedAt
    ? new Date(standings.updatedAt).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : undefined

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ranking')}</CardTitle>
        {updatedAt && (
          <p className="text-xs opacity-70">
            {t('standings_updated', 'aggiornata alle')} {updatedAt}
            {standings.round ? ` · ${t('round')} ${standings.round}` : ''}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {rankings.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]"></TableHead>
                <TableHead></TableHead>
                <TableHead>{t('P')}</TableHead>
                <TableHead>{t('W')}</TableHead>
                <TableHead>{t('D')}</TableHead>
                <TableHead>{t('L')}</TableHead>
                <TableHead>{t('pts')}</TableHead>
                <TableHead className="text-right">{t('last')} 8</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankings.map((ranking) => (
                <TableRow key={ranking.team}>
                  <TableCell
                    className={`font-medium ${highlightedTeams.includes(ranking.team) ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    {ranking.position}
                  </TableCell>
                  <TableCell
                    className={`text-left ${highlightedTeams.includes(ranking.team) ? 'bg-accent text-accent-foreground' : ''}`}
                  >
                    {ranking.team}
                  </TableCell>
                  <TableCell>{ranking.played}</TableCell>
                  <TableCell>{ranking.wins}</TableCell>
                  <TableCell>{ranking.draws}</TableCell>
                  <TableCell>{ranking.losses}</TableCell>
                  <TableCell>{ranking.points}</TableCell>
                  <TableCell>
                    <div className="flex flex-row justify-end gap-1">
                      {ranking.last8.map((result, i) => {
                        const textColor =
                          result === 'W'
                            ? 'text-green-500'
                            : result === 'L'
                              ? 'text-red-500'
                              : 'text-yellow-500'
                        return (
                          <span
                            key={i}
                            className={`inline-block font-mono text-sm font-medium ${textColor}`}
                          >
                            {t(`form_${result}`, result)}
                          </span>
                        )
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          // Niente classifica finta: finche' non arriva quella vera si dice
          // com'e'. Si popola a ogni fine giornata.
          <p className="py-4 text-center text-sm opacity-70">
            {t(
              'standings_waiting',
              'La classifica arriva dal feed a ogni fine giornata.',
            )}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
