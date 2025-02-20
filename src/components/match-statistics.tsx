import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useContext } from 'react'
import { RootContext } from '@/contexts/root-context'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

export default function MatchStatistics() {
  const { roundStatistics } = useContext(RootContext)

  if (!roundStatistics || roundStatistics.length === 0) {
    return (
      <Card className="min-h-[250px] w-full min-w-[300px] max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-extrabold">STATISTICS</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No statistics available</p>
        </CardContent>
      </Card>
    )
  }

  const match = roundStatistics[0].matches[0]
  const [home, draw, away] = match.probabilities
  const [team1, team2] = match.teams.split(' - ')

  return (
    <Card className="min-h-[250px] w-full min-w-[300px] max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-extrabold">STATISTICS</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex flex-col items-center">
            <div className="mb-1 h-5 w-5 rounded-full bg-orange-600"></div>
            <span className="text-lg font-semibold">{team1}</span>
          </div>

          <span className="mx-3 text-xl font-semibold">{home}%</span>

          <div className="relative w-[30vw] max-w-[120px]">
            <CircularProgressbar
              value={draw}
              text={`${draw}%`}
              strokeWidth={10}
              styles={buildStyles({
                textSize: '10px',
                pathColor: 'red',
                textColor: 'white',
                trailColor: 'gray',
                strokeLinecap: 'butt',
              })}
            />
            <span className="absolute bottom-12 left-1/2 -translate-x-1/2 transform text-[3vw] font-semibold sm:text-base">
              {draw}%
            </span>
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 transform text-sm">
              Draw
            </p>
          </div>

          <span className="mx-3 text-xl font-semibold">{away}%</span>

          <div className="flex flex-col items-center">
            <div className="mb-1 h-5 w-5 rounded-full bg-green-600"></div>
            <span className="text-lg font-semibold">{team2}</span>
          </div>
        </div>

        <p className="text-sm">Last 4 matches</p>
        <div className="grid grid-cols-2 gap-x-16 font-semibold">
          {['1-1', '1-1', '1-1', '1-1'].map((match, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="h-3 w-5 bg-orange-600"></div>
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center"
              >
                {match}
              </div>
              <div className="h-3 w-4 bg-green-600"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
