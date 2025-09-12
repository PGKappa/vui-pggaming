import { Skeleton } from '@/retail-components/ui/skeleton'

export default function SkeletonRaceCard() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
      <Skeleton className="h-28 w-full rounded-lg" />
    </div>
  )
}
