'use client'

import { BetsContext } from '@/contexts/bets-context'
import { Market, Selection } from '@/lib/types'
import { format } from 'date-fns'
import { t } from 'i18next'
import { ChevronsLeftIcon } from 'lucide-react'
import { useContext } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Toggle } from './ui/toggle'

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
  const { addBet, betEntries, removeBet } = useContext(BetsContext)

  const isBetSelected = (
    marketName: string,
    option: Selection,
    teams: string,
  ) => {
    return betEntries.some(
      (entry) =>
        entry.market === marketName &&
        entry.bet.teams === teams &&
        entry.bet.option.outcome === option.outcome,
    )
  }

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
                  <Toggle
                    key={option.outcome}
                    pressed={isBetSelected(market.name, option, props.teams)}
                    onPressedChange={(pressed) => {
                      if (pressed) {
                        addBet(market.name, {
                          round: props.round,
                          teams: props.teams,
                          option,
                        })
                      } else {
                        removeBet(market.name, option, props.teams)
                      }
                    }}
                    className="w-full"
                  >
                    <span>{option.outcome}</span>
                    <span>{option.decPrice}</span>
                  </Toggle>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
