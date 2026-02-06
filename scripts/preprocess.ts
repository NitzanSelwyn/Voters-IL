import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import {
  partyMeta,
  roundsMeta,
  resourceIds,
  dataCompleteness,
  FIELD_ALIASES,
  EXTRA_META_FIELDS,
} from './party-meta'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search'
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'data')
const BATCH_SIZE = 10000

// ============================================================
// Field classification
// ============================================================

// Canonical metadata field names (after normalization)
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
  if (EXTRA_META_FIELDS.has(trimmed)) return true
  // Check the original (pre-alias) name too
  if (EXTRA_META_FIELDS.has(field)) return true
  if (trimmed.startsWith('_')) return true
  if (/^שם/.test(trimmed)) return true
  if (/^סמל/.test(trimmed)) return true
  if (/^מספר/.test(trimmed)) return true
  if (/ברזל/.test(trimmed)) return true
  if (/קלפי/.test(trimmed)) return true
  return false
}

// ============================================================
// Field normalization for historical rounds
// ============================================================

/** Normalize a field name: trim whitespace + apply known aliases */
function normalizeFieldName(field: string): string {
  const trimmed = field.trim()
  return FIELD_ALIASES[trimmed] || FIELD_ALIASES[field] || trimmed
}

/** Coerce any value to number (handles text/numeric API types) */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    // Handle "0.0" style strings from K16
    const n = Number(value)
    return isNaN(n) ? 0 : n
  }
  return 0
}

function normalizeCityName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/–/g, '-')
    .replace(/—/g, '-')
}

/**
 * Normalize a record's keys: trim + apply field aliases.
 * Returns a new object with normalized keys.
 */
function normalizeRecord(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = normalizeFieldName(key)
    result[normalizedKey] = value
  }
  return result
}

// ============================================================
// API fetching
// ============================================================

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

// ============================================================
// Data types
// ============================================================

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

// ============================================================
// Record processing
// ============================================================

/**
 * Detect party columns from a normalized record's keys.
 * Filters out metadata fields and empty keys.
 */
function detectPartyFields(records: Record<string, unknown>[]): string[] {
  if (records.length === 0) return []
  const allFields = Object.keys(records[0])
  return allFields.filter(f => !isMetaField(f) && f.trim().length > 0)
}

function processFactionsRecords(records: Record<string, unknown>[], roundId: number): CityRoundData[] {
  if (records.length === 0) return []

  // Normalize all records
  const normalized = records.map(normalizeRecord)
  const partyFields = detectPartyFields(normalized)

  console.log(`  Found ${partyFields.length} party columns for round ${roundId}`)
  if (partyFields.length > 0) {
    console.log(`  Sample party columns: ${partyFields.slice(0, 8).join(', ')}`)
  }

  const cities: CityRoundData[] = []

  for (const row of normalized) {
    const cityName = normalizeCityName(row['שם ישוב'] as string)
    const cityCode = String(row['סמל ישוב'] || '').trim()
    if (!cityName || !cityCode) continue

    const eligibleVoters = toNumber(row['בזב'])
    const totalVotes = toNumber(row['מצביעים'])
    const invalidVotes = toNumber(row['פסולים'])
    const validVotes = toNumber(row['כשרים'])

    const parties: Record<string, number> = {}
    for (const field of partyFields) {
      const votes = toNumber(row[field])
      if (votes > 0) {
        parties[field] = votes
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

function processIndividualsRecords(
  records: Record<string, unknown>[],
  roundId: number,
  opts: { hasCityCodes: boolean; hasEligibleVoters: boolean }
): BallotBox[] {
  if (records.length === 0) return []

  // Normalize all records
  const normalized = records.map(normalizeRecord)
  const partyFields = detectPartyFields(normalized)

  const ballots: BallotBox[] = []

  for (const row of normalized) {
    const cityName = normalizeCityName(row['שם ישוב'] as string)
    const cityCode = opts.hasCityCodes
      ? String(row['סמל ישוב'] || '').trim()
      : '' // K17 has no city codes
    const ballotNumber = toNumber(row['מספר קלפי'])

    // Skip records with no city name
    if (!cityName) continue
    // For rounds with city codes, skip records without one (except special boxes)
    if (opts.hasCityCodes && !cityCode) continue

    const eligibleVoters = opts.hasEligibleVoters ? toNumber(row['בזב']) : 0
    const totalVotes = toNumber(row['מצביעים'])
    const invalidVotes = toNumber(row['פסולים'])
    const validVotes = toNumber(row['כשרים'])

    const parties: Record<string, number> = {}
    for (const field of partyFields) {
      const votes = toNumber(row[field])
      if (votes > 0) {
        parties[field] = votes
      }
    }

    // For K16, fix "0.0" city codes (special ballot boxes like double envelopes)
    let fixedCityCode = cityCode
    if (fixedCityCode === '0' || fixedCityCode === '0.0') {
      fixedCityCode = '0' // Standardize to "0" for special boxes
    }
    // Strip trailing ".0" from numeric city codes (e.g., "3000.0" → "3000")
    if (fixedCityCode.endsWith('.0')) {
      fixedCityCode = fixedCityCode.slice(0, -2)
    }

    ballots.push({
      id: `${roundId}-${fixedCityCode || cityName}-${ballotNumber}`,
      cityCode: fixedCityCode,
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

// ============================================================
// Ballot box -> City aggregation (for K15-K18)
// ============================================================

function aggregateBallotBoxesToCities(ballotBoxes: BallotBox[], roundId: number): CityRoundData[] {
  const cityMap = new Map<string, CityRoundData>()

  for (const box of ballotBoxes) {
    // Use cityCode as key when available, else cityName
    const key = box.cityCode || box.cityName

    if (!cityMap.has(key)) {
      cityMap.set(key, {
        cityCode: box.cityCode,
        cityName: box.cityName,
        eligibleVoters: 0,
        totalVotes: 0,
        invalidVotes: 0,
        validVotes: 0,
        parties: {},
      })
    }

    const city = cityMap.get(key)!
    city.eligibleVoters += box.eligibleVoters
    city.totalVotes += box.totalVotes
    city.invalidVotes += box.invalidVotes
    city.validVotes += box.validVotes

    for (const [party, votes] of Object.entries(box.parties)) {
      city.parties[party] = (city.parties[party] || 0) + votes
    }
  }

  const cities = Array.from(cityMap.values())
  console.log(`  Aggregated ${ballotBoxes.length} ballot boxes into ${cities.length} cities for round ${roundId}`)
  return cities
}

// ============================================================
// K17 city name -> city code matching
// ============================================================

/**
 * For K17 which lacks city codes, try to match city names against
 * known cities from other rounds. Returns a map: cityName -> cityCode.
 */
function buildCityNameToCodeMap(allCities: Map<string, { code: string; name: string }>): Map<string, string> {
  const nameToCode = new Map<string, string>()
  for (const city of allCities.values()) {
    const normalized = normalizeCityName(city.name)
    nameToCode.set(normalized, city.code)
  }
  return nameToCode
}

function assignCityCodesToK17(cities: CityRoundData[], nameToCode: Map<string, string>): void {
  let matched = 0
  let unmatched = 0
  for (const city of cities) {
    if (!city.cityCode) {
      const code = nameToCode.get(city.cityName)
      if (code) {
        city.cityCode = code
        matched++
      } else {
        unmatched++
      }
    }
  }
  console.log(`  K17 city code matching: ${matched} matched, ${unmatched} unmatched`)
  if (unmatched > 0) {
    const unmatchedNames = cities
      .filter(c => !c.cityCode)
      .map(c => c.cityName)
      .slice(0, 10)
    console.log(`  Unmatched sample: ${unmatchedNames.join(', ')}`)
  }
}

// ============================================================
// K15 XLS parsing
// ============================================================

function processK15Xls(): { cities: CityRoundData[]; ballotBoxes: BallotBox[] } {
  const xlsPath = path.resolve(__dirname, 'data', 'knesset-15.xls')
  if (!fs.existsSync(xlsPath)) {
    console.error(`  K15 XLS not found at ${xlsPath}`)
    console.error('  Download from: https://www.odata.org.il/dataset/c0ec706c-5970-4c6d-942f-aaf60187dcbb/resource/5729daf9-adfd-4ec9-b4d3-0f2047189ddb/download/-15-1999-.xls')
    throw new Error('K15 XLS file not found')
  }

  console.log('  Reading K15 XLS file...')
  const workbook = XLSX.readFile(xlsPath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet)
  console.log(`  Parsed ${rawRows.length} rows from XLS`)

  // Normalize field names and process as ballot boxes
  const normalized = rawRows.map(normalizeRecord)
  const partyFields = detectPartyFields(normalized)
  console.log(`  Found ${partyFields.length} party columns for K15`)
  console.log(`  Sample party columns: ${partyFields.slice(0, 8).join(', ')}`)

  const ballotBoxes: BallotBox[] = []
  for (const row of normalized) {
    const cityName = normalizeCityName(row['שם ישוב'] as string)
    const cityCode = String(toNumber(row['סמל ישוב']) || '').trim()
    const ballotNumber = toNumber(row['מספר קלפי'])

    if (!cityName) continue

    const eligibleVoters = toNumber(row['בזב'])
    const totalVotes = toNumber(row['מצביעים'])
    const invalidVotes = toNumber(row['פסולים'])
    const validVotes = toNumber(row['כשרים'])

    const parties: Record<string, number> = {}
    for (const field of partyFields) {
      const votes = toNumber(row[field])
      if (votes > 0) {
        parties[field] = votes
      }
    }

    ballotBoxes.push({
      id: `15-${cityCode}-${ballotNumber}`,
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

  console.log(`  Processed ${ballotBoxes.length} ballot boxes from K15 XLS`)

  // Aggregate to cities
  const cities = aggregateBallotBoxesToCities(ballotBoxes, 15)

  return { cities, ballotBoxes }
}

// ============================================================
// Settlement coordinates (same as before)
// ============================================================

async function fetchSettlementCoords(): Promise<Map<string, { lat: number; lng: number }>> {
  const coords = new Map<string, { lat: number; lng: number }>()

  // Verified WGS84 coordinates for Israeli settlements, keyed by CBS settlement code
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    // Major cities
    '3000': { lat: 31.7683, lng: 35.2137 },  // ירושלים Jerusalem
    '5000': { lat: 32.0853, lng: 34.7818 },  // תל אביב Tel Aviv
    '4000': { lat: 32.8153, lng: 34.9931 },  // חיפה Haifa
    '8300': { lat: 31.9730, lng: 34.8069 },  // ראשון לציון Rishon LeZion
    '7900': { lat: 32.0841, lng: 34.8878 },  // פתח תקווה Petah Tikva
    '70':   { lat: 31.8014, lng: 34.6434 },  // אשדוד Ashdod
    '7400': { lat: 32.3215, lng: 34.8532 },  // נתניה Netanya
    '9000': { lat: 31.2530, lng: 34.7915 },  // באר שבע Beer Sheva
    '6100': { lat: 32.0844, lng: 34.8381 },  // בני ברק Bnei Brak
    '6600': { lat: 32.0114, lng: 34.7748 },  // חולון Holon
    '8600': { lat: 32.0680, lng: 34.8244 },  // רמת גן Ramat Gan
    '7100': { lat: 31.6688, lng: 34.5743 },  // אשקלון Ashkelon
    '8400': { lat: 31.8928, lng: 34.8113 },  // רחובות Rehovot
    '6200': { lat: 32.0171, lng: 34.7515 },  // בת ים Bat Yam
    '6400': { lat: 32.1629, lng: 34.8441 },  // הרצליה Herzliya
    '6900': { lat: 32.1754, lng: 34.9067 },  // כפר סבא Kfar Saba
    '8700': { lat: 32.1836, lng: 34.8709 },  // רעננה Ra'anana
    '1200': { lat: 31.8974, lng: 35.0102 },  // מודיעין Modi'in
    '2610': { lat: 31.7468, lng: 34.9867 },  // בית שמש Beit Shemesh
    '6500': { lat: 32.4341, lng: 34.9196 },  // חדרה Hadera
    '1309': { lat: 32.0518, lng: 34.9555 },  // אלעד Elad
    '9700': { lat: 32.1500, lng: 34.8877 },  // הוד השרון Hod HaSharon
    '7700': { lat: 32.6078, lng: 35.2889 },  // עפולה Afula
    '2640': { lat: 32.0956, lng: 34.9567 },  // ראש העין Rosh HaAyin
    '1061': { lat: 32.7037, lng: 35.3013 },  // נצרת עילית Nof HaGalil
    '7300': { lat: 32.6996, lng: 35.3035 },  // נצרת Nazareth
    '1139': { lat: 32.9183, lng: 35.2953 },  // כרמיאל Karmiel
    '7600': { lat: 32.9268, lng: 35.0764 },  // עכו Akko
    '2800': { lat: 33.2084, lng: 35.5715 },  // קרית שמונה Kiryat Shmona
    '6800': { lat: 32.8101, lng: 35.1039 },  // קרית אתא Kiryat Ata
    '9500': { lat: 32.8277, lng: 35.0842 },  // קרית ביאליק Kiryat Bialik
    '8200': { lat: 32.8388, lng: 35.0788 },  // קרית מוצקין Kiryat Motzkin
    '9600': { lat: 32.8445, lng: 35.0701 },  // קרית ים Kiryat Yam
    '2100': { lat: 32.7597, lng: 34.9714 },  // טירת כרמל Tirat Carmel
    '2500': { lat: 32.7711, lng: 35.0380 },  // נשר Nesher
    '7200': { lat: 31.9286, lng: 34.7983 },  // נס ציונה Nes Ziona
    '8500': { lat: 31.9275, lng: 34.8625 },  // רמלה Ramla
    '7000': { lat: 31.9505, lng: 34.8897 },  // לוד Lod
    '6300': { lat: 32.0697, lng: 34.8114 },  // גבעתיים Givatayim
    '2400': { lat: 32.0293, lng: 34.8561 },  // אור יהודה Or Yehuda
    '2660': { lat: 31.8784, lng: 34.7382 },  // יבנה Yavne
    '2620': { lat: 32.0595, lng: 34.8575 },  // קרית אונו Kiryat Ono
    '2630': { lat: 31.6093, lng: 34.7680 },  // קרית גת Kiryat Gat
    '2650': { lat: 32.1466, lng: 34.8380 },  // רמת השרון Ramat HaSharon
    '9400': { lat: 32.0316, lng: 34.8882 },  // יהוד-מונוסון Yehud-Monosson
    '7500': { lat: 32.8638, lng: 35.2977 },  // סח'נין Sakhnin
    '8900': { lat: 32.8530, lng: 35.1982 },  // טמרה Tamra
    '8800': { lat: 32.8049, lng: 35.1702 },  // שפרעם Shfar'am
    '2710': { lat: 32.5166, lng: 35.1524 },  // אום אל-פחם Umm al-Fahm
    '2730': { lat: 32.2656, lng: 35.0084 },  // טייבה Tayibe
    '2720': { lat: 32.2337, lng: 34.9497 },  // טירה Tira
    '6000': { lat: 32.4190, lng: 35.0409 },  // באקה אל-גרביה
    '1034': { lat: 31.7298, lng: 34.7473 },  // קרית מלאכי Kiryat Malakhi
    '1161': { lat: 31.3939, lng: 34.7493 },  // רהט Rahat
    '2200': { lat: 31.0674, lng: 35.0322 },  // דימונה Dimona
    '3797': { lat: 31.9309, lng: 35.0435 },  // מודיעין עילית Modi'in Illit
    '3780': { lat: 31.6974, lng: 35.1193 },  // ביתר עילית Beitar Illit
    '3616': { lat: 31.7719, lng: 35.2830 },  // מעלה אדומים Ma'ale Adumim
    '3570': { lat: 32.1049, lng: 35.1736 },  // אריאל Ariel
    '874':  { lat: 32.6799, lng: 35.2414 },  // מגדל העמק Migdal HaEmek
    '9200': { lat: 32.5006, lng: 35.4964 },  // בית שאן Beit She'an
    '1031': { lat: 31.5247, lng: 34.5964 },  // שדרות Sderot
    '2300': { lat: 32.7225, lng: 35.1312 },  // קרית טבעון Kiryat Tivon
    '9300': { lat: 32.5714, lng: 34.9500 },  // זכרון יעקב Zichron Ya'akov
    '9800': { lat: 32.5222, lng: 34.9468 },  // בנימינה Binyamina
    '7800': { lat: 32.4720, lng: 34.9660 },  // פרדס חנה-כרכור Pardes Hanna
    '2530': { lat: 31.9397, lng: 34.8339 },  // באר יעקב Be'er Ya'akov
    '9100': { lat: 33.0026, lng: 35.0966 },  // נהריה Nahariya
    '6700': { lat: 32.7922, lng: 35.5312 },  // טבריה Tiberias
    '8000': { lat: 32.9646, lng: 35.4964 },  // צפת Safed
    '2600': { lat: 29.5577, lng: 34.9519 },  // אילת Eilat
    '681':  { lat: 32.0784, lng: 34.8511 },  // גבעת שמואל Givat Shmuel
    '1015': { lat: 31.8029, lng: 35.1488 },  // מבשרת ציון Mevaseret Zion
    '1304': { lat: 31.9977, lng: 34.9454 },  // שוהם Shoham
    '229':  { lat: 32.0614, lng: 34.8725 },  // גני תקווה Ganei Tikva
    '565':  { lat: 32.0286, lng: 34.7928 },  // אזור Azor
    '31':   { lat: 31.3139, lng: 34.6192 },  // אופקים Ofakim
    '246':  { lat: 31.4196, lng: 34.5878 },  // נתיבות Netivot
    '831':  { lat: 30.9879, lng: 34.9290 },  // ירוחם Yeruham
    '99':   { lat: 30.6109, lng: 34.8013 },  // מצפה רמון Mitzpe Ramon
    '1247': { lat: 32.4628, lng: 35.0493 },  // חריש Harish
    '1063': { lat: 33.0168, lng: 35.2716 },  // מעלות-תרשיחא Ma'alot-Tarshiha
    '195':  { lat: 32.2792, lng: 34.9175 },  // קדימה-צורן Kadima-Zoran
    '240':  { lat: 32.6575, lng: 35.1078 },  // יקנעם עילית Yokneam Illit
    '1020': { lat: 32.5077, lng: 34.9183 },  // אור עקיבא Or Akiva
    '666':  { lat: 31.2647, lng: 34.8488 },  // עומר Omer
    '1271': { lat: 31.3744, lng: 34.8099 },  // להבים Lehavim
    '922':  { lat: 32.7650, lng: 35.1060 },  // רכסים Rekhasim
    '2550': { lat: 31.8137, lng: 34.7778 },  // גדרה Gedera
    '1310': { lat: 31.8726, lng: 34.9706 },  // לפיד Lapid
    '2560': { lat: 31.2575, lng: 35.2117 },  // ערד Arad
    '3730': { lat: 31.8624, lng: 35.1728 },  // גבעת זאב Givat Ze'ev
    '3650': { lat: 31.6625, lng: 35.1531 },  // אפרת Efrat
    '3611': { lat: 31.5274, lng: 35.1236 },  // קרית ארבע Kiryat Arba
    '3400': { lat: 31.5308, lng: 35.0954 },  // חברון Hebron
    '3574': { lat: 31.9435, lng: 35.2265 },  // בית אל Beit El
    '3640': { lat: 32.1729, lng: 35.0954 },  // קרני שומרון Karnei Shomron
    '3557': { lat: 32.1677, lng: 35.1917 },  // קדומים Kedumim
    '3560': { lat: 32.1098, lng: 35.0294 },  // אלקנה Elkana
    '3750': { lat: 32.1755, lng: 34.9745 },  // אלפי מנשה Alfei Menashe
    '3760': { lat: 32.1337, lng: 34.9636 },  // אורנית Oranit
    '3660': { lat: 32.1660, lng: 35.1533 },  // עמנואל Emanuel
    '3608': { lat: 32.0468, lng: 35.3854 },  // מעלה אפרים Ma'ale Efraim
    '3576': { lat: 31.8481, lng: 35.4197 },  // מצפה יריחו Mitzpe Yeriho
    '4100': { lat: 32.9918, lng: 35.6912 },  // קצרין Katzrin
    '4201': { lat: 33.2663, lng: 35.7713 },  // מג'דל שמס Majdal Shams
    '4001': { lat: 33.2218, lng: 35.7635 },  // בוקעאתא Buq'ata
    '43':   { lat: 33.2802, lng: 35.5735 },  // מטולה Metula
    '26':   { lat: 32.9692, lng: 35.5402 },  // ראש פינה Rosh Pina
    '2034': { lat: 32.9850, lng: 35.5460 },  // חצור הגלילית Hazor HaGlilit
    '627':  { lat: 32.1568, lng: 34.9582 },  // ג'לג'וליה Jaljulia
    '634':  { lat: 32.1145, lng: 34.9762 },  // כפר קאסם Kafr Qasim
    '638':  { lat: 32.2854, lng: 34.9826 },  // קלנסווה Qalansawe
    '654':  { lat: 32.5098, lng: 35.0882 },  // כפר קרע Kafr Kara
    '481':  { lat: 32.8810, lng: 35.3850 },  // מגאר Maghar
    '494':  { lat: 32.6917, lng: 35.0433 },  // דאלית אל-כרמל
    '534':  { lat: 32.7322, lng: 35.0645 },  // עספיא Isfiya
    '1292': { lat: 32.9269, lng: 35.1552 },  // ג'דיידה-מכר
    '473':  { lat: 31.7978, lng: 35.1091 },  // אבו גוש Abu Ghosh
    '1059': { lat: 31.2284, lng: 34.9842 },  // כסיפה Kseife
    '1303': { lat: 31.2932, lng: 34.9332 },  // חורה Hura
    '1060': { lat: 31.3164, lng: 34.8558 },  // לקיה Lakia
    '1286': { lat: 31.2541, lng: 34.8974 },  // שגב-שלום Segev Shalom
    '1192': { lat: 31.2828, lng: 34.9333 },  // ערערה-בנגב
    '1054': { lat: 31.2526, lng: 34.7894 },  // תל שבע Tel Sheva
    '469':  { lat: 31.8630, lng: 34.8245 },  // קרית עקרון
    '28':   { lat: 31.8521, lng: 34.8389 },  // מזכרת בתיה
    '168':  { lat: 32.3169, lng: 34.9312 },  // כפר יונה Kfar Yona
    '166':  { lat: 31.7894, lng: 34.7067 },  // גן יבנה Gan Yavne
    '1066': { lat: 31.7468, lng: 34.7450 },  // בני עי"ש
    '584':  { lat: 31.6200, lng: 34.5300 },  // זיקים Zikim
    '155':  { lat: 31.7400, lng: 34.7267 },  // באר טוביה
    '1167': { lat: 32.5000, lng: 34.8900 },  // קיסריה Caesarea
    '812':  { lat: 33.0717, lng: 35.1500 },  // שלומי Shlomi
    '885':  { lat: 30.8733, lng: 34.7917 },  // שדה בוקר Sde Boker
    '1283': { lat: 31.2500, lng: 34.7900 },  // תל תאומים
    '29':   { lat: 33.1117, lng: 35.5717 },  // יסוד המעלה
    '1224': { lat: 32.2214, lng: 34.9791 },  // כוכב יאיר
    '171':  { lat: 32.3088, lng: 34.8545 },  // פרדסיה
  }

  for (const [code, c] of Object.entries(cityCoords)) {
    coords.set(code, c)
  }

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

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('Starting preprocessing for Knesset 15-25...')

  // Create output directories
  fs.mkdirSync(path.join(OUTPUT_DIR, 'rounds'), { recursive: true })
  fs.mkdirSync(path.join(OUTPUT_DIR, 'ballotboxes'), { recursive: true })

  const allCities = new Map<string, { code: string; name: string }>()

  for (const round of roundsMeta) {
    const resources = resourceIds[round.id]
    if (!resources) {
      console.warn(`No resource IDs for round ${round.id}, skipping`)
      continue
    }

    const completeness = dataCompleteness[round.id]
    console.log(`\n=== Processing round ${round.id} (${round.name}) ===`)

    // ── K15: Special handling (XLS file) ──
    if (round.id === 15) {
      try {
        const { cities, ballotBoxes } = processK15Xls()

        for (const city of cities) {
          if (city.cityCode && !allCities.has(city.cityCode)) {
            allCities.set(city.cityCode, { code: city.cityCode, name: city.cityName })
          }
        }

        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'rounds', `${round.id}.json`),
          JSON.stringify({ roundId: round.id, cities })
        )
        console.log(`  Written rounds/${round.id}.json (${cities.length} cities)`)

        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'ballotboxes', `${round.id}.json`),
          JSON.stringify({ roundId: round.id, ballotBoxes })
        )
        console.log(`  Written ballotboxes/${round.id}.json (${ballotBoxes.length} ballot boxes)`)
      } catch (err) {
        console.error(`  Error processing K15:`, err)
      }
      continue
    }

    // ── K16-K18: Individuals only → aggregate to cities ──
    if (!resources.factions && resources.individuals) {
      try {
        console.log('  Fetching individuals data (no factions resource)...')
        const records = await fetchAllRecords(resources.individuals)
        const hasCityCodes = completeness?.hasCityCodes ?? true
        const hasEligibleVoters = completeness?.hasEligibleVoters ?? true

        const ballotBoxes = processIndividualsRecords(records, round.id, {
          hasCityCodes,
          hasEligibleVoters,
        })
        console.log(`  Processed ${ballotBoxes.length} ballot boxes`)

        // Aggregate to city-level
        const cities = aggregateBallotBoxesToCities(ballotBoxes, round.id)

        // For K17: derive invalid votes from totalVotes - validVotes
        if (!completeness?.hasInvalidVotes) {
          for (const city of cities) {
            city.invalidVotes = city.totalVotes - city.validVotes
          }
          for (const box of ballotBoxes) {
            box.invalidVotes = box.totalVotes - box.validVotes
          }
          console.log('  Derived invalid votes from totalVotes - validVotes')
        }

        for (const city of cities) {
          if (city.cityCode && !allCities.has(city.cityCode)) {
            allCities.set(city.cityCode, { code: city.cityCode, name: city.cityName })
          }
        }

        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'rounds', `${round.id}.json`),
          JSON.stringify({ roundId: round.id, cities })
        )
        console.log(`  Written rounds/${round.id}.json (${cities.length} cities)`)

        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'ballotboxes', `${round.id}.json`),
          JSON.stringify({ roundId: round.id, ballotBoxes })
        )
        console.log(`  Written ballotboxes/${round.id}.json (${ballotBoxes.length} ballot boxes)`)
      } catch (err) {
        console.error(`  Error processing individuals for round ${round.id}:`, err)
      }
      continue
    }

    // ── K19-K25: Standard processing (both factions and individuals) ──

    // Process factions (per-city)
    if (resources.factions) {
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
        console.log(`  Written rounds/${round.id}.json (${cities.length} cities)`)
      } catch (err) {
        console.error(`  Error processing factions for round ${round.id}:`, err)
      }
    }

    // Process individuals (per-ballot-box)
    if (resources.individuals) {
      try {
        console.log('  Fetching individuals data...')
        const records = await fetchAllRecords(resources.individuals)
        const ballots = processIndividualsRecords(records, round.id, {
          hasCityCodes: true,
          hasEligibleVoters: true,
        })
        console.log(`  Processed ${ballots.length} ballot boxes`)

        fs.writeFileSync(
          path.join(OUTPUT_DIR, 'ballotboxes', `${round.id}.json`),
          JSON.stringify({ roundId: round.id, ballotBoxes: ballots })
        )
        console.log(`  Written ballotboxes/${round.id}.json (${ballots.length} ballot boxes)`)
      } catch (err) {
        console.error(`  Error processing individuals for round ${round.id}:`, err)
      }
    }
  }

  // ── Post-processing: match K17 city codes ──
  if (fs.existsSync(path.join(OUTPUT_DIR, 'rounds', '17.json'))) {
    console.log('\nPost-processing: matching K17 city names to codes...')
    const nameToCode = buildCityNameToCodeMap(allCities)
    const k17Data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'rounds', '17.json'), 'utf-8'))
    assignCityCodesToK17(k17Data.cities, nameToCode)
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'rounds', '17.json'),
      JSON.stringify(k17Data)
    )
    // Also update city index from K17 matched cities
    for (const city of k17Data.cities) {
      if (city.cityCode && !allCities.has(city.cityCode)) {
        allCities.set(city.cityCode, { code: city.cityCode, name: city.cityName })
      }
    }
    console.log('  Updated rounds/17.json with city codes')
  }

  // ── Fetch coordinates ──
  console.log('\nFetching settlement coordinates...')
  const cityCoords = await fetchSettlementCoords()

  // ── Build meta.json using cities.json as canonical source ──
  const citiesJsonPath = path.join(OUTPUT_DIR, 'cities.json')
  let citiesList: Array<{
    code: string
    name: string
    aliases?: string[]
    district?: string
    lat?: number
    lng?: number
  }>

  if (fs.existsSync(citiesJsonPath)) {
    console.log('\nUsing cities.json as canonical city name source...')
    const canonicalCities: Array<{
      code: string
      name: string
      k25raw: string
      lat?: number
      lng?: number
    }> = JSON.parse(fs.readFileSync(citiesJsonPath, 'utf-8'))

    const canonicalMap = new Map(canonicalCities.map(c => [c.code, c]))

    // Start with canonical cities
    const seenCodes = new Set<string>()
    citiesList = canonicalCities.map(c => {
      seenCodes.add(c.code)

      // Collect aliases: historical names from allCities + K25 raw name
      const aliases = new Set<string>()
      const historical = allCities.get(c.code)
      if (historical && historical.name !== c.name) {
        aliases.add(historical.name)
      }
      if (c.k25raw !== c.name) {
        aliases.add(c.k25raw)
      }

      // Prefer coordinates from cityCoords (most complete), fallback to cities.json
      const coords = cityCoords.get(c.code)
      return {
        code: c.code,
        name: c.name,
        ...(aliases.size > 0 ? { aliases: [...aliases] } : {}),
        lat: coords?.lat ?? c.lat,
        lng: coords?.lng ?? c.lng,
      }
    })

    // Add historical-only cities not in K25 (e.g., Gush Katif settlements)
    let historicalOnly = 0
    for (const [code, city] of allCities) {
      if (!seenCodes.has(code)) {
        const coords = cityCoords.get(code)
        citiesList.push({
          code,
          name: city.name,
          lat: coords?.lat,
          lng: coords?.lng,
        })
        historicalOnly++
      }
    }

    citiesList.sort((a, b) => a.name.localeCompare(b.name, 'he'))
    console.log(`  Canonical cities from K25: ${canonicalCities.length}`)
    console.log(`  Historical-only cities added: ${historicalOnly}`)
    console.log(`  Total cities: ${citiesList.length}`)
  } else {
    console.log('\nNo cities.json found, using first-seen names (run build-cities.ts first)')
    citiesList = [...allCities.values()]
      .map(c => {
        const coords = cityCoords.get(c.code)
        return {
          code: c.code,
          name: c.name,
          lat: coords?.lat,
          lng: coords?.lng,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'meta.json'),
    JSON.stringify({
      rounds: roundsMeta,
      parties: partyMeta,
      cities: citiesList,
      dataCompleteness,
    })
  )

  console.log(`\nWritten meta.json (${citiesList.length} cities, ${Object.keys(partyMeta).length} parties, ${roundsMeta.length} rounds)`)
  console.log('Done!')
}

main().catch(console.error)
