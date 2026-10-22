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
import type { Market, TeamRanking } from '@/retail-lib/types'
import i18next, { t } from 'i18next'
import { useEffect, useState } from 'react'

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
  return (
    <span
      className={`flex h-[26px] w-[26px] items-center justify-center rounded-[4px] text-[14px] font-bold ${chipColor(result)}`}
    >
      {t(`form_${result}`, result)}
    </span>
  )
}

function FormRow({ label, form }: { label: string; form?: FormResult[] }) {
  return (
    <div className="flex flex-row items-center gap-3">
      <span className="w-[54px] text-right text-[15px] font-bold">{label}</span>
      {form?.length ? (
        <div className="flex flex-row items-center gap-[6px]">
          {form.map((result, index) => (
            <Chip key={index} result={result} />
          ))}
        </div>
      ) : (
        <span className="text-[13px] opacity-60">
          {t('form_unavailable', 'storico non ancora disponibile')}
        </span>
      )}
    </div>
  )
}

function Titolo({ testo }: { testo: string }) {
  return (
    <p className="text-[15px] font-semibold text-secondary">{testo}</p>
  )
}

export default function MatchStatisticsCard({
  teams,
  markets,
  standings,
  eventId,
  groupId,
}: {
  teams: string
  markets: Market[]
  standings?: TeamRanking[]
  eventId?: string | number
  groupId?: string | number
}) {
  const [home, away] = teamsOf(teams)
  const probabilities = probabilitiesFromOdds(markets)

  // La classifica della giornata e i precedenti fra le due squadre arrivano dal
  // servizio realtime: la prima e' una chiamata per slot, i secondi una per
  // partita, fatta qui perche' dipende dalla coppia.
  const [slotStandings, setSlotStandings] = useState<TeamRanking[]>()
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

  const locale = LOCALI[i18next.language?.slice(0, 2) ?? 'it'] ?? 'it-IT'
  const previous = headToHeadRows(headToHead, locale)
  const summary = headToHead?.summary

  // Due colonne: a sinistra le percentuali, a destra lo storico. L'anello si
  // allarga per pareggiare l'altezza della colonna di destra.
  return (
    <div className="flex w-full flex-row items-stretch justify-center gap-8 px-12 pt-2">
      <div className="flex flex-1 flex-col items-center gap-3">
        <h4 className="text-[22px] font-extrabold text-secondary">
          {t('statistics').toUpperCase()}
        </h4>

        {probabilities ? (
          // flex-1 + aspect-square: l'anello cresce fino a riempire l'altezza
          // della colonna, che e' quella dettata dalla colonna di destra.
          <div className="flex min-h-0 w-full flex-1 flex-row items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-chart-3" />
              <span className="text-[17px] font-bold">{home}</span>
              <span className="text-[22px] font-semibold tabular-nums">
                {probabilities.home}%
              </span>
            </div>

            <div className="relative aspect-square h-full max-h-[260px] min-h-[140px]">
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
                <span className="text-[26px] font-bold tabular-nums">
                  {probabilities.draw}%
                </span>
                <span className="text-[14px]">{t('draw')}</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-chart-2" />
              <span className="text-[17px] font-bold">{away}</span>
              <span className="text-[22px] font-semibold tabular-nums">
                {probabilities.away}%
              </span>
            </div>
          </div>
        ) : (
          <span className="text-[14px] opacity-60">
            {t('statistics_unavailable', 'statistiche non disponibili')}
          </span>
        )}
      </div>

      <div className="w-px self-stretch bg-border opacity-40" />

      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-2">
          <Titolo testo={t('last_5_matches', 'Ultime 5 partite')} />
          <FormRow label={home} form={homeForm} />
          <FormRow label={away} form={awayForm} />
        </div>

        {/* Precedenti: mostrati solo quando ci sono. In ogni riga le squadre
            restano nell'ordine in cui giocarono quella partita — metterle
            sempre con quella di casa di oggi a sinistra rovescerebbe il
            punteggio. L'esito invece e' gia' letto dal fornitore dal punto di
            vista della squadra di casa di oggi. */}
        {previous.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <Titolo testo={t('head_to_head', 'Precedenti')} />

            {/* "Bilancio:" non e' decorativo: senza, "AST 0 - 4 LEE" si legge
                come il punteggio di una partita invece che come il conteggio
                delle vittorie. */}
            {summary && summary.played > 0 && (
              <p className="text-[14px] opacity-70">
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
                  className="flex flex-row items-center gap-3 text-[14px]"
                >
                  <span className="w-[90px] text-right opacity-70">
                    {row.date}
                  </span>
                  <span className="w-[140px] text-center font-semibold">
                    {row.scoreline}
                  </span>
                  <Chip result={row.result} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
