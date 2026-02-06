import { ResponsiveBar } from '@nivo/bar'
import { useMetaData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'

interface SeatsBarProps {
  partyTotals: Record<string, number>
  roundId: number
}

export function SeatsBar({ partyTotals, roundId }: SeatsBarProps) {
  const { meta } = useMetaData()
  const { resolved } = useThemeContext()
  if (!meta) return null

  const data = Object.entries(meta.parties)
    .filter(([letter]) => meta.parties[letter].seats[roundId] > 0)
    .map(([letter, party]) => ({
      party: party.nameHe,
      seats: party.seats[roundId] || 0,
      color: party.color,
      letter,
      votes: partyTotals[letter] || 0,
    }))
    .sort((a, b) => b.seats - a.seats)

  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'

  return (
    <div style={{ direction: 'ltr' }} className="h-[400px]">
      <ResponsiveBar
        data={data}
        keys={['seats']}
        indexBy="party"
        layout="horizontal"
        margin={{ top: 10, right: 20, bottom: 40, left: 120 }}
        padding={0.3}
        colors={({ data }) => (data as Record<string, unknown>).color as string}
        borderRadius={4}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisBottom={{
          legend: 'מנדטים',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        labelSkipWidth={20}
        labelTextColor="#ffffff"
        theme={{
          text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
          axis: { ticks: { text: { fill: textColor } }, legend: { text: { fill: textColor } } },
          grid: { line: { stroke: resolved === 'dark' ? '#333' : '#e5e5e5' } },
          tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
        }}
        tooltip={({ data }) => (
          <div className="bg-popover text-popover-foreground p-2 rounded-md shadow border border-border text-sm" dir="rtl">
            <strong>{(data as Record<string, unknown>).party as string}</strong>
            <br />
            מנדטים: {(data as Record<string, unknown>).seats as number}
          </div>
        )}
      />
    </div>
  )
}
