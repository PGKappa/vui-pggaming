'use client'

import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { generateSystemGroups } from '@/retail-lib/system-bets'
import { BetEntry, SubmittedTicket, SystemGroup } from '@/retail-lib/types'
import { RotateCcwIcon } from 'lucide-react'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FastBet from './fast-bet'
import EventBets from './event-bets'
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

export type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

export default function BettingSlip() {
  const { betEntries, removeAllBets, restoreLastSubmittedTicket } =
    useContext(BetsContext)

  const betsByMatch = useMemo(() => {
    return betEntries.reduce(
      (groupedBets: { [key: string]: BetEntry[] }, betEntry) => {
        const key = `${betEntry.bet.event.number}.${betEntry.bet.competitors}`
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
    0,
  )

  const [global, setGlobal] = useState(0)

  const potentialWinning = global * totalOdds

  const { t } = useTranslation()

  const betMode: BetMode = useMemo(() => {
    if (betEntries.length <= 1) return 'SINGLE'
    if (Object.values(betsByMatch).find((m) => m.length > 1)) return 'SYSTEM'
    else return 'MULTIPLE'
  }, [betEntries, betsByMatch])

  const [systemGroups, setSystemGroups] = useState<SystemGroup[]>([])

  useEffect(() => {
    if (betMode !== 'SYSTEM') setSystemGroups([])
    setSystemGroups(generateSystemGroups(betEntries))
  }, [betMode, betEntries])

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
              : `${t('multiple')} ( ${Object.entries(betsByMatch).length} )`}
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
              {Object.entries(betsByMatch).map(([matchKey, matchBets]) => (
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
                              setSystemGroups((prev) =>
                                prev.map((g) =>
                                  g.name === group.name
                                    ? { ...g, stake: value }
                                    : g,
                                ),
                              )
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
