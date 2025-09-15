import { Input } from '@/components/ui/input'
import { BetsContext } from '@/retail-contexts/bets-context'
import {
  Bet,
  Discipline,
  UpcomingEvent,
  UpcomingRound,
} from '@/retail-lib/types'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CodeList from './code-list'
import { toast } from 'sonner'

const markets: Record<string, { marketName: string; outcome: string }> = {
  1: {
    marketName: 'Esito finale 1X2',
    outcome: '1',
  },
  X: {
    marketName: 'Esito finale 1X2',
    outcome: 'X',
  },
  2: {
    marketName: 'Esito finale 1X2',
    outcome: '2',
  },
}

export default function SoccerFastBet(props: { selectedEvent: UpcomingEvent }) {
  const { t } = useTranslation()
  const [eventNumber, setEventNumber] = useState<number>()
  const [selection, setSelection] = useState('')
  const { addBetsWithMarket } = useContext(BetsContext)

  const upcomingRound = props.selectedEvent.data as UpcomingRound

  return (
    <div className="flex w-full flex-col gap-2 bg-accent px-2 py-3">
      <div className="flex flex-row items-center justify-between">
        <span className="text-[16px] font-bold text-bet-foreground">
          {t('fastbet')}
        </span>
        <CodeList />
      </div>
      <div className="flex flex-row items-center gap-1">
        <Input
          className="text-bold h-10 w-1/3 text-[16px]"
          placeholder={t('event_number')}
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
          className="text-bold h-10 w-2/3 text-[16px]"
          placeholder={t('selection')}
          value={selection}
          onChange={(e) => setSelection(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (!selection) {
                toast.error('Selection is required')
                return
              }
              const selections = selection.split('/')

              const marketsNotFound = selections.filter((s) => !markets[s])
              if (marketsNotFound.length > 0) {
                toast.error(`Markets not found: ${marketsNotFound.join(', ')}`)
                return
              }

              if (!eventNumber) {
                toast.error('Event number is required')
                return
              }

              const bets: { marketName: string; bet: Bet }[] = selections.map(
                (s) => ({
                  marketName: markets[s].marketName,
                  bet: {
                    event: {
                      name: props.selectedEvent.name,
                      number:
                        upcomingRound.mag_event[eventNumber - 1].eventIdentity
                          .eventId,
                      startingAt: props.selectedEvent.time,
                    },
                    discipline: Discipline.SOCCER,
                    competitors: upcomingRound.mag_event[
                      eventNumber - 1
                    ].teams.team
                      .map((team) => team.name)
                      .join(' - '),
                    option: (
                      props.selectedEvent.data as UpcomingRound
                    ).mag_event[0].markets.market
                      .find((m) => m.name === markets[s].marketName)!
                      .selections[0].selection.find(
                        (sel) => sel.outcome === markets[s].outcome,
                      )!,
                  },
                }),
              )

              addBetsWithMarket(bets)
              setEventNumber(undefined)
              setSelection('')
            }
          }}
        />
      </div>
    </div>
  )
}
