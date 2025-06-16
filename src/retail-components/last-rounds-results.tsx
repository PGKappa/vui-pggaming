import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { RoundResults } from '@/retail-lib/types'
import { useTranslation } from 'react-i18next'

export default function LastRoundsResults(props: {
  roundResults: RoundResults[]
  upcomingRound?: {
    scheduleId: number
  }[]
  open: boolean
  toggleOpen: () => void
}) {
  const { t } = useTranslation()
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Card className={`flex ${props.open ? 'h-1/2' : ''} w-full flex-col`}>
      <CardHeader className="relative flex max-h-16 min-h-16 flex-row items-center justify-between">
        <div className="w-full text-center">
          <h3 className="text-xl font-bold">{t('latest_results')}</h3>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={props.toggleOpen}
          className="absolute right-1"
        ></Button>
      </CardHeader>

      {props.open && (
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
      )}
    </Card>
  )
}
