import { Skeleton } from '@/retail-components/ui/skeleton'
import LoadingSpinner from './loading-spinner'
import { t } from 'i18next'

export default function SkeletonRoundCard() {
  return (
    <div className="relative space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-[700px] w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-2 text-md font-medium text-foreground">
          {t('loading')}...
        </p>
      </div>
    </div>
  )
}
