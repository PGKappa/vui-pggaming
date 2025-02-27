import { RootContext } from '@/contexts/root-context'
import { Bet, BetType } from '@/lib/types'
import { format, formatDistanceToNow } from 'date-fns'
import { Trash2Icon, CircleXIcon } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardFooter } from './ui/card'
import { Input } from './ui/input'
import { Separator } from './ui/separator'

export default function BettingSlip() {
  const { bets } = useContext(RootContext)
  const [global, setGlobal] = useState(1)
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

  const totalOdds = bets.reduce((total, bet) => total * bet.odd, 1)

  const potentialWinning = global * totalOdds
  

  return (
    <Card className="bg-primary-foreground text-primary rounded w-full">
      <div className="grid grid-cols-2 grid-rows-2 p-1 text-center gap-2">
        <span className="text-md pt-1">Schedina ({bets.length})</span>
        <Button variant="ghost" className="text-md min-w-[60px] whitespace-normal leading-tight p-0">
          Le mie scommesse
        </Button>
        <div className="flex flex-col items-center">
        <span className="text-md">
          {bets.length > 1 ? `Multipla (${bets.length})` : 'Singola'}
        </span>
        </div>
        <div className="flex flex-col items-center">
        <span className="text-md">Sistema</span>
        </div>
      </div>

      <CardContent className="px-1">
        {bets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <small className="text-sm font-medium leading-none">
              Nessuna Selezione
            </small>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {Object.entries(betsByMatch).map(([matchKey, matchBets]) => (
              <li key={matchKey}>
                <div className="flex flex-col gap-1 border border-primary p-1">
                  <div className="flex flex-row justify-end">
                    <Button variant="ghost" size="icon-sm">
                      <Trash2Icon />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Football</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {format(matchBets[0].round.startingAt, 'HH:mm')}
                      </span>
                      <Badge className="rounded-1">
                        {formatDistanceToNow(matchBets[0].round.startingAt)}
                      </Badge>
                    </div>
                  </div>

                  <span className="text-sm">{matchBets[0].teams}</span>
                </div>

                <div className="border border-primary bg-primary-foreground p-1">
                  {matchBets.map((bet) => (
                    <div
                      key={bet.teams}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-sm">{bet.selectedTeam}</span>
                      <span className="text-sm">{BetType[bet.betType]}</span>
                      <span className="text-sm">{bet.odd}</span>
                      <Button variant="ghost" size="icon-sm">
                        <CircleXIcon className="h-5 w-5"/>
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
      <div className="flex justify-end bg-betSlip mx-1 p-2">
        <span className="font-semibold">Importo</span>
      </div>

      <div className="flex flex-row items-center justify-between p-2">
        <span className="text-sm font-semibold">Totale</span>
        <div className="flex items-center border border-border w-fit"> 
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 bg-betSlip p-3 rounded-none"
            onClick={() =>
              setGlobal((prev) => (Math.max((global) - 1)))
            }
          >
            -
          </Button>
          <Input
            type="number"
            value= {global}
            className="w-16 text-center border-x bg-background-foreground"
            onChange={(e) =>
              setGlobal(parseFloat(e.target.value))
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-4 bg-betSlip p-3 rounded-none"
            onClick={() =>
              setGlobal((prev) => (Math.max((global) + 1)))
            }
          >
            +
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-2 text-sm">
        <div className="flex justify-between">
          <span>Quota Totale</span>
          <span>{totalOdds.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Vincita Potenziale</span>
          <span>{potentialWinning} €</span>
        </div>
      </div>

      <div className="flex items-center justify-end py-4">
        <span className="text-sm">Rimuovi Tutto</span>
        <Button variant="ghost" size="icon-sm">
          <CircleXIcon className="h-10 w-10"/>
        </Button>
      </div>

      <CardFooter>
        <Button
          variant="betNow"
          disabled={bets.length === 0}
          size="lg"
          className="w-full font-bold"
        >
          Scommetti ora
        </Button>
      </CardFooter>
    </Card>
  )
}
