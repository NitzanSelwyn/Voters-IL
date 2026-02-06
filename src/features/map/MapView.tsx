import { useState, useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useMetaData, useRoundData } from '@/data/hooks'
import { useThemeContext } from '@/components/layout/ThemeProvider'
import { RoundSelector } from '@/components/shared/RoundSelector'
import { formatNumber, formatPercent } from '@/components/shared/NumberDisplay'
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
        const winnerColor = winnerLetter ? (meta.parties[winnerLetter]?.color || '#888') : '#888'
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
          .map(([l, v]) => ({ name: meta.parties[l]?.nameHe || l, votes: v }))

        return {
          cityCode: c.cityCode,
          name: cityMeta.name,
          lat: cityMeta.lat!,
          lng: cityMeta.lng!,
          color: markerColor,
          radius,
          turnout,
          winnerName: winnerLetter ? (meta.parties[winnerLetter]?.nameHe || winnerLetter) : '',
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
        name: meta.parties[l]?.nameHe || l,
        color: meta.parties[l]?.color || '#888',
        votes: v,
        pct: c.validVotes > 0 ? (v / c.validVotes) * 100 : 0,
      }))
    return { ...c, partiesList: parties, cityName: meta.cities.find(cm => cm.code === selectedCity)?.name || c.cityName }
  }, [selectedCity, roundData, meta])

  if (metaLoading) return <ChartSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">מפה אינטראקטיבית</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <RoundSelector selected={selectedRound} onChange={setSelectedRound} />
          <select
            value={colorBy}
            onChange={e => setColorBy(e.target.value as ColorByMode)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            <option value="winner">צבע: מפלגה מנצחת</option>
            <option value="turnout">צבע: אחוז הצבעה</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <div className={`rounded-xl border border-border overflow-hidden ${selectedCity && !isMobile ? 'flex-1' : 'w-full'}`} style={{ height: isMobile ? '60vh' : '70vh' }}>
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
          <div className="w-80 rounded-xl border border-border bg-card p-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{selectedCityData.cityName}</h2>
              <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p>בעלי זכות: {formatNumber(selectedCityData.eligibleVoters)}</p>
              <p>מצביעים: {formatNumber(selectedCityData.totalVotes)}</p>
              <p>אחוז הצבעה: {formatPercent(selectedCityData.eligibleVoters > 0 ? (selectedCityData.totalVotes / selectedCityData.eligibleVoters) * 100 : 0)}</p>
              <hr className="border-border my-2" />
              {selectedCityData.partiesList.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.name}</span>
                  </div>
                  <span>{formatNumber(p.votes)} ({p.pct.toFixed(1)}%)</span>
                </div>
              ))}
              <button
                onClick={() => navigate(`/city/${selectedCity}`)}
                className="mt-4 w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                צפייה בעמוד היישוב
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCity && selectedCityData && isMobile && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{selectedCityData.cityName}</h2>
            <button onClick={() => setSelectedCity(null)} className="text-muted-foreground hover:text-foreground">✕</button>
          </div>
          <div className="space-y-2 text-sm">
            <p>הצבעה: {formatPercent(selectedCityData.eligibleVoters > 0 ? (selectedCityData.totalVotes / selectedCityData.eligibleVoters) * 100 : 0)}</p>
            {selectedCityData.partiesList.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span>{p.name}</span>
                </div>
                <span>{p.pct.toFixed(1)}%</span>
              </div>
            ))}
            <button
              onClick={() => navigate(`/city/${selectedCity}`)}
              className="mt-2 w-full py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              צפייה בעמוד היישוב
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
