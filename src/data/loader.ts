import type { MetaData, RoundData, BallotBoxData } from '@/types'

const cache = new Map<string, unknown>()

async function fetchJson<T>(path: string): Promise<T> {
  if (cache.has(path)) {
    return cache.get(path) as T
  }
  const res = await fetch(path)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.statusText}`)
  const data = await res.json()
  cache.set(path, data)
  return data as T
}

export async function loadMetaData(): Promise<MetaData> {
  return fetchJson<MetaData>('/data/meta.json')
}

export async function loadRoundData(roundId: number): Promise<RoundData> {
  return fetchJson<RoundData>(`/data/rounds/${roundId}.json`)
}

export async function loadBallotBoxData(roundId: number): Promise<BallotBoxData> {
  return fetchJson<BallotBoxData>(`/data/ballotboxes/${roundId}.json`)
}
