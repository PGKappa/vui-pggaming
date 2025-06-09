'use client'

import { Market } from '@/retail-lib/types'
import { format } from 'date-fns'
import { t } from 'i18next'
import { ChevronDown, ChevronsLeftIcon } from 'lucide-react'
import BetEntryToggle from './bet-entry-toggle'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Button } from './ui/button'
import MatchResultCard from './match-result-card'
import MatchStatistics from './match-statistics-card'
import { Separator } from './ui/separator'

export default function MatchBettingOptions(props: {
  round: {
    name: string
    number: number
    startingAt: Date
  }
  teams: string
  markets: Market[]
  close: () => void
}) {
  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-hidden">
      <div className="sticky top-0 z-10 flex h-16 flex-row items-center justify-between bg-accent text-accent-foreground">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="ml-3 rounded-[8px] bg-tertiary text-tertiary-foreground hover:bg-tertiary/70"
            onClick={props.close}
            size="icon-lg"
          >
            <ChevronsLeftIcon style={{ scale: 2 }} />
          </Button>
          <span className="text-[24px]">
            {props.round.name} {t('round')} {props.round.number} /
          </span>
          <span className="text-[20px] font-semibold">{props.teams}</span>
        </div>
        <span className="mr-5 text-[20px]">
          {format(props.round.startingAt, 'HH:mm')}
        </span>
      </div>
      <div className="flex flex-row items-start justify-between">
        <MatchResultCard
          matchResult={{
            teams: props.teams,
            score1: 1,
            score2: 2,
          }}
        />
        <Separator orientation="vertical" />
        <MatchStatistics
          match={{
            teams: props.teams,
            probabilities: [10, 50, 40],
            startTime: props.round.startingAt,
          }}
        />
      </div>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        <Accordion type="multiple" className="space-y-2">
          {props.markets.map((market) => (
            <AccordionItem
              key={market.name}
              value={market.name}
              className="text-accent-foreground"
            >
              <AccordionTrigger className="h-12 text-[16px] font-bold">
                {market.name.toUpperCase()}
                <ChevronDown className="h-6 w-6 shrink-0 text-card transition-transform duration-200" />
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 justify-items-center gap-4">
                  {market.selections[0].selection.map((option) => (
                    <BetEntryToggle
                      key={option.outcome}
                      matchStart={props.round.startingAt}
                      marketName={market.name}
                      option={option}
                      round={{
                        scheduleName: props.round.name,
                        scheduleId: props.round.number,
                      }}
                      teams={props.teams}
                      showOutcome
                      className="h-[45px] w-[190px] font-semibold"
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
