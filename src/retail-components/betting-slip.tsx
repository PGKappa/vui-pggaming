'use client'

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { generateSystemGroups } from '@/retail-lib/system-bets'
import { SubmittedTicket } from '@/retail-lib/types'
import { RotateCcwIcon } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import EventBets from './event-bets'
import FastBet from './fast-bet'
import StakeInputDialog from './stake-input-dialog'
import { Separator } from './ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { toast } from 'sonner'

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

export default function BettingSlip({
  selectedEvent,
}: {
  selectedEvent?: any
}) {
  console.log('BettingSlip rendered with selectedEvent:', selectedEvent)

  const {
    betEntries,
    betsByEvent,
    betMode,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    0,
  )

  const [global, setGlobal] = useState(0)

  const potentialWinning = global * totalOdds

  const { t } = useTranslation()

  const [systemGroupStakes, setSystemGroupStakes] = useState<
    Record<string, number>
  >({})

  const baseSystemGroups = useMemo(() => {
    if (betMode !== 'SYSTEM') {
      return []
    }
    return generateSystemGroups(betEntries)
  }, [betMode, betEntries])

  const systemGroups = useMemo(() => {
    return baseSystemGroups.map((group) => ({
      ...group,
      stake: systemGroupStakes[group.name] ?? 0,
    }))
  }, [baseSystemGroups, systemGroupStakes])

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBetNow = async () => {
    if (betEntries.length === 0) {
      toast.error(t('no_bet_selected'))
      return
    }

    if (betMode !== 'SYSTEM' && global <= 0) {
      toast.error(t('enter_valid_amount'))
      return
    }

    if (betMode === 'SYSTEM') {
      const totalSystemStake = systemGroups.reduce(
        (sum, group) => sum + group.stake,
        0,
      )
      if (totalSystemStake <= 0) {
        toast.error(t('enter_system_amount'))
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Raggruppa le scommesse per evento
      const groupedByEvent = betEntries.reduce(
        (acc, entry) => {
          const eventId = entry.bet.event.number.toString()
          if (!acc[eventId]) {
            acc[eventId] = []
          }
          acc[eventId].push(entry)
          return acc
        },
        {} as Record<string, typeof betEntries>,
      )

      // Mappa i nomi dei mercati (sia tradotti che in inglese) ai nomi API
      const getAPIMarketName = (marketName: string): string => {
        const normalized = marketName.toLowerCase().trim()

        const API_MARKET_NAMES: Record<string, string> = {
          // Nomi in inglese
          winner: 'winner',
          placed: 'placed',
          show: 'show',
          exacta: 'exacta',
          quinella: 'quinella',
          trifecta: 'trifecta',
          'boxed trifecta': 'boxedtrifecta',
          'box trifecta': 'boxedtrifecta',
          'even/odd': 'evenodd',
          'under/over': 'underover',

          // Nomi italiani/tradotti
          vincente: 'winner',
          'piazzato su 2': 'placed',
          'piazzato su 3': 'show',
          accoppiata: 'exacta',
          trio: 'trifecta',
          'trio girare': 'boxedtrifecta',
          'pari/dispari': 'evenodd',

          // FastBet codes tradotti
          place: 'placed',
          couples: 'exacta',
          triplets: 'trifecta',
          even_odd: 'evenodd',
          under_over: 'underover',
        }

        return API_MARKET_NAMES[normalized] || normalized
      }

      // Crea le selections nel formato richiesto dall'API
      const selections = Object.entries(groupedByEvent).map(
        ([eventId, entries]) => {
          // Raggruppa per market all'interno dell'evento
          const marketGroups = entries.reduce(
            (acc, entry) => {
              const apiMarketName = getAPIMarketName(entry.market)
              if (!acc[apiMarketName]) {
                acc[apiMarketName] = []
              }
              acc[apiMarketName].push({
                description: entry.bet.option.outcome,
                odds: entry.bet.option.decPrice.toString(),
                status: 1,
              })
              return acc
            },
            {} as Record<string, any[]>,
          )

          // Converti i market groups in formato API
          const markets = Object.entries(marketGroups).map(
            ([marketName, selections]) => ({
              description: marketName,
              selections: selections,
            }),
          )

          // Determina gameId e channelId basato sulla disciplina
          const firstEntry = entries[0]
          const gameId =
            firstEntry.bet.discipline === 'HORSES'
              ? 'horses6'
              : firstEntry.bet.discipline === 'DOGS'
                ? 'dogs6'
                : 'soccer'
          const channelId =
            firstEntry.bet.discipline === 'HORSES'
              ? 3
              : firstEntry.bet.discipline === 'DOGS'
                ? 4
                : 1

          // DINAMICO: Prendi palimpsestId dall'evento se disponibile
          const eventAny = firstEntry.bet.event as any
          const palimpsestId =
            eventAny.palimpsestId ||
            eventAny.extId ||
            selectedEvent?.extId ||
            selectedEvent?.palimpsestId ||
            (firstEntry.bet.discipline === 'HORSES'
              ? '1000003504'
              : '1000003502')

          return {
            gameId: gameId,
            channelId: channelId,
            palimpsestId: palimpsestId,
            eventId: eventId,
            isBanker: false,
            markets: markets,
          }
        },
      )

      // Prepara il payload nel formato esatto dell'API
      const ticketData = {
        placeBet: {
          currency: 'USD', // Cambiare valuta se necessario
          ...(betMode === 'SYSTEM'
            ? {
                system: Object.fromEntries(
                  systemGroups
                    .filter((group) => group.stake > 0)
                    .map((group) => [group.size.toString(), group.stake]),
                ),
              }
            : {
                system: { '1': betMode === 'SINGLE' ? global : global },
              }),
          selections: selections,
        },
      }

      console.log(
        'Submitting ticket with payload:',
        JSON.stringify(ticketData, null, 2),
      )

      const response = await fetch(
        'https://apidev.pgvirtual.eu/api/ticket/add',
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'accept-language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
            authorization: 'Bearer ffffffff-ffff-ffff-ffff-ffffffffffee',
            'content-type': 'application/json',
            operator: 'pg',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
          },
          referrer: 'https://test.pgvirtual.eu/',
          body: JSON.stringify(ticketData),
          mode: 'cors',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('Ticket submitted successfully:', result)

      // Successo
      toast.success(t('bet_submitted_successfully'))

      // Salva per storico
      const newTicket: SubmittedTicket = {
        date: new Date(),
        amount:
          betMode === 'SYSTEM'
            ? systemGroups.reduce((sum, group) => sum + group.stake, 0)
            : global,
        winning:
          betMode === 'SYSTEM'
            ? systemGroups.reduce(
                (sum, group) => sum + group.maxWin * group.stake,
                0,
              )
            : potentialWinning,
        betEntries: betEntries,
      }

      localStorage.setItem('lastSubmittedTicket', JSON.stringify(newTicket))

      // Svuota la betting slip
      removeAllBets()
      setGlobal(0)
      setSystemGroupStakes({})
    } catch (error) {
      console.error('Error submitting ticket:', error)
      toast.error(t('bet_submission_error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card
      className="flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
      data-testid="betting-slip"
    >
      <div className="grid grid-cols-2 text-center">
        <span className="col-span-2 flex h-[61.17px] w-full flex-col items-center justify-center bg-accent text-[19px] font-semibold text-accent-foreground">
          {t('bet_slip')} ( {betEntries.length} )
        </span>

        <div className="relative flex h-12 w-full flex-col items-center justify-center bg-betSlip">
          <span
            className={`text-[16px] text-betSlip-header-foreground ${betMode === 'SINGLE' || betMode === 'MULTIPLE' ? 'font-semibold' : ''}`}
          >
            {betMode === 'SINGLE'
              ? t('single')
              : `${t('multiple')} ( ${Object.entries(betsByEvent).length} )`}
          </span>

          {betMode === 'SINGLE' ||
            (betMode === 'MULTIPLE' && (
              <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
            ))}
        </div>

        <div
          className={`relative flex w-full flex-col items-center justify-center ${
            betMode === 'SYSTEM' ? 'bg-betSlip-header' : 'bg-gray-100'
          }`}
        >
          <span
            className={`text-[16px] ${betMode === 'SYSTEM' ? 'font-semibold text-betSlip-header-foreground' : ''}`}
          >
            {t('system')}
          </span>
          {betMode === 'SYSTEM' && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
          )}
        </div>
      </div>

      <CardContent className="h-full overflow-hidden bg-muted-foreground p-2 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="relative flex h-full items-start justify-center pt-2">
            <span className="text-[16px] font-medium leading-none">
              {t('no_selection')}
            </span>
            <Button
              variant="betNow"
              size="icon-sm"
              className="absolute right-0 top-0 font-bold"
              onClick={restoreLastSubmittedTicket}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-1 bg-background">
              {Object.entries(betsByEvent).map(([matchKey, matchBets]) => (
                <EventBets
                  key={matchKey}
                  betMode={betMode}
                  eventKey={matchKey}
                  eventBets={matchBets}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-2 bg-muted-foreground">
        {betMode !== 'SYSTEM' ? (
          <>
            <div className="flex justify-end bg-accent py-2 pr-[56px]">
              <span className="text-[16px] font-bold text-accent-foreground">
                {t('stake')}
              </span>
            </div>
            <div className="flex flex-row items-center justify-between p-2">
              <span className="text-[16px] font-semibold">{t('total')}</span>
              <StakeInputDialog value={global} setValue={setGlobal} />
            </div>
            <div className="flex flex-col gap-1 px-2 text-[16px]">
              <div className="flex justify-between">
                <span>{t('total_odd')}</span>
                <span>{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{t('potential_win')}</span>
                <span>€ {potentialWinning.toFixed(2)}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-md pt-2 text-sm">
            <ScrollArea>
              <div className="max-h-[150px] min-w-full">
                <Table>
                  <TableHeader className="bg-accent text-accent-foreground">
                    <TableRow className="border-border hover:bg-accent">
                      <TableHead className="text-left text-[13px] font-bold tracking-wide">
                        {t('group')}
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        {t('comb')}
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        {t('min')}.€
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        {t('max')}.€
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        {t('stake')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemGroups.map((group) => (
                      <TableRow
                        key={group.name}
                        className="border-border bg-primary-foreground text-[14px]"
                      >
                        <TableCell className="py-1 font-semibold">
                          {group.name}
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          {group.combinations.length}
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          {(group.minWin * group.stake).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-1 text-center font-bold">
                          {(group.maxWin * group.stake).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-1">
                          <StakeInputDialog
                            value={
                              systemGroups.find((g) => g.name === group.name)
                                ?.stake ?? 0
                            }
                            setValue={(value) =>
                              setSystemGroupStakes((prev) => ({
                                ...prev,
                                [group.name]: value,
                              }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter className="text-[14px] font-semibold">
                    <TableRow className="hover:bg-muted">
                      <TableCell colSpan={4} className="text-left">
                        {t('total')}
                      </TableCell>
                      <TableCell className="text-center">
                        €{' '}
                        {systemGroups
                          .reduce((sum, group) => sum + group.stake, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted">
                      <TableCell colSpan={4} className="text-left">
                        {t('max')} {t('win')}
                      </TableCell>
                      <TableCell className="text-center">
                        €{' '}
                        {systemGroups
                          .reduce(
                            (sum, group) =>
                              sum +
                              (group.stake > 0
                                ? group.maxWin * group.stake
                                : 0),
                            0,
                          )
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-muted">
                      <TableCell colSpan={4} className="text-left">
                        {t('min')} {t('win')}
                      </TableCell>
                      <TableCell className="text-center">
                        €{' '}
                        {systemGroups
                          .reduce((min, group) => {
                            if (group.stake === 0) return min
                            return min === 0
                              ? group.minWin * group.stake
                              : Math.min(min, group.minWin * group.stake)
                          }, 0)
                          .toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </ScrollArea>
          </div>
        )}

        <div className="flex flex-row gap-2 px-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-1/3 bg-betSlip text-[16px] font-bold text-betSlip-header-foreground"
            onClick={removeAllBets}
            disabled={isSubmitting}
          >
            {t('remove_all')}
          </Button>

          <Button
            variant="betNow"
            disabled={betEntries.length === 0 || isSubmitting}
            size="lg"
            className="w-2/3 text-[16px] font-bold"
            onClick={handleBetNow}
          >
            {isSubmitting ? t('submitting') : t('bet_now')}
          </Button>
        </div>

        <FastBet selectedEvent={selectedEvent} />
      </CardFooter>
    </Card>
  )
}
