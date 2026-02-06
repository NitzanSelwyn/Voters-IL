import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { partyMeta, roundsMeta, resourceIds } from './party-meta'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search'
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'data')
const BATCH_SIZE = 10000

// Known metadata field names in Hebrew
const META_FIELDS = new Set([
  'שם ישוב',
  'סמל ישוב',
  'בזב',
  'מצביעים',
  'פסולים',
  'כשרים',
  'מספר קלפי',
  'סמל ועדה',
  'ברזל',
  'שם ועדה',
  'קלפי',
  '_id',
])

function isMetaField(field: string): boolean {
  const trimmed = field.trim()
  if (META_FIELDS.has(trimmed)) return true
  if (trimmed.startsWith('_')) return true
  if (/^שם/.test(trimmed)) return true
  if (/^סמל/.test(trimmed)) return true
  if (/^מספר/.test(trimmed)) return true
  if (/ברזל/.test(trimmed)) return true
  if (/קלפי/.test(trimmed)) return true
  return false
}

function normalizeCityName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
}

async function fetchAllRecords(resourceId: string): Promise<Record<string, unknown>[]> {
  const allRecords: Record<string, unknown>[] = []
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const url = `${API_BASE}?resource_id=${resourceId}&limit=${BATCH_SIZE}&offset=${offset}`
    console.log(`    Fetching offset=${offset}...`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`API error ${response.status}: ${response.statusText}`)
    const json = await response.json() as {
      success: boolean
      result: { records: Record<string, unknown>[]; total: number }
    }
    if (!json.success) throw new Error('API returned success=false')

    const records = json.result.records
    total = json.result.total
    allRecords.push(...records)
    offset += records.length

    if (records.length === 0) break
    console.log(`    Got ${allRecords.length} / ${total} records`)
  }

  return allRecords
}

interface CityRoundData {
  cityCode: string
  cityName: string
  eligibleVoters: number
  totalVotes: number
  invalidVotes: number
  validVotes: number
  parties: Record<string, number>
}

interface BallotBox {
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

function processFactionsRecords(records: Record<string, unknown>[], roundId: number): CityRoundData[] {
  if (records.length === 0) return []

  // Detect party columns from the first record's keys
  const allFields = Object.keys(records[0])
  const partyFields = allFields.filter(f => !isMetaField(f) && f.trim().length > 0)

  console.log(`  Found ${partyFields.length} party columns for round ${roundId}`)
  if (partyFields.length > 0) {
    console.log(`  Sample party columns: ${partyFields.slice(0, 8).join(', ')}`)
  }

  const cities: CityRoundData[] = []

  for (const row of records) {
    const cityName = normalizeCityName(row['שם ישוב'] as string)
    const cityCode = String(row['סמל ישוב'] || '').trim()
    if (!cityName || !cityCode) continue

    const eligibleVoters = Number(row['בזב']) || 0
    const totalVotes = Number(row['מצביעים']) || 0
    const invalidVotes = Number(row['פסולים']) || 0
    const validVotes = Number(row['כשרים']) || 0

    const parties: Record<string, number> = {}
    for (const field of partyFields) {
      const votes = Number(row[field]) || 0
      if (votes > 0) {
        parties[field.trim()] = votes
      }
    }

    cities.push({
      cityCode,
      cityName,
      eligibleVoters,
      totalVotes,
      invalidVotes,
      validVotes,
      parties,
    })
  }

  return cities
}

function processIndividualsRecords(records: Record<string, unknown>[], roundId: number): BallotBox[] {
  if (records.length === 0) return []

  const allFields = Object.keys(records[0])
  const partyFields = allFields.filter(f => !isMetaField(f) && f.trim().length > 0)

  const ballots: BallotBox[] = []

  for (const row of records) {
    const cityName = normalizeCityName(row['שם ישוב'] as string)
    const cityCode = String(row['סמל ישוב'] || '').trim()
    const ballotNumber = Number(row['מספר קלפי'] || row['קלפי']) || 0
    if (!cityCode) continue

    const eligibleVoters = Number(row['בזב']) || 0
    const totalVotes = Number(row['מצביעים']) || 0
    const invalidVotes = Number(row['פסולים']) || 0
    const validVotes = Number(row['כשרים']) || 0

    const parties: Record<string, number> = {}
    for (const field of partyFields) {
      const votes = Number(row[field]) || 0
      if (votes > 0) {
        parties[field.trim()] = votes
      }
    }

    ballots.push({
      id: `${roundId}-${cityCode}-${ballotNumber}`,
      cityCode,
      cityName,
      ballotNumber,
      eligibleVoters,
      totalVotes,
      invalidVotes,
      validVotes,
      parties,
    })
  }

  return ballots
}

async function fetchSettlementCoords(): Promise<Map<string, { lat: number; lng: number }>> {
  const coords = new Map<string, { lat: number; lng: number }>()

  // Hardcode coordinates for major Israeli cities
  // These cover the most important settlements for the map visualization
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    '5000': { lat: 32.0853, lng: 34.7818 },  // Tel Aviv
    '3000': { lat: 32.7940, lng: 34.9896 },  // Haifa
    '3797': { lat: 31.7683, lng: 35.2137 },  // Jerusalem
    '9000': { lat: 31.2530, lng: 34.7915 },  // Beer Sheva
    '7900': { lat: 32.3340, lng: 34.8575 },  // Netanya
    '8300': { lat: 31.8928, lng: 34.8113 },  // Rishon LeZion
    '6100': { lat: 32.1657, lng: 34.8434 },  // Petah Tikva
    '7400': { lat: 32.0231, lng: 34.7515 },  // Holon
    '70': { lat: 32.1839, lng: 34.8714 },    // Bnei Brak
    '2800': { lat: 32.0180, lng: 34.7666 },  // Bat Yam
    '8600': { lat: 32.0944, lng: 34.8259 },  // Ramat Gan
    '6400': { lat: 31.8915, lng: 34.8222 },  // Ashdod
    '2610': { lat: 31.6685, lng: 34.5712 },  // Ashkelon
    '2640': { lat: 32.4445, lng: 34.8789 },  // Hadera
    '7700': { lat: 32.0942, lng: 34.7756 },  // Givatayim
    '2660': { lat: 32.4871, lng: 34.9530 },  // Herzliya
    '1139': { lat: 32.9248, lng: 35.3008 },  // Nazareth
    '4000': { lat: 32.8153, lng: 34.9931 },  // Krayot / Haifa area
    '1061': { lat: 29.5577, lng: 34.9519 },  // Eilat
    '8700': { lat: 32.1156, lng: 34.8372 },  // Ramat HaSharon
    '1220': { lat: 32.8061, lng: 35.1673 },  // Nof HaGalil
    '2560': { lat: 32.3088, lng: 34.8545 },  // Kfar Saba
    '6600': { lat: 32.0868, lng: 34.8879 },  // Raanana
    '2630': { lat: 32.1665, lng: 34.8439 },  // Hod HaSharon
    '1200': { lat: 32.4630, lng: 34.9189 },  // Or Akiva
    '6900': { lat: 32.3463, lng: 34.8730 },  // Ra'anana area
    '2100': { lat: 32.3252, lng: 34.8555 },  // Kfar Yona
    '7100': { lat: 31.9714, lng: 34.7725 },  // Nes Ziona
    '8400': { lat: 31.9500, lng: 34.8000 },  // Rehovot
    '2500': { lat: 31.0500, lng: 34.7600 },  // Ofakim
    '6200': { lat: 32.0000, lng: 34.8700 },  // Lod
    '7200': { lat: 32.0300, lng: 34.8800 },  // Ramle
    '1034': { lat: 32.6890, lng: 35.2950 },  // Afula
    '7800': { lat: 31.2500, lng: 34.2800 },  // Arad (approximate - actually different code)
    '1311': { lat: 32.8131, lng: 35.0009 },  // Nesher
    '6800': { lat: 31.9600, lng: 34.8900 },  // Yavne
    '2300': { lat: 31.4000, lng: 34.5700 },  // Kiryat Gat
    '2400': { lat: 31.5100, lng: 34.5900 },  // Kiryat Malakhi
    '1020': { lat: 32.8264, lng: 35.0782 },  // Tirat Carmel
    '1300': { lat: 32.8172, lng: 34.9934 },  // Kiryat Ata
    '1100': { lat: 32.8510, lng: 35.0762 },  // Kiryat Bialik
    '1010': { lat: 32.8388, lng: 35.0788 },  // Kiryat Motzkin
    '1090': { lat: 32.8250, lng: 35.0640 },  // Kiryat Yam
    '2620': { lat: 31.6700, lng: 34.5700 },  // Sderot
    '1283': { lat: 31.2500, lng: 34.7900 },  // Arad
    '2530': { lat: 30.6100, lng: 34.8000 },  // Mitzpe Ramon
    '7613': { lat: 31.8900, lng: 34.8100 },  // Rishon
    '37': { lat: 31.7500, lng: 35.2000 },    // Beit Shemesh
    '3610': { lat: 31.7700, lng: 35.1900 },  // Beit Shemesh (actual)
    '3780': { lat: 31.8600, lng: 35.2300 },  // Maaleh Adumim
    '3760': { lat: 31.7000, lng: 35.1000 },  // Beitar Illit
    '3570': { lat: 31.9500, lng: 35.1700 },  // Modi'in Illit
    '1295': { lat: 31.9400, lng: 35.0000 },  // Modi'in
    '3640': { lat: 31.9300, lng: 34.8700 },  // Modi'in-Maccabim-Reut
    '1031': { lat: 32.6020, lng: 35.2868 },  // Beit She'an
    '8000': { lat: 32.5700, lng: 35.1700 },  // Yokneam
    '1063': { lat: 32.4700, lng: 35.4800 },  // Beit She'an Valley
    '2710': { lat: 31.3200, lng: 34.2700 },  // Dimona
    '1355': { lat: 32.9700, lng: 35.5000 },  // Karmiel
    '8500': { lat: 32.2000, lng: 34.8700 },  // Rosh HaAyin
    '1268': { lat: 32.9900, lng: 35.4900 },  // Maalot-Tarshiha
    '1365': { lat: 32.5300, lng: 34.8900 },  // Zichron Ya'akov
    '3616': { lat: 31.8700, lng: 35.0100 },  // Shoham
    '3598': { lat: 31.8800, lng: 35.0400 },  // Maccabim-Reut
    '6500': { lat: 31.8100, lng: 34.6500 },  // Gedera
    '2200': { lat: 31.3500, lng: 34.3500 },  // Yeruham
    '29': { lat: 31.2600, lng: 34.7900 },    // Arad
    '178': { lat: 32.5500, lng: 35.1700 },   // Megiddo
    '8100': { lat: 32.2900, lng: 34.8900 },  // Raanana
    '1260': { lat: 32.9600, lng: 35.0900 },  // Akko
    '1292': { lat: 33.0100, lng: 35.0900 },  // Nahariya
    '4011': { lat: 31.0800, lng: 34.7800 },  // Netivot
  }

  for (const [code, c] of Object.entries(cityCoords)) {
    coords.set(code, c)
  }

  // Also try the API
  try {
    const url = `${API_BASE}?resource_id=64edd0ee-3d5d-43ce-8562-c46571e1f502&limit=2000`
    console.log('  Fetching coordinates from CBS API...')
    const response = await fetch(url)
    if (response.ok) {
      const json = await response.json() as { result?: { records?: Record<string, unknown>[] } }
      const records = json.result?.records || []
      for (const record of records) {
        const code = String(record['סמל_ישוב'] || '').trim()
        const lat = parseFloat(String(record['Y'] || record['y'] || ''))
        const lng = parseFloat(String(record['X'] || record['x'] || ''))
        if (code && !isNaN(lat) && !isNaN(lng) && lat > 29 && lat < 34 && lng > 34 && lng < 36) {
          if (!coords.has(code)) {
            coords.set(code, { lat, lng })
          }
        }
      }
      console.log(`  Total coordinates: ${coords.size}`)
    }
  } catch {
    console.warn('  Could not fetch CBS coordinates, using fallback data')
  }

  return coords
}

async function main() {
  console.log('Starting preprocessing via CKAN datastore API...')

  // Create output directories
  fs.mkdirSync(path.join(OUTPUT_DIR, 'rounds'), { recursive: true })
  fs.mkdirSync(path.join(OUTPUT_DIR, 'ballotboxes'), { recursive: true })

  const allCities = new Map<string, { code: string; name: string; district?: string }>()

  for (const round of roundsMeta) {
    const resources = resourceIds[round.id]
    if (!resources) {
      console.warn(`No resource IDs for round ${round.id}, skipping`)
      continue
    }

    console.log(`\n=== Processing round ${round.id} (${round.name}) ===`)

    // Process factions
    try {
      console.log('  Fetching factions data...')
      const records = await fetchAllRecords(resources.factions)
      const cities = processFactionsRecords(records, round.id)
      console.log(`  Processed ${cities.length} cities`)

      for (const city of cities) {
        if (!allCities.has(city.cityCode)) {
          allCities.set(city.cityCode, { code: city.cityCode, name: city.cityName })
        }
      }

      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'rounds', `${round.id}.json`),
        JSON.stringify({ roundId: round.id, cities })
      )
      console.log(`  Written rounds/${round.id}.json`)
    } catch (err) {
      console.error(`  Error processing factions for round ${round.id}:`, err)
    }

    // Process individuals (ballot boxes)
    try {
      console.log('  Fetching individuals data...')
      const records = await fetchAllRecords(resources.individuals)
      const ballots = processIndividualsRecords(records, round.id)
      console.log(`  Processed ${ballots.length} ballot boxes`)

      fs.writeFileSync(
        path.join(OUTPUT_DIR, 'ballotboxes', `${round.id}.json`),
        JSON.stringify({ roundId: round.id, ballotBoxes: ballots })
      )
      console.log(`  Written ballotboxes/${round.id}.json`)
    } catch (err) {
      console.error(`  Error processing individuals for round ${round.id}:`, err)
    }
  }

  // Fetch coordinates
  console.log('\nFetching settlement coordinates...')
  const cityCoords = await fetchSettlementCoords()

  // Build meta.json
  const citiesList = [...allCities.values()]
    .map(c => {
      const coords = cityCoords.get(c.code)
      return {
        code: c.code,
        name: c.name,
        district: c.district,
        lat: coords?.lat,
        lng: coords?.lng,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'he'))

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'meta.json'),
    JSON.stringify({ rounds: roundsMeta, parties: partyMeta, cities: citiesList })
  )

  console.log(`\nWritten meta.json (${citiesList.length} cities, ${Object.keys(partyMeta).length} parties)`)
  console.log('Done!')
}

main().catch(console.error)
