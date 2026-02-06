import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useMetaData, useFuseSearch } from '@/data/hooks'
import { cn } from '@/lib/utils'

export function SearchBar() {
  const { meta } = useMetaData()
  const fuse = useFuseSearch(meta?.cities || [])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)

  const results = query && fuse ? fuse.search(query, { limit: 8 }) : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="חיפוש יישוב..."
          className="w-full ps-9 pe-3 py-1.5 rounded-lg border border-input bg-secondary/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors"
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute top-full mt-1.5 w-full bg-popover border border-border rounded-xl overflow-hidden z-50 max-h-72 overflow-auto animate-fade-in"
          style={{ boxShadow: 'var(--shadow-dropdown)' }}
        >
          {results.map(r => (
            <button
              key={r.item.code}
              onClick={() => {
                navigate(`/city/${r.item.code}`)
                setQuery('')
                setOpen(false)
              }}
              className={cn(
                'w-full text-start px-3 py-2.5 text-sm hover:bg-accent transition-colors',
                'focus:bg-accent focus:outline-none border-b border-border/50 last:border-0'
              )}
            >
              <span className="font-medium">{r.item.name}</span>
              {r.item.district && (
                <span className="text-muted-foreground me-2 text-xs"> - {r.item.district}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
