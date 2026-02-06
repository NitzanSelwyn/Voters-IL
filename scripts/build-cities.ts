/**
 * Build canonical city list from K25 data.
 *
 * Fetches K25 factions (per-city) data from CKAN API, normalizes city names
 * (restore dashes, apostrophes, quotation marks), and writes cities.json.
 *
 * Run: npx tsx scripts/build-cities.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { resourceIds } from './party-meta'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const API_BASE = 'https://data.gov.il/api/3/action/datastore_search'
const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'data')
const BATCH_SIZE = 10000

// ============================================================
// API fetching
// ============================================================

async function fetchAllRecords(resourceId: string): Promise<Record<string, unknown>[]> {
  const allRecords: Record<string, unknown>[] = []
  let offset = 0
  let total = Infinity

  while (offset < total) {
    const url = `${API_BASE}?resource_id=${resourceId}&limit=${BATCH_SIZE}&offset=${offset}`
    console.log(`  Fetching offset=${offset}...`)
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
    console.log(`  Got ${allRecords.length} / ${total} records`)
  }

  return allRecords
}

// ============================================================
// City name normalization
// ============================================================

/**
 * Manual overrides: K25 raw name -> desired display name.
 * These handle cases where K25 data has words run together,
 * missing dashes, missing quotes/apostrophes, or other issues.
 */
const NAME_OVERRIDES: Record<string, string> = {
  // ── Restore dashes in compound cities ──
  'בועיינהנוגידאת': 'בועיינה-נוג\'ידאת',
  'בית יצחקשער חפר': 'בית יצחק-שער חפר',
  'בנימינהגבעת עדה': 'בנימינה-גבעת עדה',
  'גדיידהמכר': 'ג\'דיידה-מכר',
  'חצוראשדוד': 'חצור-אשדוד',
  'טובאזנגריה': 'טובא-זנגריה',
  'יאנוחגת': 'יאנוח-ג\'ת',
  'כסראסמיע': 'כסרא-סמיע',
  'כעביהטבאשחגאגרה': 'כעביה-טבאש-חג\'אג\'רה',
  'מודיעיןמכביםרעות': 'מודיעין-מכבים-רעות',
  'מעלותתרשיחא': 'מעלות-תרשיחא',
  'פרדס חנהכרכור': 'פרדס חנה-כרכור',
  'קדימהצורן': 'קדימה-צורן',
  'יהודמונוסון': 'יהוד-מונוסון',
  'שגבשלום': 'שגב-שלום',
  'ערערהבנגב': 'ערערה-בנגב',
  'רםאון': 'רם-און',
  'חדנס': 'חד-נס',
  'טלאל': 'טל-אל',
  'חפציבה': 'חפצי-בה',
  'אליעד': 'אלי-עד',

  // ── Restore apostrophes (geresh) ──
  'אבו גווייעד שבט': 'אבו ג\'ווייעד (שבט)',
  'גולס': 'ג\'ולס',
  'גלגוליה': 'ג\'לג\'וליה',
  'גנאביב שבט': 'ג\'נאביב (שבט)',
  'גסר אזרקא': 'ג\'סר א-זרקא',
  'גש גוש חלב': 'ג\'ש (גוש חלב)',
  'גת': 'ג\'ת',
  'חואלד': 'ח\'ואלד',
  'סחנין': 'סח\'נין',
  'סאגור': 'סאג\'ור',
  'שייח דנון': 'שיח\' דנון',
  'דריגאת': 'דריג\'את',
  'ביר הדאג': 'ביר הדאג\'',
  'עגר': 'ע\'ג\'ר',
  'מגד אלכרום': 'מג\'ד אל-כרום',
  'מגדל שמס': 'מג\'דל שמס',

  // ── Restore quotation marks (gershayim) ──
  'בני עיש': 'בני עי"ש',
  'ביתר עילית': 'ביתר עילית', // K25 has correct form already
  'בסמה': 'בסמ"ה',
  'דובב': 'דוב"ב',
  'גבעת חן': 'גבעת ח"ן',
  'גבעת כח': 'גבעת כ"ח',
  'גבעת נילי': 'גבעת ניל"י',
  'יד רמבם': 'יד רמב"ם',
  'ייטב': 'ייט"ב',
  'כפר בילו': 'כפר ביל"ו',
  'כפר הראה': 'כפר הרא"ה',
  'כפר הריף': 'כפר הרי"ף',
  'כפר חבד': 'כפר חב"ד',
  'כפר מלל': 'כפר מל"ל',
  'כרם מהרל': 'כרם מהר"ל',
  'מצפה אביב': 'מצפה אבי"ב',
  'נווה אטיב': 'נווה אטי"ב',
  'נחל עוז': 'נח"ל עוז',
  'נילי': 'ניל"י',
  'ניר חן': 'ניר ח"ן',
  'נתיב הלה': 'נתיב הל"ה',
  'פעמי תשז': 'פעמי תש"ז',
  'תלמי בילו': 'תלמי ביל"ו',
  'עין הנציב': 'עין הנצי"ב',

  // ── Restore al- prefix dashes in Arabic names ──
  'אום אלפחם': 'אום אל-פחם',
  'אום אלקוטוף': 'אום אל-קוטוף',
  'אלעריאן': 'אל-עריאן',
  'אלרום': 'אל-רום',
  'באקה אלגרביה': 'באקה אל-גרביה',
  'ביר אלמכסור': 'ביר אל-מכסור',
  'דאלית אלכרמל': 'דאלית אל-כרמל',
  'דייר אלאסד': 'דייר אל-אסד',
  'מסעודין אלעזאזמה': 'מסעודין אל-עזאזמה',
  'ראס אלעין': 'ראס אל-עין',
  'שבלי אום אלגנם': 'שבלי-אום אל-גנם',
  'עין אלאסד': 'עין אל-אסד',
  'כאוכב אבו אלהיגא': 'כאוכב אבו אל-היג\'א',
  'קודייראת אצאנעשבט': 'קדייראת א-צאנע (שבט)',
  'קצר אסר': 'קצר א-סר',
  'תראבין אצאנע שבט': 'תראבין א-צאנע (שבט)',
  'תראבין אצאנעישוב': 'תראבין א-צאנע (ישוב)',

  // ── Settlement name changes / corrections ──
  'נוף הגליל': 'נוף הגליל',  // official rename from נצרת עילית
  'נוה צוף': 'נווה צוף',  // was חלמיש, renamed
  'כפר האורנים': 'כפר האורנים',  // was מנורה, renamed
  'שריגים ליאון': 'שריגים-לי-און',
  'כפר חושן': 'כפר חושן',  // was ספסופה, renamed
  'נאות סמדר': 'נאות סמדר',  // was שיזפון, renamed
  'ניצן': 'ניצן',  // was דוחן, renamed
  'סעוה': 'סעוה',  // was מולדה, renamed
  'עצמון שגב': 'עצמון-שגב',
  'כפר ידידיה': 'כפר ידידיה',  // was ידידיה, renamed
  'גלעד אבן יצחק': 'גלעד (אבן יצחק)',

  // ── Format fixes ──
  'אבו עבדון שבט': 'אבו עבדון (שבט)',
  'אבו קורינאת שבט': 'אבו קורינאת (שבט)',
  'אבו קרינאת יישוב': 'אבו קרינאת (ישוב)',
  'אבו רובייעה שבט': 'אבו רובייעה (שבט)',
  'אבו רוקייק שבט': 'אבו רוקייק (שבט)',
  'אסד שבט': 'אסד (שבט)',
  'אעצם שבט': 'אעצם (שבט)',
  'אטרש שבט': 'אטרש (שבט)',
  'הוואשלה שבט': 'הוואשלה (שבט)',
  'הוזייל שבט': 'הוזייל (שבט)',
  'סייד שבט': 'סייד (שבט)',
  'נצאצרה שבט': 'נצאצרה (שבט)',
  'עוקבי בנו עוקבה': 'עוקבי (בנו עוקבה)',
  'עטאוונה שבט': 'עטאוונה (שבט)',
  'קבועה שבט': 'קבועה (שבט)',
  'קוואעין שבט': 'קוואעין (שבט)',
  'ניצנה קהילת חינוך': 'ניצנה (קהילת חינוך)',
  'ניר דוד תל עמל': 'ניר דוד (תל עמל)',
  'כפר רוזנואלד זרעית': 'כפר רוזנואלד (זרעית)',
  'כרם יבנה ישיבה': 'כרם יבנה (ישיבה)',
  'פקיעין בוקייעה': 'פקיעין (בוקייעה)',

  // ── Simple fixes ──
  'בית גן': 'בית ג\'ן',
  'בית חירות': 'בית חירות', // K25 form is fine
  'חירות': 'חירות',  // K25 form
  'דייר חנא': 'דייר חנא',
  'טייבה': 'טייבה',
  'חורפיש': 'חורפיש',
  'מעיליא': 'מעיליא',
  'נאות הכיכר': 'נאות הכיכר',
  'גת קיבוץ': 'גת (קיבוץ)',
  'שושנת העמקים': 'שושנת העמקים',
  'צופים': 'צופים',
  'קרית יערים': 'קרית יערים',
  'כפר סאלד': 'כפר סאלד',

  // K25 has correct form, just use it:
  'אפרת': 'אפרת',
  'פתח תקווה': 'פתח תקווה',
  'תל אביב יפו': 'תל אביב-יפו',

  // Katzir-Harish: K25 shows חריש as code 1247, which used to be קציר-חריש
  'חריש': 'חריש',
}

/**
 * Normalize a K25 city name:
 * 1. Trim whitespace
 * 2. Apply manual overrides
 * 3. Normalize remaining whitespace
 */
function normalizeK25Name(rawName: string): string {
  const trimmed = String(rawName || '').trim().replace(/\s+/g, ' ')

  // Check overrides first
  if (NAME_OVERRIDES[trimmed] !== undefined) {
    return NAME_OVERRIDES[trimmed]
  }

  return trimmed
}

// ============================================================
// Coordinates (reuse from preprocess/fix-coords)
// ============================================================

async function fetchSettlementCoords(): Promise<Map<string, { lat: number; lng: number }>> {
  const coords = new Map<string, { lat: number; lng: number }>()

  // Hardcoded coordinates for major cities and important settlements
  const cityCoords: Record<string, { lat: number; lng: number }> = {
    '3000': { lat: 31.7683, lng: 35.2137 },
    '5000': { lat: 32.0853, lng: 34.7818 },
    '4000': { lat: 32.8153, lng: 34.9931 },
    '8300': { lat: 31.9730, lng: 34.8069 },
    '7900': { lat: 32.0841, lng: 34.8878 },
    '70':   { lat: 31.8014, lng: 34.6434 },
    '7400': { lat: 32.3215, lng: 34.8532 },
    '9000': { lat: 31.2530, lng: 34.7915 },
    '6100': { lat: 32.0844, lng: 34.8381 },
    '6600': { lat: 32.0114, lng: 34.7748 },
    '8600': { lat: 32.0680, lng: 34.8244 },
    '7100': { lat: 31.6688, lng: 34.5743 },
    '8400': { lat: 31.8928, lng: 34.8113 },
    '6200': { lat: 32.0171, lng: 34.7515 },
    '6400': { lat: 32.1629, lng: 34.8441 },
    '6900': { lat: 32.1754, lng: 34.9067 },
    '8700': { lat: 32.1836, lng: 34.8709 },
    '1200': { lat: 31.8974, lng: 35.0102 },
    '2610': { lat: 31.7468, lng: 34.9867 },
    '6500': { lat: 32.4341, lng: 34.9196 },
    '1309': { lat: 32.0518, lng: 34.9555 },
    '9700': { lat: 32.1500, lng: 34.8877 },
    '7700': { lat: 32.6078, lng: 35.2889 },
    '2640': { lat: 32.0956, lng: 34.9567 },
    '1061': { lat: 32.7037, lng: 35.3013 },
    '7300': { lat: 32.6996, lng: 35.3035 },
    '1139': { lat: 32.9183, lng: 35.2953 },
    '7600': { lat: 32.9268, lng: 35.0764 },
    '2800': { lat: 33.2084, lng: 35.5715 },
    '6800': { lat: 32.8101, lng: 35.1039 },
    '9500': { lat: 32.8277, lng: 35.0842 },
    '8200': { lat: 32.8388, lng: 35.0788 },
    '9600': { lat: 32.8445, lng: 35.0701 },
    '2100': { lat: 32.7597, lng: 34.9714 },
    '2500': { lat: 32.7711, lng: 35.0380 },
    '7200': { lat: 31.9286, lng: 34.7983 },
    '8500': { lat: 31.9275, lng: 34.8625 },
    '7000': { lat: 31.9505, lng: 34.8897 },
    '6300': { lat: 32.0697, lng: 34.8114 },
    '2400': { lat: 32.0293, lng: 34.8561 },
    '2660': { lat: 31.8784, lng: 34.7382 },
    '2620': { lat: 32.0595, lng: 34.8575 },
    '2630': { lat: 31.6093, lng: 34.7680 },
    '2650': { lat: 32.1466, lng: 34.8380 },
    '9400': { lat: 32.0316, lng: 34.8882 },
    '7500': { lat: 32.8638, lng: 35.2977 },
    '8900': { lat: 32.8530, lng: 35.1982 },
    '8800': { lat: 32.8049, lng: 35.1702 },
    '2710': { lat: 32.5166, lng: 35.1524 },
    '2730': { lat: 32.2656, lng: 35.0084 },
    '2720': { lat: 32.2337, lng: 34.9497 },
    '6000': { lat: 32.4190, lng: 35.0409 },
    '1034': { lat: 31.7298, lng: 34.7473 },
    '1161': { lat: 31.3939, lng: 34.7493 },
    '2200': { lat: 31.0674, lng: 35.0322 },
    '3797': { lat: 31.9309, lng: 35.0435 },
    '3780': { lat: 31.6974, lng: 35.1193 },
    '3616': { lat: 31.7719, lng: 35.2830 },
    '3570': { lat: 32.1049, lng: 35.1736 },
    '874':  { lat: 32.6799, lng: 35.2414 },
    '9200': { lat: 32.5006, lng: 35.4964 },
    '1031': { lat: 31.5247, lng: 34.5964 },
    '2300': { lat: 32.7225, lng: 35.1312 },
    '9300': { lat: 32.5714, lng: 34.9500 },
    '9800': { lat: 32.5222, lng: 34.9468 },
    '7800': { lat: 32.4720, lng: 34.9660 },
    '2530': { lat: 31.9397, lng: 34.8339 },
    '9100': { lat: 33.0026, lng: 35.0966 },
    '6700': { lat: 32.7922, lng: 35.5312 },
    '8000': { lat: 32.9646, lng: 35.4964 },
    '2600': { lat: 29.5577, lng: 34.9519 },
    '681':  { lat: 32.0784, lng: 34.8511 },
    '1015': { lat: 31.8029, lng: 35.1488 },
    '1304': { lat: 31.9977, lng: 34.9454 },
    '229':  { lat: 32.0614, lng: 34.8725 },
    '565':  { lat: 32.0286, lng: 34.7928 },
    '31':   { lat: 31.3139, lng: 34.6192 },
    '246':  { lat: 31.4196, lng: 34.5878 },
    '831':  { lat: 30.9879, lng: 34.9290 },
    '99':   { lat: 30.6109, lng: 34.8013 },
    '1247': { lat: 32.4628, lng: 35.0493 },
    '1063': { lat: 33.0168, lng: 35.2716 },
    '195':  { lat: 32.2792, lng: 34.9175 },
    '240':  { lat: 32.6575, lng: 35.1078 },
    '1020': { lat: 32.5077, lng: 34.9183 },
    '666':  { lat: 31.2647, lng: 34.8488 },
    '1271': { lat: 31.3744, lng: 34.8099 },
    '922':  { lat: 32.7650, lng: 35.1060 },
    '2550': { lat: 31.8137, lng: 34.7778 },
    '1310': { lat: 31.8726, lng: 34.9706 },
    '2560': { lat: 31.2575, lng: 35.2117 },
    '3730': { lat: 31.8624, lng: 35.1728 },
    '3650': { lat: 31.6625, lng: 35.1531 },
    '3611': { lat: 31.5274, lng: 35.1236 },
    '3400': { lat: 31.5308, lng: 35.0954 },
    '3574': { lat: 31.9435, lng: 35.2265 },
    '3640': { lat: 32.1729, lng: 35.0954 },
    '3557': { lat: 32.1677, lng: 35.1917 },
    '3560': { lat: 32.1098, lng: 35.0294 },
    '3750': { lat: 32.1755, lng: 34.9745 },
    '3760': { lat: 32.1337, lng: 34.9636 },
    '3660': { lat: 32.1660, lng: 35.1533 },
    '3608': { lat: 32.0468, lng: 35.3854 },
    '3576': { lat: 31.8481, lng: 35.4197 },
    '4100': { lat: 32.9918, lng: 35.6912 },
    '4201': { lat: 33.2663, lng: 35.7713 },
    '4001': { lat: 33.2218, lng: 35.7635 },
    '43':   { lat: 33.2802, lng: 35.5735 },
    '26':   { lat: 32.9692, lng: 35.5402 },
    '2034': { lat: 32.9850, lng: 35.5460 },
    '627':  { lat: 32.1568, lng: 34.9582 },
    '634':  { lat: 32.1145, lng: 34.9762 },
    '638':  { lat: 32.2854, lng: 34.9826 },
    '654':  { lat: 32.5098, lng: 35.0882 },
    '481':  { lat: 32.8810, lng: 35.3850 },
    '494':  { lat: 32.6917, lng: 35.0433 },
    '534':  { lat: 32.7322, lng: 35.0645 },
    '1292': { lat: 32.9269, lng: 35.1552 },
    '473':  { lat: 31.7978, lng: 35.1091 },
    '1059': { lat: 31.2284, lng: 34.9842 },
    '1303': { lat: 31.2932, lng: 34.9332 },
    '1060': { lat: 31.3164, lng: 34.8558 },
    '1286': { lat: 31.2541, lng: 34.8974 },
    '1192': { lat: 31.2828, lng: 34.9333 },
    '1054': { lat: 31.2526, lng: 34.7894 },
    '469':  { lat: 31.8630, lng: 34.8245 },
    '28':   { lat: 31.8521, lng: 34.8389 },
    '168':  { lat: 32.3169, lng: 34.9312 },
    '166':  { lat: 31.7894, lng: 34.7067 },
    '1066': { lat: 31.7468, lng: 34.7450 },
    '584':  { lat: 31.6200, lng: 34.5300 },
    '155':  { lat: 31.7400, lng: 34.7267 },
    '1167': { lat: 32.5000, lng: 34.8900 },
    '812':  { lat: 33.0717, lng: 35.1500 },
    '885':  { lat: 30.8733, lng: 34.7917 },
    '1283': { lat: 31.2500, lng: 34.7900 },
    '29':   { lat: 33.1117, lng: 35.5717 },
    '1224': { lat: 32.2214, lng: 34.9791 },
    '171':  { lat: 32.3088, lng: 34.8545 },
  }

  for (const [code, c] of Object.entries(cityCoords)) {
    coords.set(code, c)
  }

  // Fetch CBS coordinates for remaining cities
  try {
    const url = `${API_BASE}?resource_id=64edd0ee-3d5d-43ce-8562-c46571e1f502&limit=2000`
    console.log('Fetching coordinates from CBS API...')
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
      console.log(`Total coordinates: ${coords.size}`)
    }
  } catch {
    console.warn('Could not fetch CBS coordinates, using fallback data')
  }

  return coords
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('Building canonical city list from K25 data...')

  const k25Resources = resourceIds[25]
  if (!k25Resources?.factions) {
    throw new Error('No K25 factions resource ID found')
  }

  // Fetch K25 per-city data
  console.log('Fetching K25 factions data...')
  const records = await fetchAllRecords(k25Resources.factions)
  console.log(`Fetched ${records.length} city records from K25`)

  // Extract unique cities
  const cityMap = new Map<string, string>() // code -> rawName
  for (const record of records) {
    const code = String(record['סמל ישוב'] || '').trim()
    const name = String(record['שם ישוב'] || '').trim()
    if (code && name) {
      cityMap.set(code, name)
    }
  }
  console.log(`Found ${cityMap.size} unique cities in K25`)

  // Fetch coordinates
  const coords = await fetchSettlementCoords()

  // Build cities array with normalized names
  const cities: Array<{
    code: string
    name: string
    k25raw: string  // original K25 name for alias generation
    lat?: number
    lng?: number
  }> = []

  let overrideCount = 0
  for (const [code, rawName] of cityMap) {
    const normalizedName = normalizeK25Name(rawName)
    if (normalizedName !== rawName) {
      overrideCount++
    }

    const coord = coords.get(code)
    cities.push({
      code,
      name: normalizedName,
      k25raw: rawName,
      ...(coord ? { lat: coord.lat, lng: coord.lng } : {}),
    })
  }

  // Sort by Hebrew name
  cities.sort((a, b) => a.name.localeCompare(b.name, 'he'))

  console.log(`Applied ${overrideCount} name overrides`)
  console.log(`Cities with coordinates: ${cities.filter(c => c.lat).length}`)

  // Write cities.json
  const outputPath = path.join(OUTPUT_DIR, 'cities.json')
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(cities, null, 2))
  console.log(`Written ${outputPath} (${cities.length} cities)`)

  // Show sample
  console.log('\nSample cities:')
  const samples = ['3000', '5000', '1200', '7500', '2710', '7900', '1292', '1063', '9400']
  for (const code of samples) {
    const city = cities.find(c => c.code === code)
    if (city) {
      const changed = city.name !== city.k25raw ? ` (was: ${city.k25raw})` : ''
      console.log(`  ${city.code}: ${city.name}${changed}`)
    }
  }

  console.log('\nDone!')
}

main().catch(console.error)
