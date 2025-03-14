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
import MatchStatistics from '@/components/match-statistics'
import UpcomingRoundCard from '@/components/upcoming-round-card'
import VideoStreamCard from '@/components/video-stream-card'
import { RootContext } from '@/contexts/root-context'
import { Market } from '@/lib/types'
import { useContext, useState } from 'react'

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

  return (
    <>
      <div className="container grid grid-cols-1 justify-center gap-3 pb-10 pt-4 lg:grid-cols-4 lg:pb-4">
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard streamUrl={liveRound?.streamUrl} />
          </div>
          <MatchEndBadge />
          {upcomingRounds ? (
            matchBetOptions ? (
              <MatchBettingOptions
                round={matchBetOptions.round}
                teams={matchBetOptions.teams}
                markets={matchBetOptions.markets}
                close={() => setMatchBetOptions(undefined)}
              />
            ) : (
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
            )
          ) : (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
        <div className="space-y-3 lg:col-span-1">
          <LiveRoundScores />
          <LiveRoundStatistics />
          <MatchStatistics />
          <MatchResult />
          <div className="hidden lg:block">
            <Leaderboard />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="hidden lg:block">
            <BettingSlip />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 flex w-full justify-center gap-2 lg:hidden">
        <LeaderboardSheet />
        <BettingSlipSheet />
      </div>
    </>
  )
}
