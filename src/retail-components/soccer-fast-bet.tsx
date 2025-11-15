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
import { toast } from 'sonner'
import DraggableCodeList from './draggable-code-list'
import AlphanumericKeypadDrawer from './alphanumeric-keypad-drawer'

export default function SoccerFastBet(props: { selectedEvent: UpcomingEvent }) {
  const { t } = useTranslation()
  const [fastbetInput, setFastbetInput] = useState('')
  const { addBetsWithMarket } = useContext(BetsContext)

  const upcomingRound = props.selectedEvent.data as UpcomingRound

  // Validazione sicurezza per evitare errori runtime
  if (!upcomingRound || !upcomingRound.mag_event) {
    return <div>{t('no_events_available')}</div>
  }

  const handleSubmit = async () => {
    if (!fastbetInput.trim()) {
      toast.error(t('enter_fastbet_code'))
      return
    }

    const trimmedInput = fastbetInput.trim().toUpperCase()

    const dashIndex = trimmedInput.indexOf('-')

    if (dashIndex === -1) {
      toast.error(t('invalid_format_use_dash'))
      return
    }

    const eventNumberStr = trimmedInput.substring(0, dashIndex)
    const marketsStr = trimmedInput.substring(dashIndex + 1)

    // Validazione numero evento
    const eventNumber = parseInt(eventNumberStr)
    if (
      isNaN(eventNumber) ||
      eventNumber < 1 ||
      eventNumber > upcomingRound.mag_event.length
    ) {
      toast.error(
        t('invalid_event_number', { max: upcomingRound.mag_event.length }),
      )
      return
    }

    // Split mercati per "/"
    const marketCodes = marketsStr
      .split('/')
      .map((market) => market.trim())
      .filter((market) => market.length > 0)

    if (marketCodes.length === 0) {
      toast.error(t('no_markets_provided'))
      return
    }

    // Validazione mercati
    const invalidMarkets = marketCodes.filter((code) => !soccerMarkets[code])
    if (invalidMarkets.length > 0) {
      toast.error(`${t('markets_not_found')}`)
      return
    }

    try {
      const selectedMatch = upcomingRound.mag_event[eventNumber - 1]
      const bets: { marketName: string; bet: Bet }[] = []

      for (const marketCode of marketCodes) {
        const market = selectedMatch.markets?.market?.find(
          (m) => m.name === soccerMarkets[marketCode].marketName,
        )
        const selection = market?.selections?.[0]?.selection?.find(
          (sel) => sel.outcome === soccerMarkets[marketCode].outcome,
        )

        if (!selection) {
          throw new Error(`${t('selection_not_found')}`)
        }

        bets.push({
          marketName: soccerMarkets[marketCode].marketName,
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
        })
      }

      addBetsWithMarket(bets)

      // Messaggio di successo
      toast.success(`${bets.length} ${t('bets_added')}`)

      setFastbetInput('')
    } catch (error) {
      toast.error(
        `${t('error_creating_bet')} ${error instanceof Error ? error.message : t('unknown_error')}`,
      )
    }
  }

  return (
    <div className="flex h-14 w-full items-center gap-2 bg-accent">
      <AlphanumericKeypadDrawer
        value={fastbetInput}
        setValue={setFastbetInput}
        onSubmit={handleSubmit}
        placeholder="FASTBET"
        drawerId="soccer-fastbet"
      />

      <DraggableCodeList discipline="soccer" />
    </div>
  )
}
