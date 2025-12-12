import { BetsContext } from '@/retail-contexts/bets-context'
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

  const timeToMatchStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  // Helper to translate market names
  const getTranslatedMarket = (market: string) => {
    const marketLower = market.toLowerCase()
    switch (marketLower) {
      case 'winner':
        return t('winner')
      case 'placed':
        return t('place_2')
      case 'show':
        return t('show_3')
      case 'exacta':
        return t('exacta')
      case 'quinella':
        return t('quinella')
      case 'trifecta':
        return t('trifecta')
      case 'boxed trifecta':
        return t('boxed_trifecta')
      case 'even/odd':
        return t('even_odd')
      case 'under/over':
        return t('under_over')
      default:
        return market
    }
  }

  return (
    <li>
      <div className="flex h-[88px] flex-col gap-0 border border-betSlip-foreground p-1">
        <div className="flex flex-row justify-between">
          <div className={betMode === 'SYSTEM' ? 'visible' : 'invisible'}>
            <div className="relative bottom-[1px] flex flex-row items-center gap-2 pl-1">
              <Checkbox
                checked={eventBets[0].fixed}
                onCheckedChange={() => toggleEventBetsFixed(eventKey)}
              />
              <span className="relative right-[1px] mt-[5px] pb-1 text-[12px] font-semibold">
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
              className="mb-[4px] ml-[6px] size-[17px] object-contain"
            />
          </Button>
        </div>

        <div className="relative bottom-0 mt-[1px] flex items-center justify-between">
          <span className="relative  ml-[3px] text-[15px] font-semibold">
            {eventBets[0].bet.discipline === 'SOCCER'
              ? t('football')
              : eventBets[0].bet.discipline === 'DOGS'
                ? t('dog').toUpperCase() + ' ' + t('racing').toUpperCase()
                : t('horse').toUpperCase() + ' ' + t('racing').toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <span className="relative left-[1px]  text-[15px] font-bold tabular-nums">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="mr-[4px] h-[27px] w-[61px] items-center justify-center bg-accent text-[14px] tabular-nums text-[#99a6b1]">
              {timeToMatchStart}
            </Badge>
          </div>
        </div>
        {eventBets[0].bet.discipline === 'SOCCER' ? (
          <span className="text-[16px]">{eventBets[0].bet.competitors}</span>
        ) : (
          <span className="relative bottom-[1px] ml-[3px] pb-[4px] text-[13px] uppercase">
            {eventBets[0].bet.track ||  t('track_6')}
          </span>
        )}
      </div>

      <div className="-space-y-[6px] border border-t-0 border-betSlip-foreground bg-primary-foreground pb-[1px] pl-2 pr-[1px]">
        {eventBets.map((betEntry) => {
          // Per i mercati principali (Winner, Placed, Show), mostra numero + nome corridore
          const isMainMarket = ['Winner', 'Placed', 'Show'].includes(
            betEntry.market,
          )

          // Traduci anche Even, Odd, Under, Over
          const isTranslatableOutcome = [
            'Even',
            'Odd',
            'Under',
            'Over',
          ].includes(betEntry.bet.option.outcome)

          let outcomeDisplay = betEntry.bet.option.outcome

          if (isMainMarket && betEntry.bet.competitors) {
            outcomeDisplay = `${betEntry.bet.option.outcome} ${betEntry.bet.competitors}`
          } else if (isTranslatableOutcome) {
            outcomeDisplay = t(
              betEntry.bet.option.outcome,
              betEntry.bet.option.outcome,
            )
          } else if (betEntry.bet.option.outcome.includes(' any')) {
            // Traduci le combinazioni con 'any' (es. "1-2 any" -> "1-2 cualquier")
            outcomeDisplay = betEntry.bet.option.outcome.replace(
              ' any',
              ` ${t('any')}`,
            )
          }

          // Traduci il nome del mercato
          const translatedMarket = t(betEntry.market, betEntry.market)

          return (
            <div 
  key={betEntry.id}
  className="flex items-center text-sm pr-[8px]"
>
  <span className="mr-[1px] text-[13px] w-[126px]">
    {translatedMarket}
  </span>
  <span className="ml-[0px] text-[13px] font-normal w-[109px]">
    {outcomeDisplay}
  </span>
  <span className="text-[13px] w-[101px] break-all leading-tight">
  {betEntry.bet.option.decPrice.toFixed(2)}
</span>
  <Button
    variant="ghost"
    size="icon"
    className="w-[24px] h-[40px] flex-shrink-0 translate-x-[3px]"
    onClick={() => {
      removeBet(
        betEntry.market,
        betEntry.bet.option,
        betEntry.bet.competitors,
      )
    }}
  >
    <CircleXIcon className="mt-[1px] h-[17px] scale-[1.4]" />
  </Button>
</div>
          )
        })}
      </div>
    </li>
  )
}
