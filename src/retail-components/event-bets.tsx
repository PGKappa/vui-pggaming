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
              <span className="text-[11px] mt-1 pb-1 relative right-[1px]">{t('fixed')}</span>
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
              className="size-4 object-contain ml-[6px] mb-[4px]"
            />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[15px] ml-[4px] font-semibold">
            {eventBets[0].bet.discipline === 'SOCCER'
              ? t('football')
              : eventBets[0].bet.discipline === 'DOGS'
                ? t('dog').toUpperCase() + ' ' + t('racing').toUpperCase()
                : t('horse').toUpperCase() + ' ' + t('racing').toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold relative left-[1px]">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="bg-accent font-mono text-[15px] mr-[4px] h-[26px] w-[61px] justify-center pt-1 text-[#99a6b1]">
              {timeToMatchStart}
            </Badge>
          </div>
        </div>
        {eventBets[0].bet.discipline === 'SOCCER' ? (
          <span className="text-[16px]">{eventBets[0].bet.competitors}</span>
        ) : (
          <span className="text-[14px] pb-[4px] relative bottom-[1px] ml-[4px] uppercase">
             {eventBets[0].bet.track || getTrackName(6)}
          </span>
        )}
      </div>

      <div className="border border-betSlip-foreground bg-primary-foreground pl-2 pr-[1px] border-t-0 pb-[1px] -space-y-[6px]">
        {eventBets.map((betEntry) => (
          <div
            key={betEntry.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-[13px] mt-[1px] ">{betEntry.market}</span>
            <span className="text-[13px] font-normal mt-[2px]">
              {betEntry.bet.option.outcome}
            </span>
            <span className="text-[13px] mt-[2px]">
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
              <CircleXIcon className="mt-[1px] scale-[1.4] h-[17px]"/>
            </Button>
          </div>
        ))}
      </div>
    </li>
  )
}
