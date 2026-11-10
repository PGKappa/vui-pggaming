import { PreviousChannelResult } from '@/virtual-lib/types'
import { getRacerColors } from '@/virtual-lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTranslation } from 'react-i18next'

type PreviousResultsCardProps = {
  results: PreviousChannelResult
  discipline: 'DOGS' | 'HORSES'
}

const GRID = '56px 52px 1fr'

export default function PreviousResultsCard({
  results,
  discipline,
}: PreviousResultsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="flex h-full flex-col overflow-hidden shadow-sm">
      <CardHeader className="h-12 shrink-0 justify-center space-y-0 px-3 py-0">
        <CardTitle className="text-center text-md font-bold uppercase tracking-wide">
          {t('latest_results')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        <div
          className="grid shrink-0 items-center border-b border-border bg-muted px-2 py-2 text-center text-[11px] font-bold uppercase text-muted-foreground"
          style={{ gridTemplateColumns: GRID }}
        >
          <span>{t('time')}</span>
          <span>{t('id')}</span>
          <span>{t('arrival')} 1°-2°-3°</span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {results.map((result, rowIdx) => (
            <div
              key={`${result.ext_pal_id}-${result.ext_event_id}`}
              className={`grid items-center border-b border-border px-2 py-2 ${
                rowIdx % 2 === 1 ? 'bg-muted/50' : ''
              }`}
              style={{ gridTemplateColumns: GRID }}
            >
              <div className="text-center text-sm font-bold tabular-nums">
                {result.start_time}
              </div>
              <div className="text-center text-sm tabular-nums text-muted-foreground">
                {result.ext_event_id}
              </div>
              <div className="grid grid-cols-3 gap-1">
                {result.arrival.slice(0, 3).map((competitor, index) => (
                  <div
                    key={`${competitor.number}-${index}`}
                    className="flex min-w-0 flex-col items-center gap-1"
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-sm pt-0.5 text-lg font-bold leading-none tabular-nums"
                      style={
                        getRacerColors(competitor.number, discipline).style
                      }
                    >
                      {competitor.number}
                    </div>
                    <div
                      className="w-full truncate text-center text-[11px]"
                      title={competitor.name}
                    >
                      {competitor.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
