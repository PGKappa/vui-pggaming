import { RootContext } from '@/contexts/root-context'
import { useContext } from 'react'
import LoadingSpinner from './loading-spinner'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

export default function Leaderboard() {
  const { teamRankings } = useContext(RootContext)

  if (!teamRankings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ranking Loading...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]"></TableHead>
              <TableHead></TableHead>
              <TableHead>P</TableHead>
              <TableHead>W</TableHead>
              <TableHead>D</TableHead>
              <TableHead>L</TableHead>
              <TableHead>Pts</TableHead>
              <TableHead className="text-right">LAST 8</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamRankings.map((ranking) => (
              <TableRow key={ranking.team}>
                <TableCell className="font-medium">
                  {ranking.position}
                </TableCell>
                <TableCell>{ranking.team}</TableCell>
                <TableCell>{ranking.played}</TableCell>
                <TableCell>{ranking.wins}</TableCell>
                <TableCell>{ranking.draws}</TableCell>
                <TableCell>{ranking.losses}</TableCell>
                <TableCell>{ranking.points}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {ranking.last8.map((result, i) => {
                      const textColor =
                        result === 'W'
                          ? 'text-green-500'
                          : result === 'L'
                            ? 'text-red-500'
                            : 'text-yellow-500'
                      return (
                        <span
                          key={i}
                          className={`inline-block text-sm font-medium ${textColor}`}
                        >
                          {result}
                        </span>
                      )
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
