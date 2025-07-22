import { BetsContext } from '@/retail-contexts/bets-context'
import { BetEntry } from '@/retail-lib/types'
import useTimeLeft from '@/retail-lib/use-time-left'
import { Checkbox } from '@radix-ui/react-checkbox'
import { format } from 'date-fns'
import { t } from 'i18next'
import { CircleXIcon } from 'lucide-react'
import Image from 'next/image'
import { useContext } from 'react'
import { BetMode } from './betting-slip'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

export default function EventBets(props: {
  betMode: BetMode
  eventKey: string
  eventBets: BetEntry[]
}) {
  const { betMode, eventKey, eventBets } = props
  const {
    removeBet,
    removeEventBets: removeMatchBets,
    toggleEventBetsFixed: toggleMatchBetsFixed,
  } = useContext(BetsContext)

  const timeToMatchStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  return (
    <li>
      <div className="flex flex-col gap-1 border border-betSlip-foreground p-1">
        <div className="flex flex-row justify-between">
          <div className={betMode === 'SYSTEM' ? 'visible' : 'invisible'}>
            <div className="flex flex-row items-center gap-2 pl-1">
              <Checkbox
                checked={eventBets[0].fixed}
                onCheckedChange={() => toggleMatchBetsFixed(eventKey)}
              />
              <span className="text-[12px]">{t('fixed')}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="group size-7 hover:text-tertiary-foreground"
            size="icon"
            onClick={() => removeMatchBets(eventKey)}
          >
            <Image
              src="/bin.svg"
              alt="Bin"
              width={40}
              height={20}
              className="size-5 object-contain group-hover:brightness-0 group-hover:invert"
            />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[16px] font-semibold">
            {eventBets[0].bet.discipline === 'SOCCER'
              ? t('football')
              : eventBets[0].bet.discipline === 'DOGS'
                ? t('dogs')
                : t('horses')}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[16px] font-bold">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="bg-accent font-mono text-[16px]">
              {timeToMatchStart}
            </Badge>
          </div>
        </div>

        <span className="text-[16px]">{eventBets[0].bet.competitors}</span>
      </div>

      <div className="border border-betSlip-foreground bg-primary-foreground p-1">
        {eventBets.map((betEntry) => (
          <div
            key={betEntry.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[14px]">{betEntry.market}</span>
            <span className="text-[14px] font-bold">
              {betEntry.bet.option.outcome}
            </span>
            <span className="text-[14px]">
              {betEntry.bet.option.decPrice.toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                removeBet(
                  betEntry.market,
                  betEntry.bet.option,
                  betEntry.bet.competitors,
                )
              }
            >
              <CircleXIcon style={{ scale: 1.5 }} />
            </Button>
          </div>
        ))}
      </div>
    </li>
  )
}
