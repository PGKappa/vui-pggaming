import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { BetEntry } from '@/retail-lib/types'
import useTimeLeft from '@/retail-lib/use-time-left'
import { format } from 'date-fns'
import { t } from 'i18next'
import { CircleXIcon } from 'lucide-react'
import Image from 'next/image'
import { useContext } from 'react'
import { BetMode } from './betting-slip'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from './ui/checkbox'

export default function EventBets(props: {
  betMode: BetMode
  eventKey: string
  eventBets: BetEntry[]
}) {
  const { betMode, eventKey, eventBets } = props
  const { removeBet, removeEventBets, toggleEventBetsFixed } =
    useContext(BetsContext)
  const rootContext = useContext(RootContext)
  const getTrackName =
    rootContext?.getTrackName || ((channel?: number) => `Track ${channel || 6}`)

  const timeToMatchStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  return (
    <li>
      <div className="flex flex-col gap-0 border border-betSlip-foreground p-1">
        <div className="flex flex-row justify-between">
          <div className={betMode === 'SYSTEM' ? 'visible' : 'invisible'}>
            <div className="flex flex-row items-center gap-2 pl-1">
              <Checkbox
                checked={eventBets[0].fixed}
                onCheckedChange={() => toggleEventBetsFixed(eventKey)}
              />
              <span className="relative right-[1px] mt-1 pb-1 text-[11px]">
                {t('fixed')}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="group size-7"
            size="icon"
            onClick={() => removeEventBets(eventKey)}
          >
            <Image
              src="/bin.svg"
              alt="Bin"
              width={40}
              height={20}
              className="mb-[4px] ml-[6px] size-4 object-contain"
            />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="ml-[4px] text-[15px] font-semibold">
            {eventBets[0].bet.discipline === 'SOCCER'
              ? t('football')
              : eventBets[0].bet.discipline === 'DOGS'
                ? t('dog') + ' ' + t('racing')
                : t('horse') + ' ' + t('racing')}
          </span>

          <div className="flex items-center gap-2">
            <span className="relative left-[1px] text-[15px] font-bold tabular-nums">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="mr-[4px] h-[26px] w-[61px] justify-center bg-accent pt-1 text-[15px] tabular-nums text-[#99a6b1]">
              {timeToMatchStart}
            </Badge>
          </div>
        </div>
        {eventBets[0].bet.discipline === 'SOCCER' ? (
          <span className="text-[16px]">{eventBets[0].bet.competitors}</span>
        ) : (
          <span className="relative bottom-[1px] ml-[4px] pb-[4px] text-[14px]">
            {eventBets[0].bet.track || getTrackName(6)}
          </span>
        )}
      </div>

      <div className="-space-y-[6px] border border-t-0 border-betSlip-foreground bg-primary-foreground pb-[15px] pl-2 pr-[1px]">
        {eventBets.map((betEntry) => (
          <div
            key={betEntry.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="mt-[16px] text-[13px]">{betEntry.market}</span>
            <span className="mt-[16px] text-[13px] font-normal">
              {betEntry.bet.option.outcome}
            </span>
            <span className="mt-[16px] text-[13px]">
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
              <CircleXIcon className="mt-[13px]" style={{ scale: 1.4 }} />
            </Button>
          </div>
        ))}
      </div>
    </li>
  )
}
