'use client'

import BettingSlip from '@/components/betting-slip'
import Leaderboard from '@/components/leaderboard'
import LiveRoundScores from '@/components/live-round-scores'
import LiveRoundStatistics from '@/components/live-round-statistics'
import LoadingSpinner from '@/components/loading-spinner'
import UpcomingRoundCard from '@/components/upcoming-round-card'
import VideoStreamCard from '@/components/video-stream-card'
import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'

export default function Home() {
  const { upcomingRounds, liveRound } = useContext(RootContext)

  return (
    <div className="grid grid-cols-12 justify-center gap-2 border border-black px-10 py-4">
      <div className="col-span-6 space-y-3 border border-black p-2">
        <VideoStreamCard streamUrl={liveRound?.streamUrl} />
        {upcomingRounds ? (
          <ol className="space-y-2">
            {upcomingRounds.map((round) => (
              <li key={round.number}>
                <UpcomingRoundCard round={round} />
              </li>
            ))}
          </ol>
        ) : (
          <LoadingSpinner />
        )}
      </div>
      <div className="col-span-3 space-y-3 border border-black p-2">
        {/* <LiveRoundScores /> */}
        <LiveRoundStatistics />
        <Leaderboard />
      </div>
      <div className="col-span-3 border border-black p-2">
        <BettingSlip />
      </div>
    </div>
  )
}
