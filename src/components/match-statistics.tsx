import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function MatchStatistics() {
  const { roundStatistics } = useContext(RootContext)
  const { t } = useTranslation()

  if (!roundStatistics || roundStatistics.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="font-extrabold">
            {t('statistics').toUpperCase()}
          </CardTitle>
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

  const radius = 40
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius

  const homeStroke = (home / 100) * circumference
  const awayStroke = (away / 100) * circumference

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="font-extrabold">
          {t('statistics').toUpperCase()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2 bg-card-header">
        <div className="flex w-full items-center justify-between px-4">
          <div className="flex flex-col items-center">
            <div className="mb-1 h-5 w-5 rounded-full bg-[#ffffff]"></div>
            <span className="text-lg font-semibold">{team1}</span>
          </div>

          <span className="mx-3 text-xl font-semibold">{home}%</span>

          <div className="relative w-[30vw] max-w-[120px]">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#d9d9d9"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e2001a"
                strokeWidth={strokeWidth}
                strokeDasharray={`${awayStroke} ${circumference}`}
                strokeDashoffset={circumference - homeStroke}
                transform="rotate(90 50 50)"
                strokeLinecap="round"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#ffffff"
                strokeWidth={strokeWidth}
                strokeDasharray={`${homeStroke} ${circumference}`}
                strokeDashoffset={circumference - homeStroke}
                transform="rotate(310 50 50)"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1">
              <span className="text-[3vw] font-semibold sm:text-base">
                {draw}%
              </span>
              <p className="text-sm">Draw</p>
            </div>
          </div>

          <span className="mx-3 text-xl font-semibold">{away}%</span>

          <div className="flex flex-col items-center">
            <div className="mb-1 h-5 w-5 rounded-full bg-[#e2001a]"></div>
            <span className="text-lg font-semibold">{team2}</span>
          </div>
        </div>

        <p className="text-sm">Last 4 matches</p>
        <div className="grid grid-cols-2 gap-x-16 font-semibold">
          {['1-1', '1-1', '1-1', '1-1'].map((match, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="h-3 w-5 bg-[#ffffff]"></div>
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center"
              >
                {match}
              </div>
              <div className="h-3 w-4 bg-[#e2001a]"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
