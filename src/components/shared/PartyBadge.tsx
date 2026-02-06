import { useMetaData } from '@/data/hooks'
import { cn } from '@/lib/utils'

interface PartyBadgeProps {
  letter: string
  className?: string
  showLetter?: boolean
}

export function PartyBadge({ letter, className, showLetter = false }: PartyBadgeProps) {
  const { meta } = useMetaData()
  const party = meta?.parties[letter]
  if (!party) return <span className={className}>{letter}</span>

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium text-white shadow-sm',
        className
      )}
      style={{ backgroundColor: party.color }}
    >
      {party.nameHe}
      {showLetter && <span className="text-xs opacity-80">({letter})</span>}
    </span>
  )
}
