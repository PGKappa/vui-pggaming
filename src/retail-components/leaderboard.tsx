'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useState } from 'react'
import { Button } from './ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function Leaderboard() {
  const { t } = useTranslation()
  const { teamRankings } = useContext(RootContext)
  const [open, setOpen] = useState(true)

  return (
    <Card>
      <CardHeader className="flex h-16 flex-row items-center px-5">
        <CardTitle className="justify-start text-[19px] font-bold">
          {t('standings')}
        </CardTitle>
        <Button variant="ghost" size="icon-lg" onClick={() => setOpen(!open)}>
          {open ? (
            <ChevronUp style={{ scale: 2 }} />
          ) : (
            <ChevronDown style={{ scale: 2 }} />
          )}
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="border-t border-secondary-foreground">
          {teamRankings ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-card-header ">
                  <tr className="grid grid-cols-11 md:grid-cols-11 [&_th]:text-card-header-foreground h-[44px]">
                    <th className="p-3 text-center"></th>
                    <th className="p-2 text-center">{t('club')}</th>
                    <th className="p-2 text-center">{t('p')}</th>
                    <th className="p-2 text-center">{t('w')}</th>
                    <th className="p-2 text-center">{t('d')}</th>
                    <th className="p-2 text-center">{t('l')}</th>
                    <th className="p-2 text-center">{t('pts')}</th>
                    <th className="p-2 text-center">{t('gf')}</th>
                    <th className="p-2 text-center">{t('ga')}</th>
                    <th className="p-2 text-center">GD</th>
                    <th className="p-2 text-center">{t('last_8')}</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRankings.map((ranking) => (
                    <tr
                      key={ranking.team}
                      className="grid grid-cols-11 border-b border-border hover:bg-muted/50 md:grid-cols-11"
                    >
                      <td className="p-3 text-center font-bold">
                        {ranking.position}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {ranking.team}
                      </td>
                      <td className="p-3 text-center">{ranking.played}</td>
                      <td className="p-3 text-center">{ranking.wins}</td>
                      <td className="p-3 text-center">{ranking.draws}</td>
                      <td className="p-3 text-center">{ranking.losses}</td>
                      <td className="p-3 text-center font-bold">
                        {ranking.points}
                      </td>
                      <td className="p-3 text-center">{ranking.goalsFor}</td>
                      <td className="p-3 text-center">
                        {ranking.goalsAgainst}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {ranking.goalDifference}
                      </td>
                      

                      <td className="flex justify-center gap-1 p-3">
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
                              className={`inline-block font-mono text-sm font-semibold ${textColor}`}
                            >
                              {result}
                            </span>
                          )
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <LoadingSpinner />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
