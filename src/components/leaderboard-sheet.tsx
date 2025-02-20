import Leaderboard from './leaderboard'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

export default function LeaderboardSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">Classifica</Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <Leaderboard />
      </SheetContent>
    </Sheet>
  )
}
