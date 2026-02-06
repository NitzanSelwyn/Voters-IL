import { ResponsiveHeatMap } from '@nivo/heatmap'
import { useThemeContext } from '@/components/layout/ThemeProvider'

interface CityHeatmapProps {
  data: { id: string; data: { x: string; y: number | null }[] }[]
}

export function CityHeatmap({ data }: CityHeatmapProps) {
  const { resolved } = useThemeContext()
  const textColor = resolved === 'dark' ? '#fafafa' : '#0a0a0a'

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
        emptyColor={resolved === 'dark' ? '#333' : '#f5f5f5'}
        borderWidth={1}
        borderColor={resolved === 'dark' ? '#444' : '#ddd'}
        labelTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
        theme={{
          text: { fill: textColor, fontFamily: 'Noto Sans Hebrew' },
          axis: { ticks: { text: { fill: textColor } } },
          tooltip: { container: { background: resolved === 'dark' ? '#1a1a1a' : '#fff', color: textColor } },
        }}
        tooltip={({ cell }) => (
          <div className="bg-popover text-popover-foreground p-2 rounded-md shadow border border-border text-sm" dir="rtl">
            <strong>{cell.serieId}</strong> | {cell.data.x}
            <br />
            {cell.value != null ? `${cell.formattedValue}%` : 'אין נתונים'}
          </div>
        )}
      />
    </div>
  )
}
