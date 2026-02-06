import { useState, useEffect, useMemo } from 'react'
import { useMetaData, useRoundData, useNationalAggregates } from '@/data/hooks'
import { loadRoundData } from '@/data/loader'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { StatCard } from '@/components/shared/StatCard'
import { SeatsBar } from '@/components/charts/SeatsBar'
import { VoteSharePie } from '@/components/charts/VoteSharePie'
import { TurnoutTrend } from '@/components/charts/TurnoutTrend'
import { ChartSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import type { NationalAggregates } from '@/types'

export default function NationalDashboard() {
  const { meta, loading: metaLoading } = useMetaData()
  const [selectedRound, setSelectedRound] = useState<number>(25)
  const { data: roundData, loading: roundLoading } = useRoundData(selectedRound)
  const aggregates = useNationalAggregates(roundData)

  // Load all rounds for sparklines and turnout trend
  const [allAggregates, setAllAggregates] = useState<NationalAggregates[]>([])

  useEffect(() => {
    if (!meta) return
    Promise.all(meta.rounds.map(r => loadRoundData(r.id))).then(results => {
      const aggs = results.map(rd => {
        let totalEligible = 0, totalVotes = 0, totalInvalid = 0, totalValid = 0
        const partyTotals: Record<string, number> = {}
        for (const city of rd.cities) {
          totalEligible += city.eligibleVoters
          totalVotes += city.totalVotes
          totalInvalid += city.invalidVotes
          totalValid += city.validVotes
          for (const [p, v] of Object.entries(city.parties)) {
            partyTotals[p] = (partyTotals[p] || 0) + v
          }
        }
        return {
          roundId: rd.roundId,
          totalEligible,
          totalVotes,
          totalInvalid,
          totalValid,
          turnoutPercent: totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0,
          partyTotals,
        }
      })
      setAllAggregates(aggs.sort((a, b) => a.roundId - b.roundId))
    })
  }, [meta])

  const turnoutTrendData = useMemo(
    () => allAggregates.map(a => ({ roundId: a.roundId, turnout: a.turnoutPercent })),
    [allAggregates]
  )

  if (metaLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <ChartSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">סקירה ארצית</h1>
        <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
      </div>

      {roundLoading || !aggregates ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="בעלי זכות הצבעה"
              value={aggregates.totalEligible}
              sparklineData={allAggregates.map(a => a.totalEligible)}
            />
            <StatCard
              title="מצביעים בפועל"
              value={aggregates.totalVotes}
              sparklineData={allAggregates.map(a => a.totalVotes)}
            />
            <StatCard
              title="אחוז הצבעה"
              value={aggregates.turnoutPercent}
              type="percent"
              sparklineData={allAggregates.map(a => a.turnoutPercent)}
            />
            <StatCard
              title="קולות פסולים"
              value={aggregates.totalInvalid}
              sparklineData={allAggregates.map(a => a.totalInvalid)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">מנדטים לפי מפלגה</h2>
              <SeatsBar partyTotals={aggregates.partyTotals} roundId={selectedRound} />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">חלוקת קולות</h2>
              <VoteSharePie partyTotals={aggregates.partyTotals} totalValid={aggregates.totalValid} />
            </div>
          </div>

          {turnoutTrendData.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">מגמת הצבעה לאורך זמן</h2>
              <TurnoutTrend data={turnoutTrendData} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
