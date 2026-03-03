import { BetsContext } from '@/retail-contexts/bets-context'
import { RootContext } from '@/retail-contexts/root-context'
import { getLayoutConfig } from '@/retail-lib/layout-config'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/retail-components/ui/tooltip'

export default function EventBets(props: {
  betMode: BetMode
  eventKey: string
  eventBets: BetEntry[]
}) {
  const { betMode, eventKey, eventBets } = props
  const { removeBet, removeEventBets, toggleEventBetsFixed } =
    useContext(BetsContext)
  const rootContext = useContext(RootContext)
  const lang = rootContext?.userData?.lang || 'en'
  const layout = getLayoutConfig(lang)

  const timeToMatchStart = useTimeLeft(eventBets[0].bet.event.startingAt)

  // Helper to translate market names - usa normalizeMarketName centralizzato
  const getTranslatedMarket = (market: string) => {
    const normalized = normalizeMarketName(market)
    return t(normalized)
  }

  return (
    <TooltipProvider>
      <li>
        <div className="flex h-[90px] flex-col gap-0 border border-betSlip-foreground p-1">
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
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>{t('remove_event_bets')}</TooltipContent>
            </Tooltip>
          </div>

          <div className="relative bottom-0 mt-[1px] flex items-center justify-between">
            <span className="relative ml-[3px] text-[15px] font-semibold uppercase">
              {eventBets[0].bet.discipline === 'SOCCER'
                ? t('football')
                : eventBets[0].bet.discipline === 'DOGS'
                  ? t('dog_races_label')
                  : eventBets[0].bet.discipline === 'DOGS8'
                    ? t('dog8_races_label')
                    : t('horse_races_label')}
            </span>

            <div className="flex items-center gap-2">
              <span className="relative left-[1px] text-[15px] font-bold tabular-nums">
                {format(eventBets[0].bet.event.startingAt, 'HH:mm')}
              </span>
              <Badge className="mr-[4px] h-[27px] w-[61px] items-center justify-center bg-accent text-[14px] tabular-nums text-[#99a6b1]">
                {timeToMatchStart}
              </Badge>
            </div>
          </div>
          {eventBets[0].bet.discipline === 'SOCCER' ? (
            <div className="relative bottom-[1px] ml-[3px] flex items-center justify-between pb-[4px]">
              <span className="text-[13px] uppercase">
                {eventBets[0].bet.competitors}
              </span>
              <span className="text-[10px]">|</span>
              {eventBets[0].bet.event.roundId && (
                <span className="relative mr-[220px] text-[13px] font-bold text-accent">
                  {t('round').toUpperCase()} {eventBets[0].bet.event.roundId}
                </span>
              )}
            </div>
          ) : (
            <div className="relative bottom-[1px] ml-[3px] flex items-center justify-between pb-[4px]">
              <span className="text-[13px] uppercase">
                {(() => {
                  const track = eventBets[0].bet.track
                  if (track) {
                    const num = track.match(/\d+/)?.[0]
                    if (num) return t(`track_${num}`)
                    return track
                  }
                  // Fallback basato sulla disciplina
                  return eventBets[0].bet.discipline === 'DOGS8'
                    ? t('track_8')
                    : t('track_6')
                })()}
              </span>
              <span className="text-[10px]">|</span>

              <span
                className={`relative ${layout.eventBets.eventIdMargin} text-[13px] font-bold text-accent`}
              >
                ID {eventBets[0].bet.event.number}{' '}
                {/* In case you want to translate ID in all the languages, don't forget to translate with i18n and add all in the jsons */}
              </span>
            </div>
          )}
        </div>

        <div className="-space-y-[8px] border border-t-0 border-betSlip-foreground bg-primary-foreground pb-[3px] pl-2 pr-[1px] pt-[1px] tabular-nums">
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
                // Per cani e cavalli usa la versione completa
                const isRacing =
                  betEntry.bet.discipline === 'DOGS' ||
                  betEntry.bet.discipline === 'DOGS8' ||
                  betEntry.bet.discipline === 'HORSES'
                outcomeDisplay = isRacing ? t('under_full') : t('under')
              } else if (outcomeLower === 'over') {
                // Per cani e cavalli usa la versione completa
                const isRacing =
                  betEntry.bet.discipline === 'DOGS' ||
                  betEntry.bet.discipline === 'DOGS8' ||
                  betEntry.bet.discipline === 'HORSES'
                outcomeDisplay = isRacing ? t('over_full') : t('over')
              }
            }

            // Traduci il nome del mercato usando getTranslatedMarket
            const translatedMarket = getTranslatedMarket(betEntry.market)

            return (
              <div
                key={betEntry.id}
                className="flex items-center pr-[8px] text-sm"
              >
                <span className="mr-[1px] w-[126px] text-[13px] capitalize">
                  {translatedMarket}
                </span>
                <span className="ml-[0px] w-[109px] text-left text-[13px] font-normal">
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
    </TooltipProvider>
  )
}
