import { ResponsiveLine } from '@nivo/line'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'

interface TurnoutTrendProps {
  data: { roundId: number; turnout: number }[]
}

export function TurnoutTrend({ data }: TurnoutTrendProps) {
  const { resolved } = useThemeContext()
  const { theme } = getChartTheme(resolved)

  const chartData = [{
    id: 'אחוז הצבעה',
    data: data.map(d => ({ x: `כ-${d.roundId}`, y: Number(d.turnout.toFixed(1)) })),
  }]

  return (
    <div style={{ direction: 'ltr' }} className="h-[250px]">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        curve="monotoneX"
        colors={[resolved === 'dark' ? '#4b8ede' : '#1a4f8b']}
        lineWidth={3}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={3}
        pointBorderColor={{ from: 'serieColor' }}
        enableGridX={false}
        axisLeft={{
          legend: '%',
          legendPosition: 'middle',
          legendOffset: -40,
        }}
        theme={theme}
        useMesh
        tooltip={({ point }) => (
          <div className="bg-popover text-popover-foreground p-2 rounded-lg text-sm" dir="rtl">
            <strong>{point.data.x as string}</strong>: {point.data.yFormatted}%
          </div>
        )}
      />
    </div>
  )
}
