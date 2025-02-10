'use client'

import BettingSlip from '@/components/betting-slip'
import RoundLiveScores from '@/components/round-live-scores'
import VideoStreamCard from '@/components/video-stream-card'

export default function Home() {
  return (
    <div className="grid grid-cols-12 justify-center gap-2 border border-black px-10 py-4">
      <div className="col-span-6 border border-black p-2">
        <VideoStreamCard />
      </div>
      <div className="col-span-3 border border-black p-2">
        <RoundLiveScores />
      </div>
      <div className="col-span-3 border border-black p-2">
        <BettingSlip />
      </div>
    </div>
  )
}
