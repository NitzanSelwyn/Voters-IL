import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useMetaData, useFuseSearch } from '@/data/hooks'
import type { CityMeta } from '@/types'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton'

export default function SearchPage() {
  const { meta, loading } = useMetaData()
  const fuse = useFuseSearch(meta?.cities || [])
  const [query, setQuery] = useState('')
  const [recentCities] = useLocalStorage<{ code: string; name: string }[]>('recentCities', [])

  const results = query && fuse ? fuse.search(query, { limit: 20 }) : []

  const alphabeticalGroups = useMemo(() => {
    if (!meta) return new Map<string, CityMeta[]>()
    const groups = new Map<string, CityMeta[]>()
    const sorted = [...meta.cities].sort((a, b) => a.name.localeCompare(b.name, 'he'))
    for (const city of sorted) {
      const firstLetter = city.name.charAt(0)
      if (!groups.has(firstLetter)) groups.set(firstLetter, [])
      groups.get(firstLetter)!.push(city)
    }
    return groups
  }, [meta])

  if (loading) return <ChartSkeleton />

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="page-title">חיפוש יישוב</h1>
        <p className="text-sm text-muted-foreground mt-1">חפשו בין {meta?.cities.length} יישובים</p>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="הקלד שם יישוב..."
          className="w-full ps-12 pe-4 py-3.5 rounded-xl border border-input bg-card text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
          style={{ boxShadow: 'var(--shadow-card)' }}
          autoFocus
        />
      </div>

      {query ? (
        <div className="space-y-0.5">
          {results.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">לא נמצאו תוצאות</p>
          ) : (
            results.map(r => (
              <Link
                key={r.item.code}
                to={`/city/${r.item.code}`}
                className="block px-4 py-3 rounded-lg hover:bg-accent transition-colors group"
              >
                <span className="font-medium group-hover:text-primary transition-colors">{r.item.name}</span>
                {r.item.district && (
                  <span className="text-muted-foreground me-2 text-sm"> - {r.item.district}</span>
                )}
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          {recentCities.length > 0 && (
            <div>
              <h2 className="section-title mb-3">חיפושים אחרונים</h2>
              <div className="flex flex-wrap gap-2">
                {recentCities.map(c => (
                  <Link
                    key={c.code}
                    to={`/city/${c.code}`}
                    className="px-3.5 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="section-title mb-3">יישובים</h2>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {[...alphabeticalGroups.keys()].map(letter => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {letter}
                </a>
              ))}
            </div>

            <div className="space-y-6">
              {[...alphabeticalGroups.entries()].map(([letter, cities]) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h3 className="text-lg font-bold text-primary mb-2 pb-1 border-b border-border">{letter}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-0.5">
                    {cities.map(c => (
                      <Link
                        key={c.code}
                        to={`/city/${c.code}`}
                        className="px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm truncate"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
