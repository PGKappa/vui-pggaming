import { RootContext } from '@/retail-contexts/root-context'
import { useContext } from 'react'

export default function MatchResult() {
  const { matchResult } = useContext(RootContext)

  if (!matchResult || matchResult.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center">
          <h4 className="font-extrabold">RESULTS</h4>
        </div>
        <div className="py-4 text-center">
          <p>No match results</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-center">
        <h4 className="text-xl font-extrabold text-secondary">RESULT</h4>
      </div>

      {matchResult.map((match, index) => {
        const [team1, team2] = match.teams.split(' - ')

        return (
          <div
            key={index}
            className="flex w-full items-center justify-around py-16"
          >
            <div className="flex flex-row gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-chart-3"></div>
                <span className="text-lg font-semibold">{team1}</span>
              </div>
              <span className="text-5xl font-semibold">{match.score1}</span>
            </div>

            <div className="flex flex-row gap-4">
              <span className="text-5xl font-semibold">{match.score2}</span>
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-chart-2"></div>
                <span className="text-lg font-semibold">{team2}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
