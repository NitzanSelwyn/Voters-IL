import { useMemo } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { useMetaData } from '@/data/hooks'
import { getChartTheme } from '@/lib/chartTheme'
import { getPartyName } from '@/lib/utils'
import type { RoundData } from '@/types'

interface SeatsTimelineProps {
  allRounds: RoundData[]
}

export function SeatsTimeline({ allRounds }: SeatsTimelineProps) {
  const { resolved } = useThemeContext()
  const { meta } = useMetaData()
  const { theme } = getChartTheme(resolved)

  const { data, keys } = useMemo(() => {
    if (!meta) return { data: [], keys: [] }

    const rounds = [...allRounds].sort((a, b) => a.roundId - b.roundId)

    // Collect total seats per party across all rounds
    const partyTotalSeats = new Map<string, number>()
    for (const rd of rounds) {
      for (const [letter, party] of Object.entries(meta.parties)) {
        const seats = party.seats[rd.roundId] || 0
        if (seats > 0) {
          partyTotalSeats.set(letter, (partyTotalSeats.get(letter) || 0) + seats)
        }
      }
    }

    // Sort by total seats descending — largest at bar bottom for visual stability
    const sortedKeys = [...partyTotalSeats.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([letter]) => letter)

    const barData = rounds.map(rd => {
      const row: Record<string, unknown> = { round: `כ-${rd.roundId}` }
      for (const letter of sortedKeys) {
        const seats = meta.parties[letter]?.seats[rd.roundId] || 0
        if (seats > 0) row[letter] = seats
      }
      return row
    })

    return { data: barData, keys: sortedKeys }
  }, [allRounds, meta])

  if (!meta || data.length === 0) return null

  return (
    <div style={{ direction: 'ltr' }} className="h-[500px]">
      <ResponsiveBar
        data={data}
        keys={keys}
        indexBy="round"
        layout="vertical"
        margin={{ top: 20, right: 130, bottom: 50, left: 50 }}
        padding={0.25}
        colors={(bar) => meta.parties[bar.id as string]?.color || '#888'}
        enableLabel={false}
        axisLeft={{
          legend: 'מנדטים',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        axisBottom={{
          tickRotation: -30,
        }}
        legends={[{
          dataFrom: 'keys',
          anchor: 'bottom-right',
          direction: 'column',
          translateX: 125,
          itemWidth: 115,
          itemHeight: 16,
          itemsSpacing: 2,
          symbolSize: 10,
          symbolShape: 'square',
        }]}
        tooltip={({ id, value, indexValue }) => {
          const party = meta.parties[id as string]
          const name = party ? getPartyName(party, Number(String(indexValue).replace('כ-', ''))) : id
          return (
            <div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-lg p-2 text-sm">
              <strong>{name}</strong>: {value} מנדטים ({indexValue})
            </div>
          )
        }}
        theme={theme}
      />
    </div>
  )
}
