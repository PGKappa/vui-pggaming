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
import { normalizeMarketName } from '@/retail-lib/utils'

export default function EventBets(props: {
  betMode: BetMode
  eventKey: string
  eventBets: BetEntry[]
}) {
  const { betMode, eventKey, eventBets } = props
  const { removeBet, removeEventBets, toggleEventBetsFixed } =
    useContext(BetsContext)

  const timeToMatchStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  // Helper to translate market names - usa normalizeMarketName centralizzato
  const getTranslatedMarket = (market: string) => {
    const normalized = normalizeMarketName(market)
    return t(normalized)
  }

  return (
    <li>
      <div className="flex h-[89px] flex-col gap-0 border border-betSlip-foreground p-1">
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
          <span className="relative ml-[3px] text-[15px] font-semibold">
            {eventBets[0].bet.discipline === 'SOCCER'
              ? t('football').toUpperCase()
              : eventBets[0].bet.discipline === 'DOGS'
                ? t('dog_races_label').toUpperCase()
                : t('horse_races_label').toUpperCase()}
          </span>

          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tabular-nums">
              {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
            </span>
            <Badge className="mr-[4px] h-[27px] w-[63px] items-center justify-center bg-betSlip-header  text-[14px] tabular-nums text-black">
              {timeToMatchStart}
            </Badge>
          </div>
        </div>
        {eventBets[0].bet.discipline === 'SOCCER' ? (
          <span className="text-[16px]">{eventBets[0].bet.competitors}</span>
        ) : (
          <span className="relative bottom-[2px] ml-[3px] pb-[4px] text-[13px] uppercase">
            {eventBets[0].bet.track || t('track_6')}
          </span>
        )}
      </div>

      <div className="-space-y-[8px] border border-t-0 border-betSlip-foreground bg-primary-foreground pb-[3px] pl-2 pr-[1px] pt-[1px]">
        {eventBets.map((betEntry) => {
          // Usa normalizeMarketName per riconoscere mercati principali
          const normalized = normalizeMarketName(betEntry.market)
          const isMainMarket =
            normalized === 'winner' ||
            normalized === 'placed' ||
            normalized === 'show'

          // Traduci anche Even, Odd, Under, Over
          const outcomeLower = betEntry.bet.option.outcome.toLowerCase()
          const isTranslatableOutcome =
            outcomeLower === 'even' ||
            outcomeLower === 'pari' ||
            outcomeLower === 'par' ||
            outcomeLower === 'odd' ||
            outcomeLower === 'dispari' ||
            outcomeLower === 'impar' ||
            outcomeLower === 'under' ||
            outcomeLower === 'over'

          let outcomeDisplay = betEntry.bet.option.outcome

          if (isMainMarket && betEntry.bet.competitors) {
            outcomeDisplay = `${betEntry.bet.option.outcome} ${betEntry.bet.competitors}`
          } else if (isTranslatableOutcome) {
            // Traduci usando le chiavi minuscole
            if (
              outcomeLower === 'even' ||
              outcomeLower === 'pari' ||
              outcomeLower === 'par'
            ) {
              outcomeDisplay = t('even')
            } else if (
              outcomeLower === 'odd' ||
              outcomeLower === 'dispari' ||
              outcomeLower === 'impar'
            ) {
              outcomeDisplay = t('odd')
            } else if (outcomeLower === 'under') {
              outcomeDisplay = t('under')
            } else if (outcomeLower === 'over') {
              outcomeDisplay = t('over')
            }
          }

          // Traduci il nome del mercato usando getTranslatedMarket
          const translatedMarket = getTranslatedMarket(betEntry.market)

          return (
            <div
              key={betEntry.id}
              className="flex items-center pr-[8px] text-sm"
            >
              <span className="mr-[1px] w-[126px] text-[13px]">
                {translatedMarket}
              </span>
              <span className="ml-[0px] w-[109px] text-[13px] font-normal">
                {outcomeDisplay}
              </span>
              <span className="relative right-[3px] grid w-[101px] justify-end break-all text-[13px] font-semibold leading-tight">
                {betEntry.bet.option.decPrice.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-[40px] w-[24px] flex-shrink-0 translate-x-[3px]"
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
