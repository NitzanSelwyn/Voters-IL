import { ResponsiveLine } from '@nivo/line'
import { useThemeContext } from '@/components/layout/ThemeProvider'

interface TurnoutTrendProps {
  data: { roundId: number; turnout: number }[]
}

export function TurnoutTrend({ data }: TurnoutTrendProps) {
  const { resolved } = useThemeContext()
  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'

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
        colors={['#1b5da5']}
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
        theme={{
          text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
          axis: { ticks: { text: { fill: textColor } }, legend: { text: { fill: textColor } } },
          grid: { line: { stroke: resolved === 'dark' ? '#333' : '#e5e5e5' } },
          crosshair: { line: { stroke: textColor, strokeOpacity: 0.3 } },
          tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
        }}
        useMesh
        tooltip={({ point }) => (
          <div className="bg-popover text-popover-foreground p-2 rounded-md shadow border border-border text-sm" dir="rtl">
            <strong>{point.data.x as string}</strong>: {point.data.yFormatted}%
          </div>
        )}
      />
    </div>
  )
}
