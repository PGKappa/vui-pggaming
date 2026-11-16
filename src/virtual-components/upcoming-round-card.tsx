import { Badge } from '@/virtual-components/ui/badge'
import { Button } from '@/virtual-components/ui/button'
import { Card, CardContent, CardHeader } from '@/virtual-components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/virtual-components/ui/table'
import { Discipline, Market, UpcomingRound } from '@/virtual-lib/types'
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
          eventId?: number
          groupId?: number
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
    <Card className="overflow-hidden text-table-foreground shadow-sm">
      <CardHeader className="flex h-12 flex-row items-center justify-between space-y-0 px-3 py-0 md:px-4">
        <span className="text-sm font-bold uppercase tracking-wide">
          {props.round.scheduleName} {t('round')} {props.round.scheduleId}
        </span>
        <span className="rounded-sm bg-white px-2 py-0.5 text-sm font-bold tabular-nums text-card-header">
          3:00
        </span>
      </CardHeader>
      <CardContent className="px-0">
        <Table className="table-fixed">
          <TableHeader className="bg-secondary">
            <TableRow className="border-0 transition-none hover:bg-secondary">
              <TableHead className="h-8 w-auto" />
              <TableHead className="h-8 w-[60px] text-center text-xs font-bold text-secondary-foreground sm:w-[18%]">
                1
              </TableHead>
              <TableHead className="h-8 w-[60px] text-center text-xs font-bold text-secondary-foreground sm:w-[18%]">
                X
              </TableHead>
              <TableHead className="h-8 w-[60px] text-center text-xs font-bold text-secondary-foreground sm:w-[18%]">
                2
              </TableHead>
              <TableHead className="h-8 w-11 sm:w-14" />
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

                const mainMarket = match.markets.market.find((m) =>
                  ['esito finale 1x2', '1x2'].includes(
                    m.name.trim().toLowerCase(),
                  ),
                )
                const marketOptions =
                  mainMarket?.selections.flatMap(
                    ({ selection }) => selection,
                  ) || []

                return (
                  <TableRow
                    key={index}
                    className="border-border transition-colors hover:bg-muted/60"
                  >
                    <TableCell className="px-2 py-2 sm:px-3 md:px-4">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Badge
                          variant="secondary"
                          className="flex w-14 shrink-0 flex-col items-center rounded-sm px-1 py-0.5 text-[11px] leading-tight"
                        >
                          <span>{dayLabel}</span>
                          <span className="tabular-nums">{formattedDate}</span>
                        </Badge>
                        <span className="truncate text-sm font-bold">
                          {teamNames}
                        </span>
                      </div>
                    </TableCell>

                    {mainMarket ? (
                      marketOptions.map((option, i) => (
                        <TableCell key={i} className="px-1 py-2 sm:px-2">
                          <BetEntryToggle
                            className="mx-auto h-10 w-full max-w-[120px] px-0 text-[15px] font-semibold tabular-nums sm:text-[16px]"
                            marketName={mainMarket.name}
                            bet={{
                              event: {
                                name: props.round.scheduleName,
                                number: props.round.scheduleId,
                                startingAt: matchStart,
                              },
                              discipline: Discipline.FOOTBALL,
                              competitors: teamNames,
                              option: option,
                            }}
                            variant="roundcard"
                          />
                        </TableCell>
                      ))
                    ) : (
                      <TableCell
                        colSpan={3}
                        className="text-center text-sm text-muted-foreground"
                      >
                        {t('no_odds')}
                      </TableCell>
                    )}

                    <TableCell className="px-1 py-2 text-center sm:px-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-9 rounded-sm bg-tertiary sm:w-10 text-tertiary-foreground hover:bg-tertiary/90 hover:text-tertiary-foreground"
                        onClick={() =>
                          props.viewMatchBettingOptions({
                            round: {
                              name: props.round.scheduleName,
                              number: props.round.scheduleId,
                              startingAt: matchStart,
                            },
                            teams: teamNames,
                            markets: match.markets.market,
                            eventId: match.eventIdentity?.eventId,
                            groupId: match.eventIdentity?.groupId,
                          })
                        }
                      >
                        <PlusIcon className="size-5" />
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
