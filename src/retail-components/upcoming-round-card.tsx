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
import { Discipline, Market, UpcomingRound } from '@/retail-lib/types'
import { ChevronRight } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BetEntryToggle from './bet-entry-toggle'

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    res.push(arr.slice(i, i + chunkSize))
  }
  return res
}

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
      name: t('main'),
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
      name: t('under/over'),
      markets: props.round.mag_event[0].markets.market.filter((market) =>
        [
          'Under/Over 1.5',
          'Under/Over 2.5',
          'Under/Over 3.5',
          'Under/Over 4.5',
        ].includes(market.name.trim()),
      ),
    },
    {
      name: t('exact_result'),
      markets: props.round.mag_event[0].markets.market.filter(
        (market) => ['Risultato esatto'].includes(market.name.trim()), // need more columns
      ),
    },
    {
      name: t('combo'),
      markets: props.round.mag_event[0].markets.market.filter(
        (market) =>
          [
            'Combo Vincente & Segna',
            'Combo Vincente & Goals (1.5)',
            'Combo Vincente & Goals (2.5)',
          ].includes(market.name.trim()), //need more columns
      ),
    },
    {
      name: t('multi_goal'),
      markets: props.round.mag_event[0].markets.market.filter((market) =>
        ['Somma gol', 'Somma gol Casa', 'Somma gol Trasferta'].includes(
          market.name.trim(),
        ),
      ),
    },
    {
      name: t('home/away_team'),
      markets: props.round.mag_event[0].markets.market.filter(
        (market) =>
          [
            'Casa Under/Over 0.5',
            'Casa Under/Over 1.5',
            'Casa Under/Over 2.5',
            'Trasferta Under/Over 0.5',
            'Trasferta Under/Over 1.5',
            'Trasferta Under/Over 2.5',
          ].includes(market.name.trim()), // need more columns
      ),
      /* .map((market) => ({
          ...market,
          selections: market.selections.map((selection) => ({
            ...selection,
            selection: selection.selection.map((option) => ({
              ...option,
              outcome: `${market.name.includes('Casa') ? t('home') : t('away')} - ${option.outcome}`,
            })),
          })),
        })) */
    },
    {
      name: t('partial/final'),
      markets: props.round.mag_event[0].markets.market.filter((market) =>
        ['Parziale/Finale'].includes(market.name.trim()),
      ),
    },
    {
      name: t('special'),
      markets: props.round.mag_event[0].markets.market.filter((market) =>
        ['Primo marcatore', 'Cartellino Rosso'].includes(market.name.trim()),
      ),
    },
  ]

  const specialTabs = [t('exact_result'), t('combo'), t('home/away_team')]

  const [selectedTab, setSelectedTab] = useState(marketTabs[0].name)

  return (
    <Card className="border-b border-t border-card-foreground">
      <CardHeader className="flex h-16 w-full flex-row items-center justify-start gap-2 bg-accent">
        {marketTabs.map((tab, index) => (
          <Button
            key={index}
            variant={selectedTab === tab.name ? 'marketSelected' : 'market'}
            className="h-full w-fit border border-b px-2 text-[20px] font-semibold"
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
              <TableHead></TableHead>
              <TableHead className="w-[1px] bg-white p-0"></TableHead>
              {marketTabs
                .find((tab) => tab.name === selectedTab)
                ?.markets.map((market, index) => {
                  const optionsCount = market.selections.flatMap(
                    ({ selection }) => selection,
                  ).length

                  const isSpecialTab = specialTabs.includes(selectedTab)
                  if (isSpecialTab) {
                    return (
                      <>
                        <TableHead
                          key={index}
                          className="text-center font-bold"
                          colSpan={1}
                        >
                          {market.name}
                        </TableHead>
                        <TableHead className="w-[1px] bg-white p-0"></TableHead>
                      </>
                    )
                  }

                  return (
                    <>
                      <TableHead
                        key={index}
                        className="text-center font-bold"
                        colSpan={optionsCount}
                      >
                        {market.name}
                      </TableHead>
                      {!isSpecialTab && (
                        <TableHead className="w-[1px] bg-white p-0"></TableHead>
                      )}
                    </>
                  )
                })}
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
                  <TableRow
                    key={index}
                    className="h-[70px] items-center justify-between border-card-foreground"
                  >
                    <TableCell className="w-[150px] min-w-[150px] max-w-[150px] whitespace-nowrap text-center text-[16px] font-bold">
                      {teamNames}
                    </TableCell>

                    <TableCell className="w-[1px] bg-border p-0"></TableCell>

                    {marketTabs
                      .find((tab) => tab.name === selectedTab)
                      ?.markets.map((market, marketIndex) => {
                        const isSpecialTab = specialTabs.includes(selectedTab)
                        if (isSpecialTab) {
                          let chunckSize = 12
                          if (selectedTab === t('combo')) chunckSize = 3
                          if (selectedTab === t('home/away_team'))
                            chunckSize = 1

                          const options = market.selections.flatMap(
                            ({ selection }) => selection,
                          )
                          const optionsChunks = chunkArray(options, chunckSize)
                          return (
                            <>
                              <TableCell
                                key={marketIndex}
                                className="justify-items-center px-[10px]"
                              >
                                {optionsChunks.map((chunk, chunkIndex) => (
                                  <div
                                    key={chunkIndex}
                                    className="flex flex-row items-center gap-2 py-1"
                                  >
                                    {chunk.map((option, i) => (
                                      <BetEntryToggle
                                        key={i}
                                        bet={{
                                          discipline: Discipline.SOCCER,
                                          event: {
                                            name: match.eventIdentity.eventName,
                                            number: match.eventIdentity.eventId,
                                            startingAt: matchStart,
                                          },
                                          competitors: teamNames,
                                          option: option,
                                        }}
                                        marketName={market.name}
                                        variant="roundcard"
                                        className="w-[100px] text-[19px] font-semibold"
                                      />
                                    ))}
                                  </div>
                                ))}
                              </TableCell>
                              <TableCell className="w-[1px] bg-border p-0"></TableCell>
                            </>
                          )
                        }

                        return (
                          <>
                            {market.selections
                              .flatMap(({ selection }) => selection)
                              .map((option, i) => (
                                <TableCell
                                  key={i}
                                  className="justify-items-center px-[10px]"
                                >
                                  <BetEntryToggle
                                    bet={{
                                      discipline: Discipline.SOCCER,
                                      event: {
                                        name: match.eventIdentity.eventName,
                                        number: match.eventIdentity.eventId,
                                        startingAt: matchStart,
                                      },
                                      competitors: teamNames,
                                      option: option,
                                    }}
                                    marketName={market.name}
                                    variant="roundcard"
                                    className="w-[100px] text-[19px] font-semibold"
                                  />
                                </TableCell>
                              ))}
                            {!isSpecialTab && (
                              <TableCell className="w-[1px] bg-border p-0"></TableCell>
                            )}
                          </>
                        )
                      })}

                    <TableCell className="pr-2 text-right">
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
