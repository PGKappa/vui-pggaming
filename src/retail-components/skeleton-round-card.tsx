import { Skeleton } from '@/retail-components/ui/skeleton'

export default function SkeletonRoundCard() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-[740px] w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}
