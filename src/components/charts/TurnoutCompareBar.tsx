import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'

interface TurnoutCompareBarProps {
  data: { round: string; city: number; national: number }[]
}

export function TurnoutCompareBar({ data }: TurnoutCompareBarProps) {
  const { resolved } = useThemeContext()
  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'

  return (
    <div style={{ direction: 'ltr' }} className="h-[300px]">
      <ResponsiveBar
        data={data}
        keys={['city', 'national']}
        indexBy="round"
        groupMode="grouped"
        margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
        padding={0.3}
        colors={['#1b5da5', '#9ca3af']}
        borderRadius={4}
        axisLeft={{
          legend: '% הצבעה',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        legends={[{
          dataFrom: 'keys',
          anchor: 'top-right',
          direction: 'row',
          translateY: -20,
          itemWidth: 80,
          itemHeight: 18,
          itemTextColor: textColor,
          symbolSize: 10,
          data: [
            { id: 'city', label: 'יישוב', color: '#1b5da5' },
            { id: 'national', label: 'ארצי', color: '#9ca3af' },
          ],
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
