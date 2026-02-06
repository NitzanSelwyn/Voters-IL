import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PartyMeta } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPartyName(party: PartyMeta, roundId?: number): string {
  if (roundId && party.aliasRounds?.[roundId]) {
    return party.aliasRounds[roundId].nameHe
  }
  return party.nameHe
}

/**
 * Formats a number into a compact human-readable string.
 * - Numbers < 1,000 are returned as-is (e.g. 742 -> "742")
 * - Numbers 1,000 - 999,999 are formatted as K (e.g. 50100 -> "50.1K", 124521 -> "124.5K")
 * - Numbers >= 1,000,000 are formatted as M (e.g. 1234567 -> "1.2M")
 * Trailing ".0" is stripped (e.g. 50000 -> "50K", not "50.0K").
 */
export function formatCompactNumber(n: number): string {
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''

  if (abs < 1000) {
    return sign + Math.round(abs).toString()
  }
  if (abs < 1_000_000) {
    const val = (abs / 1000).toFixed(1)
    const clean = val.endsWith('.0') ? val.slice(0, -2) : val
    return sign + clean + 'K'
  }
  const val = (abs / 1_000_000).toFixed(1)
  const clean = val.endsWith('.0') ? val.slice(0, -2) : val
  return sign + clean + 'M'
}
