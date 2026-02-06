import { ResponsiveLine } from '@nivo/line'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { useMetaData } from '@/data/hooks'
import { getChartTheme } from '@/lib/chartTheme'

interface PartyTrendData {
  letter: string
  data: { roundId: number; percent: number }[]
}

interface PartyTrendLinesProps {
  trends: PartyTrendData[]
}

export function PartyTrendLines({ trends }: PartyTrendLinesProps) {
  const { resolved } = useThemeContext()
  const { meta } = useMetaData()
  const { textColor, theme } = getChartTheme(resolved)

  const chartData = trends.map(t => ({
    id: meta?.parties[t.letter]?.nameHe || t.letter,
    color: meta?.parties[t.letter]?.color || '#888',
    data: t.data.map(d => ({ x: `כ-${d.roundId}`, y: Number(d.percent.toFixed(1)) })),
  }))

  return (
    <div style={{ direction: 'ltr' }} className="h-[350px]">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 20, right: 100, bottom: 40, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        curve="monotoneX"
        colors={chartData.map(d => d.color)}
        lineWidth={2}
        pointSize={6}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointColor={{ theme: 'background' }}
        enableGridX={false}
        legends={[{
          anchor: 'bottom-right',
          direction: 'column',
          translateX: 90,
          itemWidth: 80,
          itemHeight: 18,
          itemTextColor: textColor,
          symbolSize: 10,
          symbolShape: 'circle',
        }]}
        axisLeft={{
          legend: '% קולות',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        theme={theme}
        useMesh
      />
    </div>
  )
}
