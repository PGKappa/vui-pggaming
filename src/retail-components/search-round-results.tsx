import { RoundResults } from '@/retail-lib/types'
import { ChevronRight, XIcon } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion'
import { format } from 'date-fns'

export default function SearchRoundResults(props: {
  roundResults: RoundResults[]
  onClose: () => void
}) {
  return (
    <Card>
      <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
        <CardTitle>Search Round Results</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={props.onClose}
          className="absolute right-4"
        >
          <XIcon style={{ scale: 2 }} />
        </Button>
      </CardHeader>
      <CardContent className="h-full pt-4">
        {props.roundResults.length > 0 ? (
          <ScrollArea className="h-full">
            <Accordion type="single" className="space-y-4">
              {props.roundResults.flatMap((roundResult) =>
                roundResult.matchResults.map((match, matchIndex) => {
                  // Create a unique ID for each match
                  const matchId = `${roundResult.round.number}-${matchIndex}`
                  return (
                    <AccordionItem
                      key={matchId}
                      value={matchId}
                      className="gap-0"
                    >
                      <AccordionTrigger className="text-searchResult-foreground bg-searchResult p-2 text-base [&[data-state=open]>svg]:-rotate-90">
                        <div className="space-x-2">
                          <span className="font-bold">
                            {format(roundResult.startTime, 'dd-MM-yyyy HH:mm')}{' '}
                            {roundResult.round.name.toUpperCase()} ROUND{' '}
                            {roundResult.round.number}
                            {' / '}
                          </span>
                          <span>{match.teams}</span>
                        </div>
                        <span className="font-bold">
                          {match.score1} - {match.score2}
                        </span>
                        <ChevronRight className="h-6 w-6 shrink-0 transition-transform duration-200" />
                      </AccordionTrigger>
                      <AccordionContent>
                        <table className="bg-searchResult-secondary w-full border-collapse text-center">
                          <tbody>
                            {/* 1X2 and DOUBLE CHANCE */}
                            <tr className="border-b-2 border-betSlip">
                              <td className="border-r-2 border-betSlip p-2 text-center">
                                <div className="font-bold">1X2</div>
                                <div>
                                  {match.odds?.oneXTwo
                                    ? `2 ${match.odds.oneXTwo.odds.toFixed(2)}`
                                    : '2 1.95'}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="font-bold">DOUBLE CHANCE</div>
                                <div>
                                  {match.odds?.doubleChance
                                    ? `2 ${match.odds.doubleChance.odds.toFixed(2)}`
                                    : '2 1.63'}
                                </div>
                              </td>
                            </tr>

                            {/* FIRST SCORER and SUM GOALS */}
                            <tr className="border-b-2 border-betSlip">
                              <td className="border-r-2 border-betSlip p-2 text-center">
                                <div className="font-bold">FIRST SCORER</div>
                                <div>
                                  {match.odds?.firstScorer
                                    ? `${match.odds.firstScorer.teamLabel || 'TEAM 2'} ${match.odds.firstScorer.odds.toFixed(2)}`
                                    : 'TEAM 2 2.05'}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="font-bold">SUM GOALS</div>
                                <div>
                                  {match.odds?.sumGoals
                                    ? `${match.odds.sumGoals.value} ${match.odds.sumGoals.odds.toFixed(2)}`
                                    : '2 1.63'}
                                </div>
                              </td>
                            </tr>

                            {/* GOAL / NO GOAL and RED CARD */}
                            <tr className="border-b-2 border-betSlip">
                              <td className="border-r-2 border-betSlip p-2 text-center">
                                <div className="font-bold">GOAL / NO GOAL</div>
                                <div>
                                  {match.odds?.goalNoGoal
                                    ? `${match.odds.goalNoGoal.value} ${match.odds.goalNoGoal.odds.toFixed(2)}`
                                    : '1 1.95'}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="font-bold">RED CARD</div>
                                <div>
                                  {match.odds?.redCard
                                    ? `${match.odds.redCard.value} ${match.odds.redCard.odds.toFixed(2)}`
                                    : 'Yes 2.95'}
                                </div>
                              </td>
                            </tr>

                            {/* WINNING COMBO & SCORES and EXACT NUMBER OF GOALS */}
                            <tr>
                              <td className="border-r-2 border-betSlip p-2 text-center">
                                <div className="font-bold">
                                  WINNING COMBO & SCORES
                                </div>
                                <div>
                                  {match.odds?.winningCombo
                                    ? `${match.odds.winningCombo.value} ${match.odds.winningCombo.odds.toFixed(2)}`
                                    : '2+G 1.90'}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <div className="font-bold">
                                  EXACT NUMBER OF GOALS
                                </div>
                                <div>
                                  {match.odds?.exactGoals
                                    ? `${match.odds.exactGoals.value} ${match.odds.exactGoals.odds.toFixed(2)}`
                                    : '2 1.90'}
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </AccordionContent>
                    </AccordionItem>
                  )
                }),
              )}
            </Accordion>
          </ScrollArea>
        ) : (
          <div className="flex h-full flex-col items-center justify-center">
            No results found
          </div>
        )}
      </CardContent>
    </Card>
  )
}
