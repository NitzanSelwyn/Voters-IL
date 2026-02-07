import { cn } from '@/lib/utils'
import { useMetaData } from '@/data/hooks'

interface RoundSelectorProps {
  selected: number
  onChange: (roundId: number) => void
  className?: string
  disabledRounds?: Set<number>
}

export function RoundSelector({ selected, onChange, className, disabledRounds }: RoundSelectorProps) {
  const { meta } = useMetaData()
  if (!meta) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-1 rounded-lg bg-secondary/70 p-1', className)}>
      {meta.rounds.map(round => {
        const disabled = disabledRounds?.has(round.id)
        return (
          <button
            key={round.id}
            onClick={() => !disabled && onChange(round.id)}
            disabled={disabled}
            className={cn(
              'px-2.5 py-1 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap',
              disabled
                ? 'opacity-40 cursor-not-allowed text-muted-foreground'
                : selected === round.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
            )}
          >
            כ-{round.id}
          </button>
        )
      })}
    </div>
  )
}
