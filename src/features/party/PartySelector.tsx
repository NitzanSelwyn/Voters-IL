import { useMetaData } from '@/data/hooks'
import { cn } from '@/lib/utils'

interface PartySelectorProps {
  currentLetter?: string
  onSelect: (letter: string) => void
}

export function PartySelector({ currentLetter, onSelect }: PartySelectorProps) {
  const { meta } = useMetaData()
  if (!meta) return null

  const parties = Object.entries(meta.parties)
    .filter(([, p]) => {
      // Only show parties that had seats in at least one round
      return Object.values(p.seats).some(s => s > 0)
    })
    .sort((a, b) => {
      const aMax = Math.max(...Object.values(a[1].seats))
      const bMax = Math.max(...Object.values(b[1].seats))
      return bMax - aMax
    })

  return (
    <select
      value={currentLetter || ''}
      onChange={e => onSelect(e.target.value)}
      className={cn(
        'px-3 py-1.5 rounded-md border border-input bg-background text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring'
      )}
    >
      <option value="">בחר מפלגה...</option>
      {parties.map(([letter, party]) => (
        <option key={letter} value={letter}>
          {party.nameHe} ({letter})
        </option>
      ))}
    </select>
  )
}
