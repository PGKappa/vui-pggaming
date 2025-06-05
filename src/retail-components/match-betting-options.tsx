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
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden">
      <div className="sticky top-0 z-10 flex h-14 flex-row items-center justify-between bg-accent text-accent-foreground">
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

      <div className='flex-1 overflow-y-auto'>
        <Accordion type="multiple" className="space-y-2">
          {props.markets.map((market) => (
            <AccordionItem
              key={market.name}
              value={market.name}
              className="text-accent-foreground"
            >
              <AccordionTrigger className="h-12 text-[16px] font-bold">
                {market.name.toUpperCase()}
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
                      className="h-[45px] w-[190px]"
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
