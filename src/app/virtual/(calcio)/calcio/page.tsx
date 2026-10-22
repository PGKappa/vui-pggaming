'use client'
import BettingSlip from '@/virtual-components/betting-slip'
import BettingSlipSheet from '@/virtual-components/betting-slip-sheet'
import Leaderboard from '@/virtual-components/leaderboard'
import LeaderboardSheet from '@/virtual-components/leaderboard-sheet'
import LiveMatchInfo from '@/virtual-components/live-match-info'
import LiveRoundScores from '@/virtual-components/live-round-scores'
import LiveRoundStatistics, {
  type SelectedMatch,
} from '@/virtual-components/live-round-statistics'
import LoadingSpinner from '@/virtual-components/loading-spinner'
import MatchBettingOptions from '@/virtual-components/match-betting-options'
import MatchEndBadge from '@/virtual-components/match-end-badge'
import MatchResult from '@/virtual-components/match-result'
import MatchStatisticsCard from '@/virtual-components/match-statistics-card'
import UpcomingRoundCard from '@/virtual-components/upcoming-round-card'
import VideoStreamCard from '@/virtual-components/video-stream-card'
import { useSoccerStandings } from '@/retail-lib/soccer-standings'
import { RootContext } from '@/virtual-contexts/root-context'
import { Market, Discipline } from '@/virtual-lib/types'
import {
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'

type MatchBetOptions = {
  round: {
    name: string
    number: number
    startingAt: Date
  }
  teams: string
  markets: Market[]
  eventId?: number
  groupId?: number
}

export default function Home() {
  const { upcomingRounds, liveRound } = useContext(RootContext)
  // Stessa classifica della cassa, ancorata al campionato delle partite in
  // cartellone. Una sola connessione al feed per la pagina, passata ai due
  // riquadri.
  const partitaInCartellone = upcomingRounds?.[0]?.mag_event?.[0]?.eventIdentity
  const standings = useSoccerStandings(
    partitaInCartellone?.eventId,
    partitaInCartellone?.groupId,
  )
  const [matchBetOptions, setMatchBetOptions] = useState<MatchBetOptions>()

  const [selectedMatch, setSelectedMatch] = useState<SelectedMatch>()
  // Il dettaglio porta gia' le sue statistiche: chiude quella di fianco, per
  // non mostrare due volte la stessa cosa.
  const apriDettaglio: Dispatch<SetStateAction<MatchBetOptions | undefined>> = (
    value,
  ) => {
    setMatchBetOptions(value)
    setSelectedMatch(undefined)
  }

  const highlightedTeams = useMemo(() => {
    return selectedMatch ? selectedMatch.teams.split(' - ') : []
  }, [selectedMatch])

  return (
    <>
      <div className="container mb-10 mt-1 grid grid-cols-1 justify-center gap-3 bg-columnL-background text-columnL-foreground lg:mb-4 lg:grid-cols-4">
        {/* First column - top content */}
        <div className="flex flex-col items-center gap-4 lg:col-span-2">
          <div className="flex w-full flex-col gap-1">
            <LiveMatchInfo />
            <VideoStreamCard
              streamUrl={liveRound?.streamUrl}
              discipline={Discipline.FOOTBALL}
            />
          </div>
          <MatchEndBadge discipline={Discipline.FOOTBALL} />
          {matchBetOptions && (
            <MatchBettingOptions
              round={matchBetOptions.round}
              teams={matchBetOptions.teams}
              markets={matchBetOptions.markets}
              eventId={matchBetOptions.eventId}
              groupId={matchBetOptions.groupId}
              standings={standings.rankings}
              close={() => setMatchBetOptions(undefined)}
            />
          )}
          {!upcomingRounds && (
            <div className="flex justify-center">
              <LoadingSpinner />
            </div>
          )}

          {/* Upcoming rounds - visible on desktop */}
          <div className="hidden w-full lg:block">
            {upcomingRounds && !matchBetOptions && (
              <ol className="w-full space-y-7">
                {upcomingRounds.map((round) => (
                  <li key={round.scheduleId}>
                    <UpcomingRoundCard
                      round={round}
                      viewMatchBettingOptions={apriDettaglio}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Second column content - appears after first column but before upcoming rounds on mobile */}
        <div className="space-y-3 lg:col-span-1">
          <LiveRoundScores />
          {selectedMatch ? (
            <MatchStatisticsCard
              teams={selectedMatch.teams}
              markets={selectedMatch.markets}
              eventId={selectedMatch.eventId}
              groupId={selectedMatch.groupId}
              standings={standings.rankings}
              onBack={() => setSelectedMatch(undefined)}
            />
          ) : (
            <LiveRoundStatistics onMatchSelect={setSelectedMatch} />
          )}
          <MatchResult />
          <div className="hidden lg:block">
            <Leaderboard
              highlightedTeams={highlightedTeams}
              standings={standings}
            />
          </div>
        </div>

        {/* Upcoming rounds - visible only on mobile, appears at the bottom */}
        <div className="block lg:hidden">
          {upcomingRounds && !matchBetOptions && (
            <ol className="w-full space-y-7">
              {upcomingRounds.map((round) => (
                <li key={round.scheduleId}>
                  <UpcomingRoundCard
                    round={round}
                    viewMatchBettingOptions={apriDettaglio}
                  />
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Betting slip - rightmost column */}
        <div className="bg-background text-foreground lg:col-span-1">
          <div className="hidden lg:block">
            <BettingSlip />
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 flex w-full justify-center gap-2 lg:hidden">
        <LeaderboardSheet
          highlightedTeams={highlightedTeams}
          standings={standings}
        />
        <BettingSlipSheet />
      </div>
    </>
  )
}
