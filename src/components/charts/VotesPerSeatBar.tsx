import { useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { useMetaData } from '@/data/hooks'
import { getChartTheme } from '@/lib/chartTheme'
import { formatCompactNumber, getPartyName } from '@/lib/utils'
import type { NationalAggregates } from '@/types'

interface VotesPerSeatBarProps {
  aggregates: NationalAggregates
  roundId: number
}

export function VotesPerSeatBar({ aggregates, roundId }: VotesPerSeatBarProps) {
  const { resolved } = useThemeContext()
  const { meta } = useMetaData()
  const { theme } = getChartTheme(resolved)

  const data = useMemo(() => {
    if (!meta) return []

    return Object.entries(aggregates.partyTotals)
      .filter(([letter]) => {
        const seats = meta.parties[letter]?.seats[roundId]
        return seats && seats > 0
      })
      .map(([letter, votes]) => {
        const party = meta.parties[letter]
        const seats = party.seats[roundId]
        return {
          party: getPartyName(party, roundId),
          letter,
          votesPerSeat: Math.round(votes / seats),
          votes,
          seats,
          color: party.color,
        }
      })
      .sort((a, b) => a.votesPerSeat - b.votesPerSeat)
  }, [aggregates, roundId, meta])

  if (!meta || data.length === 0) return null

  return (
    <div style={{ direction: 'ltr' }} className="h-[400px]">
      <ResponsiveBar
        data={data}
        keys={['votesPerSeat']}
        indexBy="party"
        layout="horizontal"
        margin={{ top: 10, right: 30, bottom: 40, left: 120 }}
        padding={0.3}
        colors={({ data }) => (data as Record<string, unknown>).color as string}
        borderRadius={4}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        axisBottom={{
          legend: 'קולות למנדט',
          legendPosition: 'middle',
          legendOffset: 32,
          format: (v) => formatCompactNumber(Number(v)),
        }}
        label={d => formatCompactNumber(d.value as number)}
        labelSkipWidth={40}
        labelTextColor="#ffffff"
        tooltip={({ data: d }) => {
          const row = d as Record<string, unknown>
          return (
            <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-2 text-sm">
              <strong>{row.party as string}</strong>
              <div>{(row.seats as number).toLocaleString()} מנדטים</div>
              <div>{(row.votes as number).toLocaleString()} קולות</div>
              <div>{(row.votesPerSeat as number).toLocaleString()} קולות למנדט</div>
            </div>
          )
        }}
        theme={theme}
      />
    </div>
  )
}
