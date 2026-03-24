import { PreviousChannelResult } from '@/virtual-lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTranslation } from 'react-i18next'

type PreviousResultsCardProps = {
  results: PreviousChannelResult
  discipline?: 'DOGS' | 'HORSES'
}

export default function PreviousResultsCard({
  results,
}: PreviousResultsCardProps) {
  const { t } = useTranslation()

  return (
    <Card className="h-96">
      <CardHeader className="bg-muted py-3">
        <CardTitle className="text-center text-lg font-bold">
          {t('latest_results')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex h-full flex-col p-0">
        <div className="bg-gray-100 px-1 py-2 text-sm font-bold text-white">
          <div className="flex text-center">
            <span className="w-10 shrink-0">{t('time').toUpperCase()}</span>
            <span className="w-8 shrink-0">{t('id').toUpperCase()}</span>
            <span className="flex-1">
              {t('arrival').toUpperCase()} 1°-2°-3°
            </span>
          </div>
        </div>

        {/* Contenuto scrollabile che occupa tutto lo spazio rimanente */}
        <div className="flex-1 overflow-y-auto">
          {results.map((result) => (
            <div
              key={`${result.ext_pal_id}-${result.ext_event_id}`}
              className="border-b border-gray-200 px-1 py-1"
            >
              <div className="flex items-center">
                {/* Time */}
                <div className="w-10 shrink-0 text-center text-xs font-bold text-white">
                  {result.start_time}
                </div>
                {/* Event ID */}
                <div className="w-8 shrink-0 text-center text-xs text-white">
                  {result.ext_event_id}
                </div>
                {/* Arrival Order - First 3 positions: number + name */}
                <div className="grid flex-1 grid-cols-3">
                  {result.arrival.slice(0, 3).map((competitor, index) => (
                    <div
                      key={`${competitor.number}-${index}`}
                      className="flex flex-col items-center"
                    >
                      <span className="text-sm font-bold text-white">
                        {competitor.number}
                      </span>
                      <span
                        className="w-full truncate text-center text-xs text-white"
                        title={competitor.name}
                      >
                        {competitor.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
