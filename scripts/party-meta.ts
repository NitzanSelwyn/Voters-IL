// Curated party metadata for Knesset rounds 20-25
// Ballot letter -> party info + seats per round
// Sources: Knesset website, Wikipedia

export interface PartyInfo {
  letter: string
  nameHe: string
  nameEn: string
  color: string
  seats: Record<number, number> // roundId -> seats
}

// Major parties and their ballot letters across rounds
// Note: Some parties change ballot letters between rounds
export const partyMeta: Record<string, PartyInfo> = {
  // Likud - מחנה
  'מחל': {
    letter: 'מחל',
    nameHe: 'הליכוד',
    nameEn: 'Likud',
    color: '#1b5da5',
    seats: { 20: 30, 21: 36, 22: 36, 23: 36, 24: 30, 25: 32 },
  },
  // Yesh Atid
  'פה': {
    letter: 'פה',
    nameHe: 'יש עתיד',
    nameEn: 'Yesh Atid',
    color: '#52b4d9',
    seats: { 20: 11, 21: 0, 22: 0, 23: 0, 24: 17, 25: 24 },
  },
  // Blue and White (21-23) / Benny Gantz
  'כף': {
    letter: 'כף',
    nameHe: 'כחול לבן',
    nameEn: 'Blue and White',
    color: '#00a5e5',
    seats: { 21: 35, 22: 33, 23: 15, 24: 8, 25: 0 },
  },
  // Shas
  'שס': {
    letter: 'שס',
    nameHe: 'ש"ס',
    nameEn: 'Shas',
    color: '#0d2137',
    seats: { 20: 7, 21: 8, 22: 9, 23: 9, 24: 9, 25: 11 },
  },
  // United Torah Judaism
  'ג': {
    letter: 'ג',
    nameHe: 'יהדות התורה',
    nameEn: 'United Torah Judaism',
    color: '#173f6e',
    seats: { 20: 6, 21: 8, 22: 7, 23: 7, 24: 7, 25: 7 },
  },
  // Joint List / Hadash-Ta'al
  'ודעם': {
    letter: 'ודעם',
    nameHe: 'הרשימה המשותפת',
    nameEn: 'Joint List',
    color: '#4a8c3f',
    seats: { 20: 13, 21: 6, 22: 6, 23: 15, 24: 6, 25: 5 },
  },
  // Yisrael Beiteinu
  'ל': {
    letter: 'ל',
    nameHe: 'ישראל ביתנו',
    nameEn: 'Yisrael Beiteinu',
    color: '#003566',
    seats: { 20: 6, 21: 5, 22: 8, 23: 7, 24: 7, 25: 6 },
  },
  // Labor / Avoda
  'אמת': {
    letter: 'אמת',
    nameHe: 'העבודה',
    nameEn: 'Labor',
    color: '#e31e24',
    seats: { 20: 24, 21: 6, 22: 6, 23: 3, 24: 7, 25: 4 },
  },
  // Meretz / now Democratic Union
  'מרצ': {
    letter: 'מרצ',
    nameHe: 'מרצ',
    nameEn: 'Meretz',
    color: '#3db54a',
    seats: { 20: 5, 21: 4, 22: 5, 23: 3, 24: 6, 25: 0 },
  },
  // Religious Zionist Party
  'ט': {
    letter: 'ט',
    nameHe: 'הציונות הדתית',
    nameEn: 'Religious Zionism',
    color: '#d4a843',
    seats: { 20: 0, 21: 0, 22: 0, 23: 0, 24: 6, 25: 14 },
  },
  // New Hope - Tikva Hadasha
  'ת': {
    letter: 'ת',
    nameHe: 'תקווה חדשה',
    nameEn: 'New Hope',
    color: '#0077b6',
    seats: { 24: 6, 25: 0 },
  },
  // Yamina
  'מב': {
    letter: 'מב',
    nameHe: 'ימינה',
    nameEn: 'Yamina',
    color: '#5c913b',
    seats: { 23: 6, 24: 7, 25: 0 },
  },
  // Kulanu
  'כ': {
    letter: 'כ',
    nameHe: 'כולנו',
    nameEn: 'Kulanu',
    color: '#e2a928',
    seats: { 20: 10, 21: 4, 22: 0 },
  },
  // Jewish Home / HaBayit HaYehudi
  'טב': {
    letter: 'טב',
    nameHe: 'הבית היהודי',
    nameEn: 'Jewish Home',
    color: '#e59600',
    seats: { 20: 8, 21: 0, 22: 0 },
  },
  // United Right / Yamina (earlier incarnation)
  'נץ': {
    letter: 'נץ',
    nameHe: 'איחוד מפלגות הימין',
    nameEn: 'United Right',
    color: '#6e8b3d',
    seats: { 21: 5, 22: 7 },
  },
  // Ra'am (United Arab List) - separate from Joint List since Knesset 24
  'עם': {
    letter: 'עם',
    nameHe: 'רע"מ',
    nameEn: "Ra'am",
    color: '#28a745',
    seats: { 24: 4, 25: 5 },
  },
  // National Unity (Gantz party in K25)
  'ממ': {
    letter: 'ממ',
    nameHe: 'המחנה הממלכתי',
    nameEn: 'National Unity',
    color: '#003d7a',
    seats: { 25: 12 },
  },
  // Democratic Union / Meretz alliance (K22)
  'אמ': {
    letter: 'אמ',
    nameHe: 'המחנה הדמוקרטי',
    nameEn: 'Democratic Camp',
    color: '#55b052',
    seats: { 22: 5 },
  },
  // Hadash-Ta'al (when running separately)
  'טע': {
    letter: 'טע',
    nameHe: 'חד"ש-תע"ל',
    nameEn: 'Hadash-Taal',
    color: '#cc3333',
    seats: { 25: 5 },
  },
  // Balad (running separately in K25)
  'ד': {
    letter: 'ד',
    nameHe: 'בל"ד',
    nameEn: 'Balad',
    color: '#66a644',
    seats: { 25: 0 },
  },
}

// Rounds metadata
export const roundsMeta = [
  { id: 20, name: 'הכנסת ה-20', date: '2015-03-17', year: 2015 },
  { id: 21, name: 'הכנסת ה-21', date: '2019-04-09', year: 2019 },
  { id: 22, name: 'הכנסת ה-22', date: '2019-09-17', year: 2019 },
  { id: 23, name: 'הכנסת ה-23', date: '2020-03-02', year: 2020 },
  { id: 24, name: 'הכנסת ה-24', date: '2021-03-23', year: 2021 },
  { id: 25, name: 'הכנסת ה-25', date: '2022-11-01', year: 2022 },
]

// Resource IDs for data.gov.il CKAN API
// factions = "לפי יישובים" (per-city aggregated)
// individuals = "לפי קלפיות" (per-ballot-box detailed)
export const resourceIds: Record<number, { factions: string; individuals: string }> = {
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
}
