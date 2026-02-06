import { ResponsiveBar } from '@nivo/bar'
import { useMetaData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'
import { getPartyName, formatCompactNumber } from '@/lib/utils'

interface SeatsBarProps {
  partyTotals: Record<string, number>
  roundId: number
}

export function SeatsBar({ partyTotals, roundId }: SeatsBarProps) {
  const { meta } = useMetaData()
  const { resolved } = useThemeContext()
  if (!meta) return null

  const { textColor, theme } = getChartTheme(resolved)

  const data = Object.entries(meta.parties)
    .filter(([letter]) => meta.parties[letter].seats[roundId] > 0)
    .map(([letter, party]) => ({
      party: getPartyName(party, roundId),
      seats: party.seats[roundId] || 0,
      color: party.color,
      letter,
      votes: partyTotals[letter] || 0,
    }))
    .sort((a, b) => b.seats - a.seats)

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
        theme={theme}
        tooltip={({ data }) => {
          const d = data as Record<string, unknown>
          return (
            <div className="bg-popover text-popover-foreground p-2 rounded-lg text-sm" style={{ color: textColor }} dir="rtl">
              <strong>{d.party as string}</strong>
              <br />
              מנדטים: {d.seats as number}
              <br />
              קולות: {formatCompactNumber(d.votes as number)}
            </div>
          )
        }}
      />
    </div>
  )
}
