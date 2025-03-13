import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Leaderboard from './leaderboard'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'
import { t } from 'i18next'

export default function LeaderboardSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="lg">{t('ranking')}</Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <VisuallyHidden>
          <SheetTitle>{t('ranking')}</SheetTitle>
        </VisuallyHidden>
        <Leaderboard />
      </SheetContent>
    </Sheet>
  )
}
