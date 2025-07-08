import { Button } from '@/retail-components/ui/button'
import { Card, CardContent, CardHeader } from '@/retail-components/ui/card'
import { ScrollArea } from '@/retail-components/ui/scroll-area'
import { RoundResults } from '@/retail-lib/types'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { HistoryIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet'

export default function LastRoundsResults(props: {
  roundResults: RoundResults[]
  upcomingRound?: {
    scheduleId: number
  }[]
  setSearchRoundResults: (results: RoundResults[]) => void
  searchRoundResults?: RoundResults[]
}) {
  console.log('LastRoundsResults', props.roundResults)
  const { t } = useTranslation()
  const formatStartTime = (date: Date) =>
    new Date(date).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    })

  const [open, setOpen] = useState(false)

  const isResultSelected = useCallback(
    (roundNumber: number) =>
      props.searchRoundResults?.find((r) => r.round.number === roundNumber),
    [props.searchRoundResults],
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <SheetTitle></SheetTitle>
      </VisuallyHidden>
      <SheetTrigger asChild>
        <Button
          variant="navbar"
          className="text-background hover:bg-transparent"
        >
          <HistoryIcon style={{ scale: 1.5 }} />
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
                    className={`flex w-full cursor-pointer flex-row items-center justify-between border-b border-border p-1 px-4 ${
                      isResultSelected(result.round.number)
                        ? 'bg-muted'
                        : 'bg-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => {
                      props.setSearchRoundResults([result])
                      setOpen(false)
                    }}
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
