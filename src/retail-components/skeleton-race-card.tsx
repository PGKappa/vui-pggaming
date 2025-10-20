import { Skeleton } from '@/retail-components/ui/skeleton'
import LoadingSpinner from '@/retail-components/loading-spinner'
import { t } from 'i18next'

export default function SkeletonRaceCard() {
  return (
    <div className="relative space-y-4">
      {/* Skeleton base */}
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />

      {/* Overlay con spinner e testo - solo elementi visibili */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-2 text-md font-medium text-foreground">
          {t('loading')}...
        </p>
      </div>
    </div>
  )
}
