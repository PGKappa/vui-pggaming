'use client'

import { Discipline, Market } from '@/retail-lib/types'
import { format } from 'date-fns'
import { ChevronDown, ChevronsLeftIcon } from 'lucide-react'
import { useDetectClickOutside } from 'react-detect-click-outside'
import { useTranslation } from 'react-i18next'
import { useRef } from 'react'
import BetEntryToggle from './bet-entry-toggle'
import MatchResultCard from './match-result-card'
import MatchStatistics from './match-statistics-card'
import CustomScrollbar from './custom-scrollbar'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export default function MatchBettingOptions(props: {
  round: {
    name: string
    number: number
    startingAt: Date
    roundId?: number
  }
  teams: string
  markets: Market[]
  close: () => void
}) {
  const { t } = useTranslation()
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const ref = useDetectClickOutside({
    onTriggered: props.close,
  })

  return (
    <div ref={ref} className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-row items-center justify-between bg-bet p-3 text-accent-foreground">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="bg-accent text-tertiary-foreground"
            onClick={props.close}
            size="icon-lg"
          >
            <ChevronsLeftIcon style={{ zoom: 2 }} />
          </Button>
          <span className="text-[16px]">
            {props.round.name} {t('round')} {props.round.number} /
          </span>
          <span className="text-[16px] font-semibold">{props.teams}</span>
        </div>
        <span className="relative left-[-5px] text-[17px] font-semibold">
          {format(props.round.startingAt, 'HH:mm')}
        </span>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Contenuto scrollabile - scrollbar nascosta */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="no-scrollbar h-full overflow-y-scroll"
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-row items-start justify-between">
                <MatchResultCard
                  matchResult={{
                    teams: props.teams,
                    score1: 1,
                    score2: 2,
                  }}
                />
                <Separator
                  orientation="vertical"
                  className="mx-4 h-auto bg-border"
                  style={{ minHeight: '200px', width: '1px' }}
                />
                <MatchStatistics
                  match={{
                    teams: props.teams,
                    probabilities: [10, 50, 40],
                    startTime: props.round.startingAt,
                  }}
                />
              </div>

              <div className="pb-20">
                <Accordion type="multiple" className="space-y-2">
                  {props.markets.map((market) => (
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
