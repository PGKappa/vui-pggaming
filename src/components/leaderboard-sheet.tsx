import Leaderboard from './leaderboard'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function LeaderboardSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">Classifica</Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <VisuallyHidden>
          <SheetTitle>Classifica</SheetTitle>
        </VisuallyHidden>
        <Leaderboard />
      </SheetContent>
    </Sheet>
  )
}
