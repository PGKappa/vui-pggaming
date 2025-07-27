import { MatchResult } from '@/retail-lib/types'
import { t } from 'i18next'

export default function MatchResultCard(props: { matchResult?: MatchResult }) {
  if (!props.matchResult) {
    return (
      <div className="w-full">
        <div className="text-center">
          <h4 className="text-[22px] font-extrabold text-secondary">
            {t('result').toUpperCase()}
          </h4>
        </div>
        <div className="py-4 text-center">{t('no_match_results')}</div>
      </div>
    )
  }
  const [team1, team2] = props.matchResult.teams.split(' - ')

  return (
    <div className="flex w-full flex-col items-center justify-start gap-10">
      <div className="text-center">
        <h4 className="text-[22px] font-extrabold text-secondary">
          {t('result').toUpperCase()}
        </h4>
      </div>

      <div className="flex w-full flex-row items-center justify-center gap-52">
        <div className="flex flex-row gap-5">
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-chart-3"></div>
            <span className="text-xl font-semibold">{team1}</span>
          </div>
          <span className="text-5xl font-semibold">
            {props.matchResult.score1}
          </span>
        </div>

        <div className="flex flex-row gap-5">
          <span className="text-5xl font-semibold">
            {props.matchResult.score2}
          </span>
          <div className="flex flex-col items-center gap-1">
            <div className="h-5 w-5 rounded-full bg-chart-2"></div>
            <span className="text-xl font-semibold">{team2}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
