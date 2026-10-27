'use client'

import { Discipline, Market, TeamRanking } from '@/retail-lib/types'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useDetectClickOutside } from 'react-detect-click-outside'
import { useRef } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import { detailMarketPriority } from '@/retail-lib/market-order'
import CustomScrollbar from './custom-scrollbar'
import { Button } from './ui/button'
import MatchStatisticsCard from './match-statistics-card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'


export default function MatchBettingOptions(props: {
  round: {
    name: string
    number: number
    startingAt: Date
    roundId?: number
  }
  teams: string
  markets: Market[]
  standings?: TeamRanking[]
  eventId?: number
  close: () => void
}) {

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const orderedMarkets = [...props.markets].sort(
    (a, b) => detailMarketPriority(a.name) - detailMarketPriority(b.name),
  )

  const ref = useDetectClickOutside({
    onTriggered: props.close,
  })

  return (
    <div ref={ref} className="flex h-full w-full flex-col gap-4">
      {/* Barra rossa (nome giornata/squadre/orario) nascosta su richiesta:
          il dettaglio si chiude cliccando fuori. Ripristinabile se serve. */}

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Contenuto scrollabile - scrollbar nascosta */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="no-scrollbar h-full overflow-y-scroll"
          >
            <div className="flex flex-col gap-4">
              {/* Statistiche con dati reali: percentuali ricavate dalle quote
                  1X2 del palinsesto, forma recente dalla classifica del
                  torneo. Il riquadro RISULTATO non viene piu' mostrato. */}
              <div className="relative">
                {/* Torna alla lista mercati della giornata */}
                <Button
                  variant="action"
                  size="icon-lg"
                  className="absolute left-2 top-2 z-10"
                  onClick={props.close}
                >
                  <ChevronLeft style={{ zoom: 1.2 }} />
                </Button>
                <MatchStatisticsCard
                  teams={props.teams}
                  markets={props.markets}
                  standings={props.standings}
                  eventId={props.eventId}
                  groupId={props.round.roundId}
                />
              </div>

              <div className="pb-20">
                <Accordion type="multiple" className="space-y-2">
                  {orderedMarkets.map((market) => (
                    <AccordionItem
                      key={market.name}
                      value={market.name}
                      className="text-accent-foreground"
                    >
                      <AccordionTrigger className="h-12 text-[16px] font-bold">
                        {market.name.toUpperCase()}
                        <ChevronDown className="scale-170 shrink-0 text-white transition-transform duration-200" />
                      </AccordionTrigger>

                      <AccordionContent>
                        <div
                          className={`mb-[-16px] mt-[3px] grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] items-center gap-y-[8px] px-[64px] ${market.selections[0].selection.length > 3 ? 'gap-x-8' : 'gap-x-16'} `}
                        >
                          {market.selections[0].selection.map((option) => (
                            <BetEntryToggle
                              key={option.outcome}
                              bet={{
                                discipline: Discipline.SOCCER,
                                event: {
                                  name: props.round.name,
                                  number: props.round.number,
                                  startingAt: props.round.startingAt,
                                  roundId: props.round.roundId,
                                },
                                competitors: props.teams,
                                option: option,
                              }}
                              marketName={market.name}
                              variant="matchcard"
                              className="h-[45px] w-full font-semibold"
                            />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollbar custom separata */}
        <CustomScrollbar contentRef={scrollContainerRef} />
      </div>
    </div>
  )
}
