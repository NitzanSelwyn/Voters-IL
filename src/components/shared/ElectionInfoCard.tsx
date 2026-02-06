import { useMetaData } from '@/data/hooks'
import { cn } from '@/lib/utils'

interface ElectionInfoCardProps {
  roundId: number
  className?: string
}

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export function ElectionInfoCard({ roundId, className }: ElectionInfoCardProps) {
  const { meta } = useMetaData()
  if (!meta) return null

  const round = meta.rounds.find(r => r.id === roundId)
  if (!round) return null

  const dateObj = new Date(round.date)
  const formatted = dateFormatter.format(dateObj)

  return (
    <div className={cn('card-base flex flex-col', className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">תאריך הבחירות</span>
      <span className="text-lg font-bold mt-1.5 tracking-tight">{round.name}</span>
      <span className="text-sm text-muted-foreground mt-0.5">{formatted}</span>
    </div>
  )
}
