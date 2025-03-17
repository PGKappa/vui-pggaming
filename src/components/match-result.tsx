import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
import { MatchResult } from '@/lib/types'
import { Card, CardTitle, CardContent, CardHeader } from './ui/card'
import { t } from 'i18next'

export default function MatchResult() {
  const { matchResult } = useContext(RootContext)

  if (!matchResult || matchResult.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="font-extrabold">{t('results').toUpperCase()}</CardTitle>
        </CardHeader>
        <CardContent className="py-4 text-center">
          <p>{t("no_match_results")}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="font-extrabold">{t('results').toUpperCase()}</CardTitle>
      </CardHeader>

      {matchResult.map((match, index) => {
        const [team1, team2] = match.teams.split(' - ')

        return (
          <CardContent
            key={index}
            className="flex w-full items-center justify-around py-16 bg-card-header"
          >
            <div className="flex flex-row gap-4">
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-card-foreground"></div>
                <span className="text-lg font-semibold">{team1}</span>
              </div>
              <span className="text-5xl font-semibold">{match.score1}</span>
            </div>

            <div className="flex flex-row gap-4">
              <span className="text-5xl font-semibold">{match.score2}</span>
              <div className="flex flex-col items-center gap-2">
                <div className="h-5 w-5 rounded-full bg-accent"></div>
                <span className="text-lg font-semibold">{team2}</span>
              </div>
            </div>
          </CardContent>
        )
      })}
    </Card>
  )
}
