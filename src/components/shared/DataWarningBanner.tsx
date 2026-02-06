import { useMetaData } from '@/data/hooks'
import { cn } from '@/lib/utils'

interface DataWarningBannerProps {
  roundId: number
  className?: string
}

export function DataWarningBanner({ roundId, className }: DataWarningBannerProps) {
  const { meta } = useMetaData()
  if (!meta) return null

  const completeness = meta.dataCompleteness?.[roundId]
  if (!completeness) return null

  const hasMissingFields = !completeness.hasEligibleVoters || !completeness.hasCityCodes || !completeness.hasInvalidVotes
  const isComputedFromBallots = !completeness.hasPerCityData

  // Nothing to warn about -- data is complete and not computed
  if (!hasMissingFields && !isComputedFromBallots) return null

  // Missing fields = warning level, computed from ballots only = info level
  const isWarning = hasMissingFields

  const missingLabels: string[] = []
  if (!completeness.hasEligibleVoters) missingLabels.push('בעלי זכות בחירה')
  if (!completeness.hasCityCodes) missingLabels.push('סמלי ישוב')
  if (!completeness.hasInvalidVotes) missingLabels.push('קולות פסולים')

  return (
    <div className={cn(
      'rounded-lg border px-4 py-3 text-sm',
      isWarning
        ? 'bg-warning-light border-warning/30 text-foreground dark:bg-warning-light dark:border-warning/30'
        : 'bg-secondary/50 border-border text-foreground',
      className
    )}>
      <div className="flex items-start gap-2">
        <span className={cn('mt-0.5 shrink-0', isWarning ? 'text-warning' : 'text-muted-foreground')}>
          {isWarning ? '\u26A0' : '\u2139'}
        </span>
        <div>
          <span className="font-medium text-foreground">
            {isWarning ? 'נתונים חלקיים' : 'הערה'}
          </span>
          {missingLabels.length > 0 && (
            <p className="mt-0.5 text-muted-foreground">
              חסרים: {missingLabels.join(', ')}
            </p>
          )}
          {completeness.notes && (
            <p className="mt-0.5 text-muted-foreground">{completeness.notes}</p>
          )}
        </div>
      </div>
    </div>
  )
}
