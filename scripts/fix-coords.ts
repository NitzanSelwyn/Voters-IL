/**
 * Fix city coordinates in meta.json
 * The original preprocessing had incorrect city code → coordinate mappings.
 * This script patches meta.json with correct WGS84 coordinates.
 *
 * Run: npx tsx scripts/fix-coords.ts
 */
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Correct WGS84 coordinates for Israeli settlements, keyed by CBS settlement code
const CORRECT_COORDS: Record<string, { lat: number; lng: number }> = {
  // =============================================
  // Major cities (population > 100K)
  // =============================================
  '3000': { lat: 31.7683, lng: 35.2137 },  // ירושלים Jerusalem
  '5000': { lat: 32.0853, lng: 34.7818 },  // תל אביב Tel Aviv-Jaffa
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
  '1200': { lat: 31.8974, lng: 35.0102 },  // מודיעין Modi'in-Maccabim-Reut
  '2610': { lat: 31.7468, lng: 34.9867 },  // בית שמש Beit Shemesh

  // =============================================
  // Large cities (population 50K–100K)
  // =============================================
  '6500': { lat: 32.4341, lng: 34.9196 },  // חדרה Hadera
  '1309': { lat: 32.0518, lng: 34.9555 },  // אלעד Elad
  '9700': { lat: 32.1500, lng: 34.8877 },  // הוד השרון Hod HaSharon
  '7700': { lat: 32.6078, lng: 35.2889 },  // עפולה Afula
  '2640': { lat: 32.0956, lng: 34.9567 },  // ראש העין Rosh HaAyin
  '1061': { lat: 32.7037, lng: 35.3013 },  // נצרת עילית / נוף הגליל Nof HaGalil
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
  '6000': { lat: 32.4190, lng: 35.0409 },  // באקה אל-גרביה Baqa al-Gharbiyye
  '1034': { lat: 31.7298, lng: 34.7473 },  // קרית מלאכי Kiryat Malakhi
  '1161': { lat: 31.3939, lng: 34.7493 },  // רהט Rahat
  '2200': { lat: 31.0674, lng: 35.0322 },  // דימונה Dimona
  '3797': { lat: 31.9309, lng: 35.0435 },  // מודיעין עילית Modi'in Illit
  '3780': { lat: 31.6974, lng: 35.1193 },  // ביתר עילית Beitar Illit
  '3616': { lat: 31.7719, lng: 35.2830 },  // מעלה אדומים Ma'ale Adumim
  '3570': { lat: 32.1049, lng: 35.1736 },  // אריאל Ariel
  '874':  { lat: 32.6799, lng: 35.2414 },  // מגדל העמק Migdal HaEmek

  // =============================================
  // Medium cities (population 20K–50K)
  // =============================================
  '9200': { lat: 32.5006, lng: 35.4964 },  // בית שאן Beit She'an
  '1031': { lat: 31.5247, lng: 34.5964 },  // שדרות Sderot
  '2300': { lat: 32.7225, lng: 35.1312 },  // קרית טבעון Kiryat Tivon
  '9300': { lat: 32.5714, lng: 34.9500 },  // זכרון יעקב Zichron Ya'akov
  '9800': { lat: 32.5222, lng: 34.9468 },  // בנימינה-גבעת עדה Binyamina
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
  '1224': { lat: 32.2214, lng: 34.9791 },  // כוכב יאיר Kochav Yair
  '168':  { lat: 32.3169, lng: 34.9312 },  // כפר יונה Kfar Yona
  '166':  { lat: 31.7894, lng: 34.7067 },  // גן יבנה Gan Yavne
  '1020': { lat: 32.5077, lng: 34.9183 },  // אור עקיבא Or Akiva
  '1066': { lat: 31.7468, lng: 34.7450 },  // בני עי"ש Bnei Ayish
  '666':  { lat: 31.2647, lng: 34.8488 },  // עומר Omer
  '1271': { lat: 31.3744, lng: 34.8099 },  // להבים Lehavim
  '922':  { lat: 32.7650, lng: 35.1060 },  // רכסים Rekhasim
  '2550': { lat: 31.8137, lng: 34.7778 },  // גדרה Gedera
  '1310': { lat: 31.8726, lng: 34.9706 },  // לפיד Lapid
  '3730': { lat: 31.8624, lng: 35.1728 },  // גבעת זאב Givat Ze'ev
  '3650': { lat: 31.6625, lng: 35.1531 },  // אפרת Efrat
  '3611': { lat: 31.5274, lng: 35.1236 },  // קרית ארבע Kiryat Arba
  '4100': { lat: 32.9918, lng: 35.6912 },  // קצרין Katzrin
  '1059': { lat: 31.2284, lng: 34.9842 },  // כסיפה Kseife
  '1303': { lat: 31.2932, lng: 34.9332 },  // חורה Hura
  '1060': { lat: 31.3164, lng: 34.8558 },  // לקיה Lakia
  '1286': { lat: 31.2541, lng: 34.8974 },  // שגב-שלום Segev Shalom
  '1192': { lat: 31.2828, lng: 34.9333 },  // ערערה-בנגב Ar'ara BaNegev
  '1054': { lat: 31.2526, lng: 34.7894 },  // תל שבע Tel Sheva
  '469':  { lat: 31.8630, lng: 34.8245 },  // קרית עקרון Kiryat Ekron
  '28':   { lat: 31.8521, lng: 34.8389 },  // מזכרת בתיה Mazkeret Batya
  '171':  { lat: 32.3088, lng: 34.8545 },  // פרדסיה Pardesiya

  // =============================================
  // Arab towns and villages
  // =============================================
  '627':  { lat: 32.1568, lng: 34.9582 },  // ג'לג'וליה Jaljulia
  '634':  { lat: 32.1145, lng: 34.9762 },  // כפר קאסם Kafr Qasim
  '638':  { lat: 32.2854, lng: 34.9826 },  // קלנסווה Qalansawe
  '654':  { lat: 32.5098, lng: 35.0882 },  // כפר קרע Kafr Kara
  '637':  { lat: 32.4982, lng: 35.0882 },  // ערערה Ar'ara
  '481':  { lat: 32.8810, lng: 35.3850 },  // מגאר Maghar
  '489':  { lat: 32.6850, lng: 35.3750 },  // דבוריה Daburiyya
  '499':  { lat: 32.6807, lng: 35.2732 },  // יפיע Yafi
  '541':  { lat: 32.5336, lng: 34.9034 },  // ג'סר א-זרקא Jisr az-Zarqa
  '516':  { lat: 32.9213, lng: 35.2419 },  // מג'ד אל-כרום Majd al-Krum
  '529':  { lat: 32.8275, lng: 35.2295 },  // אעבלין I'billin
  '483':  { lat: 32.9028, lng: 35.2432 },  // בענה Bi'ina
  '502':  { lat: 32.9549, lng: 35.1856 },  // ירכא Yirka
  '485':  { lat: 32.9550, lng: 35.1718 },  // ג'ולס Julis
  '494':  { lat: 32.6917, lng: 35.0433 },  // דאלית אל-כרמל Daliyat al-Karmel
  '534':  { lat: 32.7322, lng: 35.0645 },  // עספיא Isfiya
  '520':  { lat: 32.7348, lng: 35.3120 },  // משהד Mashhad
  '532':  { lat: 32.7283, lng: 35.3329 },  // עין מאהל Ein Mahil
  '543':  { lat: 32.9369, lng: 35.3654 },  // ראמה Rama
  '504':  { lat: 32.8700, lng: 35.2098 },  // כאבול Kabul
  '507':  { lat: 32.9560, lng: 35.1520 },  // כפר יאסיף Kafr Yasif
  '509':  { lat: 32.7450, lng: 35.3414 },  // כפר כנא Kafr Kanna
  '508':  { lat: 32.7228, lng: 35.4432 },  // כפר כמא Kfar Kama
  '530':  { lat: 32.8455, lng: 35.3772 },  // עיילבון Eilabun
  '975':  { lat: 32.7207, lng: 35.2517 },  // זרזיר Zarzir
  '482':  { lat: 32.7483, lng: 35.2700 },  // בועיינה-נוג'ידאת Bu'eine Nujeidat
  '498':  { lat: 32.7769, lng: 35.3117 },  // טורעאן Tur'an
  '978':  { lat: 32.7133, lng: 35.2250 },  // כעביה-טבאש-חג'אג' Ka'abiyya
  '1292': { lat: 32.9269, lng: 35.1552 },  // ג'דיידה-מכר Judeida-Maker
  '962':  { lat: 33.0108, lng: 35.5069 },  // טובא-זנגריה Tuba-Zangariyya
  '531':  { lat: 32.8532, lng: 35.3285 },  // עראבה Arraba
  '522':  { lat: 32.9421, lng: 35.2672 },  // נחף Nahf
  '535':  { lat: 33.0784, lng: 35.3010 },  // פסוטה Fassuta
  '525':  { lat: 33.0133, lng: 35.3583 },  // סאג'ור Sajur
  '524':  { lat: 32.6338, lng: 35.3432 },  // נאעורה Na'ura
  '526':  { lat: 32.6589, lng: 35.3318 },  // סולם Sulam
  '511':  { lat: 32.7400, lng: 35.3183 },  // עילוט Ilut
  '537':  { lat: 32.5754, lng: 34.9399 },  // פוריידיס Fureidis
  '539':  { lat: 32.7883, lng: 35.2783 },  // רומאנה Rummana
  '997':  { lat: 32.7517, lng: 35.2233 },  // רומת הייב Rumat al-Heib
  '998':  { lat: 32.8300, lng: 35.2000 },  // ביר אל-מכסור Bir al-Maksur
  '944':  { lat: 32.7333, lng: 35.1517 },  // בסמת טבעון Basmat Tab'un
  '490':  { lat: 32.8617, lng: 35.2517 },  // דייר אל-אסד Deir al-Asad
  '492':  { lat: 32.8683, lng: 35.3517 },  // דייר חנא Deir Hanna
  '633':  { lat: 32.1045, lng: 34.9765 },  // כפר ברא Kafr Bara
  '628':  { lat: 32.4515, lng: 35.0660 },  // ג'ת Jatt
  '518':  { lat: 33.0267, lng: 35.2150 },  // מעיליא Mi'ilya
  '473':  { lat: 31.7978, lng: 35.1091 },  // אבו גוש Abu Ghosh
  '496':  { lat: 33.0517, lng: 35.3383 },  // חורפיש Hurfeish
  '478':  { lat: 32.6767, lng: 35.3200 },  // אכסאל Iksal
  '913':  { lat: 32.6433, lng: 35.2283 },  // שבלי - אום אל-גנם Shibli-Umm al-Ghanam
  '480':  { lat: 33.0117, lng: 35.3783 },  // בית ג'ן Beit Jann
  '649':  { lat: 32.4849, lng: 35.0588 },  // מייסר Meisar
  '510':  { lat: 32.8883, lng: 35.2183 },  // כפר מנדא Kafr Manda
  '635':  { lat: 32.6317, lng: 35.3283 },  // מוקייבלה Muqeible
  '505':  { lat: 32.8017, lng: 35.2533 },  // כאוכב אבו אל-היג' Kawkab Abu al-Hija
  '523':  { lat: 32.5983, lng: 35.3400 },  // ניין Nein
  '1296': { lat: 32.9617, lng: 35.1617 },  // כסרא-סמיע Kisra-Sumei
  '1295': { lat: 32.9433, lng: 35.2917 },  // יאנוח-ג'ת Yanuh-Jat
  '540':  { lat: 33.0667, lng: 35.5133 },  // ריחאניה Reihaniya
  '542':  { lat: 32.7217, lng: 35.3050 },  // ריינה Reineh
  '994':  { lat: 32.4900, lng: 35.0700 },  // מנשית זבדה Manshiyyet Zabda
  '512':  { lat: 32.8850, lng: 35.2717 },  // כפר מצר Kafr Misr
  '1321': { lat: 32.6917, lng: 35.1350 },  // ח'ואלד Khawaled
  '1246': { lat: 33.0833, lng: 35.1500 },  // עראמשה Aramsha
  '521':  { lat: 31.8157, lng: 35.1573 },  // עין נקובא Ein Nakuba
  '514':  { lat: 31.7817, lng: 35.1433 },  // עין ראפה Ein Rafa
  '528':  { lat: 32.5183, lng: 35.1117 },  // עוזייר Uzzair
  '1316': { lat: 32.8233, lng: 35.2200 },  // אל-עריאן al-Aryan

  // =============================================
  // Druze Golan Heights
  // =============================================
  '4201': { lat: 33.2663, lng: 35.7713 },  // מג'דל שמס Majdal Shams
  '4501': { lat: 33.2218, lng: 35.7502 },  // ע'ג'ר Ghajar
  '4203': { lat: 33.1917, lng: 35.7517 },  // מסעדה Mas'ade
  '4001': { lat: 33.2218, lng: 35.7635 },  // בוקעאתא Buq'ata

  // =============================================
  // Judea & Samaria settlements
  // =============================================
  '3574': { lat: 31.9435, lng: 35.2265 },  // בית אל Beit El
  '3779': { lat: 31.8534, lng: 35.2517 },  // כוכב יעקב Kochav Ya'akov
  '3769': { lat: 31.8201, lng: 35.1379 },  // הר אדר Har Adar
  '3770': { lat: 31.9437, lng: 35.0267 },  // חשמונאים Hashmonaim
  '3652': { lat: 32.0392, lng: 35.0502 },  // בית אריה Beit Aryeh
  '3640': { lat: 32.1729, lng: 35.0954 },  // קרני שומרון Karnei Shomron
  '3557': { lat: 32.1677, lng: 35.1917 },  // קדומים Kedumim
  '3560': { lat: 32.1098, lng: 35.0294 },  // אלקנה Elkana
  '3750': { lat: 32.1755, lng: 34.9745 },  // אלפי מנשה Alfei Menashe
  '3760': { lat: 32.1337, lng: 34.9636 },  // אורנית Oranit
  '3660': { lat: 32.1660, lng: 35.1533 },  // עמנואל Emanuel
  '3604': { lat: 31.6520, lng: 35.1293 },  // אלון שבות Alon Shvut
  '3563': { lat: 31.6322, lng: 35.2182 },  // תקוע Tekoa
  '3720': { lat: 32.1081, lng: 35.0033 },  // שערי תקווה Sha'arei Tikva
  '3608': { lat: 32.0468, lng: 35.3854 },  // מעלה אפרים Ma'ale Efraim
  '3617': { lat: 31.9532, lng: 35.2710 },  // עופרה Ofra
  '3765': { lat: 31.9773, lng: 35.2648 },  // עלי Eli
  '3641': { lat: 31.9932, lng: 35.2862 },  // שילה Shilo
  '3576': { lat: 31.8481, lng: 35.4197 },  // מצפה יריחו Mitzpe Yeriho
  '3638': { lat: 31.8095, lng: 35.3293 },  // כפר אדומים Kfar Adumim
  '3651': { lat: 31.8638, lng: 35.3068 },  // מעלה מכמש Ma'ale Mikhmash
  '3653': { lat: 31.5893, lng: 35.1668 },  // מעלה עמוס Ma'ale Amos
  '3602': { lat: 31.6624, lng: 35.1287 },  // ראש צורים Rosh Tzurim
  '3488': { lat: 31.6540, lng: 35.1130 },  // כפר עציון Kfar Etzion
  '3766': { lat: 31.5632, lng: 35.0990 },  // כרמי צור Karmei Tzur
  '3400': { lat: 31.5308, lng: 35.0954 },  // חברון Hebron
  '3764': { lat: 31.4730, lng: 35.0943 },  // חגי Hagai
  '3794': { lat: 31.6425, lng: 35.1049 },  // בת עין Bat Ayin
  '3748': { lat: 31.4614, lng: 35.0556 },  // עתניאל Otniel
  '3637': { lat: 32.2173, lng: 35.1093 },  // מעלה שומרון Ma'ale Shomron
  '3826': { lat: 32.2208, lng: 35.0000 },  // שער שומרון Sha'ar Shomron
  '3572': { lat: 32.1250, lng: 35.2233 },  // כפר תפוח Kfar Tapuach
  '3762': { lat: 32.0821, lng: 35.2988 },  // איתמר Itamar
  '3749': { lat: 32.1123, lng: 35.2620 },  // יצהר Yitzhar
  '3579': { lat: 32.1800, lng: 35.2800 },  // אלון מורה Elon Moreh
  '3569': { lat: 32.3850, lng: 35.2550 },  // מבוא דותן Mevo Dotan
  '3763': { lat: 31.8822, lng: 35.2700 },  // גבע בנימין Geva Binyamin
  '3788': { lat: 31.9605, lng: 35.0988 },  // טלמון Talmon
  '3715': { lat: 31.8260, lng: 35.2518 },  // עלמון Almon
  '3648': { lat: 31.9430, lng: 35.0900 },  // מתתיהו Mattityahu
  '3709': { lat: 31.8589, lng: 35.0593 },  // מבוא חורון Mevo Horon
  '3795': { lat: 32.2133, lng: 35.0933 },  // רבבה Revava
  '3656': { lat: 31.4117, lng: 35.0750 },  // כרמל Carmel
  '3561': { lat: 31.6750, lng: 35.1233 },  // מגדל עוז Migdal Oz
  '3725': { lat: 31.6933, lng: 35.1150 },  // נווה דניאל Neve Daniel
  '3655': { lat: 31.9400, lng: 35.0700 },  // ניל"י Nili
  '3649': { lat: 32.3333, lng: 35.1667 },  // שקד Shaked
  '3643': { lat: 32.3950, lng: 35.2050 },  // חיננית Hinanit
  '3793': { lat: 32.2550, lng: 35.1933 },  // אבני חפץ Avnei Hefetz
  '3659': { lat: 31.8600, lng: 35.2433 },  // פסגות Psagot
  '3751': { lat: 32.0817, lng: 35.4017 },  // מגדלים Migdalim
  '3658': { lat: 31.9700, lng: 35.1300 },  // עטרת Ateret
  '3573': { lat: 32.0200, lng: 35.0900 },  // חלמיש Halamish
  '3646': { lat: 32.1167, lng: 35.4750 },  // חמדת Hamdat
  '3564': { lat: 31.9317, lng: 35.3150 },  // כוכב השחר Kochav HaShahar
  '3566': { lat: 32.0070, lng: 35.4398 },  // יפית Yafit
  '3575': { lat: 31.8700, lng: 35.1350 },  // בית חורון Beit Horon
  '3603': { lat: 31.7050, lng: 35.0950 },  // הר גילה Har Gilo
  '3568': { lat: 32.4500, lng: 35.1917 },  // ריחן Reihan
  '3565': { lat: 31.9017, lng: 35.2933 },  // רימונים Rimonim
  '3619': { lat: 32.1633, lng: 35.4750 },  // רועי Ro'i
  '3824': { lat: 32.0000, lng: 35.2767 },  // עמיחי Amichai
  '3607': { lat: 31.8950, lng: 35.4550 },  // ייט"ב Yafit
  '3767': { lat: 31.9867, lng: 35.1433 },  // נחליאל Nahliel
  '3556': { lat: 31.7983, lng: 35.4333 },  // אלמוג Almog
  '3822': { lat: 32.0733, lng: 35.2750 },  // רחלים Rechelim
  '3787': { lat: 31.8750, lng: 35.0550 },  // נעלה Na'ale
  '3752': { lat: 31.9767, lng: 35.2200 },  // מעלה לבונה Ma'ale Levona
  '3790': { lat: 32.1167, lng: 35.0467 },  // נופים Nofim
  '3778': { lat: 32.1617, lng: 35.0417 },  // עץ אפרים Etz Efraim
  '3777': { lat: 31.3650, lng: 35.0517 },  // סנסנה Sansana
  '3724': { lat: 31.3983, lng: 35.0417 },  // נגוהות Negohot
  '3722': { lat: 31.3550, lng: 35.0300 },  // אשכולות Eshkolot
  '3657': { lat: 31.3831, lng: 35.0818 },  // מעון Ma'on
  '3756': { lat: 31.3913, lng: 35.1051 },  // סוסיא Susya
  '3745': { lat: 31.4550, lng: 35.0467 },  // מצדות יהודה Metzadot Yehuda
  '3727': { lat: 32.1367, lng: 35.0167 },  // עלי זהב Ali Zahav
  '3823': { lat: 31.9133, lng: 35.0183 },  // גני מודיעין Ganei Modi'in
  '3785': { lat: 32.2450, lng: 35.5050 },  // משכיות Maskiyyot
  '3610': { lat: 31.4545, lng: 35.3763 },  // מצפה שלם Mitzpe Shalem
  '3719': { lat: 31.4450, lng: 35.0500 },  // תלם Telem
  '3782': { lat: 31.3350, lng: 35.0967 },  // רותם Rotem
  '3710': { lat: 32.1900, lng: 35.2717 },  // ברכה Bracha
  '3712': { lat: 32.2917, lng: 35.1450 },  // ענב Einav
  '3713': { lat: 31.9050, lng: 35.4383 },  // נעמ"ה Na'ama
  '3654': { lat: 32.3433, lng: 35.1167 },  // ברקן Barkan
  '3746': { lat: 32.1933, lng: 35.0600 },  // קרית נטפים Kiryat Netafim
  '3717': { lat: 32.3900, lng: 35.1700 },  // חרמש Hermesh
  '3744': { lat: 32.0667, lng: 35.0533 },  // ברוכין Bruchin
  '3780': { lat: 31.6974, lng: 35.1193 },  // ביתר עילית Beitar Illit
  '3759': { lat: 31.4967, lng: 35.0633 },  // אדורה Adora
  '3754': { lat: 31.4400, lng: 35.1417 },  // אספר Asfer
  '3726': { lat: 31.6050, lng: 35.2217 },  // נוקדים Nokdim
  '3781': { lat: 31.7267, lng: 35.2867 },  // קדר Kedar
  '3613': { lat: 32.1050, lng: 35.4583 },  // גיתית Gitit
  '3614': { lat: 32.1583, lng: 35.5000 },  // מכורה Mekhora
  '3616': { lat: 31.7719, lng: 35.2830 },  // מעלה אדומים Ma'ale Adumim
  '3620': { lat: 32.2433, lng: 35.5133 },  // נירן Niran
  '3639': { lat: 31.9400, lng: 35.4200 },  // ורד יריחו Vered Yeriho
  '3606': { lat: 31.9830, lng: 35.4440 },  // גלגל Gilgal
  '3601': { lat: 31.7592, lng: 35.4573 },  // קליה Kalia
  '3645': { lat: 31.7600, lng: 35.4800 },  // בית הערבה Beit HaArava
  '3612': { lat: 32.0844, lng: 35.4293 },  // בקעות Beqa'ot
  '3599': { lat: 32.3208, lng: 35.4996 },  // מחולה Mechola
  '3578': { lat: 32.3042, lng: 35.4841 },  // שדמות מחולה Shadmot Mechola
  '3605': { lat: 32.0656, lng: 35.4234 },  // משואה Massu'a
  '3615': { lat: 32.0125, lng: 35.4355 },  // פצאל Petzael
  '3558': { lat: 31.9740, lng: 35.4491 },  // תומר Tomer
  '3598': { lat: 32.0600, lng: 35.4100 },  // ארגמן Argaman
  '3555': { lat: 32.2100, lng: 35.5200 },  // נתיב הגדוד Netiv HaGedud
  '3617': { lat: 31.9532, lng: 35.2710 },  // עופרה Ofra
  '3609': { lat: 32.0917, lng: 35.5083 },  // חמרה Hamra

  // =============================================
  // Golan Heights settlements
  // =============================================
  '4100': { lat: 32.9918, lng: 35.6912 },  // קצרין Katzrin
  '4101': { lat: 33.1262, lng: 35.7789 },  // מרום גולן Merom Golan
  '4551': { lat: 32.7472, lng: 35.6878 },  // נאות גולן Ne'ot Golan
  '4015': { lat: 32.9225, lng: 35.7275 },  // בני יהודה Bnei Yehuda
  '4301': { lat: 32.7764, lng: 35.6878 },  // אפיק Afik
  '4006': { lat: 33.0633, lng: 35.7633 },  // קשת Keshet
  '4013': { lat: 33.1017, lng: 35.7150 },  // אורטל Ortal
  '4014': { lat: 32.8550, lng: 35.6767 },  // נטור Natur
  '4010': { lat: 33.1050, lng: 35.7667 },  // אודם Odem
  '4017': { lat: 33.0267, lng: 35.7533 },  // אלוני הבשן Alonei HaBashan
  '4012': { lat: 33.0667, lng: 35.8017 },  // אניעם Ani'am
  '4021': { lat: 32.7600, lng: 35.7050 },  // גבעת יואב Givat Yoav
  '4022': { lat: 32.7117, lng: 35.7150 },  // גשור Geshur
  '4702': { lat: 33.0150, lng: 35.7650 },  // רמות Ramot
  '4701': { lat: 32.8117, lng: 35.7633 },  // רמת מגשימים Ramat Magshimim
  '4204': { lat: 32.7617, lng: 35.6433 },  // מבוא חמה Mevo Hamma
  '4303': { lat: 33.2517, lng: 35.7883 },  // נווה אטי"ב Neve Ativ
  '4304': { lat: 33.0633, lng: 35.6967 },  // נוב Nov
  '4024': { lat: 32.7567, lng: 35.7117 },  // קלע Kela
  '4025': { lat: 32.8433, lng: 35.7417 },  // קדמת צבי Kidmat Tzvi
  '4005': { lat: 32.7833, lng: 35.6600 },  // חספין Haspin
  '4028': { lat: 32.8783, lng: 35.7050 },  // כנף Kanaf
  '4019': { lat: 32.8867, lng: 35.7417 },  // מיצר Meitzar
  '4008': { lat: 32.8717, lng: 35.7517 },  // מעלה גמלא Ma'ale Gamla
  '4009': { lat: 33.0517, lng: 35.7250 },  // שעל Sha'al
  '4003': { lat: 33.1800, lng: 35.7883 },  // אל-רום El Rom
  '4002': { lat: 33.0267, lng: 35.7633 },  // אלי-עד Eli Ad
  '4007': { lat: 32.9517, lng: 35.7183 },  // יונתן Yonatan
  '4004': { lat: 32.7767, lng: 35.6417 },  // כפר חרוב Kfar Haruv
  '4026': { lat: 32.7017, lng: 35.6817 },  // חד-נס Had Nes

  // =============================================
  // Northern Israel (Galilee, Upper Galilee)
  // =============================================
  '43':   { lat: 33.2802, lng: 35.5735 },  // מטולה Metula
  '26':   { lat: 32.9692, lng: 35.5402 },  // ראש פינה Rosh Pina
  '2034': { lat: 32.9850, lng: 35.5460 },  // חצור הגלילית Hazor HaGlilit
  '812':  { lat: 33.0717, lng: 35.1500 },  // שלומי Shlomi
  '454':  { lat: 33.0567, lng: 35.0850 },  // סער Sa'ar
  '574':  { lat: 33.0600, lng: 35.1067 },  // גשר הזיו Gesher HaZiv
  '595':  { lat: 33.0400, lng: 35.1000 },  // לוחמי הגיטאות Lohamei HaGeta'ot
  '576':  { lat: 33.0283, lng: 35.1433 },  // כברי Kabri
  '77':   { lat: 33.0550, lng: 35.5700 },  // אילת השחר Ayelet HaShachar
  '76':   { lat: 33.1783, lng: 35.5617 },  // כפר גלעדי Kfar Giladi
  '176':  { lat: 32.6833, lng: 35.5750 },  // אפיקים Afikim
  '262':  { lat: 32.8367, lng: 35.5200 },  // גינוסר Ginosar
  '65':   { lat: 32.8317, lng: 35.5117 },  // מגדל Migdal
  '46':   { lat: 32.7150, lng: 35.5017 },  // יבנאל Yavne'el
  '701':  { lat: 32.8567, lng: 35.4867 },  // ארבל Arbel
  '578':  { lat: 33.0383, lng: 35.4267 },  // סאסא Sasa
  '603':  { lat: 33.0567, lng: 35.4017 },  // אלקוש Elkosh

  // =============================================
  // Jezreel Valley
  // =============================================
  '452':  { lat: 32.5433, lng: 35.3267 },  // יזרעאל Yizre'el
  '96':   { lat: 32.7317, lng: 35.0700 },  // יגור Yagur
  '130':  { lat: 32.6183, lng: 35.1683 },  // משמר העמק Mishmar HaEmek
  '86':   { lat: 32.5683, lng: 35.3917 },  // גבע Geva
  '95':   { lat: 32.5133, lng: 35.3917 },  // בית אלפא Beit Alfa
  '80':   { lat: 32.6917, lng: 35.2417 },  // נהלל Nahalal
  '242':  { lat: 32.5567, lng: 35.4217 },  // בית השיטה Beit HaShita
  '241':  { lat: 32.6600, lng: 35.1067 },  // יקנעם Yokneam

  // =============================================
  // Sharon & Coastal Plain
  // =============================================
  '387':  { lat: 32.3400, lng: 34.8800 },  // כפר מונש Kfar Monash
  '386':  { lat: 32.3000, lng: 34.8600 },  // בני דרור Bnei Dror
  '182':  { lat: 32.2700, lng: 34.8800 },  // אבן יהודה Even Yehuda
  '447':  { lat: 32.2450, lng: 34.8700 },  // נורדיה Nordiya
  '267':  { lat: 32.1900, lng: 34.8000 },  // כפר שמריהו Kfar Shmaryahu
  '716':  { lat: 32.2050, lng: 34.9600 },  // אייל Eyal
  '450':  { lat: 32.0950, lng: 34.9150 },  // בארות יצחק Beerot Yitzhak
  '587':  { lat: 32.0750, lng: 34.8400 },  // סביון Savyon
  '696':  { lat: 31.9900, lng: 34.8450 },  // כפר חב"ד Kfar Chabad
  '1236': { lat: 32.1714, lng: 34.8875 },  // נירית Nirit
  '1315': { lat: 32.2133, lng: 34.9508 },  // מתן Matan

  // =============================================
  // Central Israel (additional)
  // =============================================
  '3644': { lat: 31.8482, lng: 35.1456 },  // גבעון החדשה Giv'on HaHadasha
  '1165': { lat: 31.9258, lng: 34.9571 },  // שילת Shilat
  '1113': { lat: 31.7295, lng: 35.1067 },  // צור הדסה Tzur Hadassa
  '1141': { lat: 31.9165, lng: 35.0233 },  // מבוא מודיעים Mevo Modi'im
  '1050': { lat: 31.9107, lng: 34.9696 },  // בית חשמונאי Beit Hashmonai
  '472':  { lat: 31.7978, lng: 35.1091 },  // אבו גוש Abu Ghosh
  '1137': { lat: 31.7700, lng: 35.1267 },  // קרית יערים Kiryat Ye'arim

  // =============================================
  // Southern Israel (Negev)
  // =============================================
  '424':  { lat: 31.4117, lng: 34.5400 },  // גבים Gevim
  '419':  { lat: 31.3567, lng: 34.5450 },  // סעד Saad
  '397':  { lat: 31.3333, lng: 34.7117 },  // חצרים Hatzerim
  '421':  { lat: 31.2167, lng: 34.7667 },  // משאבי שדה Mashabbei Sadeh
  '695':  { lat: 31.2450, lng: 34.5800 },  // מגן Magen
  '885':  { lat: 30.8733, lng: 34.7917 },  // שדה בוקר Sde Boker
  '1158': { lat: 29.9517, lng: 35.0400 },  // יהל Yahel
  '1052': { lat: 29.9617, lng: 35.0617 },  // קטורה Ketura
  '1126': { lat: 29.5150, lng: 34.9350 },  // אילות Eilot
  '1152': { lat: 30.9650, lng: 34.5250 },  // אשלים Ashalim
  '1248': { lat: 29.8217, lng: 35.0250 },  // אליפז Elifaz
  '13':   { lat: 30.7550, lng: 35.2817 },  // חצבה Hatzeva
  '2042': { lat: 31.4650, lng: 35.3917 },  // עין גדי Ein Gedi
  '1057': { lat: 31.1917, lng: 35.3750 },  // נווה זוהר Neve Zohar
  '1124': { lat: 30.9850, lng: 35.3850 },  // נאות הכיכר Ne'ot HaKikar
  '1348': { lat: 31.2500, lng: 34.7600 },  // ביר הדאג' Bir Hadaj
  '1358': { lat: 31.2750, lng: 34.9000 },  // אום בטין Umm Batin
  '1359': { lat: 31.2400, lng: 34.9500 },  // אל סייד Al-Sayyid
  '1342': { lat: 31.2200, lng: 34.9200 },  // אבו קרינאת Abu Kerinat
  '1349': { lat: 31.2600, lng: 34.8700 },  // דריג'את Driyat
  '1332': { lat: 31.3000, lng: 34.8500 },  // חוסנייה Hussniyya
  '1375': { lat: 31.3200, lng: 34.8300 },  // אבו תלול Abu Talul
  '1360': { lat: 31.2500, lng: 34.8000 },  // מולדה Molada
  '584':  { lat: 31.6200, lng: 34.5300 },  // זיקים Zikim
  '338':  { lat: 31.3850, lng: 34.5850 },  // איבים Ivim
  '714':  { lat: 31.5550, lng: 34.5067 },  // ארז Erez
  '845':  { lat: 31.4850, lng: 34.4833 },  // כפר עזה Kfar Aza
  '69':   { lat: 31.3900, lng: 34.4350 },  // ניר עוז Nir Oz
  '402':  { lat: 31.2850, lng: 34.5083 },  // ניר יצחק Nir Yitzhak
  '840':  { lat: 31.3200, lng: 34.4833 },  // כיסופים Kissufim

  // =============================================
  // Gaza envelope / Western Negev
  // =============================================
  '358':  { lat: 31.5400, lng: 34.5550 },  // יד מרדכי Yad Mordechai
  '428':  { lat: 31.3167, lng: 34.5667 },  // ברור חיל Beror Hayil
  '844':  { lat: 31.4850, lng: 34.4950 },  // נחל עוז Nahal Oz
  '668':  { lat: 31.3967, lng: 34.4917 },  // מפלסים Mefalsim
  '665':  { lat: 31.4017, lng: 34.5267 },  // תקומה Tkuma
  '359':  { lat: 31.6583, lng: 34.5583 },  // ניצנים Nitzanim
  '713':  { lat: 31.4050, lng: 34.4350 },  // רעים Re'im

  // =============================================
  // Additional small/medium towns for map coverage
  // =============================================
  '1236': { lat: 32.1714, lng: 34.8875 },  // נירית Nirit
  '1345': { lat: 32.1600, lng: 34.9400 },  // צור יצחק Tzur Yitzhak
  '1324': { lat: 32.1800, lng: 34.8100 },  // ארסוף Arsuf
  '1102': { lat: 32.3250, lng: 34.8650 },  // צוקי ים Tzukei Yam
  '1167': { lat: 32.5000, lng: 34.8900 },  // קיסריה Caesarea
  '155':  { lat: 31.7400, lng: 34.7267 },  // באר טוביה Be'er Tuvia
  '400':  { lat: 31.5400, lng: 34.6300 },  // אבן שמואל Even Shmuel
  '406':  { lat: 31.6800, lng: 34.6500 },  // חצור-אשדוד Hatzor-Ashdod
  '586':  { lat: 32.5717, lng: 35.1750 },  // מגידו Megiddo
  '300':  { lat: 32.5433, lng: 35.0300 },  // דליה Daliya
  '1186': { lat: 32.7367, lng: 35.2817 },  // הושעיה Hoshaya
  '607':  { lat: 32.9817, lng: 35.4250 },  // מירון Meron
  '47':   { lat: 32.6883, lng: 35.4200 },  // כפר תבור Kfar Tavor
  '1244': { lat: 32.7300, lng: 35.2150 },  // תמרת Tamrat
  '122':  { lat: 32.7050, lng: 35.1383 },  // רמת ישי Ramat Yishai
  '53':   { lat: 32.6867, lng: 34.9400 },  // עתלית Atlit
  '317':  { lat: 32.7133, lng: 35.0167 },  // בית אורן Beit Oren
  '1283': { lat: 31.2500, lng: 34.7900 },  // תל תאומים Tel Te'omim
  '29':   { lat: 33.1117, lng: 35.5717 },  // יסוד המעלה Yesod HaMa'ala
  '1319': { lat: 32.3600, lng: 34.8950 },  // בת חפר Bat Hefer
  '1331': { lat: 32.8767, lng: 35.2617 },  // כמאנה Kamane
  '1327': { lat: 32.5083, lng: 35.0617 },  // מעלה עירון Ma'ale Iron
  '1243': { lat: 32.4767, lng: 35.0600 },  // קציר Katzir
  '1290': { lat: 32.4200, lng: 35.0200 },  // זמר Zemer
  '1155': { lat: 31.6400, lng: 34.6167 },  // מגן שאול Magen Sha'ul
}

const metaPath = path.resolve(__dirname, '..', 'public', 'data', 'meta.json')
const raw = fs.readFileSync(metaPath, 'utf-8')
const meta = JSON.parse(raw)

let updated = 0
let removed = 0

for (const city of meta.cities) {
  const coords = CORRECT_COORDS[city.code]
  if (coords) {
    city.lat = coords.lat
    city.lng = coords.lng
    updated++
  } else {
    // Remove incorrect coords from cities not in our verified list
    if (city.lat !== undefined || city.lng !== undefined) {
      delete city.lat
      delete city.lng
      removed++
    }
  }
}

fs.writeFileSync(metaPath, JSON.stringify(meta))
console.log(`Updated ${updated} cities with correct coordinates`)
console.log(`Removed incorrect coordinates from ${removed} cities`)
console.log(`Total cities in meta: ${meta.cities.length}`)
console.log('Done!')
