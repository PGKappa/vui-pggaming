import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useTranslation } from 'react-i18next'
import Leaderboard from './leaderboard'
import { Button } from './ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'

export default function LeaderboardSheet({
  highlightedTeams = [],
}: {
  highlightedTeams: string[]
}) {
  const { t } = useTranslation()
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-footer-ranking text-footer-ranking-foreground hover:bg-footer-ranking/90 text-md font-semibold"
        >
          {t('ranking')}
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-0">
        <VisuallyHidden>
          <SheetTitle>{t('ranking')}</SheetTitle>
        </VisuallyHidden>
        <Leaderboard highlightedTeams={highlightedTeams} />
      </SheetContent>
    </Sheet>
  )
}
