import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useMetaData, useRoundData, useBallotBoxData } from '@/data/hooks'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { StatCard } from '@/components/shared/StatCard'
import { TurnoutCompareBar } from '@/components/charts/TurnoutCompareBar'
import { PartyTrendLines } from '@/components/charts/PartyTrendLines'
import { ChartSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { BallotBoxTable } from './BallotBoxTable'
import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { loadRoundData } from '@/data/loader'
import { useEffect } from 'react'
import type { RoundData, NationalAggregates } from '@/types'

export default function CityView() {
  const { cityCode } = useParams<{ cityCode: string }>()
  const { meta, loading: metaLoading } = useMetaData()
  const [selectedRound, setSelectedRound] = useState<number>(25)
  const { data: roundData, loading: roundLoading } = useRoundData(selectedRound)
  const { data: ballotData, loading: ballotLoading } = useBallotBoxData(selectedRound)
  const { resolved } = useThemeContext()
  const [showPercent, setShowPercent] = useState(false)

  // Load all rounds for trends
  const [allRounds, setAllRounds] = useState<RoundData[]>([])
  const [allNatAggs, setAllNatAggs] = useState<NationalAggregates[]>([])

  useEffect(() => {
    if (!meta) return
    Promise.all(meta.rounds.map(r => loadRoundData(r.id))).then(results => {
      setAllRounds(results.sort((a, b) => a.roundId - b.roundId))
      const aggs = results.map(rd => {
        let te = 0, tv = 0, ti = 0, tvl = 0
        const pt: Record<string, number> = {}
        for (const c of rd.cities) {
          te += c.eligibleVoters; tv += c.totalVotes; ti += c.invalidVotes; tvl += c.validVotes
          for (const [p, v] of Object.entries(c.parties)) pt[p] = (pt[p] || 0) + v
        }
        return { roundId: rd.roundId, totalEligible: te, totalVotes: tv, totalInvalid: ti, totalValid: tvl, turnoutPercent: te > 0 ? (tv / te) * 100 : 0, partyTotals: pt }
      })
      setAllNatAggs(aggs.sort((a, b) => a.roundId - b.roundId))
    })
  }, [meta])

  const cityMeta = meta?.cities.find(c => c.code === cityCode)
  const cityData = roundData?.cities.find(c => c.cityCode === cityCode)

  // Party bar data
  const partyBarData = useMemo(() => {
    if (!cityData || !meta) return []
    return Object.entries(cityData.parties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([letter, votes]) => ({
        party: meta.parties[letter]?.nameHe || letter,
        value: showPercent ? Number(((votes / cityData.validVotes) * 100).toFixed(1)) : votes,
        color: meta.parties[letter]?.color || '#888',
      }))
  }, [cityData, meta, showPercent])

  // Party trends across rounds
  const partyTrends = useMemo(() => {
    if (!cityCode || !allRounds.length || !meta) return []
    const topLetters = cityData
      ? Object.entries(cityData.parties).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l]) => l)
      : []
    return topLetters.map(letter => ({
      letter,
      data: allRounds.map(rd => {
        const c = rd.cities.find(c => c.cityCode === cityCode)
        if (!c) return { roundId: rd.roundId, percent: 0 }
        return { roundId: rd.roundId, percent: c.validVotes > 0 ? (c.parties[letter] || 0) / c.validVotes * 100 : 0 }
      }),
    }))
  }, [cityCode, allRounds, cityData, meta])

  // Turnout compare data
  const turnoutCompare = useMemo(() => {
    if (!allRounds.length || !allNatAggs.length || !cityCode) return []
    return allRounds.map((rd, i) => {
      const c = rd.cities.find(c => c.cityCode === cityCode)
      const cityTurnout = c && c.eligibleVoters > 0 ? (c.totalVotes / c.eligibleVoters) * 100 : 0
      return {
        round: `כ-${rd.roundId}`,
        city: Number(cityTurnout.toFixed(1)),
        national: Number(allNatAggs[i]?.turnoutPercent.toFixed(1) || 0),
      }
    })
  }, [allRounds, allNatAggs, cityCode])

  // Ballot boxes for this city
  const cityBallots = useMemo(() => {
    if (!ballotData || !cityCode) return []
    return ballotData.ballotBoxes.filter(b => b.cityCode === cityCode)
  }, [ballotData, cityCode])

  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'

  if (metaLoading) {
    return <div className="space-y-6"><CardSkeleton /><ChartSkeleton /></div>
  }

  if (!cityMeta) {
    return <div className="text-center py-12 text-muted-foreground">יישוב לא נמצא</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{cityMeta.name}</h1>
          {cityMeta.district && <p className="text-muted-foreground">{cityMeta.district}</p>}
        </div>
        <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
      </div>

      {roundLoading || !cityData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard title="בעלי זכות הצבעה" value={cityData.eligibleVoters} />
            <StatCard title="מצביעים בפועל" value={cityData.totalVotes} />
            <StatCard
              title="אחוז הצבעה"
              value={cityData.eligibleVoters > 0 ? (cityData.totalVotes / cityData.eligibleVoters) * 100 : 0}
              type="percent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold">תוצאות מפלגות</h2>
                <button
                  onClick={() => setShowPercent(!showPercent)}
                  className="text-sm px-2 py-1 rounded bg-secondary text-secondary-foreground"
                >
                  {showPercent ? 'מספרים' : 'אחוזים'}
                </button>
              </div>
              <div style={{ direction: 'ltr' }} className="h-[350px]">
                <ResponsiveBar
                  data={partyBarData}
                  keys={['value']}
                  indexBy="party"
                  layout="horizontal"
                  margin={{ top: 10, right: 20, bottom: 40, left: 100 }}
                  padding={0.3}
                  colors={({ data }) => (data as Record<string, unknown>).color as string}
                  borderRadius={4}
                  axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  axisBottom={{ legend: showPercent ? '%' : 'קולות', legendPosition: 'middle', legendOffset: 32 }}
                  labelSkipWidth={20}
                  labelTextColor="#ffffff"
                  theme={{
                    text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
                    axis: { ticks: { text: { fill: textColor } }, legend: { text: { fill: textColor } } },
                    grid: { line: { stroke: resolved === 'dark' ? '#333' : '#e5e5e5' } },
                    tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
                  }}
                />
              </div>
            </div>

            {partyTrends.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-lg font-semibold mb-2">מגמות מפלגות לאורך זמן</h2>
                <PartyTrendLines trends={partyTrends} />
              </div>
            )}
          </div>

          {turnoutCompare.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-lg font-semibold mb-2">השוואת אחוזי הצבעה</h2>
              <TurnoutCompareBar data={turnoutCompare} />
            </div>
          )}

          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold mb-2">קלפיות</h2>
            {ballotLoading ? (
              <ChartSkeleton />
            ) : (
              <BallotBoxTable ballots={cityBallots} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
