import { ResponsivePie } from '@nivo/pie'
import { useNavigate } from 'react-router-dom'
import { useMetaData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { formatNumber } from '@/components/shared/NumberDisplay'
import { getChartTheme } from '@/lib/chartTheme'
import { getPartyName } from '@/lib/utils'

interface VoteSharePieProps {
  partyTotals: Record<string, number>
  totalValid: number
  roundId?: number
}

export function VoteSharePie({ partyTotals, totalValid, roundId }: VoteSharePieProps) {
  const { meta } = useMetaData()
  const { resolved } = useThemeContext()
  const navigate = useNavigate()
  const { textColor } = getChartTheme(resolved)
  if (!meta) return null

  const threshold = totalValid * 0.02
  let othersVotes = 0
  const mainParties: { id: string; label: string; value: number; color: string }[] = []

  for (const [letter, votes] of Object.entries(partyTotals)) {
    if (votes >= threshold && meta.parties[letter]) {
      mainParties.push({
        id: letter,
        label: getPartyName(meta.parties[letter], roundId),
        value: votes,
        color: meta.parties[letter].color,
      })
    } else {
      othersVotes += votes
    }
  }

  mainParties.sort((a, b) => b.value - a.value)

  if (othersVotes > 0) {
    mainParties.push({
      id: 'others',
      label: 'אחרות',
      value: othersVotes,
      color: '#94a3b8',
    })
  }

  return (
    <div style={{ direction: 'ltr' }} className="h-[350px]">
      <ResponsivePie
        data={mainParties}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.55}
        padAngle={1}
        cornerRadius={4}
        colors={({ data }) => data.color}
        borderWidth={1}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLinkLabels={true}
        arcLinkLabelsTextColor={textColor}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLinkLabelsSkipAngle={10}
        arcLabel={d => formatNumber(d.value)}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#ffffff"
        onClick={(datum) => {
          if (datum.id !== 'others') {
            navigate(`/party/${datum.id}`)
          }
        }}
        theme={{
          text: { fontFamily: 'Noto Sans Hebrew', fontSize: 12 },
          tooltip: {
            container: {
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
              padding: 0,
            },
          },
        }}
        tooltip={({ datum }) => (
          <div className="bg-popover text-popover-foreground p-2 rounded-lg shadow-lg border border-border text-sm" dir="rtl">
            <strong>{datum.label}</strong>
            <br />
            {formatNumber(datum.value)} קולות ({((datum.value / totalValid) * 100).toFixed(1)}%)
          </div>
        )}
      />
    </div>
  )
}
