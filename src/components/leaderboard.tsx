'use client'

import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
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
import { t } from 'i18next'

export default function Leaderboard() {
  const { teamRankings } = useContext(RootContext)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("ranking")}</CardTitle>
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
                <TableHead className="text-right">{t("last")} 8</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamRankings.map((ranking) => (
                <TableRow key={ranking.team}>
                  <TableCell className="font-medium">
                    {ranking.position}
                  </TableCell>
                  <TableCell className="text-left font-bold">
                    {ranking.team}
                  </TableCell>
                  <TableCell>{ranking.played}</TableCell>
                  <TableCell>{ranking.wins}</TableCell>
                  <TableCell>{ranking.draws}</TableCell>
                  <TableCell>{ranking.losses}</TableCell>
                  <TableCell>{ranking.points}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1">
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
