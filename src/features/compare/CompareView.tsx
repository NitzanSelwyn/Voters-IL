import { useState, useEffect, useMemo } from 'react'
import { useMetaData } from '@/data/hooks'
import { loadRoundData } from '@/data/loader'
import { VoteShiftBar } from '@/components/charts/VoteShiftBar'
import { StatCard } from '@/components/shared/StatCard'
import { ChartSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { RoundData, NationalAggregates } from '@/types'

function computeAgg(rd: RoundData): NationalAggregates {
  let te = 0, tv = 0, ti = 0, tvl = 0
  const pt: Record<string, number> = {}
  for (const c of rd.cities) {
    te += c.eligibleVoters; tv += c.totalVotes; ti += c.invalidVotes; tvl += c.validVotes
    for (const [p, v] of Object.entries(c.parties)) pt[p] = (pt[p] || 0) + v
  }
  return { roundId: rd.roundId, totalEligible: te, totalVotes: tv, totalInvalid: ti, totalValid: tvl, turnoutPercent: te > 0 ? (tv / te) * 100 : 0, partyTotals: pt }
}

export default function CompareView() {
  const { meta, loading: metaLoading } = useMetaData()
  const [fromRound, setFromRound] = useState<number>(24)
  const [toRound, setToRound] = useState<number>(25)
  const [fromData, setFromData] = useState<RoundData | null>(null)
  const [toData, setToData] = useState<RoundData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([loadRoundData(fromRound), loadRoundData(toRound)])
      .then(([f, t]) => { setFromData(f); setToData(t) })
      .finally(() => setLoading(false))
  }, [fromRound, toRound])

  const fromAgg = useMemo(() => fromData ? computeAgg(fromData) : null, [fromData])
  const toAgg = useMemo(() => toData ? computeAgg(toData) : null, [toData])

  // Vote shifts
  const shifts = useMemo(() => {
    if (!fromAgg || !toAgg) return []
    const allLetters = new Set([...Object.keys(fromAgg.partyTotals), ...Object.keys(toAgg.partyTotals)])
    return [...allLetters].map(letter => {
      const fromPct = fromAgg.totalValid > 0 ? ((fromAgg.partyTotals[letter] || 0) / fromAgg.totalValid) * 100 : 0
      const toPct = toAgg.totalValid > 0 ? ((toAgg.partyTotals[letter] || 0) / toAgg.totalValid) * 100 : 0
      return { letter, change: toPct - fromPct }
    }).filter(s => Math.abs(s.change) > 0.3)
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, 15)
  }, [fromAgg, toAgg])

  // New and gone parties
  const { newParties, goneParties } = useMemo(() => {
    if (!fromAgg || !toAgg || !meta) return { newParties: [] as string[], goneParties: [] as string[] }
    const fromLetters = new Set(Object.keys(fromAgg.partyTotals).filter(l => fromAgg.partyTotals[l] > 0))
    const toLetters = new Set(Object.keys(toAgg.partyTotals).filter(l => toAgg.partyTotals[l] > 0))
    return {
      newParties: [...toLetters].filter(l => !fromLetters.has(l)),
      goneParties: [...fromLetters].filter(l => !toLetters.has(l)),
    }
  }, [fromAgg, toAgg, meta])

  // Biggest city swing
  const biggestSwing = useMemo(() => {
    if (!fromData || !toData) return null
    let maxSwing = 0
    let swingCity = ''
    for (const toCity of toData.cities) {
      const fromCity = fromData.cities.find(c => c.cityCode === toCity.cityCode)
      if (!fromCity || fromCity.eligibleVoters < 5000) continue
      const fromTurnout = fromCity.eligibleVoters > 0 ? (fromCity.totalVotes / fromCity.eligibleVoters) * 100 : 0
      const toTurnout = toCity.eligibleVoters > 0 ? (toCity.totalVotes / toCity.eligibleVoters) * 100 : 0
      const swing = Math.abs(toTurnout - fromTurnout)
      if (swing > maxSwing) { maxSwing = swing; swingCity = toCity.cityName }
    }
    return { city: swingCity, swing: maxSwing }
  }, [fromData, toData])

  if (metaLoading) return <ChartSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">השוואת סבבים</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">מ:</span>
          <select
            value={fromRound}
            onChange={e => setFromRound(Number(e.target.value))}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            {meta?.rounds.map(r => <option key={r.id} value={r.id}>כ-{r.id}</option>)}
          </select>
          <span className="text-sm text-muted-foreground">אל:</span>
          <select
            value={toRound}
            onChange={e => setToRound(Number(e.target.value))}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            {meta?.rounds.map(r => <option key={r.id} value={r.id}>כ-{r.id}</option>)}
          </select>
        </div>
      </div>

      {loading || !fromAgg || !toAgg ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><CardSkeleton /><CardSkeleton /></div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="שינוי אחוז הצבעה"
              value={toAgg.turnoutPercent - fromAgg.turnoutPercent}
              type="percent"
            />
            {biggestSwing && (
              <StatCard
                title="שינוי הצבעה גדול ביותר"
                value={biggestSwing.swing}
                type="percent"
              />
            )}
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted-foreground">מפלגות חדשות</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {newParties.length > 0 ? newParties.map(l => (
                  <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {meta?.parties[l]?.nameHe || l}
                  </span>
                )) : <span className="text-sm text-muted-foreground">אין</span>}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted-foreground">מפלגות שנעלמו</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {goneParties.length > 0 ? goneParties.map(l => (
                  <span key={l} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {meta?.parties[l]?.nameHe || l}
                  </span>
                )) : <span className="text-sm text-muted-foreground">אין</span>}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">שינוי בתמיכה (% קולות)</h2>
            <VoteShiftBar shifts={shifts} />
          </div>
        </>
      )}
    </div>
  )
}
