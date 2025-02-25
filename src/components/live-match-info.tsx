import { useContext } from 'react'
import { RootContext } from '@/contexts/root-context'

export default function LiveMatchInfo() {
  const { liveRound } = useContext(RootContext)

  if (!liveRound) return null

  const startTime = new Date(liveRound.startingAt)
  const formattedTime = startTime.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center gap-2 p-2">
      <img
        src="/calcio/ball.svg"
        alt="Football"
        className="h-8 w-8 invert filter"
      />
      <span>Football</span>
      <span className='ml-auto'>{formattedTime}</span>
    </div>
  )
}
