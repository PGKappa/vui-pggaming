'use client'

import { Market } from '@/retail-lib/types'
import { format } from 'date-fns'
import { ChevronDown, ChevronsLeftIcon } from 'lucide-react'
import { useDetectClickOutside } from 'react-detect-click-outside'
import { useTranslation } from 'react-i18next'
import BetEntryToggle from './bet-entry-toggle'
import MatchResultCard from './match-result-card'
import MatchStatistics from './match-statistics-card'
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
  }
  teams: string
  markets: Market[]
  close: () => void
}) {
  const { t } = useTranslation()

  const ref = useDetectClickOutside({
    onTriggered: props.close,
  })

  return (
    <div ref={ref} className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-row items-center justify-between bg-accent p-3 text-accent-foreground">
        <div className="flex flex-row items-center gap-2">
          <Button
            className="rounded-[8px] bg-tertiary text-tertiary-foreground hover:bg-tertiary/70"
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
        <span className="text-[20px]">
          {format(props.round.startingAt, 'HH:mm')}
        </span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto">
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
                  <ChevronDown className="h-6 w-6 shrink-0 text-card transition-transform duration-200" />
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-3 items-center justify-between gap-4 px-2">
                    {market.selections[0].selection.map((option) => (
                      <BetEntryToggle
                        key={option.outcome}
                        bet={{
                          event: {
                            name: props.round.name,
                            number: props.round.number,
                            startingAt: props.round.startingAt,
                          },
                          competitor: props.teams,
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
  )
}
