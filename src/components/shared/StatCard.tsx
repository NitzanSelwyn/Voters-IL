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
  const h = 28
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} className="mt-2 opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  )
}

export function StatCard({ title, value, type = 'number', sparklineData, className }: StatCardProps) {
  return (
    <div className={cn('card-base flex flex-col', className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      <span className="text-2xl font-bold mt-1.5 tracking-tight">
        {type === 'percent' ? formatPercent(value) : formatNumber(value)}
      </span>
      {sparklineData && <MiniSparkline data={sparklineData} />}
    </div>
  )
}
