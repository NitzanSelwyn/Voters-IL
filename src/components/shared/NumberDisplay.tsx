const formatter = new Intl.NumberFormat('he-IL')
const percentFormatter = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function formatNumber(n: number): string {
  return formatter.format(n)
}

export function formatPercent(n: number): string {
  return percentFormatter.format(n) + '%'
}

interface NumberDisplayProps {
  value: number
  type?: 'number' | 'percent'
  className?: string
}

export function NumberDisplay({ value, type = 'number', className }: NumberDisplayProps) {
  return (
    <span className={className}>
      {type === 'percent' ? formatPercent(value) : formatNumber(value)}
    </span>
  )
}
