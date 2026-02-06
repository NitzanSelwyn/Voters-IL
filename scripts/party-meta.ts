// Curated party metadata for Knesset rounds 15-25
// Ballot letter -> party info + seats per round
// Sources: Knesset website, Wikipedia, data.gov.il CKAN API verification

export interface PartyInfo {
  letter: string
  nameHe: string
  nameEn: string
  color: string
  seats: Record<number, number> // roundId -> seats
  // When a ballot letter was reused by a different party in older rounds,
  // aliasRounds provides the correct name for that specific round.
  aliasRounds?: Record<number, { nameHe: string; nameEn: string }>
}

// ============================================================
// Party Metadata
// ============================================================
// Organized by: long-running parties first, then newer/defunct parties.
// Some ballot letters were reused by different parties across rounds —
// aliasRounds handles these cases (e.g., פה = Center Party in K15, Yesh Atid in K19+).

export const partyMeta: Record<string, PartyInfo> = {

  // ──────────────────────────────────────────────
  // Long-running parties (span multiple eras)
  // ──────────────────────────────────────────────

  // Likud
  // K19: ran as joint list with Yisrael Beiteinu ("Likud Yisrael Beiteinu")
  'מחל': {
    letter: 'מחל',
    nameHe: 'הליכוד',
    nameEn: 'Likud',
    color: '#1b5da5',
    seats: { 15: 19, 16: 38, 17: 12, 18: 27, 19: 31, 20: 30, 21: 35, 22: 32, 23: 36, 24: 30, 25: 32 },
    aliasRounds: {
      19: { nameHe: 'הליכוד ישראל ביתנו', nameEn: 'Likud Yisrael Beiteinu' },
    },
  },

  // Shas
  'שס': {
    letter: 'שס',
    nameHe: 'ש"ס',
    nameEn: 'Shas',
    color: '#0d2137',
    seats: { 15: 17, 16: 11, 17: 12, 18: 11, 19: 11, 20: 7, 21: 8, 22: 9, 23: 9, 24: 9, 25: 11 },
  },

  // United Torah Judaism
  'ג': {
    letter: 'ג',
    nameHe: 'יהדות התורה',
    nameEn: 'United Torah Judaism',
    color: '#173f6e',
    seats: { 15: 5, 16: 5, 17: 6, 18: 5, 19: 7, 20: 6, 21: 8, 22: 7, 23: 7, 24: 7, 25: 7 },
  },

  // Labor / Avoda
  // K15: "One Israel" (Labor+Gesher+Meimad), K16-K17: "Labor-Meimad"
  'אמת': {
    letter: 'אמת',
    nameHe: 'העבודה',
    nameEn: 'Labor',
    color: '#e31e24',
    seats: { 15: 26, 16: 19, 17: 19, 18: 13, 19: 15, 20: 24, 21: 6, 22: 6, 23: 7, 24: 7, 25: 4 },
    aliasRounds: {
      15: { nameHe: 'ישראל אחת', nameEn: 'One Israel' },
      16: { nameHe: 'העבודה-מימד', nameEn: 'Labor-Meimad' },
      17: { nameHe: 'העבודה-מימד', nameEn: 'Labor-Meimad' },
      23: { nameHe: 'העבודה-גשר-מרצ', nameEn: 'Labor-Gesher-Meretz' },
    },
  },

  // Meretz
  // Note: K19 data uses ballot letter מרץ (final ץ), preprocessing normalizes to מרצ
  // K17: "Meretz-Yachad", K18: "Meretz-New Movement"
  'מרצ': {
    letter: 'מרצ',
    nameHe: 'מרצ',
    nameEn: 'Meretz',
    color: '#3db54a',
    seats: { 15: 10, 16: 6, 17: 5, 18: 3, 19: 6, 20: 5, 21: 4, 22: 0, 23: 0, 24: 6, 25: 0 },
    aliasRounds: {
      17: { nameHe: 'מרצ-יחד', nameEn: 'Meretz-Yachad' },
    },
  },

  // Yisrael Beiteinu
  // K15: alone (4), K16: joint list with National Union (7), K17-K18: alone
  // K19: merged into Likud (מחל), K20+: alone again
  'ל': {
    letter: 'ל',
    nameHe: 'ישראל ביתנו',
    nameEn: 'Yisrael Beiteinu',
    color: '#003566',
    seats: { 15: 4, 16: 7, 17: 11, 18: 15, 20: 6, 21: 5, 22: 8, 23: 7, 24: 7, 25: 6 },
    aliasRounds: {
      16: { nameHe: 'האיחוד הלאומי - ישראל ביתנו', nameEn: 'National Union-Yisrael Beiteinu' },
    },
  },

  // Balad
  'ד': {
    letter: 'ד',
    nameHe: 'בל"ד',
    nameEn: 'Balad',
    color: '#66a644',
    seats: { 15: 2, 16: 3, 17: 3, 18: 3, 19: 3, 25: 0 },
  },

  // Ra'am / United Arab List
  // K15-K19: "United Arab List" (sometimes with Ta'al), K24+: "Ra'am"
  'עם': {
    letter: 'עם',
    nameHe: 'רע"מ',
    nameEn: "Ra'am",
    color: '#28a745',
    seats: { 15: 5, 16: 2, 17: 4, 18: 4, 19: 4, 24: 4, 25: 5 },
    aliasRounds: {
      15: { nameHe: 'הרשימה הערבית המאוחדת', nameEn: 'United Arab List' },
      16: { nameHe: 'הרשימה הערבית המאוחדת', nameEn: 'United Arab List' },
      17: { nameHe: 'רע"מ-תע"ל', nameEn: "Ra'am-Ta'al" },
      18: { nameHe: 'רע"מ-תע"ל', nameEn: "Ra'am-Ta'al" },
      19: { nameHe: 'רע"מ-תע"ל', nameEn: "Ra'am-Ta'al" },
    },
  },

  // ──────────────────────────────────────────────
  // Parties from K20+ era (already tracked)
  // ──────────────────────────────────────────────

  // Yesh Atid (K19+)
  // K15: ballot letter פה was used by the Center Party (completely different party)
  'פה': {
    letter: 'פה',
    nameHe: 'יש עתיד',
    nameEn: 'Yesh Atid',
    color: '#52b4d9',
    seats: { 15: 6, 19: 19, 20: 11, 21: 0, 22: 0, 23: 0, 24: 17, 25: 24 },
    aliasRounds: {
      15: { nameHe: 'מפלגת המרכז', nameEn: 'Center Party' },
    },
  },

  // Blue and White (K21-24)
  'כף': {
    letter: 'כף',
    nameHe: 'כחול לבן',
    nameEn: 'Blue and White',
    color: '#00a5e5',
    seats: { 21: 35, 22: 33, 23: 33, 24: 8, 25: 0 },
  },

  // Joint List (K20-K24)
  // In K15-K19, Hadash ran separately under ו
  'ודעם': {
    letter: 'ודעם',
    nameHe: 'הרשימה המשותפת',
    nameEn: 'Joint List',
    color: '#4a8c3f',
    seats: { 20: 13, 21: 0, 22: 13, 23: 15, 24: 6, 25: 0 },
  },

  // Religious Zionism (K24+)
  // K18: ballot letter ט was used by National Union (different party)
  'ט': {
    letter: 'ט',
    nameHe: 'הציונות הדתית',
    nameEn: 'Religious Zionism',
    color: '#d4a843',
    seats: { 18: 4, 20: 0, 21: 0, 22: 0, 23: 0, 24: 6, 25: 14 },
    aliasRounds: {
      18: { nameHe: 'האיחוד הלאומי', nameEn: 'National Union' },
    },
  },

  // New Hope (K24)
  'ת': {
    letter: 'ת',
    nameHe: 'תקווה חדשה',
    nameEn: 'New Hope',
    color: '#0077b6',
    seats: { 24: 6, 25: 0 },
  },

  // Yamina (K23-K24)
  'מב': {
    letter: 'מב',
    nameHe: 'ימינה',
    nameEn: 'Yamina',
    color: '#5c913b',
    seats: { 23: 6, 24: 7, 25: 0 },
  },

  // Kulanu (K20-K21)
  'כ': {
    letter: 'כ',
    nameHe: 'כולנו',
    nameEn: 'Kulanu',
    color: '#e2a928',
    seats: { 20: 10, 21: 4, 22: 0 },
  },

  // Jewish Home / HaBayit HaYehudi (K18-K20)
  // K17: ballot letter טב was used by National Union-NRP joint list
  'טב': {
    letter: 'טב',
    nameHe: 'הבית היהודי',
    nameEn: 'Jewish Home',
    color: '#e59600',
    seats: { 17: 9, 18: 3, 19: 12, 20: 8, 21: 0, 22: 0 },
    aliasRounds: {
      17: { nameHe: 'האיחוד הלאומי-מפד"ל', nameEn: 'National Union-NRP' },
    },
  },

  // United Right (K21-K22)
  // K15: ballot letter נץ was used by National Union
  'נץ': {
    letter: 'נץ',
    nameHe: 'איחוד מפלגות הימין',
    nameEn: 'United Right',
    color: '#6e8b3d',
    seats: { 15: 4, 21: 5, 22: 7 },
    aliasRounds: {
      15: { nameHe: 'האיחוד הלאומי', nameEn: 'National Union' },
    },
  },

  // National Unity / HaMahane HaMamlahti (K25)
  'ממ': {
    letter: 'ממ',
    nameHe: 'המחנה הממלכתי',
    nameEn: 'National Unity',
    color: '#003d7a',
    seats: { 25: 12 },
  },

  // Democratic Camp / Meretz alliance (K22)
  'אמ': {
    letter: 'אמ',
    nameHe: 'המחנה הדמוקרטי',
    nameEn: 'Democratic Camp',
    color: '#55b052',
    seats: { 22: 5 },
  },

  // Hadash-Ta'al in K25 (split from Joint List)
  'טע': {
    letter: 'טע',
    nameHe: 'חד"ש-תע"ל',
    nameEn: 'Hadash-Taal',
    color: '#cc3333',
    seats: { 25: 5 },
  },

  // Hadash-Ta'al in K21 (when Joint List split temporarily)
  'ום': {
    letter: 'ום',
    nameHe: 'חד"ש-תע"ל',
    nameEn: 'Hadash-Taal',
    color: '#cc3333',
    seats: { 21: 6 },
  },

  // Ra'am-Balad in K21 (when Joint List split temporarily)
  'דעם': {
    letter: 'דעם',
    nameHe: 'רע"מ-בל"ד',
    nameEn: "Ra'am-Balad",
    color: '#2e7d32',
    seats: { 21: 4 },
  },

  // ──────────────────────────────────────────────
  // Historical parties (K15-K19 only)
  // ──────────────────────────────────────────────

  // Kadima (K17-K18), then Hatnuah under Tzipi Livni (K19)
  // Major centrist party founded by Ariel Sharon in 2005
  'כן': {
    letter: 'כן',
    nameHe: 'קדימה',
    nameEn: 'Kadima',
    color: '#FF6D00',
    seats: { 17: 29, 18: 28, 19: 6 },
    aliasRounds: {
      19: { nameHe: 'התנועה', nameEn: 'Hatnuah' },
    },
  },

  // Hadash (K15-K19, ran separately before Joint List era)
  // Communist/Arab-Jewish party, later joined Joint List (ודעם) in K20
  'ו': {
    letter: 'ו',
    nameHe: 'חד"ש',
    nameEn: 'Hadash',
    color: '#d32f2f',
    seats: { 15: 3, 16: 3, 17: 3, 18: 4, 19: 4 },
  },

  // Shinui (K15-K16)
  // Secular centrist party led by Tommy Lapid (father of Yair Lapid/Yesh Atid)
  'יש': {
    letter: 'יש',
    nameHe: 'שינוי',
    nameEn: 'Shinui',
    color: '#F9A825',
    seats: { 15: 6, 16: 15 },
  },

  // Gil - Pensioners Party (K17 only)
  // Surprise election result, never repeated
  'ז': {
    letter: 'ז',
    nameHe: 'גיל - גמלאים לישראל',
    nameEn: 'Gil (Pensioners)',
    color: '#7E57C2',
    seats: { 17: 7 },
  },

  // NRP / Mafdal - National Religious Party (K15-K16)
  // Later merged into Jewish Home (טב) and eventually Religious Zionism
  'ם': {
    letter: 'ם',
    nameHe: 'המפד"ל',
    nameEn: 'NRP',
    color: '#558B2F',
    seats: { 15: 5, 16: 6 },
  },

  // Yisrael B'Aliyah (K15-K16)
  // Russian immigrant party led by Natan Sharansky, merged into Likud before K17
  'נ': {
    letter: 'נ',
    nameHe: 'ישראל בעלייה',
    nameEn: "Yisrael B'Aliyah",
    color: '#0288D1',
    seats: { 15: 6, 16: 2 },
  },

  // One Nation / Am Echad (K15-K16)
  // Workers' party led by Amir Peretz, later merged into Labor
  'ב': {
    letter: 'ב',
    nameHe: 'עם אחד',
    nameEn: 'One Nation',
    color: '#8D6E63',
    seats: { 15: 2, 16: 3 },
  },

  // Kadima remnant (K19 only)
  // What remained of Kadima under Shaul Mofaz after Livni split to form Hatnuah
  'קנ': {
    letter: 'קנ',
    nameHe: 'קדימה',
    nameEn: 'Kadima',
    color: '#FF8C00',
    seats: { 19: 2 },
  },

  // National Union (K16 - ran under ט in K18, here ט has aliasRounds)
  // Note: In K16, National Union + YB ran under ל (see ל aliasRounds).
  // In K18, National Union ran under ט (see ט aliasRounds).
  // In K17, NU-NRP joint list ran under טב (see טב aliasRounds).
  // No separate entry needed — tracked via aliasRounds on ל, ט, and טב.
}

// ============================================================
// Rounds Metadata
// ============================================================

export const roundsMeta = [
  { id: 15, name: 'הכנסת ה-15', date: '1999-05-17', year: 1999 },
  { id: 16, name: 'הכנסת ה-16', date: '2003-01-28', year: 2003 },
  { id: 17, name: 'הכנסת ה-17', date: '2006-03-28', year: 2006 },
  { id: 18, name: 'הכנסת ה-18', date: '2009-02-10', year: 2009 },
  { id: 19, name: 'הכנסת ה-19', date: '2013-01-22', year: 2013 },
  { id: 20, name: 'הכנסת ה-20', date: '2015-03-17', year: 2015 },
  { id: 21, name: 'הכנסת ה-21', date: '2019-04-09', year: 2019 },
  { id: 22, name: 'הכנסת ה-22', date: '2019-09-17', year: 2019 },
  { id: 23, name: 'הכנסת ה-23', date: '2020-03-02', year: 2020 },
  { id: 24, name: 'הכנסת ה-24', date: '2021-03-23', year: 2021 },
  { id: 25, name: 'הכנסת ה-25', date: '2022-11-01', year: 2022 },
]

// ============================================================
// Resource IDs for data.gov.il CKAN API
// ============================================================
// factions = "לפי יישובים" (per-city aggregated)
// individuals = "לפי קלפיות" (per-ballot-box detailed)
//
// K16-K18: only individuals (per-ballot-box) data exists — must aggregate into per-city
// K15: not on data.gov.il at all — sourced from odata.org.il XLS (scripts/data/knesset-15.xls)

export const resourceIds: Record<number, { factions: string | null; individuals: string | null }> = {
  25: {
    factions: 'b392b8ee-ba45-4ea0-bfed-f03a1a36e99c',
    individuals: 'cc223336-07bc-485d-b160-62df92967c0a',
  },
  24: {
    factions: '9921a347-8466-4ef4-81f9-22523c5c4632',
    individuals: '419be3b0-fd30-455a-afc0-034ec36be990',
  },
  23: {
    factions: '3dc36e20-25d6-4496-ba6a-71d9bc917349',
    individuals: '3b9e911a-2e90-4587-b209-84171664056b',
  },
  22: {
    factions: 'bd22cd14-138c-4917-931a-ef628c2a5a30',
    individuals: '22f3a195-3a79-436c-be23-cb606bc7b398',
  },
  21: {
    factions: '1a1c7b2b-e819-4ba9-b159-d68e3566c58b',
    individuals: 'f79f9ba5-fe12-4b90-96cc-916f1b7c1c34',
  },
  20: {
    factions: '929b50c6-f455-4be2-b438-ec6af01421f2',
    individuals: 'c3db5581-f48d-45fc-b221-e7635e940c41',
  },
  19: {
    factions: 'c20cdcef-4d42-4241-a41b-6ca7ae51002d',
    individuals: '432d3185-545a-41d9-8c72-d10ee515919c',
  },
  18: {
    factions: null, // No per-city resource — aggregate from individuals
    individuals: '840edb33-90ac-4176-8ad9-4cdcb8e5caa5',
  },
  17: {
    factions: null, // No per-city resource — aggregate from individuals
    individuals: '70f8bc93-8d98-4c20-ad7c-768af713f1c5',
  },
  16: {
    factions: null, // No per-city resource — aggregate from individuals
    individuals: '498b48e9-5af6-474d-b7a4-5ac1e21d3a08',
  },
  15: {
    factions: null, // Not on data.gov.il — parsed from scripts/data/knesset-15.xls
    individuals: null,
  },
}

// ============================================================
// Data completeness flags per round
// ============================================================
// Used by the frontend to show "incomplete data" indicators

export interface DataCompleteness {
  hasPerCityData: boolean       // true = dedicated per-city resource, false = aggregated from ballot boxes
  hasPerBallotBoxData: boolean
  hasEligibleVoters: boolean    // false only for K17
  hasCityCodes: boolean         // false only for K17
  hasInvalidVotes: boolean      // false only for K17 (derivable from totalVotes - validVotes)
  dataSource: 'ckan-api' | 'ckan-api-aggregated' | 'xls-odata'
  notes?: string
}

export const dataCompleteness: Record<number, DataCompleteness> = {
  15: {
    hasPerCityData: false,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'xls-odata',
    notes: 'מקור: קובץ XLS מ-odata.org.il. נתוני ישובים מחושבים מסיכום קלפיות.',
  },
  16: {
    hasPerCityData: false,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api-aggregated',
    notes: 'נתוני ישובים מחושבים מסיכום קלפיות.',
  },
  17: {
    hasPerCityData: false,
    hasPerBallotBoxData: true,
    hasEligibleVoters: false,
    hasCityCodes: false,
    hasInvalidVotes: false,
    dataSource: 'ckan-api-aggregated',
    notes: 'חסרים נתוני בעלי זכות בחירה וסמלי ישוב. לא ניתן לחשב אחוז הצבעה.',
  },
  18: {
    hasPerCityData: false,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api-aggregated',
    notes: 'נתוני ישובים מחושבים מסיכום קלפיות.',
  },
  19: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  20: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  21: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  22: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  23: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  24: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
  25: {
    hasPerCityData: true,
    hasPerBallotBoxData: true,
    hasEligibleVoters: true,
    hasCityCodes: true,
    hasInvalidVotes: true,
    dataSource: 'ckan-api',
  },
}

// ============================================================
// Field name normalization for historical rounds
// ============================================================
// Maps variant field names to the canonical names used in K20-25.

export const FIELD_ALIASES: Record<string, string> = {
  // Eligible voters variants
  "בז''ב": 'בזב',      // K18
  'בוחרים': 'בזב',     // K16
  'ב ז ב': 'בזב',      // K15

  // Ballot box number variants
  'סמל קלפי': 'מספר קלפי', // K16, K18
  'קלפי': 'מספר קלפי',     // K15

  // Meretz spelling variant
  'מרץ': 'מרצ',            // K19 uses final-ץ
}

// Additional meta fields specific to historical rounds (not party ballot letters)
export const EXTRA_META_FIELDS = new Set([
  'כתובת',        // K17 - ballot box address
  'ת. עדכון',     // K18 - update timestamp
  'נפה',          // K15 - sub-district code
  'פיצול',        // K15 - ballot box split indicator
  "מס' רץ",       // K15 - running number
  'ס"ה מחושב',    // K15 - computed total (checksum)
  'מצביעים ',      // K15 - voters with trailing space (normalized separately)
  'סמל ועדה',     // Various - committee code
  'שם ועדה',      // Various - committee name
  'ברזל',         // Various
])
