import { useState, useMemo } from 'react'
import { useMetaData, useRoundData, useNationalAggregates } from '@/data/hooks'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { StatCard } from '@/components/shared/StatCard'
import { DataWarningBanner } from '@/components/shared/DataWarningBanner'
import { ChartSkeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'
import { getPartyName } from '@/lib/utils'
import { formatPercent, formatFullNumber } from '@/components/shared/NumberDisplay'

const BOTTOM_COUNT = 20
const BREAKDOWN_COUNT = 10
const MIN_PARTY_PCT = 5

export default function ShameView() {
  const { meta, loading: metaLoading } = useMetaData()
  const [selectedRound, setSelectedRound] = useState<number>(25)
  const { data: roundData, loading: roundLoading } = useRoundData(selectedRound)
  const nationalAgg = useNationalAggregates(roundData)
  const { resolved } = useThemeContext()
  const { theme } = getChartTheme(resolved)

  const sortedCities = useMemo(() => {
    if (!roundData) return []
    return roundData.cities
      .filter(c => c.eligibleVoters > 0)
      .map(c => ({
        ...c,
        turnout: (c.totalVotes / c.eligibleVoters) * 100,
      }))
      .sort((a, b) => a.turnout - b.turnout)
      .slice(0, BOTTOM_COUNT)
  }, [roundData])

  const belowThresholdCount = useMemo(() => {
    if (!roundData) return 0
    return roundData.cities.filter(
      c => c.eligibleVoters > 0 && (c.totalVotes / c.eligibleVoters) * 100 < 50
    ).length
  }, [roundData])

  const turnoutBarData = useMemo(() => {
    return sortedCities.map(c => ({
      name: c.cityName,
      turnout: Number(c.turnout.toFixed(1)),
      eligibleVoters: c.eligibleVoters,
      totalVotes: c.totalVotes,
    }))
  }, [sortedCities])

  const { breakdownData, breakdownKeys, breakdownColors } = useMemo(() => {
    if (!sortedCities.length || !meta) return { breakdownData: [], breakdownKeys: [] as string[], breakdownColors: {} as Record<string, string> }

    const top10 = sortedCities.slice(0, BREAKDOWN_COUNT)

    // Find all party letters with >5% in any of the 10 cities
    const relevantLetters = new Set<string>()
    for (const city of top10) {
      for (const [letter, votes] of Object.entries(city.parties)) {
        if (city.validVotes > 0 && (votes / city.validVotes) * 100 > MIN_PARTY_PCT) {
          relevantLetters.add(letter)
        }
      }
    }

    const keys = Array.from(relevantLetters)
    const colors: Record<string, string> = {}
    for (const letter of keys) {
      colors[letter] = meta.parties[letter]?.color || '#888'
    }

    const data = top10.map(city => {
      const row: Record<string, string | number> = { city: city.cityName }
      let accounted = 0
      for (const letter of keys) {
        const pct = city.validVotes > 0
          ? Number(((city.parties[letter] || 0) / city.validVotes * 100).toFixed(1))
          : 0
        row[letter] = pct
        accounted += pct
      }
      row['אחר'] = Number(Math.max(0, 100 - accounted).toFixed(1))
      return row
    })

    const allColors: Record<string, string> = { ...colors, 'אחר': '#94a3b8' }

    return {
      breakdownData: data,
      breakdownKeys: [...keys, 'אחר'],
      breakdownColors: allColors,
    }
  }, [sortedCities, meta])

  const winnerTable = useMemo(() => {
    if (!meta) return []
    return sortedCities.map(city => {
      let winnerLetter = ''
      let maxVotes = 0
      for (const [letter, votes] of Object.entries(city.parties)) {
        if (votes > maxVotes) {
          maxVotes = votes
          winnerLetter = letter
        }
      }
      const partyMeta = meta.parties[winnerLetter]
      return {
        cityName: city.cityName,
        winnerName: partyMeta ? getPartyName(partyMeta, selectedRound) : winnerLetter,
        winnerColor: partyMeta?.color || '#888',
        winnerPct: city.validVotes > 0 ? (maxVotes / city.validVotes) * 100 : 0,
        turnout: city.turnout,
        eligibleVoters: city.eligibleVoters,
        totalVotes: city.totalVotes,
      }
    })
  }, [sortedCities, meta, selectedRound])

  if (metaLoading) {
    return <div className="space-y-6"><CardSkeleton /><ChartSkeleton /></div>
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="page-title">קיר הבושה</h1>
        <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
      </div>

      <DataWarningBanner roundId={selectedRound} />

      {roundLoading || !roundData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
          <ChartSkeleton />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              title="הצבעה הנמוכה ביותר"
              value={sortedCities[0]?.turnout ?? 0}
              type="percent"
              className="animate-fade-in-up stagger-1"
            />
            <StatCard
              title="ממוצע ארצי"
              value={nationalAgg?.turnoutPercent ?? 0}
              type="percent"
              className="animate-fade-in-up stagger-2"
            />
            <StatCard
              title="יישובים מתחת ל-50%"
              value={belowThresholdCount}
              className="animate-fade-in-up stagger-3"
            />
          </div>

          {/* Turnout Bar Chart */}
          <div className="card-base">
            <h2 className="section-title mb-3">20 היישובים עם אחוז ההצבעה הנמוך ביותר</h2>
            <div style={{ direction: 'ltr' }} className="h-[550px]">
              <ResponsiveBar
                data={turnoutBarData}
                keys={['turnout']}
                indexBy="name"
                layout="horizontal"
                margin={{ top: 10, right: 40, bottom: 40, left: 120 }}
                padding={0.3}
                colors={['#ef4444']}
                borderRadius={4}
                axisLeft={{ tickSize: 0, tickPadding: 8 }}
                axisBottom={{
                  legend: '% הצבעה',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                label={d => `${d.value}%`}
                labelSkipWidth={20}
                labelTextColor="#ffffff"
                theme={theme}
                valueScale={{ type: 'linear', max: 100 }}
                tooltip={({ data }) => (
                  <div style={theme.tooltip?.container}>
                    <strong>{data.name}</strong>
                    <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: 'auto auto', gap: '2px 12px' }}>
                      <span style={{ color: '#94a3b8' }}>הצבעה:</span>
                      <span>{data.turnout}%</span>
                      <span style={{ color: '#94a3b8' }}>בעלי זכות:</span>
                      <span>{formatFullNumber(data.eligibleVoters)}</span>
                      <span style={{ color: '#94a3b8' }}>הצביעו:</span>
                      <span>{formatFullNumber(data.totalVotes)}</span>
                    </div>
                  </div>
                )}
              />
            </div>
          </div>

          {/* Party Breakdown Stacked Bar */}
          {breakdownData.length > 0 && (
            <div className="card-base">
              <h2 className="section-title mb-3">פילוח מפלגתי — 10 היישובים התחתונים</h2>
              <div style={{ direction: 'ltr' }} className="h-[400px]">
                <ResponsiveBar
                  data={breakdownData}
                  keys={breakdownKeys}
                  indexBy="city"
                  layout="horizontal"
                  margin={{ top: 10, right: 20, bottom: 40, left: 120 }}
                  padding={0.3}
                  colors={({ id }) => breakdownColors[id as string] || '#888'}
                  borderRadius={2}
                  axisLeft={{ tickSize: 0, tickPadding: 8 }}
                  axisBottom={{
                    legend: '% קולות',
                    legendPosition: 'middle',
                    legendOffset: 32,
                  }}
                  label={d => (d.value as number) > 8 ? `${d.value}%` : ''}
                  labelSkipWidth={24}
                  labelTextColor="#ffffff"
                  theme={theme}
                  tooltip={({ id, value, indexValue }) => {
                    const partyMeta = meta?.parties[id as string]
                    const label = partyMeta ? getPartyName(partyMeta, selectedRound) : (id as string)
                    return (
                      <div style={theme.tooltip?.container}>
                        <strong>{indexValue}</strong>
                        <br />
                        <span style={{ color: breakdownColors[id as string] }}>●</span>{' '}
                        {label}: {value}%
                      </div>
                    )
                  }}
                />
              </div>
            </div>
          )}

          {/* Winner Table */}
          <div className="card-base">
            <h2 className="section-title mb-3">המפלגה המובילה ביישובים עם הצבעה נמוכה</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">יישוב</th>
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">בעלי זכות</th>
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">הצביעו</th>
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">% הצבעה</th>
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">מפלגה מובילה</th>
                    <th className="text-start py-2 px-3 font-medium text-muted-foreground">% מהקולות</th>
                  </tr>
                </thead>
                <tbody>
                  {winnerTable.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="py-2 px-3 font-medium">{row.cityName}</td>
                      <td className="py-2 px-3 tabular-nums">{formatFullNumber(row.eligibleVoters)}</td>
                      <td className="py-2 px-3 tabular-nums">{formatFullNumber(row.totalVotes)}</td>
                      <td className="py-2 px-3 tabular-nums">{formatPercent(row.turnout)}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: row.winnerColor }}
                          />
                          {row.winnerName}
                        </span>
                      </td>
                      <td className="py-2 px-3 tabular-nums">{formatPercent(row.winnerPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
