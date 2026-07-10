import React from 'react'
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
            roundId?: number
          }
          teams: string
          markets: Market[]
        }
      | undefined
    >
  >
  onTabChange?: (tabName: string) => void
}) {
  const { t } = useTranslation()

  const layoutConfig = {
    normal: {
      main: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-2',
        gap: 'gap-6',
      },
      underover: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-3',
        gap: 'gap-11',
      },
      multigoal: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-2.5',
        gap: 'gap-9',
      },
      partialeFinale: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-2.5',
        gap: 'gap-11',
      },
      special: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-7',
        gap: 'gap-10',
      },
    },
    special: {
      homeaway: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-2',
        gap: 'gap-2',
        rowGap: 'gap-2',
      },
      exact_result: {
        container: 'flex items-center justify-center',
        cellPadding: 'px-2 py-2',
        gap: 'gap-3',
        rowGap: 'gap-0',
      },
      combo: {
        container: 'flex items-center justify-between',
        cellPadding: 'px-9 py-2',
        gap: 'gap-2',
        rowGap: 'gap-2',
      },
      homeawayFull: {
        container: 'flex items-center justify-between',
        cellPadding: 'px-3',
        gap: 'gap-2',
        rowGap: 'gap-2',
      },
    },
  }

  // Helper per ottenere la configurazione layout corretta
  const getLayoutConfig = (tabName: string) => {
    if (tabName === t('main')) return layoutConfig.normal.main
    if (tabName === t('under/over')) return layoutConfig.normal.underover
    if (tabName === t('multi_goal')) return layoutConfig.normal.multigoal
    if (tabName === t('partial/final'))
      return layoutConfig.normal.partialeFinale
    return layoutConfig.normal.special
  }

  const getSpecialTabConfig = (tabName: string) => {
    if (tabName === t('home/away_team')) return layoutConfig.special.homeaway
    if (tabName === t('exact_result')) return layoutConfig.special.exact_result
    if (tabName === t('combo')) return layoutConfig.special.combo
    return layoutConfig.special.homeawayFull
  }

  // Funzione per tradurre i nomi dei mercati
  const translateMarketName = (marketName: string): string => {
    const marketMap: { [key: string]: string } = {
      'Esito finale 1X2': t('market_esito_finale_1x2'),
      'Double Chance': t('market_doppia_chance').toUpperCase(),
      'Doppia Chance': t('market_doppia_chance').toUpperCase(),
      'Under/Over 2.5': t('market_under_over_2_5').toUpperCase(),
      'Gol no gol': t('market_gol_no_gol').toUpperCase(),
      'Under/Over 1.5': t('market_under_over_1_5').toUpperCase(),
      'Under/Over 3.5': t('market_under_over_3_5').toUpperCase(),
      'Under/Over 4.5': t('market_under_over_4_5').toUpperCase(),
      'Correct Score': t('market_risultato_esatto').toUpperCase(),
      'Risultato esatto': t('market_risultato_esatto').toUpperCase(),
      'Combo 1x2 + Goal/No Goal': '1X2 + GOL/NO GOL',
      'Combo Vincente & Segna': t('market_combo_vincente_segna').toUpperCase(),
      'Combo 1x2 + Under/Over (1.5)': t(
        'market_combo_vincente_goals_1_5',
      ).toUpperCase(),
      'Combo Vincente & Goals (1.5)': t(
        'market_combo_vincente_goals_1_5',
      ).toUpperCase(),
      'Combo 1x2 + Under/Over (2.5)': t(
        'market_combo_vincente_goals_2_5',
      ).toUpperCase(),
      'Combo Vincente & Goals (2.5)': t(
        'market_combo_vincente_goals_2_5',
      ).toUpperCase(),
      'Somma gol': t('market_somma_gol').toUpperCase(),
      'Somma gol Casa': t('market_somma_gol_casa').toUpperCase(),
      'Somma gol Trasferta': t('market_somma_gol_trasferta').toUpperCase(),
      'Casa Under/Over 0.5': t('market_casa_under_over_0_5').toUpperCase(),
      'Casa Under/Over 1.5': t('market_casa_under_over_1_5').toUpperCase(),
      'Casa Under/Over 2.5': t('market_casa_under_over_2_5').toUpperCase(),
      'Trasferta Under/Over 0.5': t(
        'market_trasferta_under_over_0_5',
      ).toUpperCase(),
      'Trasferta Under/Over 1.5': t(
        'market_trasferta_under_over_1_5',
      ).toUpperCase(),
      'Trasferta Under/Over 2.5': t(
        'market_trasferta_under_over_2_5',
      ).toUpperCase(),
      'Half Time/ Full Time': t('market_parziale_finale').toUpperCase(),
      'Parziale/Finale': t('market_parziale_finale').toUpperCase(),
      'First Scorer': t('market_primo_marcatore').toUpperCase(),
      'Primo marcatore': t('market_primo_marcatore').toUpperCase(),
      'Red Card': t('market_cartellino_rosso').toUpperCase(),
      'Cartellino Rosso': t('market_cartellino_rosso').toUpperCase(),
      'Multigoal Home': `${t('multi_goal').toUpperCase()} ${t('home_extended').toUpperCase()}`,
      'Multigoal Away': `${t('multi_goal').toUpperCase()} ${t('away_extended').toUpperCase()}`,
      'Home Under/Over 0.5': `${t('home_extended').toUpperCase()} ${t('under/over').toUpperCase()} 0.5`,
      'Home Under/Over 1.5': `${t('home_extended').toUpperCase()} ${t('under/over').toUpperCase()} 1.5`,
      'Home Under/Over 2.5': `${t('home_extended').toUpperCase()} ${t('under/over').toUpperCase()} 2.5`,
      'Away Under/Over 0.5': `${t('away_extended').toUpperCase()} ${t('under/over').toUpperCase()} 0.5`,
      'Away Under/Over 1.5': `${t('away_extended').toUpperCase()} ${t('under/over').toUpperCase()} 1.5`,
      'Away Under/Over 2.5': `${t('away_extended').toUpperCase()} ${t('under/over').toUpperCase()} 2.5`,
    }

    return marketMap[marketName.trim()] || marketName
  }

  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  // Verifica sicurezza per evitare errori runtime
  const hasEvents = props.round.mag_event && props.round.mag_event.length > 0

  const marketTabs: { name: string; markets: Market[] }[] = hasEvents
    ? [
        {
          name: t('main'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['1X2', 'Double Chance', 'Under\/Over 2.5', 'Gol no gol'].includes(
              market.name.trim(),
            ),
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
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['Correct Score'].includes(market.name.trim()),
          ),
        },
        {
          name: t('combo'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            [
              'Combo 1x2 + Goal\/No Goal',
              'Combo 1x2 + Under\/Over (1.5)',
              'Combo 1x2 + Under\/Over (2.5)',
            ].includes(market.name.trim()),
          ),
        },
        {
          name: t('multi_goal'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['Multigoal', 'Multigoal Home', 'Multigoal Away'].includes(
              market.name.trim(),
            ),
          ),
        },
        {
          name: t('home/away_team'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            [
              'Home Under\/Over 0.5',
              'Home Under\/Over 1.5',
              'Home Under\/Over 2.5',
              'Away Under\/Over 0.5',
              'Away Under\/Over 1.5',
              'Away Under\/Over 2.5',
            ].includes(market.name.trim()),
          ),
        },
        {
          name: t('partial/final'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['Half Time\/ Full Time'].includes(market.name.trim()),
          ),
        },
        {
          name: t('special'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['First Scorer', 'Red Card'].includes(market.name.trim()),
          ),
        },
      ]
    : []

  const specialTabs = [t('exact_result'), t('combo'), t('home/away_team')]

  const [selectedTab, setSelectedTab] = useState(
    marketTabs.length > 0 ? marketTabs[0].name : '',
  )

  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName)

    setTimeout(() => {
      const container =
        document.querySelector('div.h-\\[805px\\].overflow-y-auto') ||
        document.querySelector('[class*="overflow-y-auto"]')

      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 50)

    props.onTabChange?.(tabName)
  }

  const formatMarketHeader = (marketName: string) => {
    const translatedName = translateMarketName(marketName)

    if (marketName.includes('Casa Under/Over')) {
      const valueMatch = marketName.match(/(\d+\.?\d*)/)
      const value = valueMatch ? valueMatch[1] : ''

      return (
        <div className="flex flex-col">
          <span className="text-[20px]">
            {t('home_extended').toUpperCase()} {t('un/ov')} {value}
          </span>
        </div>
      )
    }

    if (marketName.includes('Trasferta Under/Over')) {
      const valueMatch = marketName.match(/(\d+\.?\d*)/)
      const value = valueMatch ? valueMatch[1] : ''

      return (
        <div className="flex flex-col">
          <span className="text-[20px]">
            {t('away_extended').toUpperCase()} {t('un/ov')} {value}
          </span>
        </div>
      )
    }

    return translatedName
  }

  if (!hasEvents) {
    return (
      <Card className="border-b border-t border-card-foreground">
        <CardHeader className="sticky top-0 z-40 flex h-28 w-full flex-row items-center justify-center gap-2 border-b bg-accent">
          <div className="text-lg">{t('no_events_available')}</div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-card-foreground">
      <CardHeader className="sticky top-0 z-40 flex h-[72px] w-full flex-row items-center justify-start gap-2 bg-accent px-2">
        {marketTabs.map((tab, index) => (
          <Button
            key={index}
            variant={selectedTab === tab.name ? 'marketSelected' : 'market'}
            className="relative left-[6px] h-[47px] w-[177px] px-2 pb-[1px] text-[15px] font-semibold uppercase"
            onClick={() => handleTabChange(tab.name)}
          >
            {tab.name}
          </Button>
        ))}
      </CardHeader>

      <CardContent className="px-0">
        <Table className="table-fixed">
          <TableHeader className="h-11 bg-card-header text-[20px] text-card-header-foreground">
            <TableRow className="border-card-foreground transition-none">
              <TableHead className="w-[130px] min-w-[130px] max-w-[130px] text-center text-[16px] font-semibold">
                {t('round')} {props.round.scheduleId}
              </TableHead>
              <TableHead className="w-[1px] bg-card-header p-0"></TableHead>
              {marketTabs
                .find((tab) => tab.name === selectedTab)
                ?.markets.map((market, index) => {
                  const optionsCount = market.selections.flatMap(
                    ({ selection }) => selection,
                  ).length

                  const isSpecialTab = specialTabs.includes(selectedTab)
                  if (isSpecialTab) {
                    return (
                      <React.Fragment key={`special-${index}`}>
                        <TableHead className="w-[1px] bg-card-header p-0"></TableHead>
                        <TableHead
                          className="text-center font-semibold"
                          colSpan={1}
                        >
                          {formatMarketHeader(market.name)}
                        </TableHead>
                      </React.Fragment>
                    )
                  }

                  return (
                    <React.Fragment key={`market-${index}`}>
                      <TableHead className="w-[1px] bg-card-header p-0"></TableHead>
                      <TableHead
                        className="p-0 text-center font-semibold"
                        colSpan={optionsCount}
                      >
                        {formatMarketHeader(market.name)}
                      </TableHead>
                    </React.Fragment>
                  )
                })}{' '}
              <TableHead className="w-[1px] bg-card-header p-0"></TableHead>{' '}
              <TableHead className="w-[48px] min-w-[48px] max-w-[48px]"></TableHead>
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
                    className="h-[67px] items-center justify-between border-card-foreground tabular-nums"
                  >
                    <TableCell className="w-[130px] min-w-[130px] max-w-[130px] whitespace-nowrap text-start text-[17px] font-bold">
                      <div className="flex flex-col text-center">
                        <span>{teamNames}</span>

                        <span className="text-center text-[14px] font-bold text-accent">
                          <span>
                            <span>ID&nbsp;&nbsp;{index + 1}</span>
                          </span>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="w-[1px] bg-white p-0"></TableCell>

                    {(() => {
                      const currentMarkets =
                        marketTabs.find((tab) => tab.name === selectedTab)
                          ?.markets || []
                      const isSpecialTab = specialTabs.includes(selectedTab)

                      return currentMarkets.map((market, marketIndex) => {
                        if (isSpecialTab) {
                          // Per CASA/TRASFERTA mostriamo i pulsanti di ogni mercato in riga
                          if (selectedTab === t('home/away_team')) {
                            const options = market.selections.flatMap(
                              ({ selection }) => selection,
                            )
                            const config = getSpecialTabConfig(selectedTab)

                            return (
                              <React.Fragment
                                key={`special-market-${marketIndex}`}
                              >
                                <TableCell className="w-[1px] bg-black p-0"></TableCell>
                                <TableCell className={config.cellPadding}>
                                  <div
                                    className={`${config.container} ${config.gap}`}
                                  >
                                    {options.map((option, i) => (
                                      <BetEntryToggle
                                        key={i}
                                        bet={{
                                          discipline: Discipline.SOCCER,
                                          event: {
                                            name: match.eventIdentity.eventName,
                                            number: match.eventIdentity.eventId,
                                            startingAt: matchStart,
                                            roundId:
                                              match.eventIdentity.groupId,
                                          },
                                          competitors: teamNames,
                                          option: option,
                                        }}
                                        marketName={market.name}
                                        variant="roundcard"
                                        className="h-[50px] w-[100px] text-[16px] font-semibold tabular-nums"
                                      />
                                    ))}
                                  </div>
                                </TableCell>
                              </React.Fragment>
                            )
                          }

                          let chunckSize = 12
                          if (selectedTab === t('combo')) chunckSize = 3

                          const options = market.selections.flatMap(
                            ({ selection }) => selection,
                          )
                          const optionsChunks = chunkArray(options, chunckSize)
                          const config = getSpecialTabConfig(selectedTab)

                          return (
                            <React.Fragment
                              key={`special-market-${marketIndex}`}
                            >
                              <TableCell className="w-[1px] bg-black p-0"></TableCell>
                              <TableCell className={config.cellPadding}>
                                <div className="flex flex-col gap-2">
                                  {optionsChunks.map((chunk, chunkIndex) => (
                                    <div
                                      key={chunkIndex}
                                      className={`${config.container} ${config.gap}`}
                                    >
                                      {chunk.map((option, i) => (
                                        <BetEntryToggle
                                          key={i}
                                          bet={{
                                            discipline: Discipline.SOCCER,
                                            event: {
                                              name: match.eventIdentity
                                                .eventName,
                                              number:
                                                match.eventIdentity.eventId,
                                              startingAt: matchStart,
                                              roundId:
                                                match.eventIdentity.groupId,
                                            },
                                            competitors: teamNames,
                                            option: option,
                                          }}
                                          marketName={market.name}
                                          variant="roundcard"
                                          className="h-[50px] w-[100px] text-[16px] font-semibold tabular-nums"
                                        />
                                      ))}
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </React.Fragment>
                          )
                        }

                        return (
                          <React.Fragment key={`regular-market-${marketIndex}`}>
                            <TableCell className="w-[1px] bg-black p-0"></TableCell>
                            <TableCell
                              colSpan={
                                market.selections.flatMap(
                                  ({ selection }) => selection,
                                ).length
                              }
                              className={
                                getLayoutConfig(selectedTab).cellPadding
                              }
                            >
                              <div
                                className={`${getLayoutConfig(selectedTab).container} ${getLayoutConfig(selectedTab).gap}`}
                              >
                                {market.selections
                                  .flatMap(({ selection }) => selection)
                                  .map((option, i) => (
                                    <BetEntryToggle
                                      key={i}
                                      bet={{
                                        discipline: Discipline.SOCCER,
                                        event: {
                                          name: match.eventIdentity.eventName,
                                          number: match.eventIdentity.eventId,
                                          startingAt: matchStart,
                                          roundId: match.eventIdentity.groupId,
                                        },
                                        competitors: teamNames,
                                        option: option,
                                      }}
                                      marketName={market.name}
                                      variant="roundcard"
                                      className="h-[50px] w-[100px] text-[16px] font-semibold tabular-nums"
                                    />
                                  ))}
                              </div>
                            </TableCell>
                          </React.Fragment>
                        )
                      })
                    })()}

                    <TableCell className="w-[1px] bg-black p-0"></TableCell>
                    <TableCell className="w-[48px] min-w-[48px] max-w-[48px] items-center justify-center text-center">
                      <Button
                        variant="action"
                        size="icon-lg"
                        onClick={() =>
                          props.viewMatchBettingOptions({
                            round: {
                              name: props.round.scheduleName,
                              number: props.round.scheduleId,
                              startingAt: matchStart,
                              roundId: match.eventIdentity.groupId,
                            },
                            teams: teamNames,
                            markets: match.markets.market,
                          })
                        }
                      >
                        <ChevronRight style={{ zoom: 1.2 }} />
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
