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
import { BetsContext } from '@/contexts/bets-context'
import { BetOption, BetOptionMarket, UpcomingRound } from '@/lib/types'
import { Locale, format, isToday } from 'date-fns'
import { itCH, enGB, zhCN } from 'date-fns/locale'
import { PlusIcon } from 'lucide-react'
import { Dispatch, SetStateAction, useContext } from 'react'
import { useTranslation } from 'react-i18next'

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
          betOptions: Array<{ market: BetOptionMarket; options: BetOption[] }>
        }
      | undefined
    >
  >
}) {
  const { addBet } = useContext(BetsContext)

  const { t, i18n } = useTranslation()
  const currentLocale = getLocale(i18n.language)
  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex flex-row items-center justify-between px-6 md:pl-14">
        <span>
          {props.round.name} {t('round')} {props.round.number}
        </span>
        <span>30:00</span>
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
            {props.round.matches.map((match, index) => {
              const roundStart = new Date(props.round.startingAt)
              const matchStart = new Date(roundStart.getTime())
              let dayLabel = format(matchStart, 'EEE', {
                locale: currentLocale,
              }).toUpperCase()

              if (isToday(matchStart)) {
                dayLabel = t('today')
              }

              const formattedDate = format(matchStart, 'HH:mm', {
                locale: currentLocale,
              })

              return (
                <TableRow key={index} className="border-card-foreground">
                  <TableCell className="flex w-full flex-row items-center gap-2 md:pl-14">
                    <Badge variant="secondary" className="flex flex-col py-0">
                      <span>{dayLabel}</span>
                      <span>{formattedDate}</span>
                    </Badge>
                    <span className="font-bold">{match.teams}</span>
                  </TableCell>

                  {match.betOptions
                    .find(
                      (betOption) => betOption.market === BetOptionMarket.MAIN,
                    )
                    ?.options.map((option, i) => (
                      <TableCell key={i}>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            addBet({
                              round: {
                                name: props.round.name,
                                number: props.round.number,
                                startingAt: props.round.startingAt,
                              },
                              teams: match.teams,
                              option,
                            })
                          }
                        >
                          {option.odd}
                        </Button>
                      </TableCell>
                    ))}

                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        props.viewMatchBettingOptions({
                          round: props.round,
                          teams: match.teams,
                          betOptions: match.betOptions,
                        })
                      }
                    >
                      <PlusIcon />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
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
