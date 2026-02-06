import { ResponsiveBump } from '@nivo/bump'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { useMetaData } from '@/data/hooks'
import type { NationalAggregates } from '@/types'

interface BumpRankingProps {
  aggregates: Map<number, NationalAggregates>
  topN?: number
}

export function BumpRanking({ aggregates, topN = 12 }: BumpRankingProps) {
  const { resolved } = useThemeContext()
  const { meta } = useMetaData()
  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'
  if (!meta) return null

  const roundIds = [...aggregates.keys()].sort()

  // Find top N parties across all rounds
  const partyMaxVotes = new Map<string, number>()
  for (const agg of aggregates.values()) {
    for (const [letter, votes] of Object.entries(agg.partyTotals)) {
      partyMaxVotes.set(letter, Math.max(partyMaxVotes.get(letter) || 0, votes))
    }
  }
  const topParties = [...partyMaxVotes.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([letter]) => letter)

  const data = topParties.map(letter => {
    const party = meta.parties[letter]
    return {
      id: party?.nameHe || letter,
      color: party?.color || '#888',
      data: roundIds.map(roundId => {
        const agg = aggregates.get(roundId)!
        const sorted = Object.entries(agg.partyTotals)
          .filter(([l]) => topParties.includes(l))
          .sort((a, b) => b[1] - a[1])
        const rank = sorted.findIndex(([l]) => l === letter) + 1
        return { x: `כ-${roundId}`, y: rank || null }
      }),
    }
  })

  return (
    <div style={{ direction: 'ltr' }} className="h-[500px]">
      <ResponsiveBump
        data={data}
        margin={{ top: 20, right: 100, bottom: 40, left: 40 }}
        colors={data.map(d => d.color)}
        lineWidth={3}
        activeLineWidth={5}
        pointSize={8}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serie.color' }}
        axisLeft={{
          legend: 'דירוג',
          legendPosition: 'middle',
          legendOffset: -30,
        }}
        theme={{
          text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
          axis: { ticks: { text: { fill: textColor } }, legend: { text: { fill: textColor } } },
          tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
        }}
      />
    </div>
  )
}
