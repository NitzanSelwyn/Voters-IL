export interface RoundMeta {
  id: number
  name: string
  date: string
  year: number
}

export interface PartyMeta {
  letter: string
  nameHe: string
  nameEn: string
  color: string
  seats: Record<number, number>
  aliasRounds?: Record<number, { nameHe: string; nameEn: string }>
}

export interface CityMeta {
  code: string
  name: string
  aliases?: string[]
  district?: string
  lat?: number
  lng?: number
}

export interface DataCompleteness {
  hasPerCityData: boolean
  hasPerBallotBoxData: boolean
  hasEligibleVoters: boolean
  hasCityCodes: boolean
  hasInvalidVotes: boolean
  dataSource: string
  notes?: string
}

export interface MetaData {
  rounds: RoundMeta[]
  parties: Record<string, PartyMeta>
  cities: CityMeta[]
  dataCompleteness: Record<number, DataCompleteness>
}

export interface CityRoundData {
  cityCode: string
  cityName: string
  eligibleVoters: number
  totalVotes: number
  invalidVotes: number
  validVotes: number
  parties: Record<string, number>
}

export interface RoundData {
  roundId: number
  cities: CityRoundData[]
}

export interface BallotBox {
  id: string
  cityCode: string
  cityName: string
  ballotNumber: number
  eligibleVoters: number
  totalVotes: number
  invalidVotes: number
  validVotes: number
  parties: Record<string, number>
}

export interface BallotBoxData {
  roundId: number
  ballotBoxes: BallotBox[]
}

export interface NationalAggregates {
  roundId: number
  totalEligible: number
  totalVotes: number
  totalInvalid: number
  totalValid: number
  turnoutPercent: number
  partyTotals: Record<string, number>
}

export type ThemeMode = 'light' | 'dark' | 'system'

export type ColorByMode = 'winner' | 'turnout' | 'change'
