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
import {
  Dispatch,
  SetStateAction,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import BetEntryToggle from './bet-entry-toggle'

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const res: T[][] = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    res.push(arr.slice(i, i + chunkSize))
  }
  return res
}

// Scala della griglia quote: a piena larghezza (viewport 1920) i tasti sono
// a grandezza piena, a 1280 scendono a MIN_SCALE. Sotto non si rimpicciolisce
// oltre: le colonne finali che non entrano vengono nascoste (tutti i mercati
// restano nel dettaglio del singolo evento).
const CARD_WIDTH_FULL = 1490
const CARD_WIDTH_MIN = 850
const MIN_SCALE = 0.8
// Colonna squadra + colonna freccia + divisori + margine di sicurezza
const FIXED_COLUMNS_WIDTH = 130 + 48 + 2 + 8

// Misura in px a scala piena -> valore CSS che segue --odds-u
const u = (px: number) => `calc(${px}*var(--odds-u))`

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
          eventId?: number
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
        cellClass: '',
        pad: 8,
        gap: 24,
      },
      underover: {
        container: 'flex items-center justify-center',
        cellClass: '',
        pad: 12,
        gap: 44,
      },
      multigoal: {
        container: 'flex items-center justify-center',
        cellClass: '',
        pad: 10,
        gap: 36,
      },
      partialeFinale: {
        container: 'flex items-center justify-center',
        cellClass: '',
        pad: 10,
        gap: 44,
      },
      // Speciale ha 17 quote in riga: tasti stretti e gap ridotti
      special: {
        container: 'flex items-center justify-center',
        cellClass: '',
        pad: 4,
        gap: 6,
      },
    },
    special: {
      homeaway: {
        container: 'flex items-center justify-center',
        cellClass: '',
        pad: 8,
        gap: 8,
        rowGap: 'gap-2',
      },
      exact_result: {
        container: 'flex items-center justify-center',
        cellClass: 'py-2',
        pad: 8,
        gap: 12,
        rowGap: 'gap-0',
      },
      combo: {
        container: 'flex items-center justify-between',
        cellClass: 'py-2',
        pad: 36,
        gap: 8,
        rowGap: 'gap-2',
      },
      homeawayFull: {
        container: 'flex items-center justify-between',
        cellClass: '',
        pad: 12,
        gap: 8,
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
          // Ordine colonne come il riferimento online: 1X2, Doppia Chance,
          // Gol no gol, Under/Over 2.5 (il feed manda la DC per ultima).
          markets: props.round.mag_event[0].markets.market
            .filter((market) =>
              [
                '1X2',
                'Esito finale 1X2',
                'Double Chance',
                'Doppia Chance',
                'Under\/Over 2.5',
                'Gol no gol',
              ].includes(market.name.trim()),
            )
            .sort((a, b) => {
              const prio = (name: string) => {
                const n = name.trim().toLowerCase()
                if (n === '1x2' || n.includes('esito finale')) return 0
                if (n.includes('chance')) return 1
                if (n.includes('gol no gol')) return 2
                return 3
              }
              return prio(a.name) - prio(b.name)
            }),
        },
        {
          name: t('under/over'),
          // Colonne in ordine crescente di soglia (1.5, 2.5, 3.5, 4.5):
          // il feed le manda in ordine sparso.
          markets: props.round.mag_event[0].markets.market
            .filter((market) =>
              [
                'Under/Over 1.5',
                'Under/Over 2.5',
                'Under/Over 3.5',
                'Under/Over 4.5',
              ].includes(market.name.trim()),
            )
            .sort(
              (a, b) =>
                parseFloat(a.name.match(/\d+\.\d+/)?.[0] ?? '0') -
                parseFloat(b.name.match(/\d+\.\d+/)?.[0] ?? '0'),
            ),
        },
        {
          name: t('exact_result'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['Correct Score', 'Risultato esatto'].includes(market.name.trim()),
          ),
        },
        {
          name: t('combo'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            [
              'Combo 1x2 + Goal\/No Goal',
              'Combo 1x2 + Under\/Over (1.5)',
              'Combo 1x2 + Under\/Over (2.5)',
              'Combo Vincente & Segna',
              'Combo Vincente & Goals (1.5)',
              'Combo Vincente & Goals (2.5)',
            ].includes(market.name.trim()),
          ),
        },
        {
          name: t('multi_goal'),
          // Colonne in ordine: Multigoal, Multi Goal Casa, Multi Goal Trasferta.
          markets: props.round.mag_event[0].markets.market
            .filter((market) =>
              [
                'Multigoal',
                'Multigoal Home',
                'Multigoal Away',
                'Somma gol',
                'Somma gol Casa',
                'Somma gol Trasferta',
              ].includes(market.name.trim()),
            )
            .sort((a, b) => {
              const prio = (name: string) => {
                const n = name.trim().toLowerCase()
                if (n.includes('casa') || n.includes('home')) return 1
                if (n.includes('trasferta') || n.includes('away')) return 2
                return 0
              }
              return prio(a.name) - prio(b.name)
            }),
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
              'Casa Under/Over 0.5',
              'Casa Under/Over 1.5',
              'Casa Under/Over 2.5',
              'Trasferta Under/Over 0.5',
              'Trasferta Under/Over 1.5',
              'Trasferta Under/Over 2.5',
            ].includes(market.name.trim()),
          ),
        },
        {
          name: t('partial/final'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            ['Half Time\/ Full Time', 'Parziale\/Finale'].includes(
              market.name.trim(),
            ),
          ),
        },
        {
          name: t('special'),
          markets: props.round.mag_event[0].markets.market.filter((market) =>
            [
              'First Scorer',
              'Red Card',
              'Primo marcatore',
              'Cartellino Rosso',
              'Margine di vittoria',
            ].includes(market.name.trim()),
          ),
        },
      ]
    : []

  const specialTabs = [t('exact_result'), t('combo'), t('home/away_team')]

  const [selectedTab, setSelectedTab] = useState(
    marketTabs.length > 0 ? marketTabs[0].name : '',
  )

  const cardRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState<number>()

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card) return
    const observer = new ResizeObserver(([entry]) =>
      setCardWidth(entry.contentRect.width),
    )
    observer.observe(card)
    return () => observer.disconnect()
  }, [hasEvents])

  const scale = cardWidth
    ? Math.min(
        1,
        Math.max(
          MIN_SCALE,
          MIN_SCALE +
            ((1 - MIN_SCALE) * (cardWidth - CARD_WIDTH_MIN)) /
              (CARD_WIDTH_FULL - CARD_WIDTH_MIN),
        ),
      )
    : 1
  const availableWidth = cardWidth ? cardWidth - FIXED_COLUMNS_WIDTH : Infinity

  const isSpecialTab = specialTabs.includes(selectedTab)
  const tabConfig = isSpecialTab
    ? getSpecialTabConfig(selectedTab)
    : getLayoutConfig(selectedTab)
  const buttonWidth = selectedTab === t('special') ? 68 : 100
  const optionsCount = (market: Market) =>
    market.selections.flatMap(({ selection }) => selection).length

  const tabMarkets =
    marketTabs.find((tab) => tab.name === selectedTab)?.markets ?? []

  // Tasti per riga a piena larghezza (Combo e Risultato esatto vanno gia' a
  // capo, gli altri stanno su una riga sola)
  const naturalPerRow = (market: Market) => {
    const count = optionsCount(market)
    if (!isSpecialTab || selectedTab === t('home/away_team')) return count
    return Math.min(count, selectedTab === t('combo') ? 3 : 12)
  }

  // Risultato esatto ha un solo mercato: invece di nascondere quote si
  // riducono i tasti per riga (righe bilanciate) finche' entrano.
  const buttonsPerRow = (market: Market) => {
    const natural = naturalPerRow(market)
    if (selectedTab !== t('exact_result')) return natural
    const fitGap = Math.min(tabConfig.gap, 8)
    const fit = Math.floor(
      (availableWidth / scale - 1 - 2 * tabConfig.pad + fitGap) /
        (buttonWidth + fitGap),
    )
    if (fit >= natural) return natural
    const rows = Math.ceil(optionsCount(market) / Math.max(1, fit))
    return Math.ceil(optionsCount(market) / rows)
  }

  const marketWidth = (market: Market) => {
    const perRow = buttonsPerRow(market)
    return (
      1 +
      (2 * tabConfig.pad +
        perRow * buttonWidth +
        (perRow - 1) * tabConfig.gap) *
        scale
    )
  }
  // Colonne occupate dal mercato in tabella (colSpan)
  const marketColumns = (market: Market) =>
    isSpecialTab ? 1 : optionsCount(market)

  // Con table-fixed lo spazio si divide in parti uguali per colonna: ogni
  // mercato deve entrare nella sua quota, altrimenti si toglie l'ultimo.
  let visibleCount = tabMarkets.length
  while (visibleCount > 1) {
    const shown = tabMarkets.slice(0, visibleCount)
    const totalColumns = shown.reduce((sum, m) => sum + marketColumns(m), 0)
    const fits = shown.every(
      (m) =>
        marketWidth(m) <= (availableWidth * marketColumns(m)) / totalColumns,
    )
    if (fits) break
    visibleCount--
  }
  const visibleMarkets = tabMarkets.slice(0, visibleCount)
  const visibleColumns = visibleMarkets.reduce(
    (sum, m) => sum + marketColumns(m),
    0,
  )

  // Se sono state nascoste colonne resta spazio libero nelle celle: i tasti
  // stretti (Speciale) tornano larghi come gli altri e lo spazio rimasto si
  // divide in parti uguali tra i tasti e ai lati. A piena larghezza restano
  // le misure del config.
  const marketButtonsStyle = (market: Market) => {
    const perRow = buttonsPerRow(market)
    const cellWidth =
      (availableWidth * marketColumns(market)) / visibleColumns / scale
    const room = cellWidth - 2 * tabConfig.pad
    if (
      visibleCount === tabMarkets.length &&
      perRow === naturalPerRow(market)
    ) {
      // Misure del config; se la riga non entra (Parziale/Finale, un solo
      // mercato su una riga) si riducono prima il gap e poi i tasti, fino
      // alla larghezza dei tasti di Speciale.
      const minGap = Math.min(tabConfig.gap, 8)
      const width = Math.min(
        buttonWidth,
        Math.max(68, (room - (perRow - 1) * minGap) / perRow),
      )
      const gap = Math.min(
        tabConfig.gap,
        Math.max(0, (room - perRow * width) / Math.max(1, perRow - 1)),
      )
      return {
        gap: u(gap),
        '--odds-btn-w': u(width),
      } as React.CSSProperties
    }
    const width = Math.max(
      buttonWidth,
      Math.min(100, (room - (perRow - 1) * tabConfig.gap) / perRow),
    )
    const gap = Math.max(tabConfig.gap, (room - perRow * width) / (perRow + 1))
    return { gap: u(gap), '--odds-btn-w': u(width) } as React.CSSProperties
  }

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
          <span>
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
          <span>
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
    <Card
      ref={cardRef}
      className="border-card-foreground"
      style={{ '--odds-u': `${scale}px` } as React.CSSProperties}
    >
      {/* Tab mercati: se a risoluzioni basse non entrano compare la
          scrollbar sottile orizzontale, visibile solo al passaggio del
          mouse (.hover-scrollbar) */}
      <CardHeader className="sticky top-0 z-40 flex h-[72px] w-full flex-row items-center justify-start hover-scrollbar gap-2 overflow-x-auto bg-accent pl-[14px] pr-2">
        {marketTabs.map((tab, index) => (
          <Button
            key={index}
            variant={selectedTab === tab.name ? 'marketSelected' : 'market'}
            className="h-[47px] w-[177px] shrink-0 px-2 pb-[1px] text-[15px] font-semibold uppercase"
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
              {visibleMarkets.map((market, index) => {
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
                      colSpan={optionsCount(market)}
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
                      return visibleMarkets.map((market, marketIndex) => {
                        if (isSpecialTab) {
                          // Per CASA/TRASFERTA mostriamo i pulsanti di ogni mercato in riga
                          if (selectedTab === t('home/away_team')) {
                            const options = market.selections.flatMap(
                              ({ selection }) => selection,
                            )

                            return (
                              <React.Fragment
                                key={`special-market-${marketIndex}`}
                              >
                                <TableCell className="w-[1px] bg-black p-0"></TableCell>
                                <TableCell
                                  className={tabConfig.cellClass}
                                  style={{ paddingInline: u(tabConfig.pad) }}
                                >
                                  <div
                                    className={tabConfig.container}
                                    style={marketButtonsStyle(market)}
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
                                        className="h-[50px] w-[var(--odds-btn-w)] text-[length:calc(16*var(--odds-u))] font-semibold tabular-nums"
                                      />
                                    ))}
                                  </div>
                                </TableCell>
                              </React.Fragment>
                            )
                          }

                          const options = market.selections.flatMap(
                            ({ selection }) => selection,
                          )
                          const optionsChunks = chunkArray(
                            options,
                            buttonsPerRow(market),
                          )

                          return (
                            <React.Fragment
                              key={`special-market-${marketIndex}`}
                            >
                              <TableCell className="w-[1px] bg-black p-0"></TableCell>
                              <TableCell
                                className={tabConfig.cellClass}
                                style={{ paddingInline: u(tabConfig.pad) }}
                              >
                                <div className="flex flex-col gap-2">
                                  {optionsChunks.map((chunk, chunkIndex) => (
                                    <div
                                      key={chunkIndex}
                                      className={tabConfig.container}
                                      style={marketButtonsStyle(market)}
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
                                          className="h-[50px] w-[var(--odds-btn-w)] text-[length:calc(16*var(--odds-u))] font-semibold tabular-nums"
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
                              colSpan={optionsCount(market)}
                              className={tabConfig.cellClass}
                              style={{ paddingInline: u(tabConfig.pad) }}
                            >
                              <div className="flex flex-col gap-2">
                                {chunkArray(
                                  market.selections.flatMap(
                                    ({ selection }) => selection,
                                  ),
                                  buttonsPerRow(market),
                                ).map((chunk, chunkIndex) => (
                                  <div
                                    key={chunkIndex}
                                    className={tabConfig.container}
                                    style={marketButtonsStyle(market)}
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
                                            roundId:
                                              match.eventIdentity.groupId,
                                          },
                                          competitors: teamNames,
                                          option: option,
                                        }}
                                        marketName={market.name}
                                        variant="roundcard"
                                        className={`h-[50px] w-[var(--odds-btn-w)] ${selectedTab === t('special') ? 'whitespace-nowrap' : ''} text-[length:calc(16*var(--odds-u))] font-semibold tabular-nums`}
                                      />
                                    ))}
                                  </div>
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
                            eventId: match.eventIdentity.eventId,
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
