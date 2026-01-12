'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle } from './ui/card'

interface LeaderboardProps {
  isExpanded: boolean
  onToggle: (expanded: boolean) => void
}

export default function Leaderboard({
  isExpanded,
  onToggle,
}: LeaderboardProps) {
  const { t } = useTranslation()
  const { teamRankings } = useContext(RootContext)

  const handleToggle = () => {
    onToggle(!isExpanded)
  }

  return (
    <div className="relative pb-20">
      <div className={`${isExpanded ? 'sticky top-0 z-30' : ''} bg-background`}>
        <Card>
          <CardHeader
            className="flex h-12 cursor-pointer flex-row items-center px-5"
            onClick={handleToggle}
          >
            <CardTitle className="justify-start text-[16px] font-semibold">
              {t('standings').toUpperCase()}
            </CardTitle>
            <Button variant="ghost" size="icon-lg">
              {isExpanded ? (
                <ChevronDown style={{ scale: 1.7, marginLeft: '27px' }} />
              ) : (
                <ChevronUp style={{ scale: 1.7, marginLeft: '27px' }} />
              )}
            </Button>
          </CardHeader>
        </Card>
      </div>

      {isExpanded && (
        <div className="bg-background relative bottom-[16px]">
          <div className="sticky top-[48px] z-30 bg-card-header">
            <div className="grid h-[51px] grid-cols-11 pt-[16px] [&_div]:flex [&_div]:items-center [&_div]:justify-center [&_div]:font-bold [&_div]:text-card-header-foreground text-[16px]">
              <div className="p-2 text-center"></div>
              <div className="p-2 text-center">{t('club')}</div>
              <div className="p-2 text-center">{t('p')}</div>
              <div className="p-2 text-center">{t('w')}</div>
              <div className="p-2 text-center">{t('d')}</div>
              <div className="p-2 text-center">{t('l')}</div>
              <div className="p-2 text-center">{t('pts')}</div>
              <div className="p-2 text-center">{t('gf')}</div>
              <div className="p-2 text-center">{t('ga')}</div>
              <div className="p-2 text-center">{t('gd')}</div>
              <div className="p-2 text-center">{t('last_8')}</div>
            </div>
          </div>

          {teamRankings ? (
            <div className="min-h-[800px] overflow-y-auto">
              <table className="w-full">
                <tbody>
                  {teamRankings.map((ranking) => (
                    <tr
                      key={ranking.team}
                      className="grid grid-cols-11 border-b border-border md:grid-cols-11 h-[51px]"
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
                      <td className="p-3 text-center">
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
                              className={`inline-block font-mono text-lg font-semibold ${textColor}`}
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
        </div>
      )}
    </div>
  )
}
