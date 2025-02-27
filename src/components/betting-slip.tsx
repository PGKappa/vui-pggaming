import { RootContext } from '@/contexts/root-context'
import { Bet } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import { Trash2Icon } from 'lucide-react'
import { useContext, useMemo } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'

export default function BettingSlip() {
  const { bets } = useContext(RootContext)
  const betsByMatch = useMemo(() => {
    return bets.reduce((groupedBets: { [key: string]: Bet[] }, bet) => {
      const key = `${bet.round.number}-${bet.teams}`
      if (!groupedBets[key]) {
        groupedBets[key] = []
      }
      groupedBets[key].push(bet)
      return groupedBets
    }, {})
  }, [bets])

  return (
    <Card className="bg-primary-foreground text-primary">
      <div className="grid grid-cols-2 grid-rows-2">
        <span className="flex flex-col items-center justify-center text-md">
          Schedina ({bets.length})
        </span>
        <Button variant="ghost">Le mie scommesse</Button>
        <span className="flex flex-col items-center justify-center">
          {bets.length > 1 ? `Multipla (${bets.length})` : 'Singola'}
        </span>
        <span className="flex flex-col items-center justify-center">
          Sistema
        </span>
      </div>
      <CardContent className="h-80 px-1">
        {bets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <small className="text-sm font-medium leading-none">
              Nessuna Selezione
            </small>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {Object.entries(betsByMatch).map(([matchKey, matchBets]) => (
              <li key={matchKey} className="flex flex-col">
                <div className="flex flex-col gap-1 border border-primary p-1">
                  <div className="flex flex-row justify-end">
                    <Button variant="ghost" size="icon-sm" className="">
                      <Trash2Icon />
                    </Button>
                  </div>
                  <div className="flex flex-row items-center justify-between">
                    <span className="text-sm font-semibold">Football</span>
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-sm">
                        {format(matchBets[0].round.startingAt, 'HH:mm')}
                      </span>
                      <Badge className="rounded-none">
                        {formatDistanceToNow(matchBets[0].round.startingAt)}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-sm">{matchBets[0].teams}</span>
                </div>
                {/* <Separator />
                <ul>
                  {matchBets.map((bet) => (
                    <li
                      key={bet.}
                      className="flex flex-row items-center gap-2"
                    >
                      <span className="text-sm">{bet.type}</span>
                      <span className="text-sm font-semibold">{bet.odd}</span>
                    </li>
                  ))}
                </ul> */}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="betNow"
          disabled={bets.length === 0}
          size="lg"
          className="w-full"
        >
          Scommetti ora
        </Button>
      </CardFooter>
    </Card>
  )
}
