import { Badge } from '@/retail-components/ui/badge'
import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/retail-components/ui/table'
import { Market, UpcomingRound } from '@/retail-lib/types'
import { PlusIcon } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import BetEntryToggle from './bet-entry-toggle'
import Image from 'next/image'

export default function UpcomingRoundCard(props: {
  round: UpcomingRound
  viewMatchBettingOptions: Dispatch<
    SetStateAction<
      | {
          round: {
            name: string
            number: number
            startingAt: Date
          }
          teams: string
          markets: Market[]
        }
      | undefined
    >
  >
}) {
  const { t, i18n } = useTranslation()

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const firstMatchStart = props.round.mag_event[0]?.startTime
  const formattedFirstMatchStart = firstMatchStart
    ? new Date(firstMatchStart).toLocaleTimeString(i18n.language, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex h-16 flex-row items-center justify-between px-5">
        <div className="flex flex-row items-center gap-2">
          <Image
            src="/icon-calcio.png"
            alt="Calcio"
            width={40}
            height={20}
            className="size-9 object-contain"
          />

          <span className="text-[24px] font-bold">
            {props.round.scheduleName} {t('round')} {props.round.scheduleId}
          </span>
        </div>

        <span className="text-[22px]">{formattedFirstMatchStart}</span>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader className="h-11 bg-card-header text-[20px] text-card-header-foreground">
            <TableRow className="border-card-foreground transition-none">
              <TableHead className='w-[130px]'></TableHead>
              <TableHead></TableHead>
              <TableHead className="text-center font-bold">1</TableHead>
              <TableHead className="text-center font-bold">X</TableHead>
              <TableHead className="text-center font-bold">2</TableHead>
              <TableHead className="w-[1px] bg-card-header-foreground p-0" />

              <TableHead className="text-center font-bold">DC 1X</TableHead>
              <TableHead className="text-center font-bold">DC X2</TableHead>
              <TableHead className="text-center font-bold">DC 12</TableHead>
              <TableHead className="w-[1px] bg-card-header-foreground p-0" />

              <TableHead className="text-center font-bold">Goal</TableHead>
              <TableHead className="text-center font-bold">No Goal</TableHead>
              <TableHead className="w-[1px] bg-card-header-foreground p-0" />

              <TableHead className="text-center font-bold">U 2.5</TableHead>
              <TableHead className="text-center font-bold">O 2.5</TableHead>

              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.round.mag_event.length ? (
              props.round.mag_event.map((match, index) => {
                const matchStart = new Date(match.startTime)

                let dayLabel = matchStart
                  .toLocaleDateString(i18n.language, { weekday: 'short' })
                  .toUpperCase()
                if (matchStart.toDateString() === today.toDateString()) {
                  dayLabel = t('today').toUpperCase()
                } else if (
                  matchStart.toDateString() === tomorrow.toDateString()
                ) {
                  dayLabel = t('tomorrow').toUpperCase()
                }

                const formattedDate = matchStart.toLocaleTimeString(
                  i18n.language,
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                )

                const teamNames = match.teams.team
                  .map((t) => t.name || '')
                  .join(' - ')

                const mainMarket = match.markets.market.find(
                  (m) => m.name === 'Esito finale 1X2',
                )
                const dcMarket = match.markets.market.find(
                  (m) => m.name === 'Doppia Chance',
                )
                const underOverMarket = match.markets.market.find(
                  (m) => m.name.trim() === 'Under\/Over 2.5',
                )
                const goalNoGoalMarket = match.markets.market.find(
                  (m) => m.name === 'Gol no gol',
                )

                const marketOptions =
                  mainMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                const dcMarketOptions =
                  dcMarket?.selections.flatMap(({ selection }) => selection) ||
                  []

                const underOverOptions =
                  underOverMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                const goalNoGoalOptions =
                  goalNoGoalMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                return (
                  <TableRow key={index} className="border-card-foreground">
                    <TableCell className="flex h-[70px] w-[130px] flex-row items-center justify-center">
                      <Badge
                        variant="secondary"
                        className="flex flex-col justify-center py-1.5"
                      >
                        <span className="text-[16px]">{dayLabel}</span>
                        <span className="text-[12px] font-normal">
                          {formattedDate}
                        </span>
                      </Badge>
                    </TableCell>

                    <TableCell className="h-[70px] w-[142px] p-0 text-center">
                      <span className="text-[16px] font-bold">{teamNames}</span>
                    </TableCell>

                    {mainMarket ? (
                      marketOptions.map((option, i) => (
                        <TableCell
                          key={i}
                          className="h-[70px] w-[116px] px-[10px] text-center"
                        >
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={mainMarket.name}
                            option={option}
                            className="h-[45px] w-[90px] text-[19px] font-semibold"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={3} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="w-[1px] bg-border p-0" />

                    {dcMarket ? (
                      dcMarketOptions.map((option, i) => (
                        <TableCell
                          key={i}
                          className="h-[70px] w-[116px] px-[10px] text-center"
                        >
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={dcMarket.name}
                            option={option}
                            className="h-[45px] w-[90px] text-[19px] font-semibold"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={3} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="w-[1px] bg-border p-0" />

                    {goalNoGoalMarket ? (
                      goalNoGoalOptions.map((option, i) => (
                        <TableCell
                          key={i}
                          className="h-[70px] w-[116px] px-[10px] text-center"
                        >
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={goalNoGoalMarket.name}
                            option={option}
                            className="h-[45px] w-[90px] text-[19px] font-semibold"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={2} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="w-[1px] bg-border p-0" />

                    {underOverMarket ? (
                      underOverOptions.map((option, i) => (
                        <TableCell
                          key={i}
                          className="h-[70px] w-[116px] px-[10px] text-center"
                        >
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={underOverMarket.name}
                            option={option}
                            className="h-[45px] w-[90px] text-[19px] font-semibold"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={2} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="text-center">
                      <Button
                        className="rounded-[8px] bg-tertiary text-tertiary-foreground hover:bg-tertiary/90"
                        size="icon-lg"
                        onClick={() =>
                          props.viewMatchBettingOptions({
                            round: {
                              name: props.round.scheduleName,
                              number: props.round.scheduleId,
                              startingAt: matchStart,
                            },
                            teams: teamNames,
                            markets: match.markets.market,
                          })
                        }
                      >
                        <PlusIcon style={{ scale: 1.5 }} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-4 text-center">
                  {t('no_matches')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
