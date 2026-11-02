'use client'

import {
  fetchHeadToHead,
  fetchSlotStandings,
  formForTeam,
  headToHeadRows,
  probabilitiesFromOdds,
  teamsOf,
  type FormResult,
  type HeadToHead,
} from '@/retail-lib/soccer-stats'
import type { TeamRanking as SoccerTeamRanking } from '@/retail-lib/types'
import type { Market } from '@/virtual-lib/types'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const LOCALI: Record<string, string> = {
  it: 'it-IT',
  en: 'en-GB',
  es: 'es-ES',
  ru: 'ru-RU',
}

const RADIUS = 42
const STROKE = 12
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
// Stacco fra i tre spicchi dell'anello, in unita' di percorso.
const GAP = 3

// Le tre quote diventano tre spicchi consecutivi a partire dalle ore 12.
function ring(probabilities: { home: number; draw: number; away: number }) {
  const segments = [
    { key: 'home', value: probabilities.home, className: 'stroke-chart-3' },
    { key: 'draw', value: probabilities.draw, className: 'stroke-chart-1' },
    { key: 'away', value: probabilities.away, className: 'stroke-chart-2' },
  ]
  let start = 0
  return segments.map((segment) => {
    const length = (segment.value / 100) * CIRCUMFERENCE
    const offset = start
    start += length
    return {
      ...segment,
      dash: `${Math.max(length - GAP, 0)} ${CIRCUMFERENCE}`,
      dashOffset: -offset,
    }
  })
}

function chipColor(result: FormResult): string {
  return result === 'W'
    ? 'bg-chart-3 text-white'
    : result === 'L'
      ? 'bg-chart-2 text-white'
      : 'bg-chart-1 text-white'
}

function Chip({ result }: { result: FormResult }) {
  const { t } = useTranslation()
  return (
    <span
      className={`flex h-[22px] w-[22px] items-center justify-center rounded-[4px] text-[12px] font-bold ${chipColor(result)}`}
    >
      {t(`form_${result}`, result)}
    </span>
  )
}

function FormRow({ label, form }: { label: string; form?: FormResult[] }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-row items-center justify-center gap-2">
      <span className="w-[46px] text-right text-[13px] font-bold">{label}</span>
      {form?.length ? (
        <div className="flex flex-row items-center gap-1">
          {form.map((result, index) => (
            <Chip key={index} result={result} />
          ))}
        </div>
      ) : (
        <span className="text-[12px] opacity-60">
          {t('form_unavailable', 'storico non ancora disponibile')}
        </span>
      )}
    </div>
  )
}

export default function MatchStatisticsCard({
  teams,
  markets,
  eventId,
  groupId,
  standings,
  onBack,
}: {
  teams: string
  markets: Market[]
  eventId?: string | number
  groupId?: string | number
  standings?: SoccerTeamRanking[]
  onBack?: () => void
}) {
  const { t, i18n } = useTranslation()
  const [home, away] = teamsOf(teams)
  const probabilities = probabilitiesFromOdds(markets)

  // Stessi dati della cassa: classifica della giornata (una chiamata per
  // slot) e precedenti fra le due squadre (una per partita).
  const [slotStandings, setSlotStandings] = useState<SoccerTeamRanking[]>()
  const [headToHead, setHeadToHead] = useState<HeadToHead>()

  useEffect(() => {
    let active = true
    fetchSlotStandings(eventId, groupId).then((rows) => {
      if (active && rows) setSlotStandings(rows)
    })
    fetchHeadToHead(eventId).then((data) => {
      if (active && data) setHeadToHead(data)
    })
    return () => {
      active = false
    }
  }, [eventId, groupId])

  // La forma deve essere la stessa identica che si legge in classifica: se la
  // classifica a schermo contiene entrambe le squadre si usa quella, e le
  // ultime 5 sono per forza le ultime 5 delle 8 mostrate li'. La classifica
  // per giornata resta come riserva, per quando quella generale non e'
  // ancora arrivata o non copre queste squadre.
  const dallaClassifica =
    formForTeam(standings, home) && formForTeam(standings, away)
      ? standings
      : undefined
  const table = dallaClassifica ?? slotStandings ?? standings
  const homeForm = formForTeam(table, home)
  const awayForm = formForTeam(table, away)

  const locale = LOCALI[i18n.language?.slice(0, 2) ?? 'it'] ?? 'it-IT'
  const previous = headToHeadRows(headToHead, locale)
  const summary = headToHead?.summary

  return (
    <Card className="w-full">
      <CardHeader className="relative flex items-center justify-between">
        <CardTitle className="font-extrabold">
          {onBack && (
            <Button
              onClick={onBack}
              variant="ghost"
              size="icon"
              className="absolute left-0 top-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {t('statistics').toUpperCase()}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4 pb-5">
        <span className="text-[15px] font-bold">{teams}</span>

        {probabilities ? (
          <div className="flex flex-row items-center justify-center gap-5">
            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-chart-3" />
              <span className="text-[14px] font-bold">{home}</span>
              <span className="text-[18px] font-semibold tabular-nums">
                {probabilities.home}%
              </span>
            </div>

            <div className="relative h-[130px] w-[130px]">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <g transform="rotate(-90 50 50)">
                  {ring(probabilities).map((segment) => (
                    <circle
                      key={segment.key}
                      cx="50"
                      cy="50"
                      r={RADIUS}
                      fill="none"
                      strokeWidth={STROKE}
                      strokeDasharray={segment.dash}
                      strokeDashoffset={segment.dashOffset}
                      className={segment.className}
                    />
                  ))}
                </g>
              </svg>

              <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                <span className="text-[20px] font-bold tabular-nums">
                  {probabilities.draw}%
                </span>
                <span className="text-[12px]">{t('draw')}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-3 w-3 rounded-full bg-chart-2" />
              <span className="text-[14px] font-bold">{away}</span>
              <span className="text-[18px] font-semibold tabular-nums">
                {probabilities.away}%
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[13px] opacity-60">
            {t('statistics_unavailable', 'statistiche non disponibili')}
          </span>
        )}

        <div className="flex flex-col items-center gap-2">
          <p className="text-[13px] font-semibold">
            {t('last_5_matches', 'Ultime 5 partite')}
          </p>
          <FormRow label={home} form={homeForm} />
          <FormRow label={away} form={awayForm} />
        </div>

        {/* Precedenti: in ogni riga le squadre restano nell'ordine in cui
            giocarono quella partita — metterle sempre con quella di casa di
            oggi a sinistra rovescerebbe il punteggio. L'esito invece e' gia'
            orientato dal fornitore sulla squadra di casa di oggi. */}
        {previous.length > 0 && (
          <div className="flex w-full flex-col items-center gap-1">
            <p className="text-[13px] font-semibold">
              {t('head_to_head', 'Precedenti')}
            </p>

            {/* Senza "Bilancio:" la riga si legge come il punteggio di una
                partita invece che come il conteggio delle vittorie. */}
            {summary && summary.played > 0 && (
              <p className="text-[12px] opacity-70">
                {t('balance', 'Bilancio')}: {home} {summary.homeTeamWins} -{' '}
                {summary.awayTeamWins} {away}
                {summary.draws > 0
                  ? ` (${summary.draws} ${
                      summary.draws === 1
                        ? t('draw').toLowerCase()
                        : t('draws', 'pareggi')
                    })`
                  : ''}
              </p>
            )}

            <div className="flex flex-col gap-[3px] pt-1 tabular-nums">
              {previous.map((row) => (
                <div
                  key={row.eventId}
                  className="flex flex-row items-center gap-2 text-[12px]"
                >
                  <span className="w-[76px] text-right opacity-70">
                    {row.date}
                  </span>
                  <span className="w-[118px] text-center font-semibold">
                    {row.scoreline}
                  </span>
                  <Chip result={row.result} />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
