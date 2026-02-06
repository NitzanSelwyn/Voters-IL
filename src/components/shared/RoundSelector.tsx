import { cn } from '@/lib/utils'
import { useMetaData } from '@/data/hooks'

interface RoundSelectorProps {
  selected: number
  onChange: (roundId: number) => void
  className?: string
}

export function RoundSelector({ selected, onChange, className }: RoundSelectorProps) {
  const { meta } = useMetaData()
  if (!meta) return null

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      {meta.rounds.map(round => (
        <button
          key={round.id}
          onClick={() => onChange(round.id)}
          className={cn(
            'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
            selected === round.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          כ-{round.id}
        </button>
      ))}
    </div>
  )
}
