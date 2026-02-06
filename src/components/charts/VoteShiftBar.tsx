import { ResponsiveBar } from '@nivo/bar'
import { useMetaData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'

interface VoteShiftBarProps {
  shifts: { letter: string; change: number }[]
}

export function VoteShiftBar({ shifts }: VoteShiftBarProps) {
  const { meta } = useMetaData()
  const { resolved } = useThemeContext()
  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'
  if (!meta) return null

  const data = shifts
    .sort((a, b) => b.change - a.change)
    .map(s => ({
      party: meta.parties[s.letter]?.nameHe || s.letter,
      change: Number(s.change.toFixed(2)),
      color: s.change >= 0 ? '#22c55e' : '#ef4444',
    }))

  return (
    <div style={{ direction: 'ltr' }} className="h-[400px]">
      <ResponsiveBar
        data={data}
        keys={['change']}
        indexBy="party"
        layout="horizontal"
        margin={{ top: 10, right: 30, bottom: 40, left: 120 }}
        padding={0.3}
        colors={({ data }) => (data as Record<string, unknown>).color as string}
        borderRadius={4}
        axisLeft={{ tickSize: 0, tickPadding: 8 }}
        axisBottom={{
          legend: 'שינוי ב-% קולות',
          legendPosition: 'middle',
          legendOffset: 32,
        }}
        labelSkipWidth={20}
        labelTextColor="#ffffff"
        markers={[{
          axis: 'x',
          value: 0,
          lineStyle: { stroke: textColor, strokeWidth: 1 },
        }]}
        theme={{
          text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
          axis: { ticks: { text: { fill: textColor } }, legend: { text: { fill: textColor } } },
          grid: { line: { stroke: resolved === 'dark' ? '#333' : '#e5e5e5' } },
          tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
        }}
      />
    </div>
  )
}
