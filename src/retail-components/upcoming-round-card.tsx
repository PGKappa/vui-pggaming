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

  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between px-6 md:pl-14">
        <span>
          {props.round.scheduleName} {t('round')} {props.round.scheduleId}
        </span>
        <span>3:00</span>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader className="bg-card-header text-card-header-foreground">
            <TableRow className="border-card-foreground transition-none">
              <TableHead></TableHead>
              <TableHead className="text-center font-bold">1</TableHead>
              <TableHead className="text-center font-bold">X</TableHead>
              <TableHead className="text-center font-bold">2</TableHead>
              <TableHead className="text-center font-bold">UNDER</TableHead>
              <TableHead className="text-center font-bold">OVER</TableHead>
              <TableHead className="text-center font-bold">GOAL</TableHead>
              <TableHead className="text-center font-bold">NO GOAL</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.round.mag_event.length ? (
              props.round.mag_event.map((match, index) => {
                const matchStart = new Date(match.startTime)
                
                let dayLabel = matchStart.toLocaleDateString(i18n.language, { weekday: 'short' }).toUpperCase()
                if (matchStart.toDateString() === today.toDateString()) {
                  dayLabel = t('today').toUpperCase()
                } else if (matchStart.toDateString() === tomorrow.toDateString()) {
                  dayLabel = t('tomorrow').toUpperCase()
                }

                const formattedDate = matchStart.toLocaleTimeString(i18n.language, {
                  hour: '2-digit',
                  minute: '2-digit',
                })


                const teamNames = match.teams.team
                  .map((t) => t.name || '')
                  .join(' - ')

                const mainMarket = match.markets.market.find(
                  (m) => m.name === 'Esito finale 1X2',
                )
                const underOverMarket = match.markets.market.find(
                  (m) => m.name === 'Under\/Over 1.5',
                )
                const goalMarket = match.markets.market.find(
                  (m) => m.name === 'Gol no gol',
                )

                const marketOptions =
                  mainMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                const underOverOptions =
                  underOverMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                const goalOptions =
                  goalMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                return (
                  <TableRow key={index} className="border-card-foreground">
                    <TableCell className="flex w-full flex-row items-center gap-2 md:pl-14">
                      <Badge variant="secondary" className="flex flex-col py-0">
                        <span>{dayLabel}</span>
                        <span>{formattedDate}</span>
                      </Badge>
                      <span className="font-bold">{teamNames}</span>
                    </TableCell>

                    {mainMarket ? (
                      marketOptions.map((option, i) => (
                        <TableCell key={i}>
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={mainMarket.name}
                            option={option}
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={3} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    {underOverMarket ? (
                      underOverOptions.map((option, i) => (
                        <TableCell key={i}>
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={underOverMarket.name}
                            option={option}
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={2} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    {goalMarket ? (
                      goalOptions.map((option, i) => (
                        <TableCell key={i}>
                          <BetEntryToggle
                            matchStart={matchStart}
                            round={props.round}
                            teams={teamNames}
                            marketName={goalMarket.name}
                            option={option}
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell colSpan={2} className="text-center">
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
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
                        <PlusIcon />
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
