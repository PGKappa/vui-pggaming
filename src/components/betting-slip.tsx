import { BetsContext } from '@/contexts/bets-context'
import { BetEntry } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import { t } from 'i18next'
import { CircleXIcon, RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import BetsHistoryDialog from './bets-history-dialog'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Separator } from './ui/separator'

export default function BettingSlip() {
  const { betEntries, removeBet, removeMatchBets, removeAllBets, refreshBets } =
    useContext(BetsContext)
  const [global, setGlobal] = useState(1)
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

  const roundsLength = new Set(
    betEntries.map((betEntry) => betEntry.bet.round.number),
  ).size

  return (
    <>
      <Card className="w-full rounded-sm bg-primary-foreground text-primary">
        <div className="grid grid-cols-2 grid-rows-2 text-center">
          <span className="flex w-full flex-col items-center justify-center text-md">
            {t('bet_slip')} ({betEntries.length})
          </span>
          <BetsHistoryDialog />

          <span
            className={`flex w-full flex-col items-center justify-center text-md ${
              betEntries.length <= 1
                ? 'border-b-2 border-accent bg-betSlip'
                : 'bg-gray-100'
            }`}
          >
            {roundsLength > 1 ? `t('multiple') (${roundsLength})` : t('single')}
          </span>

          <span
            className={`flex w-full flex-col items-center justify-center text-md ${
              betEntries.length > 1
                ? 'border-b-2 border-accent bg-betSlip'
                : 'bg-gray-100'
            }`}
          >
            {t('system')}
          </span>
        </div>

        <CardContent className="p-3">
          {betEntries.length === 0 ? (
            <div className="flex h-full flex-row items-center justify-center gap-3">
              <small className="text-md font-medium leading-none">
                {t('no_selection')}
              </small>
              <Button
                variant="betNow"
                size="icon-sm"
                className="font-bold"
                onClick={refreshBets}
              >
                <RotateCcwIcon />
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {Object.entries(betsByMatch).map(([matchKey, matchBets]) => (
                <li key={matchKey}>
                  <div className="flex flex-col gap-1 border border-primary p-1">
                    <div className="flex flex-row justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeMatchBets(matchKey)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">Football</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {format(matchBets[0].bet.round.startingAt, 'HH:mm')}
                        </span>
                        <Badge className="rounded-sm">
                          {formatDistanceToNow(
                            matchBets[0].bet.round.startingAt,
                          )}
                        </Badge>
                      </div>
                    </div>

                    <span className="text-sm">{matchBets[0].bet.teams}</span>
                  </div>

                  <div className="border border-primary bg-primary-foreground p-1">
                    {matchBets.map((betEntry) => (
                      <div
                        key={betEntry.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-sm">{betEntry.market}</span>
                        <span className="text-sm">
                          {betEntry.bet.option.outcome}
                        </span>
                        <span className="text-sm">
                          {betEntry.bet.option.decPrice}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeBet(betEntry.id)}
                        >
                          <CircleXIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
        <Separator className="my-2" />
        <div className="mx-1 flex justify-end bg-betSlip p-2">
          <span className="font-semibold">{t('amount')}</span>
        </div>

        <div className="flex flex-row items-center justify-between p-2">
          <span className="text-sm font-semibold">{t('total')}</span>
          <div className="flex w-fit items-center border border-border">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 rounded-none bg-betSlip p-3"
              onClick={() => setGlobal((prev) => Math.max(prev - 1))}
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
              onClick={() => setGlobal((prev) => Math.max(prev + 1))}
            >
              +
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-1 px-2 text-sm">
          <div className="flex justify-between">
            <span>{t('total_odd')}</span>
            <span>{totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('potential_win')}</span>
            <span>{potentialWinning.toFixed(2)} €</span>
          </div>
        </div>

        <div className="flex items-center justify-end py-4">
          <span className="text-sm">{t('remove_all')}</span>
          <Button variant="ghost" size="icon-sm" onClick={removeAllBets}>
            <CircleXIcon className="h-10 w-10" />
          </Button>
        </div>

        <CardFooter>
          <Button
            variant="betNow"
            disabled={betEntries.length === 0}
            size="lg"
            className="w-full font-bold"
          >
            {t('bet_now')}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
