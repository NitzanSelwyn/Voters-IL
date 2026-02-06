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
    <div className={cn('flex flex-wrap items-center gap-1 rounded-lg bg-secondary/70 p-1', className)}>
      {meta.rounds.map(round => (
        <button
          key={round.id}
          onClick={() => onChange(round.id)}
          className={cn(
            'px-2.5 py-1 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
            selected === round.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          כ-{round.id}
        </button>
      ))}
    </div>
  )
}
