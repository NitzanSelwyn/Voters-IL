import { cn } from '@/lib/utils'

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
  )
}

export function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <LoadingSkeleton className="h-6 w-48" />
      <LoadingSkeleton className="h-64 w-full" />
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-2">
      <LoadingSkeleton className="h-4 w-24" />
      <LoadingSkeleton className="h-8 w-32" />
      <LoadingSkeleton className="h-3 w-20" />
    </div>
  )
}
