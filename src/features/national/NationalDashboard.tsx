import { useState, useEffect, useMemo } from 'react'
import { useMetaData, useRoundData, useNationalAggregates } from '@/data/hooks'
import { loadRoundData } from '@/data/loader'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { StatCard } from '@/components/shared/StatCard'
import { ElectionInfoCard } from '@/components/shared/ElectionInfoCard'
import { DataWarningBanner } from '@/components/shared/DataWarningBanner'
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
    () => allAggregates
      .filter(a => a.totalEligible > 0)
      .map(a => ({ roundId: a.roundId, turnout: a.turnoutPercent })),
    [allAggregates]
  )

  const aggregatesWithEligible = useMemo(
    () => allAggregates.filter(a => a.totalEligible > 0),
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">סקירה ארצית</h1>
          <p className="text-sm text-muted-foreground mt-1">נתוני בחירות לכנסת ישראל</p>
        </div>
        <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
      </div>

      <DataWarningBanner roundId={selectedRound} />

      {roundLoading || !aggregates ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <ElectionInfoCard roundId={selectedRound} className="animate-fade-in-up stagger-1" />
            <StatCard
              title="בעלי זכות הצבעה"
              value={aggregates.totalEligible}
              sparklineData={aggregatesWithEligible.map(a => a.totalEligible)}
              className="animate-fade-in-up stagger-2"
            />
            <StatCard
              title="מצביעים בפועל"
              value={aggregates.totalVotes}
              sparklineData={allAggregates.map(a => a.totalVotes)}
              className="animate-fade-in-up stagger-3"
            />
            <StatCard
              title="אחוז הצבעה"
              value={aggregates.turnoutPercent}
              type="percent"
              sparklineData={aggregatesWithEligible.map(a => a.turnoutPercent)}
              className="animate-fade-in-up stagger-4"
            />
            <StatCard
              title="קולות פסולים"
              value={aggregates.totalInvalid}
              sparklineData={allAggregates.map(a => a.totalInvalid)}
              className="animate-fade-in-up"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-base">
              <h2 className="section-title mb-3">מנדטים לפי מפלגה</h2>
              <SeatsBar partyTotals={aggregates.partyTotals} roundId={selectedRound} />
            </div>

            <div className="card-base">
              <h2 className="section-title mb-3">חלוקת קולות</h2>
              <VoteSharePie partyTotals={aggregates.partyTotals} totalValid={aggregates.totalValid} roundId={selectedRound} />
            </div>
          </div>

          {turnoutTrendData.length > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">מגמת הצבעה לאורך זמן</h2>
              <TurnoutTrend data={turnoutTrendData} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
