import { cn } from '@/lib/utils'
import { formatNumber, formatPercent } from './NumberDisplay'

interface StatCardProps {
  title: string
  value: number
  type?: 'number' | 'percent'
  sparklineData?: number[]
  className?: string
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 80
  const h = 24
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} className="mt-1">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-primary"
      />
    </svg>
  )
}

export function StatCard({ title, value, type = 'number', sparklineData, className }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-4 flex flex-col',
      className
    )}>
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="text-2xl font-bold mt-1">
        {type === 'percent' ? formatPercent(value) : formatNumber(value)}
      </span>
      {sparklineData && <MiniSparkline data={sparklineData} />}
    </div>
  )
}
