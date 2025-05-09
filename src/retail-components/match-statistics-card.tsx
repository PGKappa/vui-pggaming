import { MatchStatistics } from '@/retail-lib/types'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function MatchStatisticsCard({
  match,
  onBack,
}: {
  match: MatchStatistics
  onBack: () => void
}) {
  const { t } = useTranslation()

  const [home, draw, away] = match.probabilities
  const [team1, team2] = match.teams.split(' - ')

  const radius = 40
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius

  const homeStroke = (home / 100) * circumference
  const awayStroke = (away / 100) * circumference

  return (
    <Card className="w-full">
      <CardHeader className="relative flex items-center justify-between">
        <CardTitle className="font-extrabold">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="absolute left-0 top-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {t('statistics').toUpperCase()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-2 bg-card-header">
        <div className="flex w-full flex-row items-center justify-around">
          <div className="grid grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-chart-3"></div>
              <span className="text-lg font-semibold">{team1}</span>
            </div>
            <span className="text-xl font-semibold">{home}%</span>
          </div>

          <div className="relative w-28 md:w-32 lg:w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                className="stroke-chart-1"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                className="stroke-chart-2"
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
                className="stroke-chart-3"
                strokeWidth={strokeWidth}
                strokeDasharray={`${homeStroke} ${circumference}`}
                strokeDashoffset={circumference - homeStroke}
                transform="rotate(310 50 50)"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute left-1/2 top-1/2 z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1">
              <span className="text-md font-semibold sm:text-lg">{draw}%</span>
              <p className="text-sm">{t('draw')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
            <span className="text-xl font-semibold lg:hidden 2xl:block">
              {away}%
            </span>
            <div className="flex flex-col items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-chart-2"></div>
              <span className="text-lg font-semibold">{team2}</span>
            </div>
            <span className="hidden text-xl font-semibold lg:block 2xl:hidden">
              {away}%
            </span>
          </div>
        </div>

        <p className="text-sm">{t('last_4_matches')}</p>
        <div className="grid grid-cols-2 gap-x-16 font-semibold">
          {['1-1', '1-1', '1-1', '1-1'].map((match, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className="h-3 w-5 bg-chart-3"></div>
              <div
                key={index}
                className="flex h-8 w-8 items-center justify-center"
              >
                {match}
              </div>
              <div className="h-3 w-4 bg-chart-2"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
