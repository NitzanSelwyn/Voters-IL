import { ResponsiveBar } from '@nivo/bar'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'

interface TurnoutCompareBarProps {
  data: { round: string; city: number; national: number }[]
}

export function TurnoutCompareBar({ data }: TurnoutCompareBarProps) {
  const { resolved } = useThemeContext()
  const { textColor, theme } = getChartTheme(resolved)

  return (
    <div style={{ direction: 'ltr' }} className="h-[300px]">
      <ResponsiveBar
        data={data}
        keys={['city', 'national']}
        indexBy="round"
        groupMode="grouped"
        margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
        padding={0.3}
        colors={[resolved === 'dark' ? '#4b8ede' : '#1a4f8b', '#94a3b8']}
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
            { id: 'city', label: 'יישוב', color: resolved === 'dark' ? '#4b8ede' : '#1a4f8b' },
            { id: 'national', label: 'ארצי', color: '#94a3b8' },
          ],
        }]}
        theme={theme}
      />
    </div>
  )
}
