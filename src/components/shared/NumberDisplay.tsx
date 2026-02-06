import { formatCompactNumber } from '@/lib/utils'

const localeFormatter = new Intl.NumberFormat('he-IL')
const percentFormatter = new Intl.NumberFormat('he-IL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/**
 * Formats a number in compact human-readable form: 50100 -> "50.1K", 1234567 -> "1.2M".
 * For numbers < 1000, returns them as-is.
 */
export function formatNumber(n: number): string {
  return formatCompactNumber(n)
}

/**
 * Formats a number with full locale-aware separators (e.g. 1,234,567).
 * Use this in tables or contexts where the exact number matters.
 */
export function formatFullNumber(n: number): string {
  return localeFormatter.format(n)
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
