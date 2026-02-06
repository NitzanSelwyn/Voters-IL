import { ResponsiveHeatMap } from '@nivo/heatmap'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { getChartTheme } from '@/lib/chartTheme'

interface CityHeatmapProps {
  data: { id: string; data: { x: string; y: number | null }[] }[]
}

export function CityHeatmap({ data }: CityHeatmapProps) {
  const { resolved } = useThemeContext()
  const { theme } = getChartTheme(resolved)

  return (
    <div style={{ direction: 'ltr' }} className="h-[600px]">
      <ResponsiveHeatMap
        data={data}
        margin={{ top: 40, right: 20, bottom: 20, left: 120 }}
        axisTop={{
          tickSize: 0,
          tickPadding: 8,
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 8,
        }}
        colors={{
          type: 'sequential',
          scheme: 'blues',
          minValue: 0,
          maxValue: 50,
        }}
        emptyColor={resolved === 'dark' ? '#1e2d45' : '#f1f5f9'}
        borderWidth={1}
        borderColor={resolved === 'dark' ? '#1e3050' : '#e2e8f0'}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        theme={theme}
        tooltip={({ cell }) => (
          <div className="text-sm" dir="rtl">
            <strong>{cell.serieId}</strong> | {cell.data.x}
            <br />
            {cell.value != null ? `${cell.formattedValue}%` : 'אין נתונים'}
          </div>
        )}
      />
    </div>
  )
}
