'use client'

import { Badge } from '@/retail-components/ui/badge'
import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardFooter } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { BetsContext } from '@/retail-contexts/bets-context'
import { generateSystemGroups } from '@/retail-lib/system-bets'
import { BetEntry, SubmittedTicket, SystemGroup } from '@/retail-lib/types'
import { getTimeDistanceFromNow } from '@/retail-lib/utils'
import { CircleXIcon, RotateCcwIcon } from 'lucide-react'
import Image from 'next/image'
import { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FastBet from './fast-bet'
import StakeInputDialog from './stake-input-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Separator } from './ui/separator'
import { Checkbox } from './ui/checkbox'

type BetMode = 'SINGLE' | 'MULTIPLE' | 'SYSTEM'

export default function BettingSlip() {
  const {
    betEntries,
    removeBet,
    removeMatchBets,
    toggleMatchBetsFixed,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)

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
        <span className="col-span-2 flex h-16 w-full flex-col items-center justify-center bg-accent text-[19px] font-semibold text-accent-foreground">
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
                    <div className="flex flex-row justify-between">
                      <div
                        className={
                          betMode === 'SYSTEM' ? 'visible' : 'invisible'
                        }
                      >
                        <div className="flex flex-row items-center gap-2 pl-1">
                          <Checkbox
                            checked={matchBets[0].fixed}
                            onCheckedChange={() =>
                              toggleMatchBetsFixed(matchKey)
                            }
                          />
                          <span className="text-[12px]">{t('fixed')}</span>
                        </div>
                      </div>
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
                        <span className="text-[16px] font-bold">
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

      <Separator />

      <CardFooter className="flex flex-col gap-2 bg-muted-foreground">
        {betMode !== 'SYSTEM' ? (
          <>
            <div className="flex justify-end bg-accent px-8 py-2">
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
          <div className="mt-2 rounded-md text-sm">
            <ScrollArea>
              <div className="max-h-[150px] min-w-full">
                <Table>
                  <TableHeader className="bg-accent text-accent-foreground">
                    <TableRow className="border-border hover:bg-accent">
                      <TableHead className="text-left text-[13px] font-bold tracking-wide">
                        Group
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        Comb.
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        Min.€
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        Max.€
                      </TableHead>
                      <TableHead className="text-center text-[13px] font-bold tracking-wide">
                        Stake
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
                        Total
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
                        Max Win
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
                        Min Win
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

        <div className="mx-2 flex flex-row gap-2">
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
