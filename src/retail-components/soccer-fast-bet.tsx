import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { BetsContext } from '@/retail-contexts/bets-context'
import {
  Bet,
  Discipline,
  UpcomingEvent,
  UpcomingRound,
} from '@/retail-lib/types'
import { soccerMarkets } from '@/retail-lib/soccer-markets'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
/* import CodeList from './code-list' */
import Image from 'next/image'
import { toast } from 'sonner'

export default function SoccerFastBet(props: { selectedEvent: UpcomingEvent }) {
  const { t } = useTranslation()
  const [eventNumber, setEventNumber] = useState<number>()
  const [selection, setSelection] = useState('')
  const { addBetsWithMarket } = useContext(BetsContext)

  const upcomingRound = props.selectedEvent.data as UpcomingRound

  // Validazione sicurezza per evitare errori runtime
  if (!upcomingRound || !upcomingRound.mag_event) {
    return <div>{t('no_events_available')}</div>
  }

  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          {t('fastbet')}
        </span>
        {/* <CodeList /> */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-32 bg-bet text-[16px] font-bold text-bet-foreground">
              {t('code_list')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl">
            <div className="flex flex-col items-center justify-center bg-accent pt-4">
              <h2 className="h-10 text-[19px] font-bold text-accent-foreground">
                {t('code_list')}
              </h2>
              <Image
                src="/soccer-codes-image.png"
                alt="Codici scommesse calcio"
                width={1920}
                height={1080}
                className="h-auto max-w-full"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/4 text-[16px]"
          placeholder={t('event_id')}
          type="text"
          value={eventNumber ? eventNumber.toString().padStart(2, '0') : ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '') // Solo numeri
            const num = Number(value)
            if (num >= 1 && num <= upcomingRound.mag_event.length) {
              setEventNumber(num)
            } else if (value === '') {
              setEventNumber(undefined)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
              e.preventDefault()
              setEventNumber(undefined)
            }
          }}
        />
        <Input
          className="text-bold h-10 w-3/4 text-[16px]"
          placeholder={t('selection')}
          value={selection}
          onChange={(e) => setSelection(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!selection) {
                toast.error(`${t('selection_required')}`)
                return
              }
              const selections = selection.split('/')

              const marketsNotFound = selections.filter(
                (s) => !soccerMarkets[s],
              )
              if (marketsNotFound.length > 0) {
                toast.error(
                  `$${t('markets_not_found')}: ${marketsNotFound.join(', ')}`,
                )
                return
              }

              if (!eventNumber) {
                toast.error(`${t('event_number_required')}`)
                return
              }

              try {
                const bets: { marketName: string; bet: Bet }[] = selections.map(
                  (s) => {
                    const selectedMatch =
                      upcomingRound.mag_event[eventNumber - 1]
                    const market = selectedMatch.markets?.market?.find(
                      (m) => m.name === soccerMarkets[s].marketName,
                    )
                    const selection = market?.selections?.[0]?.selection?.find(
                      (sel) => sel.outcome === soccerMarkets[s].outcome,
                    )

                    if (!selection) {
                      throw new Error(`${t('selection_not_found')} ${s}`)
                    }

                    return {
                      marketName: soccerMarkets[s].marketName,
                      bet: {
                        event: {
                          name: props.selectedEvent.name,
                          number: selectedMatch.eventIdentity.eventId,
                          startingAt: props.selectedEvent.time,
                        },
                        discipline: Discipline.SOCCER,
                        competitors: selectedMatch.teams.team
                          .map((team) => team.name)
                          .join(' - '),
                        option: selection,
                      },
                    }
                  },
                )

                addBetsWithMarket(bets)
                setEventNumber(undefined)
                setSelection('')
              } catch (error) {
                toast.error(
                  `${t('error_creating_bet')} ${error instanceof Error ? error.message : t('unknown_error')}`,
                )
              }
            }
          }}
        />
      </div>
    </div>
  )
}
