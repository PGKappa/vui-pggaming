import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import BettingSlip from './betting-slip'
import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'

export default function BettingSlipSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">Schedina</Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <VisuallyHidden>
          <SheetTitle>Schedina</SheetTitle>
        </VisuallyHidden>
        <BettingSlip />
      </SheetContent>
    </Sheet>
  )
}
