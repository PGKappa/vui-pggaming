import { RootContext } from '@/contexts/root-context'
import { useContext, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { Bet } from '@/lib/types'
import { Trash2Icon } from 'lucide-react'
import { Separator } from './ui/separator'

enum ToggledTab {
  SINGLE,
  MULTIPLE,
  MULTIPLE_SYSTEM,
}

export default function BettingSlip() {
  const { bets } = useContext(RootContext)
  const betsByRound = useMemo(
    () =>
      bets?.reduce(
        (acc, bet) => {
          if (!acc[bet.round.number]) {
            acc[bet.round.number] = []
          }
          acc[bet.round.number].push(bet)
          return acc
        },
        {} as Record<number, Bet[]>,
      ),
    [bets],
  )

  return (
    <Card>
      <div className="grid grid-cols-2 grid-rows-2">
        <Button variant="ghost">Schedina ({bets.length})</Button>
        <Button variant="ghost">Le mie scommesse</Button>
        <Button variant="ghost">
          {bets.length > 1 ? `Multipla (${bets.length})` : 'Singola'}
        </Button>
        <Button variant="ghost">Sistema</Button>
      </div>
      <div className="h-80 p-2">
        {bets.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <small className="text-sm font-medium leading-none">
              Nessuna Selezione
            </small>
          </div>
        ) : (
          <ul className="flex flex-col">
            {Object.entries(betsByRound).map(([round, bets]) => (
              <li key={round} className="flex flex-col gap-1 border">
                <div className="flex flex-row items-center justify-between p-1">
                  <h3 className="text-sm font-semibold">
                    {bets[0].round.name} Round {round}
                  </h3>
                  <h4 className="text-sm font-semibold"></h4>
                  <Button variant="ghost" size="icon">
                    <Trash2Icon />
                  </Button>
                </div>
                <Separator />
                <ul className="p-1">
                  {bets.map((bet) => (
                    <li key={bet.teams}>
                      {bet.teams} - {bet.odd}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
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
