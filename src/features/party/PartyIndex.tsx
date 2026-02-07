import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMetaData } from '@/data/hooks'
import { loadRoundData } from '@/data/loader'
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton'
import { SeatsTimeline } from '@/components/charts/SeatsTimeline'
import { PartyTrendLines } from '@/components/charts/PartyTrendLines'
import { VoteShiftBar } from '@/components/charts/VoteShiftBar'
import { BumpRanking } from '@/components/charts/BumpRanking'
import { VotesPerSeatBar } from '@/components/charts/VotesPerSeatBar'
import { PartySelector } from './PartySelector'
import type { RoundData, NationalAggregates } from '@/types'

export default function PartyIndex() {
  const { meta, loading: metaLoading } = useMetaData()
  const navigate = useNavigate()
  const [allRounds, setAllRounds] = useState<RoundData[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedRound, setSelectedRound] = useState<number>(25)
  const [compareFrom, setCompareFrom] = useState<number>(24)
  const [compareTo, setCompareTo] = useState<number>(25)

  useEffect(() => {
    if (!meta) return
    setLoading(true)
    Promise.all(meta.rounds.map(r => loadRoundData(r.id)))
      .then(results => setAllRounds(results.sort((a, b) => a.roundId - b.roundId)))
      .finally(() => setLoading(false))
  }, [meta])

  const aggMap = useMemo(() => {
    const map = new Map<number, NationalAggregates>()
    for (const rd of allRounds) {
      let te = 0, tv = 0, ti = 0, tvl = 0
      const pt: Record<string, number> = {}
      for (const c of rd.cities) {
        te += c.eligibleVoters; tv += c.totalVotes; ti += c.invalidVotes; tvl += c.validVotes
        for (const [p, v] of Object.entries(c.parties)) pt[p] = (pt[p] || 0) + v
      }
      map.set(rd.roundId, { roundId: rd.roundId, totalEligible: te, totalVotes: tv, totalInvalid: ti, totalValid: tvl, turnoutPercent: te > 0 ? (tv / te) * 100 : 0, partyTotals: pt })
    }
    return map
  }, [allRounds])

  const topPartiesTrends = useMemo(() => {
    if (!meta || aggMap.size === 0) return []

    // Find top 8 parties by max vote % across any round
    const partyMaxPercent = new Map<string, number>()
    for (const agg of aggMap.values()) {
      for (const [letter, votes] of Object.entries(agg.partyTotals)) {
        const pct = agg.totalValid > 0 ? (votes / agg.totalValid) * 100 : 0
        partyMaxPercent.set(letter, Math.max(partyMaxPercent.get(letter) || 0, pct))
      }
    }

    const top8 = [...partyMaxPercent.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([letter]) => letter)

    return top8.map(letter => ({
      letter,
      data: [...aggMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([roundId, agg]) => ({
          roundId,
          percent: agg.totalValid > 0 ? (agg.partyTotals[letter] || 0) / agg.totalValid * 100 : 0,
        })),
    }))
  }, [meta, aggMap])

  const voteShifts = useMemo(() => {
    if (!meta || aggMap.size === 0) return []
    const fromAgg = aggMap.get(compareFrom)
    const toAgg = aggMap.get(compareTo)
    if (!fromAgg || !toAgg) return []

    const allLetters = new Set([
      ...Object.keys(fromAgg.partyTotals),
      ...Object.keys(toAgg.partyTotals),
    ])

    return [...allLetters]
      .map(letter => {
        const fromPct = fromAgg.totalValid > 0 ? (fromAgg.partyTotals[letter] || 0) / fromAgg.totalValid * 100 : 0
        const toPct = toAgg.totalValid > 0 ? (toAgg.partyTotals[letter] || 0) / toAgg.totalValid * 100 : 0
        return { letter, change: toPct - fromPct }
      })
      .filter(s => Math.abs(s.change) > 0.3)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 15)
  }, [meta, aggMap, compareFrom, compareTo])

  const selectedAgg = aggMap.get(selectedRound) || null

  const roundSelectClass = 'px-3 py-1.5 rounded-lg border border-input bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

  if (metaLoading) return <ChartSkeleton />

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">השוואת מפלגות</h1>
          <p className="text-sm text-muted-foreground mt-1">מבט על כל המפלגות לאורך 11 סבבי בחירות</p>
        </div>
        <PartySelector
          onSelect={(letter) => navigate(`/party/${letter}`)}
        />
      </div>

      {loading ? <ChartSkeleton /> : (
        <>
          {/* Seats Distribution Timeline */}
          <div className="card-base">
            <h2 className="section-title mb-3">חלוקת 120 המנדטים לאורך הזמן</h2>
            <SeatsTimeline allRounds={allRounds} />
          </div>

          {/* Vote Share Trends */}
          {topPartiesTrends.length > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">מגמות אחוזי הצבעה – 8 המפלגות הגדולות</h2>
              <PartyTrendLines trends={topPartiesTrends} />
            </div>
          )}

          {/* Shifts Between Elections */}
          {meta && (
            <div className="card-base">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="section-title">שינויים בין סבבים</h2>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">מ:</span>
                  <select
                    value={compareFrom}
                    onChange={e => setCompareFrom(Number(e.target.value))}
                    className={roundSelectClass}
                  >
                    {meta.rounds.map(r => (
                      <option key={r.id} value={r.id}>כ-{r.id}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground">אל:</span>
                  <select
                    value={compareTo}
                    onChange={e => setCompareTo(Number(e.target.value))}
                    className={roundSelectClass}
                  >
                    {meta.rounds.map(r => (
                      <option key={r.id} value={r.id}>כ-{r.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <VoteShiftBar shifts={voteShifts} />
            </div>
          )}

          {/* Bump Ranking */}
          {aggMap.size > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">דירוג מפלגות לאורך זמן</h2>
              <BumpRanking aggregates={aggMap} />
            </div>
          )}

          {/* Votes-per-Seat Efficiency */}
          {meta && selectedAgg && (
            <div className="card-base">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h2 className="section-title">יעילות: קולות למנדט</h2>
                <select
                  value={selectedRound}
                  onChange={e => setSelectedRound(Number(e.target.value))}
                  className={roundSelectClass}
                >
                  {meta.rounds.map(r => (
                    <option key={r.id} value={r.id}>כ-{r.id}</option>
                  ))}
                </select>
              </div>
              <VotesPerSeatBar aggregates={selectedAgg} roundId={selectedRound} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
