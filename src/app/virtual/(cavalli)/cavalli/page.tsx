'use client'
import BettingSlip from '@/components/betting-slip'
import BettingSlipSheet from '@/components/betting-slip-sheet'
import Leaderboard from '@/components/leaderboard'
import LeaderboardSheet from '@/components/leaderboard-sheet'
import LiveMatchInfo from '@/components/live-match-info'
import LiveRoundScores from '@/components/live-round-scores'
import LiveRoundStatistics from '@/components/live-round-statistics'
import LoadingSpinner from '@/components/loading-spinner'
import MatchBettingOptions from '@/components/match-betting-options'
import MatchEndBadge from '@/components/match-end-badge'
import MatchResult from '@/components/match-result'
import MatchStatisticsCard from '@/components/match-statistics-card'
import UpcomingRoundCard from '@/components/upcoming-round-card'
import VideoStreamCard from '@/components/video-stream-card'
import { RootContext } from '@/contexts/root-context'
import { Market, MatchStatistics } from '@/lib/types'
import { useContext, useMemo, useState } from 'react'

export default function Home() {
  const { upcomingRounds, liveRound } = useContext(RootContext)
  const [matchBetOptions, setMatchBetOptions] = useState<{
    round: {
      name: string
      number: number
      startingAt: Date
    }
    teams: string
    markets: Market[]
  }>()

  const [selectedMatch, setSelectedMatch] = useState<MatchStatistics>()
  const highlightedTeams = useMemo(() => {
    return selectedMatch ? selectedMatch.teams.split(' - ') : []
  }, [selectedMatch])

  return (
    <>
      <div className="container mb-10 mt-1 grid grid-cols-1 justify-center gap-3 bg-columnL-background text-columnL-foreground lg:mb-4 lg:grid-cols-4">
        {/* First column - top content */}
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard streamUrl={liveRound?.streamUrl} />
          </div>
          <MatchEndBadge />
          {matchBetOptions && (
            <MatchBettingOptions
              round={matchBetOptions.round}
              teams={matchBetOptions.teams}
              markets={matchBetOptions.markets}
              close={() => setMatchBetOptions(undefined)}
            />
          )}
          {!upcomingRounds && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {/* Upcoming rounds - visible on desktop */}
          <div className="hidden w-full lg:block">
            {upcomingRounds && !matchBetOptions && (
              <ol className="w-full space-y-7">
                {upcomingRounds.map((round) => (
                  <li key={round.scheduleId}>
                    <UpcomingRoundCard
                      round={round}
                      viewMatchBettingOptions={setMatchBetOptions}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Second column content - appears after first column but before upcoming rounds on mobile */}
        <div className="space-y-3 lg:col-span-1">
          {/* <LiveRoundScores />
          {selectedMatch ? (
            <MatchStatisticsCard
              match={selectedMatch}
              onBack={() => setSelectedMatch(undefined)}
            />
          ) : (
            <LiveRoundStatistics onMatchSelect={setSelectedMatch} />
          )}
          <MatchResult />
          <div className="hidden lg:block">
            <Leaderboard highlightedTeams={highlightedTeams} />
          </div> */}
        </div>

        {/* Upcoming rounds - visible only on mobile, appears at the bottom */}
        <div className="block lg:hidden">
          {upcomingRounds && !matchBetOptions && (
            <ol className="w-full space-y-7">
              {upcomingRounds.map((round) => (
                <li key={round.scheduleId}>
                  <UpcomingRoundCard
                    round={round}
                    viewMatchBettingOptions={setMatchBetOptions}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Betting slip - rightmost column */}
        <div className="bg-background text-foreground lg:col-span-1">
          <div className="hidden lg:block">
            <BettingSlip />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 flex w-full justify-center gap-2 lg:hidden">
        <LeaderboardSheet highlightedTeams={highlightedTeams} />
        <BettingSlipSheet />
      </div>
    </>
  )
}
