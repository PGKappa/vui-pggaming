'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
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
}: {
  highlightedTeams: string[]
}) {
  const { teamRankings } = useContext(RootContext)
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('ranking')}</CardTitle>
      </CardHeader>
      <CardContent>
        {teamRankings ? (
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
              {teamRankings.map((ranking) => (
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
                            {result}
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
          <div className="flex flex-col items-center">
            <LoadingSpinner />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
