import { useState, useMemo } from 'react'
import { useMetaData } from '@/data/hooks'
import { formatFullNumber, formatPercent } from '@/components/shared/NumberDisplay'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import type { BallotBox } from '@/types'

interface BallotBoxTableProps {
  ballots: BallotBox[]
}

type SortKey = 'ballotNumber' | 'totalVotes' | 'turnout'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

export function BallotBoxTable({ ballots }: BallotBoxTableProps) {
  const { meta } = useMetaData()
  const isMobile = useIsMobile()
  const [sortKey, setSortKey] = useState<SortKey>('ballotNumber')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    const arr = [...ballots]
    arr.sort((a, b) => {
      let va: number, vb: number
      if (sortKey === 'turnout') {
        va = a.eligibleVoters > 0 ? a.totalVotes / a.eligibleVoters : 0
        vb = b.eligibleVoters > 0 ? b.totalVotes / b.eligibleVoters : 0
      } else {
        va = a[sortKey]
        vb = b[sortKey]
      }
      return sortDir === 'asc' ? va - vb : vb - va
    })
    return arr
  }, [ballots, sortKey, sortDir])

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function getTop3(ballot: BallotBox) {
    return Object.entries(ballot.parties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([letter, votes]) => ({
        name: meta?.parties[letter]?.nameHe || letter,
        color: meta?.parties[letter]?.color || '#888',
        votes,
      }))
  }

  if (ballots.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">אין נתוני קלפיות</p>
  }

  if (isMobile) {
    return (
      <div className="space-y-2.5">
        {paged.map(b => {
          const turnout = b.eligibleVoters > 0 ? (b.totalVotes / b.eligibleVoters) * 100 : 0
          const top3 = getTop3(b)
          return (
            <div key={b.id} className="border border-border rounded-lg p-3.5 space-y-2 bg-card/50">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">קלפי #{b.ballotNumber}</span>
                <span className="text-sm font-medium text-primary">{formatPercent(turnout)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatFullNumber(b.totalVotes)} / {formatFullNumber(b.eligibleVoters)}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {top3.map((p, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: p.color }}>
                    {p.name}: {formatFullNumber(p.votes)}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 pt-3">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3.5 py-1.5 rounded-lg bg-secondary text-sm font-medium disabled:opacity-40 transition-opacity">הקודם</button>
            <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3.5 py-1.5 rounded-lg bg-secondary text-sm font-medium disabled:opacity-40 transition-opacity">הבא</button>
          </div>
        )}
      </div>
    )
  }

  const sortIndicator = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-start p-2.5 cursor-pointer hover:text-primary transition-colors font-semibold text-xs uppercase tracking-wider text-muted-foreground" onClick={() => toggleSort('ballotNumber')}>
                קלפי{sortIndicator('ballotNumber')}
              </th>
              <th className="text-start p-2.5 cursor-pointer hover:text-primary transition-colors font-semibold text-xs uppercase tracking-wider text-muted-foreground" onClick={() => toggleSort('totalVotes')}>
                מצביעים{sortIndicator('totalVotes')}
              </th>
              <th className="text-start p-2.5 cursor-pointer hover:text-primary transition-colors font-semibold text-xs uppercase tracking-wider text-muted-foreground" onClick={() => toggleSort('turnout')}>
                אחוז הצבעה{sortIndicator('turnout')}
              </th>
              <th className="text-start p-2.5 font-semibold text-xs uppercase tracking-wider text-muted-foreground">3 מפלגות מובילות</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(b => {
              const turnout = b.eligibleVoters > 0 ? (b.totalVotes / b.eligibleVoters) * 100 : 0
              const top3 = getTop3(b)
              return (
                <tr key={b.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                  <td className="p-2.5 font-medium">{b.ballotNumber}</td>
                  <td className="p-2.5">{formatFullNumber(b.totalVotes)} / {formatFullNumber(b.eligibleVoters)}</td>
                  <td className="p-2.5 font-medium">{formatPercent(turnout)}</td>
                  <td className="p-2.5">
                    <div className="flex gap-1.5">
                      {top3.map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full text-white shadow-sm" style={{ backgroundColor: p.color }}>
                          {p.name}: {formatFullNumber(p.votes)}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className={cn("px-3.5 py-1.5 rounded-lg bg-secondary text-sm font-medium transition-opacity", page === 0 && "opacity-40")}>הקודם</button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className={cn("px-3.5 py-1.5 rounded-lg bg-secondary text-sm font-medium transition-opacity", page >= totalPages - 1 && "opacity-40")}>הבא</button>
        </div>
      )}
    </div>
  )
}
