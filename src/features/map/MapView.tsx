import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useMetaData, useRoundData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { DataWarningBanner } from '@/components/shared/DataWarningBanner'
import { formatNumber, formatPercent } from '@/components/shared/NumberDisplay'
import { getPartyName } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { ChartSkeleton } from '@/components/shared/LoadingSkeleton'
import { useIsMobile } from '@/hooks/useMediaQuery'
import type { ColorByMode } from '@/types'
import 'leaflet/dist/leaflet.css'

const ISRAEL_CENTER: [number, number] = [31.5, 34.8]
const ISRAEL_ZOOM = 8

export default function MapView() {
  const { meta, loading: metaLoading } = useMetaData()
  const { resolved } = useThemeContext()
  const [selectedRound, setSelectedRound] = useState<number>(25)
  const { data: roundData, loading: roundLoading } = useRoundData(selectedRound)
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [colorBy, setColorBy] = useState<ColorByMode>('winner')
  const [selectedCity, setSelectedCity] = useState<string | null>(null)

  const tileUrl = resolved === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const markers = useMemo(() => {
    if (!roundData || !meta) return []
    return roundData.cities
      .filter(c => {
        const cityMeta = meta.cities.find(cm => cm.code === c.cityCode)
        return cityMeta?.lat && cityMeta?.lng
      })
      .map(c => {
        const cityMeta = meta.cities.find(cm => cm.code === c.cityCode)!
        const topParty = Object.entries(c.parties).sort((a, b) => b[1] - a[1])[0]
        const winnerLetter = topParty?.[0]
        const winnerParty = winnerLetter ? meta.parties[winnerLetter] : null
        const winnerColor = winnerParty?.color || '#888'
        const turnout = c.eligibleVoters > 0 ? (c.totalVotes / c.eligibleVoters) * 100 : 0

        let markerColor = winnerColor
        if (colorBy === 'turnout') {
          const t = Math.min(turnout / 100, 1)
          const r = Math.round(255 * (1 - t))
          const g = Math.round(255 * t)
          markerColor = `rgb(${r},${g},100)`
        }

        const radius = Math.max(3, Math.min(20, Math.log(c.eligibleVoters + 1) * 2))

        const top3 = Object.entries(c.parties)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([l, v]) => ({ name: meta.parties[l] ? getPartyName(meta.parties[l], selectedRound) : l, votes: v }))

        return {
          cityCode: c.cityCode,
          name: cityMeta.name,
          lat: cityMeta.lat!,
          lng: cityMeta.lng!,
          color: markerColor,
          radius,
          turnout,
          winnerName: winnerParty ? getPartyName(winnerParty, selectedRound) : (winnerLetter || ''),
          top3,
        }
      })
  }, [roundData, meta, colorBy])

  const selectedCityData = useMemo(() => {
    if (!selectedCity || !roundData || !meta) return null
    const c = roundData.cities.find(c => c.cityCode === selectedCity)
    if (!c) return null
    const parties = Object.entries(c.parties)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([l, v]) => ({
        name: meta.parties[l] ? getPartyName(meta.parties[l], selectedRound) : l,
        color: meta.parties[l]?.color || '#888',
        votes: v,
        pct: c.validVotes > 0 ? (v / c.validVotes) * 100 : 0,
      }))
    return { ...c, partiesList: parties, cityName: meta.cities.find(cm => cm.code === selectedCity)?.name || c.cityName }
  }, [selectedCity, roundData, meta])

  if (metaLoading) return <ChartSkeleton />

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">מפה אינטראקטיבית</h1>
          <p className="text-sm text-muted-foreground mt-1">לחץ על יישוב לפרטים</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
          <select
            value={colorBy}
            onChange={e => setColorBy(e.target.value as ColorByMode)}
            className="px-3 py-1.5 rounded-lg border border-input bg-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="winner">צבע: מפלגה מנצחת</option>
            <option value="turnout">צבע: אחוז הצבעה</option>
          </select>
        </div>
      </div>

      <DataWarningBanner roundId={selectedRound} />

      <div className="flex gap-4">
        <div
          className={`rounded-xl border border-border overflow-hidden ${selectedCity && !isMobile ? 'flex-1' : 'w-full'}`}
          style={{ height: isMobile ? '60vh' : '70vh', boxShadow: 'var(--shadow-card)' }}
        >
          {roundLoading ? (
            <div className="flex items-center justify-center h-full bg-card">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <MapContainer center={ISRAEL_CENTER} zoom={ISRAEL_ZOOM} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
              <TileLayer url={tileUrl} attribution='&copy; OpenStreetMap' />
              {markers.map(m => (
                <CircleMarker
                  key={m.cityCode}
                  center={[m.lat, m.lng]}
                  radius={m.radius}
                  fillColor={m.color}
                  color={m.color}
                  weight={1}
                  opacity={0.8}
                  fillOpacity={0.6}
                  eventHandlers={{
                    click: () => setSelectedCity(m.cityCode),
                  }}
                >
                  <Tooltip direction="top" offset={[0, -5]}>
                    <div dir="rtl" className="text-sm">
                      <strong>{m.name}</strong><br />
                      מנצחת: {m.winnerName}<br />
                      הצבעה: {m.turnout.toFixed(1)}%
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {selectedCity && selectedCityData && !isMobile && (
          <div className="w-80 card-base overflow-y-auto animate-fade-in" style={{ maxHeight: '70vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedCityData.cityName}</h2>
              <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors">✕</button>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">בעלי זכות</span>
                <span className="font-medium">{formatNumber(selectedCityData.eligibleVoters)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">מצביעים</span>
                <span className="font-medium">{formatNumber(selectedCityData.totalVotes)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-muted-foreground">אחוז הצבעה</span>
                <span className="font-bold text-primary">{formatPercent(selectedCityData.eligibleVoters > 0 ? (selectedCityData.totalVotes / selectedCityData.eligibleVoters) * 100 : 0)}</span>
              </div>
              <div className="pt-2 space-y-2">
                {selectedCityData.partiesList.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-sm">{p.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatNumber(p.votes)} ({p.pct.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate(`/city/${selectedCity}`)}
                className="mt-4 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                צפייה בעמוד היישוב
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCity && selectedCityData && isMobile && (
        <div className="card-base animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{selectedCityData.cityName}</h2>
            <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent">✕</button>
          </div>
          <div className="space-y-2 text-sm">
            <p>הצבעה: <span className="font-bold text-primary">{formatPercent(selectedCityData.eligibleVoters > 0 ? (selectedCityData.totalVotes / selectedCityData.eligibleVoters) * 100 : 0)}</span></p>
            {selectedCityData.partiesList.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
                <span className="text-muted-foreground">{p.pct.toFixed(1)}%</span>
              </div>
            ))}
            <button
              onClick={() => navigate(`/city/${selectedCity}`)}
              className="mt-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm"
            >
              צפייה בעמוד היישוב
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
