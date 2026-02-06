import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMetaData } from '@/data/hooks'
import { loadRoundData } from '@/data/loader'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { DataWarningBanner } from '@/components/shared/DataWarningBanner'
import { BumpRanking } from '@/components/charts/BumpRanking'
import { CityHeatmap } from '@/components/charts/CityHeatmap'
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton'
import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'
import { PartySelector } from './PartySelector'
import type { RoundData, NationalAggregates } from '@/types'

export default function PartyView() {
  const { partyId } = useParams<{ partyId: string }>()
  const { meta, loading: metaLoading } = useMetaData()
  const navigate = useNavigate()
  const { resolved } = useThemeContext()
  const [selectedRound, setSelectedRound] = useState<number>(25)
  const [allRounds, setAllRounds] = useState<RoundData[]>([])
  const [loading, setLoading] = useState(true)

  const party = partyId ? meta?.parties[partyId] : null

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

  const topCitiesData = useMemo(() => {
    if (!partyId || !allRounds.length || !meta) return []
    const rd = allRounds.find(r => r.roundId === selectedRound)
    if (!rd) return []
    return rd.cities
      .filter(c => c.validVotes > 0 && c.parties[partyId])
      .map(c => ({
        city: c.cityName,
        percent: Number(((c.parties[partyId] / c.validVotes) * 100).toFixed(1)),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 15)
  }, [partyId, allRounds, selectedRound, meta])

  const heatmapData = useMemo(() => {
    if (!partyId || !allRounds.length || !meta) return []
    const cityTotals = new Map<string, { name: string; total: number }>()
    for (const rd of allRounds) {
      for (const c of rd.cities) {
        const votes = c.parties[partyId] || 0
        const existing = cityTotals.get(c.cityCode)
        if (existing) existing.total += votes
        else cityTotals.set(c.cityCode, { name: c.cityName, total: votes })
      }
    }
    const top30 = [...cityTotals.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 30)

    return top30.map(([code, { name }]) => ({
      id: name,
      data: allRounds.map(rd => {
        const c = rd.cities.find(c => c.cityCode === code)
        const pct = c && c.validVotes > 0 ? Number(((c.parties[partyId] || 0) / c.validVotes * 100).toFixed(1)) : null
        return { x: `כ-${rd.roundId}`, y: pct }
      }),
    }))
  }, [partyId, allRounds, meta])

  const { theme } = getChartTheme(resolved)

  if (metaLoading) return <ChartSkeleton />

  if (!party) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="page-title">מעקב מפלגה</h1>
          <p className="text-sm text-muted-foreground mt-1">בחרו מפלגה לצפייה בנתונים</p>
        </div>
        <PartySelector
          onSelect={(letter) => navigate(`/party/${letter}`)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: party.color }} />
          <h1 className="page-title">{party.nameHe}</h1>
          <span className="text-muted-foreground text-sm">({partyId})</span>
        </div>
        <PartySelector
          currentLetter={partyId}
          onSelect={(letter) => navigate(`/party/${letter}`)}
        />
      </div>

      <DataWarningBanner roundId={selectedRound} />

      <div className="flex flex-wrap gap-2">
        {meta!.rounds.map(r => (
          <div key={r.id} className="card-base !p-2.5 !px-3.5 text-sm">
            כ-{r.id}: <strong className="text-primary">{party.seats[r.id] || 0}</strong> מנדטים
          </div>
        ))}
      </div>

      {loading ? <ChartSkeleton /> : (
        <>
          {aggMap.size > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">דירוג לאורך זמן</h2>
              <BumpRanking aggregates={aggMap} />
            </div>
          )}

          {heatmapData.length > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">מפת חום - אחוזי הצבעה בערים</h2>
              <CityHeatmap data={heatmapData} />
            </div>
          )}

          <div className="card-base">
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title">ערים מובילות</h2>
              <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
            </div>
            <div style={{ direction: 'ltr' }} className="h-[400px]">
              <ResponsiveBar
                data={topCitiesData}
                keys={['percent']}
                indexBy="city"
                layout="horizontal"
                margin={{ top: 10, right: 30, bottom: 40, left: 120 }}
                padding={0.3}
                colors={[party.color]}
                borderRadius={4}
                axisLeft={{ tickSize: 0, tickPadding: 8 }}
                axisBottom={{ legend: '% קולות', legendPosition: 'middle', legendOffset: 32 }}
                labelSkipWidth={20}
                labelTextColor="#ffffff"
                theme={theme}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
