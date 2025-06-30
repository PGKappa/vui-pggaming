import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { RoundResults } from '@/retail-lib/types'
import { HistoryIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function LastRoundsResults(props: {
  roundResults: RoundResults[]
  upcomingRound?: {
    scheduleId: number
  }[]
}) {
  const { t } = useTranslation()
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Sheet>
      <VisuallyHidden>
        <SheetTitle></SheetTitle>
      </VisuallyHidden>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="text-background hover:bg-transparent"
          style={{ scale: 2 }}
        >
          <HistoryIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="h-full w-[300px] p-0">
        <Card className={`flex w-full flex-col`}>
          <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
            <div className="w-full text-center">
              <h3 className="text-xl font-bold">{t('latest_results')}</h3>
            </div>
          </CardHeader>

          <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full">
              {props.roundResults.length < 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  {t('no_past_results')}
                </div>
              ) : (
                props.roundResults.map((result) => (
                  <button
                    key={result.round.number}
                    className="flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1 px-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-md">
                        {result.round.name} {t('round')} {result.round.number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-md font-bold">
                        {formatStartTime(new Date(result.startTime))}
                      </span>
                      <span className="text-md italic">0:30</span>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </SheetContent>
    </Sheet>
  )
}
