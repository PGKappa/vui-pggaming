'use client'

import { Market } from '@/retail-lib/types'
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
      <div className="flex flex-row items-center justify-between bg-accent text-accent-foreground">
        <div className="flex flex-row items-center gap-2">
          <Button variant="ghost" onClick={props.close} size="icon">
            <ChevronsLeftIcon />
          </Button>
          <span>
            {props.round.name} {t('round')} {props.round.number} /
          </span>
          <span className="text-sm font-semibold">{props.teams}</span>
        </div>
        <Badge className='mr-5'>{format(props.round.startingAt, 'HH:mm')}</Badge>
      </div>
      <Accordion type="multiple" className='space-y-2'>
        {props.markets.map((market) => (
          <AccordionItem key={market.name} value={market.name} className='text-accent-foreground'>
            <AccordionTrigger>{market.name.toUpperCase()}</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-3 gap-4 px-8">
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
