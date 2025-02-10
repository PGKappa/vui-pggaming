'use client'
import { RootContext } from '@/contexts/root-context'
import { Fragment, useContext } from 'react'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'

export default function RoundLiveScores() {
  const { liveRound } = useContext(RootContext)

  if (!liveRound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Round Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <div
            className="text-surface inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              Loading...
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {liveRound.name} Round {liveRound.number}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {liveRound.scores.map((score, index) => (
            <Fragment key={index}>
              <li className="flex items-center gap-2">
                <Badge>LIVE</Badge>
                <span className="flex-1 text-sm font-medium leading-none">
                  {score.team1} - {score.team2}
                </span>
                <span className="text-sm font-medium leading-none">
                  {score.score1} - {score.score2}
                </span>
              </li>
              {index < liveRound.scores.length - 1 && <Separator />}
            </Fragment>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
