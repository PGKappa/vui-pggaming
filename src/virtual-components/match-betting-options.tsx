'use client'

import { Discipline, Market } from '@/virtual-lib/types'
import { format } from 'date-fns'
import { t } from 'i18next'
import { ChevronsLeftIcon } from 'lucide-react'
import BetEntryToggle from './bet-entry-toggle'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

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
    <div className="flex w-full flex-col gap-2">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <Button variant="ghost" onClick={props.close} size="icon">
            <ChevronsLeftIcon />
          </Button>
          <span>
            {props.round.name} {t('round')} {props.round.number} /
          </span>
          <span className="text-sm font-semibold">{props.teams}</span>
        </div>
        <Badge>{format(props.round.startingAt, 'HH:mm')}</Badge>
      </div>
      <Accordion type="multiple">
        {props.markets.map((market) => (
          <AccordionItem key={market.name} value={market.name}>
            <AccordionTrigger>{market.name.toUpperCase()}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-4 px-8">
                {market.selections[0].selection.map((option) => (
                  <BetEntryToggle
                    key={option.outcome}
                    bet={{
                      discipline: Discipline.FOOTBALL,
                      event: {
                        name: props.round.name,
                        number: props.round.number,
                        startingAt: props.round.startingAt,
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
  )
}
