'use client'

import { Button } from '@/virtual-components/ui/button'
import { Card, CardContent, CardFooter } from '@/virtual-components/ui/card'
import { Input } from '@/virtual-components/ui/input'
import { Separator } from '@/virtual-components/ui/separator'
import { BetsContext } from '@/virtual-contexts/bets-context'
import { generateSystemGroups } from '@/virtual-lib/system-bets'
import { CircleXIcon, RotateCcwIcon } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BetsHistoryDialog from './bets-history-dialog'
import EventBets from './event-bets'
import { ScrollArea } from './ui/scroll-area'
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
  const {
    betEntries,
    betsByEvent,
    betMode,
    removeAllBets,
    restoreLastSubmittedTicket,
  } = useContext(BetsContext)

  const totalOdds = betEntries.reduce(
    (total, betEntry) => total * betEntry.bet.option.decPrice,
    betEntries.length > 0 ? 1 : 0,
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
  }, [betEntries, betMode])

  // Combina i gruppi base con le puntate inserite dall'utente
  const systemGroups = useMemo(() => {
    return baseSystemGroups.map((group) => ({
      ...group,
      stake: systemGroupStakes[group.name] ?? 0,
    }))
  }, [baseSystemGroups, systemGroupStakes])

  // Calcola i totali per la modalità SYSTEM
  const systemTotals = useMemo(() => {
    const totalStake = systemGroups.reduce((sum, group) => sum + group.stake, 0)
    const minWin = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + group.minWin * group.stake
    }, 0)
    const maxWin = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + group.maxWin * group.stake
    }, 0)

    const totalOdds = systemGroups.reduce((sum, group) => {
      if (group.stake === 0) return sum
      return sum + ((group.minWin + group.maxWin) / 2) * group.stake
    }, 0)

    return { totalStake, minWin, maxWin, totalOdds }
  }, [systemGroups])

  const handleSubmitTicket = () => {
    if (betMode === 'SYSTEM') {
      console.log('Submitting system ticket with stakes:', systemGroupStakes)
    } else {
      console.log('Submitting ticket with amount:', global)
    }

    removeAllBets()
    setGlobal(0)
    setSystemGroupStakes({})
  }

  const updateSystemGroupStake = (groupName: string, value: number) => {
    setSystemGroupStakes((prev) => ({
      ...prev,
      [groupName]: value >= 0 ? value : 0,
    }))
  }

  return (
    <Card
      className="flex h-full w-full flex-col overflow-hidden bg-primary-foreground text-betSlip-foreground"
      data-testid="betting-slip"
    >
      <div className="grid grid-cols-2 grid-rows-2 text-center">
        <span className="flex w-full flex-col items-center justify-center text-md">
          {t('bet_slip')} ({betEntries.length})
        </span>
        <BetsHistoryDialog />

        <div className="relative flex h-12 w-full flex-col items-center justify-center bg-betSlip">
          <span
            className={`text-[16px] text-betSlip-header-foreground ${
              betMode === 'SINGLE' || betMode === 'MULTIPLE'
                ? 'font-semibold'
                : ''
            }`}
          >
            {betMode === 'SINGLE'
              ? t('single')
              : `${t('multiple')} (${Object.entries(betsByEvent).length})`}
          </span>

          {(betMode === 'SINGLE' || betMode === 'MULTIPLE') && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-accent"></div>
          )}
        </div>

        <div
          className={`relative flex w-full flex-col items-center justify-center ${
            betMode === 'SYSTEM' ? 'bg-betSlip-header' : 'bg-gray-100'
          }`}
        >
          <span
            className={`text-[16px] ${
              betMode === 'SYSTEM'
                ? 'font-semibold text-betSlip-header-foreground'
                : ''
            }`}
          >
            {t('system')}
          </span>
          {betMode === 'SYSTEM' && (
            <div className="absolute bottom-0.5 h-[4px] w-[156px] bg-accent"></div>
          )}
        </div>
      </div>

      <CardContent className="overflow-hidden p-3 text-betSlip-foreground">
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
            <ul className="flex flex-col gap-1 bg-primary-foreground">
              {Object.entries(betsByEvent).map(([eventKey, eventBets]) => (
                <EventBets
                  key={eventKey}
                  betMode={betMode}
                  eventKey={eventKey}
                  eventBets={eventBets}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col gap-2 p-0">
        {betMode !== 'SYSTEM' ? (
          // SINGLE/MULTIPLE - Input diretto per importo
          <>
            <div className="flex w-full justify-end bg-betSlip p-2">
              <span className="font-semibold">{t('amount')}</span>
            </div>

            <div className="flex w-full flex-row items-center justify-between gap-20 p-2">
              <span className="text-sm font-semibold">{t('total')}</span>
              <div className="flex w-fit items-center border border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 rounded-none bg-betSlip p-3"
                  onClick={() => setGlobal((prev) => Math.max(prev - 1, 1))}
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={global}
                  className="bg-background-foreground w-16 border-x text-center"
                  onChange={(e) => setGlobal(parseFloat(e.target.value))}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-4 rounded-none bg-betSlip p-3"
                  onClick={() => setGlobal((prev) => prev + 1)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="w-full px-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-20 py-1 text-sm font-semibold">
                  <span>{t('total')}</span>
                  <span>€ {global.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm">
                  <span>{t('total_odd')}</span>
                  <span>{totalOdds.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm font-bold">
                  <span>{t('potential_win')}</span>
                  <span>€ {potentialWinning.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          // SYSTEM - Tabella gruppi con input per ogni gruppo
          <div className="flex h-full w-full flex-col">
            <div className="w-full flex-1 overflow-auto">
              <Table className="w-full">
                <TableHeader className="sticky top-0 bg-accent text-accent-foreground">
                  <TableRow className="border-border hover:bg-accent">
                    <TableHead className="py-2 text-left text-[12px] font-bold tracking-wide">
                      {t('group')}
                    </TableHead>
                    <TableHead className="py-2 text-center text-[12px] font-bold tracking-wide">
                      {t('comb')}
                    </TableHead>
                    <TableHead className="py-2 text-center text-[12px] font-bold tracking-wide">
                      {t('min')}.€
                    </TableHead>
                    <TableHead className="py-2 text-center text-[12px] font-bold tracking-wide">
                      {t('max')}.€
                    </TableHead>
                    <TableHead className="py-2 text-center text-[12px] font-bold tracking-wide">
                      {t('stake')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemGroups.map((group) => (
                    <TableRow
                      key={group.name}
                      className="border-border bg-primary-foreground text-[13px] hover:bg-muted/50"
                    >
                      <TableCell className="py-2 text-[12px] font-semibold">
                        {group.name}
                      </TableCell>
                      <TableCell className="py-2 text-center text-[12px]">
                        {group.combinations.length}
                      </TableCell>
                      <TableCell className="py-2 text-center text-[12px]">
                        {(group.minWin * group.stake).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2 text-center text-[12px] font-bold">
                        {(group.maxWin * group.stake).toFixed(2)}
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex w-full items-center justify-center">
                          <div className="flex items-center overflow-hidden rounded-sm border border-border">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 rounded-none bg-betSlip p-0 text-[10px] font-bold hover:bg-accent/80"
                              onClick={() =>
                                updateSystemGroupStake(
                                  group.name,
                                  Math.max(group.stake - 0.5, 0),
                                )
                              }
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={group.stake}
                              onChange={(e) =>
                                updateSystemGroupStake(
                                  group.name,
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="h-6 w-12 rounded-none border-0 border-x bg-primary-foreground text-center text-[10px] focus:ring-0 focus:ring-offset-0"
                              min="0"
                              step="0.5"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 rounded-none bg-betSlip p-0 text-[10px] font-bold hover:bg-accent/80"
                              onClick={() =>
                                updateSystemGroupStake(
                                  group.name,
                                  group.stake + 0.5,
                                )
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="sticky bottom-0 bg-muted/50 text-[13px] font-semibold">
                  <TableRow className="hover:bg-muted/50">
                    <TableCell colSpan={4} className="text-left">
                      {t('total')}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      € {systemTotals.totalStake.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell colSpan={4} className="text-left">
                      {t('min_win')}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      € {systemTotals.minWin.toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-muted/50">
                    <TableCell colSpan={4} className="text-left">
                      {t('max_win')}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      € {systemTotals.maxWin.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}
      </CardFooter>

      <div className="flex items-center justify-end gap-1 px-2 py-2">
        <span className="text-sm">{t('remove_all')}</span>
        <Button variant="ghost" size="icon-sm" onClick={removeAllBets}>
          <CircleXIcon className="h-10 w-10" />
        </Button>
      </div>

      <Button
        variant="betNow"
        disabled={betEntries.length === 0}
        size="lg"
        className="m-1 w-full rounded-none text-[16px] font-bold"
        onClick={handleSubmitTicket}
      >
        {t('bet_now')}
      </Button>
    </Card>
  )
}
