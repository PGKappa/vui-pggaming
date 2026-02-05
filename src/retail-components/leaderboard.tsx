'use client'

import { RootContext } from '@/retail-contexts/root-context'
import { TeamRanking } from '@/retail-lib/types'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import LoadingSpinner from './loading-spinner'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle } from './ui/card'

interface LeaderboardProps {
  isExpanded: boolean
  onToggle: (expanded: boolean) => void
}

// Default mock data per leaderboard - questa è fixture per testing
const DEFAULT_TEAM_RANKINGS: TeamRanking[] = [
  {
    position: 1,
    team: 'LEE',
    played: 17,
    wins: 14,
    draws: 2,
    losses: 1,
    points: 44,
    goalsFor: 42,
    goalsAgainst: 12,
    goalDifference: 30,
    last8: ['W', 'W', 'W', 'W', 'W', 'W', 'D', 'W'],
  },
  {
    position: 2,
    team: 'BUR',
    played: 17,
    wins: 11,
    draws: 4,
    losses: 2,
    points: 37,
    goalsFor: 35,
    goalsAgainst: 18,
    goalDifference: 17,
    last8: ['W', 'W', 'D', 'W', 'W', 'W', 'D', 'W'],
  },
  {
    position: 3,
    team: 'WAT',
    played: 17,
    wins: 11,
    draws: 1,
    losses: 5,
    points: 34,
    goalsFor: 32,
    goalsAgainst: 21,
    goalDifference: 11,
    last8: ['W', 'L', 'W', 'W', 'L', 'W', 'W', 'W'],
  },
  {
    position: 4,
    team: 'NOR',
    played: 17,
    wins: 10,
    draws: 3,
    losses: 4,
    points: 33,
    goalsFor: 28,
    goalsAgainst: 19,
    goalDifference: 9,
    last8: ['W', 'D', 'W', 'L', 'W', 'W', 'D', 'W'],
  },
  {
    position: 5,
    team: 'BRE',
    played: 17,
    wins: 9,
    draws: 4,
    losses: 4,
    points: 31,
    goalsFor: 26,
    goalsAgainst: 20,
    goalDifference: 6,
    last8: ['W', 'D', 'L', 'W', 'D', 'W', 'W', 'D'],
  },
  {
    position: 6,
    team: 'WOL',
    played: 17,
    wins: 8,
    draws: 6,
    losses: 3,
    points: 30,
    goalsFor: 24,
    goalsAgainst: 17,
    goalDifference: 7,
    last8: ['D', 'W', 'D', 'W', 'D', 'D', 'W', 'W'],
  },
  {
    position: 7,
    team: 'MCI',
    played: 17,
    wins: 8,
    draws: 5,
    losses: 4,
    points: 29,
    goalsFor: 31,
    goalsAgainst: 22,
    goalDifference: 9,
    last8: ['W', 'D', 'L', 'W', 'D', 'W', 'D', 'W'],
  },
  {
    position: 8,
    team: 'MUN',
    played: 17,
    wins: 8,
    draws: 4,
    losses: 5,
    points: 28,
    goalsFor: 23,
    goalsAgainst: 24,
    goalDifference: -1,
    last8: ['L', 'W', 'W', 'D', 'L', 'W', 'W', 'D'],
  },
  {
    position: 9,
    team: 'LIV',
    played: 17,
    wins: 7,
    draws: 6,
    losses: 4,
    points: 27,
    goalsFor: 25,
    goalsAgainst: 22,
    goalDifference: 3,
    last8: ['D', 'W', 'D', 'L', 'D', 'W', 'D', 'W'],
  },
  {
    position: 10,
    team: 'CHE',
    played: 17,
    wins: 7,
    draws: 5,
    losses: 5,
    points: 26,
    goalsFor: 22,
    goalsAgainst: 23,
    goalDifference: -1,
    last8: ['W', 'L', 'D', 'W', 'L', 'D', 'W', 'D'],
  },
  {
    position: 11,
    team: 'ARS',
    played: 17,
    wins: 7,
    draws: 4,
    losses: 6,
    points: 25,
    goalsFor: 21,
    goalsAgainst: 25,
    goalDifference: -4,
    last8: ['L', 'W', 'D', 'L', 'W', 'W', 'D', 'L'],
  },
  {
    position: 12,
    team: 'MCU',
    played: 17,
    wins: 6,
    draws: 6,
    losses: 5,
    points: 24,
    goalsFor: 20,
    goalsAgainst: 22,
    goalDifference: -2,
    last8: ['D', 'L', 'W', 'D', 'D', 'W', 'L', 'D'],
  },
  {
    position: 13,
    team: 'CIA',
    played: 17,
    wins: 6,
    draws: 5,
    losses: 6,
    points: 23,
    goalsFor: 19,
    goalsAgainst: 24,
    goalDifference: -5,
    last8: ['L', 'D', 'W', 'L', 'D', 'L', 'W', 'D'],
  },
  {
    position: 14,
    team: 'GBI',
    played: 17,
    wins: 5,
    draws: 7,
    losses: 5,
    points: 22,
    goalsFor: 18,
    goalsAgainst: 23,
    goalDifference: -5,
    last8: ['D', 'D', 'L', 'D', 'W', 'D', 'L', 'D'],
  },
  {
    position: 15,
    team: 'NSC',
    played: 17,
    wins: 5,
    draws: 6,
    losses: 6,
    points: 21,
    goalsFor: 17,
    goalsAgainst: 25,
    goalDifference: -8,
    last8: ['L', 'D', 'W', 'L', 'D', 'L', 'D', 'W'],
  },
  {
    position: 16,
    team: 'FBI',
    played: 17,
    wins: 4,
    draws: 8,
    losses: 5,
    points: 20,
    goalsFor: 16,
    goalsAgainst: 24,
    goalDifference: -8,
    last8: ['D', 'L', 'D', 'D', 'L', 'D', 'D', 'D'],
  },
  {
    position: 17,
    team: 'NAP',
    played: 17,
    wins: 4,
    draws: 6,
    losses: 7,
    points: 18,
    goalsFor: 15,
    goalsAgainst: 27,
    goalDifference: -12,
    last8: ['L', 'D', 'L', 'W', 'L', 'D', 'L', 'D'],
  },
  {
    position: 18,
    team: 'LOT',
    played: 17,
    wins: 3,
    draws: 7,
    losses: 7,
    points: 16,
    goalsFor: 14,
    goalsAgainst: 28,
    goalDifference: -14,
    last8: ['L', 'D', 'L', 'D', 'L', 'W', 'D', 'L'],
  },
  {
    position: 19,
    team: 'ARC',
    played: 17,
    wins: 2,
    draws: 6,
    losses: 9,
    points: 12,
    goalsFor: 12,
    goalsAgainst: 32,
    goalDifference: -20,
    last8: ['L', 'L', 'D', 'L', 'L', 'D', 'W', 'L'],
  },
  {
    position: 20,
    team: 'UDO',
    played: 17,
    wins: 1,
    draws: 4,
    losses: 12,
    points: 7,
    goalsFor: 9,
    goalsAgainst: 38,
    goalDifference: -29,
    last8: ['L', 'L', 'L', 'D', 'L', 'L', 'L', 'W'],
  },
]

export default function Leaderboard({
  isExpanded,
  onToggle,
}: LeaderboardProps) {
  const { t } = useTranslation()
  const { teamRankings } = useContext(RootContext)

  // Usa teamRankings da contesto se disponibile, altrimenti fallback a default
  const displayRankings = useMemo(
    () =>
      teamRankings && teamRankings.length > 0
        ? teamRankings
        : DEFAULT_TEAM_RANKINGS,
    [teamRankings],
  )

  const handleToggle = () => {
    onToggle(!isExpanded)
  }

  return (
    <div className={`relative ${isExpanded ? '' : 'mt-[10px]'}`}>
      <div className={`${isExpanded ? 'sticky top-0 z-30' : ''} bg-background`}>
        <Card>
          <CardHeader
            className="flex h-[41px] cursor-pointer flex-row items-center px-5"
            onClick={handleToggle}
          >
            <CardTitle className="justify-start text-[16px] font-bold realtive bottom-[1px]">
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
        <div className="bg-background">
          <div className="sticky top-[41px] z-30 bg-card-header">
            <div className="grid h-[51px] grid-cols-11 [&_div]:flex [&_div]:items-center [&_div]:justify-center [&_div]:font-bold [&_div]:text-card-header-foreground text-[16px]">
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

          {displayRankings && displayRankings.length > 0 ? (
            <div className="pb-20">
              <table className="w-full">
                <tbody>
                  {displayRankings.map((ranking) => (
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