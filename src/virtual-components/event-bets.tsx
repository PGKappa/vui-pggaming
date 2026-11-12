import { BetsContext } from '@/virtual-contexts/bets-context'
import { BetEntry, Discipline } from '@/virtual-lib/types'
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

// I mercati corse sono salvati con il nome interno (usato anche per il ticket):
// qui li traduciamo solo per la visualizzazione.
const RACE_MARKET_LABELS: Record<string, string> = {
  Winner: 'winner',
  Placed: 'place_2',
  Show: 'show_3',
  'Even/Odd': 'even_odd',
  'Under/Over': 'under_over',
  Exacta: 'exacta',
  Quinella: 'quinella',
  Trifecta: 'trifecta',
  'Box Trifecta': 'boxed_trifecta',
}

// soglia under/over: 4.5 per i cani a 8, 3.5 per le corse a 6
const translateMarket = (market: string, discipline: Discipline) => {
  const key = RACE_MARKET_LABELS[market]
  if (!key) return market
  if (market !== 'Under/Over') return t(key)
  return `${t(key)} ${discipline === Discipline.DOGS8 ? '4.5' : '3.5'}`
}

const translateOutcome = (outcome: string) =>
  t(outcome, { nsSeparator: false, keySeparator: false })

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
    const discipline = eventBets[0]?.bet?.discipline
    if (discipline === 'DOGS') return t('dog_racing')
    if (discipline === 'DOGS8') return t('dog8_racing')
    if (discipline === 'HORSES') return t('horse_racing')

    if (eventBets[0]?.bet?.event?.name) {
      return eventBets[0].bet.event.name
    }

    // Fallback per vecchia logica
    if (pathname.includes('/cavalli')) return t('horses')
    if (pathname.includes('/calcio')) return t('football')
    if (pathname.includes('/cani')) return t('dogs')
    return t('other')
  }
  const firstBet = eventBets[0].bet

  // Layout ricalcato sul blocco evento della betslip retail
  return (
    <li>
      <div className="flex h-[89px] flex-col gap-0 border border-betSlip-foreground p-1">
        <div className="flex flex-row justify-between">
          <div className={betMode === 'SYSTEM' ? 'visible' : 'invisible'}>
            <div className="flex flex-row items-center space-x-2 pl-1 pt-1">
              <Checkbox
                checked={eventBets[0].fixed}
                onCheckedChange={() => toggleEventBetsFixed(eventKey)}
              />
              <span className="text-[12px] font-semibold">{t('fixed')}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            className="size-7 bg-transparent hover:bg-transparent"
            size="icon"
            onClick={() => removeEventBets(eventKey)}
          >
            <Image
              src="/bin.svg"
              alt="Bin"
              width={40}
              height={20}
              className="size-[17px] object-contain brightness-0"
            />
          </Button>
        </div>

        <div className="mt-[1px] flex items-center justify-between">
          <span className="ml-[3px] text-[15px] font-semibold uppercase">
            {getCategory()}
          </span>
          <div className="mr-1 flex items-center space-x-2">
            <span className="text-[15px] font-bold tabular-nums">
              {/* le corse partono al minuto esatto: l'orario calcolato da
                  `since` può cadere qualche istante prima (12:23:59), quindi
                  si arrotonda al minuto più vicino invece di troncare */}
              {format(
                Math.round(
                  new Date(firstBet.event.startingAt).getTime() / 60000,
                ) * 60000,
                'HH:mm',
              )}
            </span>
            <Badge className="mr-[4px] h-[27px] w-[61px] items-center justify-center rounded-sm bg-card-header text-[14px] tabular-nums text-card-header-foreground hover:bg-card-header">
              {timeToEventStart}
            </Badge>
          </div>
        </div>

        {firstBet.discipline === Discipline.FOOTBALL ? (
          <div className="ml-[3px] flex items-center gap-2 whitespace-nowrap pb-[4px]">
            <span className="text-[13px] uppercase">
              {firstBet.competitors}
            </span>
            <span className="text-[10px]">|</span>
            <span className="text-[13px] font-bold text-tertiary">
              {t('round').toUpperCase()} {firstBet.event.number}
            </span>
          </div>
        ) : (
          <div className="ml-[3px] flex items-center pb-[4px]">
            <span className="text-[13px] font-bold text-tertiary">
              ID {firstBet.event.number}
            </span>
          </div>
        )}
      </div>

      <div className="-space-y-[8px] border border-t-0 border-betSlip-foreground bg-white pl-[7px] pr-2 pt-[2px] tabular-nums">
        {eventBets.map((betEntry) => (
          <div key={betEntry.id} className="flex items-center text-sm">
            <span className="mr-2 min-w-0 flex-1 text-[12px] capitalize leading-tight">
              {translateMarket(betEntry.market, betEntry.bet.discipline)}
            </span>
            <span className="mr-2 max-w-[55%] shrink-0 text-left text-[13px] font-normal leading-tight">
              {translateOutcome(betEntry.bet.option.outcome)}
            </span>
            <span className="relative right-1 w-[48px] shrink-0 text-right text-[13px] font-semibold">
              {betEntry.bet.option.decPrice.toFixed(2)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-[40px] w-[24px] shrink-0 translate-x-[3px] translate-y-[-2px] bg-transparent hover:bg-transparent"
              onClick={() =>
                removeBet(
                  betEntry.market,
                  betEntry.bet.option,
                  betEntry.bet.competitors,
                  betEntry.bet.discipline,
                )
              }
            >
              <CircleXIcon className="mt-[1px] h-[17px] scale-[1.4]" />
            </Button>
          </div>
        ))}
      </div>
    </li>
  )
}
