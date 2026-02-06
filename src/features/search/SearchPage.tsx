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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">חיפוש יישוב</h1>

      <div className="relative max-w-lg">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="הקלד שם יישוב..."
          className="w-full ps-10 pe-4 py-3 rounded-xl border border-input bg-background text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
      </div>

      {query ? (
        <div className="space-y-1">
          {results.length === 0 ? (
            <p className="text-muted-foreground py-4">לא נמצאו תוצאות</p>
          ) : (
            results.map(r => (
              <Link
                key={r.item.code}
                to={`/city/${r.item.code}`}
                className="block px-4 py-3 rounded-lg hover:bg-accent transition-colors"
              >
                <span className="font-medium">{r.item.name}</span>
                {r.item.district && (
                  <span className="text-muted-foreground me-2"> - {r.item.district}</span>
                )}
              </Link>
            ))
          )}
        </div>
      ) : (
        <>
          {recentCities.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">חיפושים אחרונים</h2>
              <div className="flex flex-wrap gap-2">
                {recentCities.map(c => (
                  <Link
                    key={c.code}
                    to={`/city/${c.code}`}
                    className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-accent transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">יישובים</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {[...alphabeticalGroups.keys()].map(letter => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="w-8 h-8 flex items-center justify-center rounded bg-secondary text-secondary-foreground text-sm font-medium hover:bg-accent"
                >
                  {letter}
                </a>
              ))}
            </div>

            <div className="space-y-4">
              {[...alphabeticalGroups.entries()].map(([letter, cities]) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h3 className="text-lg font-bold text-primary mb-1">{letter}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1">
                    {cities.map(c => (
                      <Link
                        key={c.code}
                        to={`/city/${c.code}`}
                        className="px-2 py-1 rounded hover:bg-accent transition-colors text-sm truncate"
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
