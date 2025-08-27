import { RootContext } from '@/virtual-contexts/root-context'
import { t } from 'i18next'
import { useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function MatchResult() {
  const { matchResult } = useContext(RootContext)

  if (!matchResult || matchResult.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="h-12 text-center">
          <CardTitle className="font-extrabold">
            {t('results').toUpperCase()}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p>{t('no_match_results')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="items-center py-3 text-center">
        <CardTitle className="font-extrabold">
          {t('results').toUpperCase()}
        </CardTitle>
      </CardHeader>

      {matchResult.map((match, index) => {
        const [team1, team2] = match.teams.split(' - ')

        return (
          <CardContent
            key={index}
            className="flex w-full items-center justify-center gap-20 bg-card-header"
            style={{ paddingTop: '4rem', paddingBottom: '4rem' }}
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
          </CardContent>
        )
      })}
    </Card>
  )
}
