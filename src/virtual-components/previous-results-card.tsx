import { PreviousChannelResult } from '@/virtual-lib/types'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useTranslation } from 'react-i18next'

type PreviousResultsCardProps = {
  results: PreviousChannelResult
}

const getCompetitorColorByNumber = (number: number): string => {
  switch (number) {
    case 1:
      return 'bg-red-500'
    case 2:
      return 'bg-blue-500'
    case 3:
      return 'bg-orange-500'
    case 4:
      return 'bg-green-500'
    case 5:
      return 'bg-yellow-500'
    case 6:
      return 'bg-purple-500'
    default:
      return 'border border-gray-300 bg-white text-black'
  }
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
        <div className="bg-gray-100 px-2 py-2 text-sm font-bold text-black">
          <div className="flex justify-between text-center">
            <span className="w-16">{t('time').toUpperCase()}</span>
            <span className="w-12">{t('id').toUpperCase()}</span>
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
              className="border-b border-gray-200 px-2 py-3"
            >
              {/* Riga principale: orario, id, numeri colorati */}
              <div className="flex items-center justify-between">
                {/* Time */}
                <div className="w-16 text-center text-xs font-bold text-white">
                  {result.start_time}
                </div>
                {/* Event ID */}
                <div className="w-12 text-center text-xs text-white">
                  {result.ext_event_id}
                </div>
                {/* Arrival Order - First 3 positions */}
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex gap-8">
                    {result.arrival.slice(0, 3).map((competitor, index) => (
                      <div
                        key={`${competitor.number}-${index}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-md font-bold text-white ${getCompetitorColorByNumber(competitor.number)}`}
                      >
                        {competitor.number}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Riga nomi: due spazi vuoti, nomi centrati sotto i numeri */}
              <div className="mt-2 flex items-center justify-between">
                <div className="w-16"></div>
                <div className="w-12"></div>
                <div className="flex flex-1 items-center justify-center">
                  <div className="flex gap-8">
                    {result.arrival.slice(0, 3).map((competitor, index) => (
                      <div
                        key={`${competitor.name}-${index}`}
                        className="w-8 truncate text-center text-xs text-white"
                        title={competitor.name}
                      >
                        {competitor.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
