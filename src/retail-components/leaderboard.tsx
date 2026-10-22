'use client'

import type { StandingsState } from '@/retail-lib/soccer-standings'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Card, CardHeader, CardTitle } from './ui/card'
import CustomScrollbar from './custom-scrollbar'

interface LeaderboardProps {
  isExpanded: boolean
  onToggle: (expanded: boolean) => void
  // Stato fornito dalla pagina, che resta in ascolto del hub anche quando
  // la classifica non è montata (nessuna giornata selezionata).
  standings: StandingsState
}

export default function Leaderboard({
  isExpanded,
  onToggle,
  standings,
}: LeaderboardProps) {
  const { t } = useTranslation()
  const displayRankings = standings.rankings
  const leaderboardScrollRef = useRef<HTMLDivElement>(null)

  const updatedAt = standings.updatedAt
    ? new Date(standings.updatedAt).toLocaleTimeString('it-IT', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  const handleToggle = () => {
    const newExpandedState = !isExpanded
    onToggle(newExpandedState)

    // Quando si apre la Leaderboard, scrolla la pagina principale della metà
    if (newExpandedState) {
      setTimeout(() => {
        // Trova il contenitore di scroll principale (pageScrollRef)
        const pageScroll = document.querySelector(
          '[class*="overflow-y-scroll"][class*="no-scrollbar"]',
        ) as HTMLDivElement

        if (pageScroll) {
          // Scrolla della metà dell'altezza della Leaderboard (400px = metà di 800px)
          const currentScroll = pageScroll.scrollTop
          pageScroll.scrollTo({
            top: currentScroll + 400,
            behavior: 'smooth',
          })
        }
      }, 50)
    }
  }

  return (
    <div className="relative">
      <div className={`${isExpanded ? 'sticky top-0 z-30' : ''} bg-background`}>
        <Card>
          <CardHeader
            className="flex h-[41px] cursor-pointer flex-row items-center px-5"
            onClick={handleToggle}
          >
            <CardTitle className="realtive bottom-[1px] justify-start text-[16px] font-bold">
              {t('standings').toUpperCase()}
            </CardTitle>
            {updatedAt && (
              <span className="ml-4 text-[12px] opacity-70">
                {t('standings_updated', 'aggiornata alle')} {updatedAt}
                {standings.round ? ` · ${t('round')} ${standings.round}` : ''}
              </span>
            )}
            <Button variant="ghost" size="icon-lg">
              {isExpanded ? (
                <ChevronDown style={{ zoom: 1.2, marginLeft: '27px' }} />
              ) : (
                <ChevronUp style={{ zoom: 1.2, marginLeft: '27px' }} />
              )}
            </Button>
          </CardHeader>
        </Card>
      </div>

      {isExpanded && (
        <div className="relative h-[800px] overflow-hidden bg-background">
          <div className="h-full overflow-hidden">
            <div
              ref={leaderboardScrollRef}
              className="no-scrollbar h-full overflow-y-scroll"
            >
              <div className="sticky top-0 z-30 bg-card-header">
                <div className="grid h-[51px] grid-cols-11 text-[16px] [&_div]:flex [&_div]:items-center [&_div]:justify-center [&_div]:font-bold [&_div]:text-card-header-foreground">
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

              {displayRankings.length > 0 ? (
                <div className="pb-20">
                  <table className="w-full">
                    <tbody>
                      {displayRankings.map((ranking) => (
                        <tr
                          key={ranking.team}
                          className="grid h-[51px] grid-cols-11 border-b border-border md:grid-cols-11"
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
                          <td className="p-3 text-center">
                            {ranking.goalsFor}
                          </td>
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
                                  {t(`form_${result}`, result)}
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
                <div className="flex flex-col items-center gap-2 p-10 text-center text-[15px]">
                  <span className="font-semibold">
                    {t(
                      'standings_waiting',
                      'Classifica in attesa della prossima giornata conclusa',
                    )}
                  </span>
                  {standings.note && (
                    <span className="opacity-70">{standings.note}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scrollbar custom per Leaderboard */}
          <div className="pointer-events-none absolute right-0 top-0 h-full">
            <CustomScrollbar contentRef={leaderboardScrollRef} />
          </div>
        </div>
      )}
    </div>
  )
}
