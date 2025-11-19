import { BetsContext } from '@/virtual-contexts/bets-context'
import { BetEntry } from '@/virtual-lib/types'
import useTimeLeft from '@/virtual-lib/use-time-left'
import { format } from 'date-fns'
import { t } from 'i18next'
import { CircleXIcon } from 'lucide-react'
import Image from 'next/image'
import { useContext } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Checkbox } from '@/virtual-components/ui/checkbox'
import { usePathname } from 'next/navigation'

export default function EventBets(props: {
  betMode: 'SINGLE' | 'MULTIPLE' | 'SYSTEM'
  eventKey: string
  eventBets: BetEntry[]
}) {
  const { betMode, eventKey, eventBets } = props
  const { removeBet, removeEventBets, toggleEventBetsFixed } =
    useContext(BetsContext)
  const pathname = usePathname()

  const timeToEventStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  const getCategory = () => {
    if (eventBets[0]?.bet?.event?.name) {
      return eventBets[0].bet.event.name
    }

    // Fallback per vecchia logica
    if (pathname.includes('/cavalli')) return t('horses')
    if (pathname.includes('/calcio')) return t('football')
    if (pathname.includes('/cani')) return t('dogs')
    return t('other')
  }
  return (
    <li>
      <div className="flex flex-col gap-1 border border-betSlip-foreground bg-primary-foreground p-1">
        <div className="flex flex-row justify-between">
          {betMode === 'SYSTEM' && (
            <div className="flex flex-row items-center gap-2 pl-1">
              <Checkbox
                checked={eventBets[0].fixed}
                onCheckedChange={() => toggleEventBetsFixed(eventKey)}
              />
              <span className="text-[12px]">{t('fixed')}</span>
            </div>
          )}

          {betMode !== 'SYSTEM' && (
            <div className="flex flex-row items-center gap-2 pl-1"></div>
          )}

          <Button
            variant="ghost"
            className="group size-5 hover:text-tertiary-foreground"
            size="icon"
            onClick={() => removeEventBets(eventKey)}
          >
            <Image
              src="/bin.svg"
              alt="Bin"
              width={15}
              height={15}
              className="size-5 object-contain brightness-0 group-hover:brightness-0 group-hover:invert"
            />
          </Button>
        </div>

        <div className="flex items-center justify-between bg-primary-foreground">
          <span className="text-[12px] font-semibold">{getCategory()}</span>

          <div className="flex items-center gap-2">
            <span className="text-[12px]">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="h-6 w-14 rounded-sm text-sm">
              {timeToEventStart}
            </Badge>
          </div>
        </div>

        <span className="text-[12px]">ID {eventBets[0].bet.event.number}</span>
      </div>

      <div className="border border-betSlip-foreground bg-primary-foreground p-1">
        {eventBets.map((betEntry) => (
          <div
            key={betEntry.id}
            className="flex items-center gap-10 text-[12px]"
          >
            <span className="flex-1 text-[12px]">{betEntry.market}</span>
            <span className="text-[12px]">{betEntry.bet.option.outcome}</span>
            <span className="text-[12px] font-bold">
              {betEntry.bet.option.decPrice.toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-5"
              onClick={() =>
                removeBet(
                  betEntry.market,
                  betEntry.bet.option,
                  betEntry.bet.competitors,
                )
              }
            >
              <CircleXIcon className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </li>
  )
}
