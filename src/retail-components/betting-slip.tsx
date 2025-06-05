'use client'

import { Badge } from '@/retail-components/ui/badge'
import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { Input } from '@/retail-components/ui/input'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { BetEntry, SubmittedTicket } from '@/retail-lib/types'
import { getTimeDistanceFromNow } from '@/retail-lib/utils'
import { CircleXIcon, RotateCcwIcon } from 'lucide-react'
import Image from 'next/image'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FastBet from './fast-bet'
import StakeInputDialog from './stake-input-dialog'

export default function BettingSlip() {
  const {
    betEntries,
    removeBet,
    removeMatchBets,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)
  const [global, setGlobal] = useState(0)
  const [isStakeDialogOpen, setStakeDialogOpen] = useState(false)

  const betsByMatch = useMemo(() => {
    return betEntries.reduce(
      (groupedBets: { [key: string]: BetEntry[] }, betEntry) => {
        const key = `${betEntry.bet.round.number}.${betEntry.bet.teams}`
        if (!groupedBets[key]) {
          groupedBets[key] = []
        }
        groupedBets[key].push(betEntry)
        return groupedBets
      },
      {},
    )
  }, [betEntries])

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    1,
  )

  const potentialWinning = global * totalOdds

  const { t } = useTranslation()

  const maxMarketsPerMatch = useMemo(() => {
    return Object.values(betsByMatch).reduce((max, bets) => {
      const uniqueMarkets = new Set(bets.map((bet) => bet.market)).size
      return Math.max(max, uniqueMarkets)
    }, 0)
  }, [betsByMatch])

  return (
    <Card
      className="flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
      data-testid="betting-slip"
    >
      <div className="grid grid-cols-2 text-center">
        <span className="col-span-2 flex h-16 w-full flex-col items-center justify-center bg-accent text-[19px] font-semibold text-accent-foreground">
          {t('bet_slip')} ( {betEntries.length} )
        </span>

        <div className="relative flex h-12 w-full flex-col items-center justify-center bg-betSlip">
          <span
            className={`text-[19px] text-betSlip-header-foreground ${maxMarketsPerMatch <= 1 ? 'font-semibold' : ''}`}
          >
            {betEntries.length <= 1
              ? t('single')
              : `${t('multiple')} ( ${Object.entries(betsByMatch).length} )`}
          </span>

          {maxMarketsPerMatch <= 1 && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
          )}
        </div>

        <div
          className={`relative flex w-full flex-col items-center justify-center ${
            maxMarketsPerMatch > 1 ? 'bg-betSlip-header' : 'bg-gray-100'
          }`}
        >
          <span
            className={`text-[19px] ${maxMarketsPerMatch > 1 ? 'font-semibold text-betSlip-header-foreground' : ''}`}
          >
            {t('system')}
          </span>
          {maxMarketsPerMatch > 1 && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-betSlip-header-foreground"></div>
          )}
        </div>
      </div>

      <CardContent className="h-full overflow-hidden bg-muted-foreground p-2 text-betSlip-foreground">
        {betEntries.length === 0 ? (
          <div className="flex h-full flex-row items-center justify-center gap-3">
            <small className="text-[16px] font-medium leading-none">
              {t('no_selection')}
            </small>
            <Button
              variant="betNow"
              size="icon-sm"
              className="font-bold"
              onClick={restoreLastSubmittedTicket}
            >
              <RotateCcwIcon />
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <ul className="flex flex-col gap-1 bg-background">
              {Object.entries(betsByMatch).map(([matchKey, matchBets]) => (
                <li key={matchKey}>
                  <div className="flex flex-col gap-1 border border-betSlip-foreground p-1">
                    <div className="flex flex-row justify-end">
                      <Button
                        variant="ghost"
                        className="group size-7 hover:text-tertiary-foreground"
                        size="icon"
                        onClick={() => removeMatchBets(matchKey)}
                      >
                        <Image
                          src="/bin.svg"
                          alt="Bin"
                          width={40}
                          height={20}
                          className="size-5 object-contain group-hover:brightness-0 group-hover:invert"
                        />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[16px] font-semibold">
                        Football
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[16px]">
                          {new Date(
                            matchBets[0].bet.round.startingAt,
                          ).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Badge className="bg-accent text-[16px]">
                          {getTimeDistanceFromNow(
                            new Date(matchBets[0].bet.round.startingAt),
                          )}
                        </Badge>
                      </div>
                    </div>

                    <span className="text-[16px]">
                      {matchBets[0].bet.teams}
                    </span>
                  </div>

                  <div className="border border-betSlip-foreground bg-primary-foreground p-1">
                    {matchBets.map((betEntry) => (
                      <div
                        key={betEntry.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-[14px]">{betEntry.market}</span>
                        <span className="text-[14px] font-bold">
                          {betEntry.bet.option.outcome}
                        </span>
                        <span className="text-[14px]">
                          {betEntry.bet.option.decPrice.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeBet(
                              betEntry.market,
                              betEntry.bet.option,
                              betEntry.bet.teams,
                            )
                          }
                        >
                          <CircleXIcon style={{ scale: 1.5 }} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 bg-muted-foreground">
        <div className="flex justify-end bg-accent px-8 py-2">
          <span className="text-[16px] font-bold text-accent-foreground">
            {t('amount')}
          </span>
        </div>

        <div className="flex flex-row items-center justify-between p-2">
          <span className="text-[16px] font-semibold">{t('total')}</span>
          <div className="flex w-fit items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-5 bg-bet p-3 text-[19px] text-bet-foreground"
              onClick={() => setGlobal((prev) => Math.max(prev - 0.5, 0))}
            >
              -
            </Button>
            <Input
              type="number"
              value={global}
              className="bg-background-foreground h-7 w-16 border-x text-center"
              readOnly
              onClick={() => setStakeDialogOpen(true)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-4 bg-bet p-3 text-[19px] text-bet-foreground"
              onClick={() => setGlobal((prev) => prev + 0.5)}
            >
              +
            </Button>
          </div>
        </div>

        <StakeInputDialog
          open={isStakeDialogOpen}
          initialValue={global}
          onClose={() => setStakeDialogOpen(false)}
          onConfirm={(val) => {
            setGlobal(val)
            setStakeDialogOpen(false)
          }}
        />

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

        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="w-1/3 bg-betSlip text-[16px] font-bold text-betSlip-header-foreground"
            onClick={removeAllBets}
          >
            {t('remove_all')}
          </Button>

          <Button
            variant="betNow"
            disabled={betEntries.length === 0}
            size="lg"
            className="w-2/3 text-[16px] font-bold"
            onClick={() => {
              const newTicket: SubmittedTicket = {
                date: new Date(),
                amount: global,
                winning: potentialWinning,
                betEntries: betEntries,
              }

              localStorage.setItem(
                'lastSubmittedTicket',
                JSON.stringify(newTicket),
              )

              console.log('[BettingSlip] Ticket submitted:', newTicket)
              removeAllBets()
            }}
          >
            {t('bet_now')}
          </Button>
        </div>

        <FastBet />
      </CardFooter>
    </Card>
  )
}
