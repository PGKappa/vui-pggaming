'use client'
import BettingSlip from '@/components/betting-slip'
import BettingSlipSheet from '@/components/betting-slip-sheet'
import Leaderboard from '@/components/leaderboard'
import LeaderboardSheet from '@/components/leaderboard-sheet'
import LiveRoundScores from '@/components/live-round-scores'
import LiveRoundStatistics from '@/components/live-round-statistics'
import MatchStatistics from '@/components/match-statistics'
import LoadingSpinner from '@/components/loading-spinner'
import UpcomingRoundCard from '@/components/upcoming-round-card'
import VideoStreamCard from '@/components/video-stream-card'
import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
import LiveMatchInfo from '@/components/live-match-info'
import MatchEndBadge from '@/components/match-end-badge'

export default function Home() {
  const { upcomingRounds, liveRound } = useContext(RootContext)
  return (
    <>
      <div className="container grid grid-cols-1 justify-center gap-3 py-4 lg:grid-cols-4">
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard streamUrl={liveRound?.streamUrl} />
          </div>
          <MatchEndBadge />
          {upcomingRounds ? (
            <ol className="w-full space-y-7">
              {upcomingRounds.map((round) => (
                <li key={round.number}>
                  <UpcomingRoundCard round={round} />
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}
        </div>
        <div className="space-y-3 lg:col-span-1">
          {/* <LiveRoundScores /> */}
          {/* <LiveRoundStatistics /> */}
          <MatchStatistics />
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
