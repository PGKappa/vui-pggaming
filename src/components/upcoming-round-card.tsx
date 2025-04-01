import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Market, UpcomingRound } from '@/lib/types'
import { Locale, format, isToday, isTomorrow } from 'date-fns'
import { enGB, itCH, zhCN } from 'date-fns/locale'
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
  const currentLocale = getLocale(i18n.language)

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
          <TableHeader className="bg-card-header">
            <TableRow className="border-card-foreground transition-none *:text-card-foreground hover:bg-card-header">
              <TableHead></TableHead>
              <TableHead className="text-center">1</TableHead>
              <TableHead className="text-center">X</TableHead>
              <TableHead className="text-center">2</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.round.mag_event.length ? (
              props.round.mag_event.map((match, index) => {
                const matchStart = new Date(match.startTime)
                let dayLabel = format(matchStart, 'EEE', {
                  locale: currentLocale,
                }).toUpperCase()
                if (isToday(matchStart)) {
                  dayLabel = t('today')
                } else if (isTomorrow(matchStart)) {
                  dayLabel = t('tomorrow')
                }

                const formattedDate = format(matchStart, 'HH:mm', {
                  locale: currentLocale,
                })
                const teamNames = match.teams.team
                  .map((t) => t.name || '')
                  .join(' - ')

                const mainMarket = match.markets.market.find(
                  (m) => m.name === 'Esito finale 1X2',
                )
                const marketOptions =
                  mainMarket?.selections.flatMap(
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

function getLocale(lang: string) {
  const locales: Record<string, Locale> = {
    en: enGB,
    it: itCH,
    cn: zhCN,
  }
  return locales[lang] || enGB
}
