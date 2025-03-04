'use client'

import { BetOption, BetOptionMarket, BetOptionMarketLabels } from '@/lib/types'
import { Button } from './ui/button'
import { ChevronsLeftIcon } from 'lucide-react'
import { Badge } from './ui/badge'
import { format } from 'date-fns'
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
  }
  teams: string
  betOptions: Array<{ market: BetOptionMarket; options: BetOption[] }>
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
            {props.round.name} Round {props.round.number} /
          </span>
          <span className="text-sm font-semibold">{props.teams}</span>
        </div>
        <Badge>{format(props.round.startingAt, 'HH:mm')}</Badge>
      </div>
      <Accordion type="multiple">
        {props.betOptions.map(({ market, options }) => (
          <AccordionItem key={market} value={market.toString()}>
            <AccordionTrigger>{BetOptionMarketLabels[market]}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-4 px-8">
                {options?.map((option) => (
                  <Button
                    key={option.betType}
                    className="flex flex-row justify-between"
                  >
                    <span>{option.betType}</span>
                    <span className="font-bold">{option.odd}</span>
                  </Button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
