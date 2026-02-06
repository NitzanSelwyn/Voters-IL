export function getChartTheme(resolved: 'light' | 'dark') {
  const textColor = resolved === 'dark' ? '#e2e8f0' : '#0f172a'
  const gridColor = resolved === 'dark' ? '#1e3050' : '#e2e8f0'
  const tooltipBg = resolved === 'dark' ? '#162032' : '#ffffff'

  return {
    textColor,
    gridColor,
    theme: {
      text: { fill: textColor, fontFamily: 'Noto Sans Hebrew', fontSize: 12 },
      axis: {
        ticks: { text: { fill: textColor, fontSize: 11 } },
        legend: { text: { fill: textColor, fontSize: 12 } },
      },
      grid: { line: { stroke: gridColor, strokeDasharray: '3 3' } },
      crosshair: { line: { stroke: textColor, strokeOpacity: 0.2 } },
      tooltip: {
        container: {
          background: tooltipBg,
          color: textColor,
          borderRadius: '8px',
          boxShadow: resolved === 'dark'
            ? '0 8px 24px rgba(0,0,0,0.3)'
            : '0 8px 24px rgba(15,23,42,0.1)',
          border: `1px solid ${gridColor}`,
          padding: '8px 12px',
          fontSize: '13px',
        },
      },
    },
  }
}
