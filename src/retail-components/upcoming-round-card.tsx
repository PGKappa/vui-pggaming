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
import { ChevronRight } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
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
  const { t } = useTranslation()

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const marketTabs: { name: string; markets: Market[] }[] = [
    {
      name: 'Principali',
      markets: props.round.mag_event[0].markets.market.filter((market) =>
        [
          'Esito finale 1X2',
          'Doppia Chance',
          'Under\/Over 2.5',
          'Gol no gol',
        ].includes(market.name.trim()),
      ),
    },
    {
      name: 'Under/Over',
      markets: props.round.mag_event[0].markets.market.filter((market) =>
      [
        'Under/Over 1.5',
        'Under/Over 2.5',
        'Under/Over 3.5',
        'Under/Over 4.5',
      ].includes(market.name.trim()),
      ),
    }
  ]

  const [selectedTab, setSelectedTab] = useState(marketTabs[0].name)

  function getFloatFromString(text: string): number | undefined {
    const match = text.match(/[-+]?\d*\.\d+([eE][-+]?\d+)?/);
    return match ? parseFloat(match[0]) : undefined;
  }

  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex h-16 flex-row items-center justify-start bg-accent">
        {marketTabs.map((tab, index) => (
          <Button
            key={index}
            variant="navbarSelected"
            className="h-full w-[150px] text-[20px] font-semibold"
            onClick={() => {
              setSelectedTab(tab.name)
            }}
          >
            {tab.name}
          </Button>
        ))}
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader className="h-11 bg-card-header text-[20px] text-card-header-foreground">
            <TableRow className="border-card-foreground transition-none">
              <TableHead className="w-[225px]"></TableHead>
              {marketTabs
                .find((tab) => tab.name === selectedTab)
                ?.markets.map((market, index) => (
                  <>
                    {market.selections
                      .flatMap(({ selection }) => selection)
                      .map((option, i) => (
                        <TableHead
                          key={`${index}-${i}`}
                          className="text-center font-bold"
                        >
                          {option.outcome} {getFloatFromString(market.name)}
                        </TableHead>
                      ))}
                    {index <=
                      market.selections.flatMap(({ selection }) => selection)
                        .length && (
                      <TableHead className="w-[1px] bg-border p-0"></TableHead>
                    )}
                  </>
                ))}
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {props.round.mag_event.length ? (
              props.round.mag_event.map((match, index) => {
                const matchStart = new Date(match.startTime)

                const teamNames = match.teams.team
                  .map((t) => t.name || '')
                  .join(' - ')

                return (
                  <TableRow key={index} className="h-[70px] border-card-foreground">
                    <TableCell className="p-0 text-center">
                      <span className="text-[16px] font-bold">{teamNames}</span>
                    </TableCell>

                    {marketTabs
                      .find((tab) => tab.name === selectedTab)
                      ?.markets.map((market, index) => (
                        <>
                          {market.selections
                            .flatMap(({ selection }) => selection)
                            .map((option, i) => (
                              <TableCell
                                key={i}
                                className="px-[10px] text-center"
                              >
                                <BetEntryToggle
                                  matchStart={matchStart}
                                  round={props.round}
                                  teams={teamNames}
                                  marketName={market.name}
                                  option={option}
                                  className="h-[45px] w-[90px] text-[19px] font-semibold"
                                />
                              </TableCell>
                            ))}
                          {index <=
                            market.selections.flatMap(
                              ({ selection }) => selection,
                            ).length && (
                            <TableCell className="w-[1px] bg-border p-0"></TableCell>
                          )}
                        </>
                      ))}

                    <TableCell className="text-right pr-4">
                      <Button
                        variant="action"
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
                        <ChevronRight style={{ scale: 1.5 }} />
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
