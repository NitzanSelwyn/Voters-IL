import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted/70', className)} />
  )
}

export function ChartSkeleton() {
  return (
    <div className="card-base space-y-4">
      <LoadingSkeleton className="h-5 w-40" />
      <LoadingSkeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="card-base space-y-3">
      <LoadingSkeleton className="h-3 w-20" />
      <LoadingSkeleton className="h-7 w-28" />
      <LoadingSkeleton className="h-3 w-16" />
    </div>
  )
}
