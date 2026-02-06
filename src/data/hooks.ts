import { useState, useEffect, useMemo, useContext, createContext, type ReactNode } from 'react'
import { loadMetaData, loadRoundData, loadBallotBoxData } from './loader'
import type { MetaData, RoundData, BallotBoxData, NationalAggregates, CityMeta } from '@/types'
import React from 'react'
import Fuse from 'fuse.js'

// --- Meta Data Context ---
interface MetaContextValue {
  meta: MetaData | null
  loading: boolean
  error: string | null
}

const MetaContext = createContext<MetaContextValue>({ meta: null, loading: true, error: null })

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadMetaData()
      .then(setMeta)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return React.createElement(MetaContext.Provider, { value: { meta, loading, error } }, children)
}

export function useMetaData() {
  return useContext(MetaContext)
}

// --- Round Data ---
export function useRoundData(roundId: number | null) {
  const [data, setData] = useState<RoundData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (roundId === null) return
    setLoading(true)
    setError(null)
    loadRoundData(roundId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [roundId])

  return { data, loading, error }
}

// --- Ballot Box Data ---
export function useBallotBoxData(roundId: number | null) {
  const [data, setData] = useState<BallotBoxData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (roundId === null) return
    setLoading(true)
    setError(null)
    loadBallotBoxData(roundId)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [roundId])

  return { data, loading, error }
}

// --- National Aggregates ---
export function useNationalAggregates(roundData: RoundData | null): NationalAggregates | null {
  return useMemo(() => {
    if (!roundData) return null
    const partyTotals: Record<string, number> = {}
    let totalEligible = 0
    let totalVotes = 0
    let totalInvalid = 0
    let totalValid = 0

    for (const city of roundData.cities) {
      totalEligible += city.eligibleVoters
      totalVotes += city.totalVotes
      totalInvalid += city.invalidVotes
      totalValid += city.validVotes
      for (const [party, votes] of Object.entries(city.parties)) {
        partyTotals[party] = (partyTotals[party] || 0) + votes
      }
    }

    return {
      roundId: roundData.roundId,
      totalEligible,
      totalVotes,
      totalInvalid,
      totalValid,
      turnoutPercent: totalEligible > 0 ? (totalVotes / totalEligible) * 100 : 0,
      partyTotals,
    }
  }, [roundData])
}

// --- Party History across rounds ---
export function usePartyHistory(partyLetter: string | null) {
  const [rounds, setRounds] = useState<Map<number, RoundData>>(new Map())
  const [loading, setLoading] = useState(false)
  const { meta } = useMetaData()

  useEffect(() => {
    if (!partyLetter || !meta) return
    setLoading(true)
    const roundIds = meta.rounds.map(r => r.id)
    Promise.all(roundIds.map(id => loadRoundData(id)))
      .then(results => {
        const map = new Map<number, RoundData>()
        results.forEach((r, i) => map.set(roundIds[i], r))
        setRounds(map)
      })
      .finally(() => setLoading(false))
  }, [partyLetter, meta])

  return { rounds, loading }
}

// --- Fuse.js Search ---
export function useFuseSearch(cities: CityMeta[]) {
  return useMemo(() => {
    if (!cities.length) return null
    return new Fuse(cities, {
      keys: ['name', 'aliases'],
      threshold: 0.3,
      distance: 100,
    })
  }, [cities])
}
