// Abdest ve namaz rehberi içeriği (Hanefî mezhebi, Diyanet İlmihali esas alınmıştır).
// Metinler Türkçe ve İngilizce; diğer dillerde İngilizce gösterilir.

export type Persona = 'erkek' | 'kadin' | 'erkekCocuk' | 'kizCocuk';
export const PERSONAS: Persona[] = ['erkek', 'kadin', 'erkekCocuk', 'kizCocuk'];
export type GuideLang = 'tr' | 'en';

const isFemale = (p: Persona) => p === 'kadin' || p === 'kizCocuk';
const isKid = (p: Persona) => p === 'erkekCocuk' || p === 'kizCocuk';

export type DuaKey = 'subhaneke' | 'tahiyyat' | 'salli' | 'barik' | 'rabbena' | 'rabbenagfirli' | 'kunut1' | 'kunut2';

export type Step = {
  title: string;
  text: string;
  /** assets/rehber içindeki görsel */
  image?: number;
  /** Bu adımda okunanlar */
  read?: (DuaKey | { surah: number; label: string })[];
  /** Kısa vurgu (ör. erkek/kadın farkı) */
  note?: string;
};

type L = Record<GuideLang, string>;
const pick = (l: L, lang: GuideLang) => l[lang];

// ---------- Görseller ----------
// require() derleme anında çözülmeli; bu yüzden tüm görseller burada tek tek listelenir.
const IMG = {
  'abdest-erkek': [
    require('../../assets/rehber/abdest-erkek-1.webp'),
    require('../../assets/rehber/abdest-erkek-2.webp'),
    require('../../assets/rehber/abdest-erkek-3.webp'),
    require('../../assets/rehber/abdest-erkek-4.webp'),
    require('../../assets/rehber/abdest-erkek-5.webp'),
    require('../../assets/rehber/abdest-erkek-6.webp'),
    require('../../assets/rehber/abdest-erkek-7.webp'),
    require('../../assets/rehber/abdest-erkek-8.webp'),
    require('../../assets/rehber/abdest-erkek-9.webp'),
  ],
  'abdest-kadin': [
    require('../../assets/rehber/abdest-kadin-1.webp'),
    require('../../assets/rehber/abdest-kadin-2.webp'),
    require('../../assets/rehber/abdest-kadin-3.webp'),
    require('../../assets/rehber/abdest-kadin-4.webp'),
    require('../../assets/rehber/abdest-kadin-5.webp'),
    require('../../assets/rehber/abdest-kadin-6.webp'),
    require('../../assets/rehber/abdest-kadin-7.webp'),
    require('../../assets/rehber/abdest-kadin-8.webp'),
    require('../../assets/rehber/abdest-kadin-9.webp'),
  ],
  'namaz-erkek': [
    require('../../assets/rehber/namaz-erkek-1.webp'),
    require('../../assets/rehber/namaz-erkek-2.webp'),
    require('../../assets/rehber/namaz-erkek-3.webp'),
    require('../../assets/rehber/namaz-erkek-4.webp'),
    require('../../assets/rehber/namaz-erkek-5.webp'),
    require('../../assets/rehber/namaz-erkek-6.webp'),
  ],
  'namaz-kadin': [
    require('../../assets/rehber/namaz-kadin-1.webp'),
    require('../../assets/rehber/namaz-kadin-2.webp'),
    require('../../assets/rehber/namaz-kadin-3.webp'),
    require('../../assets/rehber/namaz-kadin-4.webp'),
    require('../../assets/rehber/namaz-kadin-5.webp'),
    require('../../assets/rehber/namaz-kadin-6.webp'),
  ],
  'namaz-erkek-cocuk': [
    require('../../assets/rehber/namaz-erkek-cocuk-1.webp'),
    require('../../assets/rehber/namaz-erkek-cocuk-2.webp'),
    require('../../assets/rehber/namaz-erkek-cocuk-3.webp'),
    require('../../assets/rehber/namaz-erkek-cocuk-4.webp'),
    require('../../assets/rehber/namaz-erkek-cocuk-5.webp'),
    require('../../assets/rehber/namaz-erkek-cocuk-6.webp'),
  ],
  'namaz-kiz-cocuk': [
    require('../../assets/rehber/namaz-kiz-cocuk-1.webp'),
    require('../../assets/rehber/namaz-kiz-cocuk-2.webp'),
    require('../../assets/rehber/namaz-kiz-cocuk-3.webp'),
    require('../../assets/rehber/namaz-kiz-cocuk-4.webp'),
    require('../../assets/rehber/namaz-kiz-cocuk-5.webp'),
    require('../../assets/rehber/namaz-kiz-cocuk-6.webp'),
  ],
} as const;

export function abdestImage(p: Persona, n: number) {
  return IMG[isFemale(p) ? 'abdest-kadin' : 'abdest-erkek'][n - 1];
}

export function namazImage(p: Persona, n: number) {
  const key =
    p === 'erkek' ? 'namaz-erkek' : p === 'kadin' ? 'namaz-kadin' : p === 'erkekCocuk' ? 'namaz-erkek-cocuk' : 'namaz-kiz-cocuk';
  return IMG[key][n - 1];
}

// ---------- Abdest ----------

export function abdestIntro(p: Persona, lang: GuideLang) {
  if (isKid(p))
    return pick(
      {
        tr: 'Abdest, namazdan önce Allah’ın huzuruna temiz çıkmak için aldığımız güzel bir temizliktir. Suyu israf etmeden, sağ taraftan başlayarak her adımı sırayla yap.',
        en: 'Wudu is the special washing we do before prayer so that we stand before Allah clean. Use water carefully, start with the right side and follow the steps in order.',
      },
      lang,
    );
  return pick(
    {
      tr: 'Abdestin farzları dörttür: yüzü yıkamak, kolları dirseklerle birlikte yıkamak, başın dörtte birini meshetmek ve ayakları topuklarla birlikte yıkamak. Diğer adımlar sünnettir; tamamını sırasıyla yapmak abdesti sünnete uygun ve eksiksiz kılar.',
      en: 'Wudu has four obligatory parts (Hanafi): washing the face, washing the arms including the elbows, wiping a quarter of the head and washing the feet including the ankles. The other steps are sunnah; doing all of them in order makes your wudu complete.',
    },
    lang,
  );
}

export function abdestSteps(p: Persona, lang: GuideLang): Step[] {
  const f = isFemale(p);
  const k = isKid(p);
  const s = (tr: string, en: string) => (lang === 'tr' ? tr : en);
  return [
    {
      image: 1,
      title: s('Niyet ve Besmele', 'Intention and Bismillah'),
      text: k
        ? s('İçinden “Allah rızası için abdest almaya” diye niyet et ve “Bismillâhirrahmânirrahîm” de.', 'Say in your heart “I intend to make wudu for Allah” and say “Bismillahir-rahmanir-rahim”.')
        : s(
            '“Niyet ettim Allah rızası için abdest almaya” diye niyet edilir, Eûzü-Besmele çekilir. Varsa yüzük oynatılır; kadınlar ojeyi abdestten önce çıkarmalıdır, çünkü suyun tırnağa ulaşmasını engeller.',
            'Make the intention “I intend to perform wudu for the sake of Allah” and say the ta‘awwudh and basmala. Move any ring so water reaches beneath it; nail polish must be removed beforehand because it stops water reaching the nails.',
          ),
    },
    {
      image: 2,
      title: s('Elleri yıkamak', 'Washing the hands'),
      text: s(
        k
          ? 'Ellerini bileklere kadar üç kere yıka. Parmak aralarını da ovmayı unutma.'
          : 'Eller bileklere kadar üç kere yıkanır, parmak araları hilallenir (ovulur).',
        k
          ? 'Wash your hands up to the wrists three times. Don’t forget between your fingers.'
          : 'Wash the hands up to the wrists three times, running the fingers through each other.',
      ),
    },
    {
      image: 3,
      title: s('Ağza su vermek', 'Rinsing the mouth'),
      text: s(
        'Sağ avuçla ağza üç kere su alınıp her seferinde çalkalanır.',
        'Take water into the mouth with the right hand three times, rinsing it each time.',
      ),
    },
    {
      image: 4,
      title: s('Burna su vermek', 'Rinsing the nose'),
      text: s(
        'Sağ elle burna üç kere su çekilir, sol elle temizlenir.',
        'Sniff water into the nose with the right hand three times and clean it with the left hand.',
      ),
    },
    {
      image: 5,
      title: s('Yüzü yıkamak', 'Washing the face'),
      text: s(
        k
          ? 'Yüzünü alnından çenene, bir kulağından diğer kulağına kadar üç kere yıka.'
          : 'Yüz; alında saçların bittiği yerden çene altına, bir kulak yumuşağından diğerine kadar üç kere yıkanır.' +
              (f ? ' Başörtüsü alından biraz geri itilerek suyun saç bitimine ulaşması sağlanır.' : ' Sakal varsa parmaklarla hilallenir.'),
        k
          ? 'Wash your face from your forehead to your chin and from ear to ear, three times.'
          : 'Wash the face three times, from the hairline to below the chin and from one earlobe to the other.' +
              (f ? ' Push the headscarf back a little so water reaches the hairline.' : ' Run wet fingers through the beard.'),
      ),
    },
    {
      image: 6,
      title: s('Kolları yıkamak', 'Washing the arms'),
      text: s(
        'Önce sağ, sonra sol kol dirseklerle birlikte üç kere yıkanır. Dirsekler mutlaka yıkanmalıdır.',
        'Wash the right arm, then the left, up to and including the elbows, three times each.',
      ),
    },
    {
      image: 7,
      title: s('Başı meshetmek', 'Wiping the head'),
      text: s(
        f
          ? 'Eller ıslatılıp başın en az dörtte biri meshedilir. Mesh saçın üzerine yapılmalıdır; başörtüsü üzerine yapılan mesh geçerli değildir.'
          : 'Eller ıslatılıp başın en az dörtte biri meshedilir. Takke veya şapka varsa çıkarılır; mesh doğrudan saça yapılır.',
        f
          ? 'Wet the hands and wipe at least a quarter of the head. The wiping must touch the hair; wiping over the headscarf is not valid.'
          : 'Wet the hands and wipe at least a quarter of the head. Take off any cap; the wiping must touch the hair.',
      ),
    },
    {
      image: 8,
      title: s('Kulak ve enseyi meshetmek', 'Wiping the ears and neck'),
      text: s(
        'Islak şehadet parmaklarıyla kulakların içi, başparmaklarla arkası meshedilir. Serçe parmaklar dışındaki parmakların dış yüzüyle ense meshedilir.',
        'With wet index fingers wipe inside the ears and with the thumbs behind them. Then wipe the back of the neck with the backs of the fingers.',
      ),
    },
    {
      image: 9,
      title: s('Ayakları yıkamak', 'Washing the feet'),
      text: s(
        'Önce sağ, sonra sol ayak topuklarla birlikte üç kere yıkanır; sol elin serçe parmağıyla ayak parmaklarının arası hilallenir.' +
          (k ? '' : ' Abdestten sonra kelime-i şehadet getirilir.'),
        'Wash the right foot, then the left, including the ankles, three times, cleaning between the toes with the little finger of the left hand.' +
          (k ? '' : ' After wudu recite the shahada.'),
      ),
    },
  ];
}

export function abdestBreakers(lang: GuideLang) {
  return lang === 'tr'
    ? [
        'Önden veya arkadan bir şey çıkması (idrar, dışkı, yel)',
        'Vücuttan kan, irin gibi akıcı bir şeyin çıkıp akması',
        'Ağız dolusu kusmak',
        'Uyumak (bir yere dayanarak veya yatarak)',
        'Bayılmak, sarhoş olmak',
        'Namazda yanındakinin duyacağı kadar gülmek',
      ]
    : [
        'Anything leaving the front or back passage (urine, stool, wind)',
        'Blood, pus or another fluid flowing out of the body',
        'Vomiting a mouthful',
        'Sleeping while lying down or leaning',
        'Fainting or intoxication',
        'Laughing aloud during prayer',
      ];
}

// ---------- Namaz ----------

export function namazIntro(p: Persona, lang: GuideLang) {
  const f = isFemale(p);
  if (isKid(p))
    return lang === 'tr'
      ? 'Namaz, Allah ile konuşmamızdır. Peygamber Efendimiz (s.a.v.) çocukların yedi yaşından itibaren namaza alıştırılmasını tavsiye etmiştir. Aşağıda iki rekâtlık bir namazı adım adım öğrenebilirsin. Henüz bütün duaları bilmiyorsan üzülme; öğrendikçe eklersin.'
      : 'Prayer is how we talk to Allah. The Prophet ﷺ advised that children start getting used to prayer from the age of seven. Below you can learn a two-rak‘ah prayer step by step. If you don’t know all the prayers yet, don’t worry; add them as you learn.';
  return lang === 'tr'
    ? `Namazdan önce: abdestli olmak, beden-elbise-namaz yerinin temiz olması, ${
        f ? 'yüz, eller ve ayaklar dışında bütün bedenin örtülmesi' : 'en az göbek ile diz kapağı arasının örtülmesi'
      }, kıbleye yönelmek, vaktin girmiş olması ve niyet etmek gerekir. Aşağıda iki rekâtlık bir namaz (ör. sabah namazının farzı) adım adım anlatılmıştır.`
    : `Before prayer you need: wudu, a clean body, clothes and place, ${
        f ? 'covering the whole body except the face, hands and feet' : 'covering at least from the navel to the knees'
      }, facing the qibla, the time having begun, and the intention. Below is a two-rak‘ah prayer (e.g. the fard of Fajr) step by step.`;
}

export function namazSteps(p: Persona, lang: GuideLang): Step[] {
  const f = isFemale(p);
  const k = isKid(p);
  const s = (tr: string, en: string) => (lang === 'tr' ? tr : en);
  const fatiha = { surah: 1, label: s('Fâtiha', 'Al-Fatiha') };
  const zamm = { surah: 112, label: s('Zamm-ı sûre (ör. İhlâs)', 'A short surah (e.g. Al-Ikhlas)') };
  return [
    {
      image: 1,
      title: s('Niyet ve iftitah tekbiri', 'Intention and opening takbir'),
      text: s(
        `Kıbleye dönülür, ayaklar arasında dört parmak kadar açıklık bırakılır. “Niyet ettim Allah rızası için bugünkü sabah namazının farzını kılmaya” diye niyet edilir. ${
          f
            ? 'Eller omuz hizasına kaldırılır, avuç içleri kıbleye bakar.'
            : 'Eller kulak hizasına kaldırılır; başparmaklar kulak yumuşağına değer, avuç içleri kıbleye bakar.'
        } “Allâhü Ekber” denir.`,
        `Face the qibla with the feet about four fingers apart. Make the intention, e.g. “I intend to pray today’s fard of Fajr for Allah”. ${
          f
            ? 'Raise the hands to shoulder level, palms facing the qibla,'
            : 'Raise the hands to the ears, thumbs touching the earlobes, palms facing the qibla,'
        } and say “Allahu Akbar”.`,
      ),
      note: k ? undefined : f ? s('Kadınlar elleri omuz hizasına kaldırır.', 'Women raise the hands to the shoulders.') : s('Erkekler elleri kulak hizasına kaldırır.', 'Men raise the hands to the ears.'),
    },
    {
      image: 2,
      title: s('Kıyam', 'Standing (qiyam)'),
      text: s(
        `${
          f
            ? 'Eller göğüs üzerine konur, sağ el sol elin üstüne gelir.'
            : 'Eller göbek altında bağlanır; sağ elin başparmağı ve serçe parmağıyla sol bilek kavranır.'
        } Gözler secde yerine bakar. Sırasıyla Sübhâneke, Eûzü-Besmele, Fâtiha ve kısa bir sûre okunur.`,
        `${
          f
            ? 'Place the hands on the chest, the right hand over the left.'
            : 'Fold the hands below the navel, holding the left wrist with the thumb and little finger of the right hand.'
        } Look at the place of prostration. Recite Subhanaka, the ta‘awwudh and basmala, Al-Fatiha and a short surah.`,
      ),
      read: ['subhaneke', fatiha, zamm],
    },
    {
      image: 3,
      title: s('Rükû', 'Bowing (ruku‘)'),
      text: s(
        `“Allâhü Ekber” diyerek eğilinir. ${
          f
            ? 'Kadınlar sırtı tam düz yapmadan biraz eğilir, parmaklar bitişik olarak eller dizlere konur.'
            : 'Sırt ve baş düz bir çizgide olur, parmaklar açık olarak dizler kavranır.'
        } Üç kere “Sübhâne Rabbiye’l-azîm” denir. “Semiallâhü limen hamideh” diyerek doğrulunur, ayakta “Rabbenâ leke’l-hamd” denir.`,
        `Say “Allahu Akbar” and bow. ${
          f
            ? 'Women bow slightly, placing the hands on the knees with the fingers together.'
            : 'Keep the back and head level, gripping the knees with the fingers spread.'
        } Say “Subhana Rabbiyal-‘Azim” three times. Rise saying “Sami‘allahu liman hamidah” and, standing, “Rabbana lakal-hamd”.`,
      ),
    },
    {
      image: 4,
      title: s('Secde', 'Prostration (sujud)'),
      text: s(
        `“Allâhü Ekber” diyerek önce dizler, sonra eller, sonra burun ve alın yere konur. ${
          f
            ? 'Kadınlar kollarını yanlarına bitiştirir, karnını uyluklarına yaklaştırır, kollarını yere yakın tutar.'
            : 'Erkekler kollarını yanlarından ayırır, dirseklerini yerden kaldırır, karnını uyluklarından uzak tutar.'
        } Ayak parmakları kıbleye döner. Üç kere “Sübhâne Rabbiye’l-a’lâ” denir. “Allâhü Ekber” ile oturulur, kısa bir süre durulur ve aynı şekilde ikinci secde yapılır.`,
        `Saying “Allahu Akbar”, place the knees, then the hands, then the nose and forehead on the ground. ${
          f
            ? 'Women keep the arms close to the sides and the belly near the thighs.'
            : 'Men keep the arms away from the sides, elbows off the ground and the belly away from the thighs.'
        } Toes point toward the qibla. Say “Subhana Rabbiyal-A‘la” three times. Sit up with “Allahu Akbar”, pause briefly and make the second prostration the same way.`,
      ),
      note: k ? undefined : f ? s('Kadınlar secdede toplu durur.', 'Women stay compact in sujud.') : s('Erkekler dirseklerini yerden kaldırır.', 'Men keep the elbows raised.'),
    },
    {
      title: s('İkinci rekât', 'Second rak‘ah'),
      text: s(
        '“Allâhü Ekber” diyerek ayağa kalkılır, eller bağlanır. Bu sefer Sübhâneke okunmaz; Besmele, Fâtiha ve bir sûre okunur. Birinci rekâttaki gibi rükû ve iki secde yapılır.',
        'Stand up saying “Allahu Akbar” and fold the hands. This time Subhanaka is not recited: say the basmala, Al-Fatiha and a surah, then bow and make two prostrations as before.',
      ),
      read: [fatiha, { surah: 108, label: s('Zamm-ı sûre (ör. Kevser)', 'A short surah (e.g. Al-Kawthar)') }],
    },
    {
      image: 5,
      title: s('Oturuş (ka‘de)', 'Sitting (qa‘dah)'),
      text: s(
        `${
          f
            ? 'Kadınlar sol kalçaları üzerine oturur, ayaklarını sağ taraftan dışarı çıkarır.'
            : 'Erkekler sol ayağını yatırıp üzerine oturur, sağ ayağını dikerek parmaklarını kıbleye çevirir.'
        } Eller uylukların üzerine konur. Ettehiyyâtü, Allâhümme salli, Allâhümme bârik ve Rabbenâ duaları okunur.`,
        `${
          f
            ? 'Women sit on the left hip with both feet out to the right side.'
            : 'Men sit on the left foot laid flat, keeping the right foot upright with the toes toward the qibla.'
        } The hands rest on the thighs. Recite At-Tahiyyat, Allahumma salli, Allahumma barik and the Rabbana prayers.`,
      ),
      read: ['tahiyyat', 'salli', 'barik', 'rabbena', 'rabbenagfirli'],
    },
    {
      image: 6,
      title: s('Selam', 'Salam'),
      text: s(
        'Baş önce sağa çevrilerek “Esselâmü aleyküm ve rahmetullâh”, sonra sola çevrilerek aynı söz söylenir. Namaz tamamlanmış olur.',
        'Turn the head to the right saying “As-salamu ‘alaykum wa rahmatullah”, then to the left saying the same. The prayer is complete.',
      ),
    },
  ];
}

export function namazExtraNotes(lang: GuideLang) {
  return lang === 'tr'
    ? [
        'Üç ve dört rekâtlık namazlarda ikinci rekâttan sonraki ilk oturuşta yalnızca Ettehiyyâtü okunur ve ayağa kalkılır.',
        'Farz namazların üçüncü ve dördüncü rekâtlarında yalnızca Fâtiha okunur; sünnetlerde Fâtiha’dan sonra sûre de okunur.',
        'Vitir namazının üçüncü rekâtında rükûdan önce “Allâhü Ekber” denip eller kaldırılır, tekrar bağlanır ve Kunut duaları okunur.',
        'Bu rehber Hanefî mezhebine göre hazırlanmıştır.',
      ]
    : [
        'In three- and four-rak‘ah prayers, at the first sitting after the second rak‘ah only At-Tahiyyat is recited, then you stand up.',
        'In the third and fourth rak‘ahs of fard prayers only Al-Fatiha is recited; in sunnah prayers a surah follows it.',
        'In the third rak‘ah of Witr, before bowing, say “Allahu Akbar” raising the hands, fold them again and recite the Qunut prayers.',
        'This guide follows the Hanafi school.',
      ];
}

/** Vakitlerin rekât sayıları (Hanefî) */
export const REKATLAR: { key: 'sabah' | 'ogle' | 'ikindi' | 'aksam' | 'yatsi'; parts: { kind: 'sunnet' | 'farz' | 'vitir'; n: number }[] }[] = [
  { key: 'sabah', parts: [{ kind: 'sunnet', n: 2 }, { kind: 'farz', n: 2 }] },
  { key: 'ogle', parts: [{ kind: 'sunnet', n: 4 }, { kind: 'farz', n: 4 }, { kind: 'sunnet', n: 2 }] },
  { key: 'ikindi', parts: [{ kind: 'sunnet', n: 4 }, { kind: 'farz', n: 4 }] },
  { key: 'aksam', parts: [{ kind: 'farz', n: 3 }, { kind: 'sunnet', n: 2 }] },
  { key: 'yatsi', parts: [{ kind: 'sunnet', n: 4 }, { kind: 'farz', n: 4 }, { kind: 'sunnet', n: 2 }, { kind: 'vitir', n: 3 }] },
];

// ---------- Dualar ----------

export type Dua = { ar: string; tr: string; en: string; mTr: string; mEn: string; nameTr: string; nameEn: string };

export const DUALAR: Record<DuaKey, Dua> = {
  subhaneke: {
    nameTr: 'Sübhâneke',
    nameEn: 'Subhanaka',
    ar: 'سُبْحَانَكَ اللّٰهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالٰى جَدُّكَ وَلَا اِلٰهَ غَيْرُكَ',
    tr: 'Sübhâneke’llâhümme ve bi hamdik ve tebârekesmük ve teâlâ ceddük ve lâ ilâhe ğayrük.',
    en: 'Subhanakallahumma wa bihamdika wa tabarakasmuka wa ta‘ala jadduka wa la ilaha ghairuk.',
    mTr: 'Allah’ım! Sen eksik sıfatlardan pak ve uzaksın. Seni daima böyle tenzih eder ve överim. Senin adın mübarektir. Varlığın her şeyden üstündür. Senden başka ilah yoktur.',
    mEn: 'Glory be to You, O Allah, and praise. Blessed is Your name and exalted is Your majesty. There is no god but You.',
  },
  tahiyyat: {
    nameTr: 'Ettehiyyâtü',
    nameEn: 'At-Tahiyyat',
    ar: 'اَلتَّحِيَّاتُ لِلّٰهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ اَلسَّلَامُ عَلَيْكَ اَيُّهَا النَّبِيُّ وَرَحْمَةُ اللّٰهِ وَبَرَكَاتُهُ اَلسَّلَامُ عَلَيْنَا وَعَلٰى عِبَادِ اللّٰهِ الصَّالِحِينَ اَشْهَدُ اَنْ لَا اِلٰهَ اِلَّا اللّٰهُ وَاَشْهَدُ اَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ',
    tr: 'Ettehiyyâtü lillâhi vessalevâtü vettayyibât. Esselâmü aleyke eyyühen-Nebiyyü ve rahmetullâhi ve berekâtüh. Esselâmü aleynâ ve alâ ibâdillâhis-sâlihîn. Eşhedü en lâ ilâhe illallâh ve eşhedü enne Muhammeden abdühû ve resûlüh.',
    en: 'At-tahiyyatu lillahi was-salawatu wat-tayyibat. As-salamu ‘alaika ayyuhan-Nabiyyu wa rahmatullahi wa barakatuh. As-salamu ‘alaina wa ‘ala ‘ibadillahis-salihin. Ash-hadu an la ilaha illallah, wa ash-hadu anna Muhammadan ‘abduhu wa rasuluh.',
    mTr: 'Bütün tazimler, dualar ve güzel sözler Allah’ındır. Ey Peygamber! Allah’ın selamı, rahmeti ve bereketleri senin üzerine olsun. Selam bizim üzerimize ve Allah’ın salih kulları üzerine olsun. Şahitlik ederim ki Allah’tan başka ilah yoktur ve yine şahitlik ederim ki Muhammed O’nun kulu ve elçisidir.',
    mEn: 'All greetings, prayers and good words are for Allah. Peace be upon you, O Prophet, and the mercy of Allah and His blessings. Peace be upon us and upon the righteous servants of Allah. I bear witness that there is no god but Allah, and I bear witness that Muhammad is His servant and messenger.',
  },
  salli: {
    nameTr: 'Allâhümme salli',
    nameEn: 'Allahumma salli',
    ar: 'اَللّٰهُمَّ صَلِّ عَلٰى مُحَمَّدٍ وَعَلٰى اٰلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلٰى اِبْرٰهِيمَ وَعَلٰى اٰلِ اِبْرٰهِيمَ اِنَّكَ حَمِيدٌ مَجِيدٌ',
    tr: 'Allâhümme salli alâ Muhammedin ve alâ âli Muhammed. Kemâ salleyte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
    en: 'Allahumma salli ‘ala Muhammadin wa ‘ala ali Muhammad, kama sallaita ‘ala Ibrahima wa ‘ala ali Ibrahim, innaka Hamidun Majid.',
    mTr: 'Allah’ım! İbrahim’e ve ailesine rahmet ettiğin gibi Muhammed’e ve ailesine de rahmet et. Şüphesiz sen övülmeye layıksın, şanı yücesin.',
    mEn: 'O Allah, send prayers upon Muhammad and the family of Muhammad as You sent prayers upon Ibrahim and the family of Ibrahim. You are Praiseworthy, Glorious.',
  },
  barik: {
    nameTr: 'Allâhümme bârik',
    nameEn: 'Allahumma barik',
    ar: 'اَللّٰهُمَّ بَارِكْ عَلٰى مُحَمَّدٍ وَعَلٰى اٰلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلٰى اِبْرٰهِيمَ وَعَلٰى اٰلِ اِبْرٰهِيمَ اِنَّكَ حَمِيدٌ مَجِيدٌ',
    tr: 'Allâhümme bârik alâ Muhammedin ve alâ âli Muhammed. Kemâ bârekte alâ İbrâhîme ve alâ âli İbrâhîm. İnneke hamîdün mecîd.',
    en: 'Allahumma barik ‘ala Muhammadin wa ‘ala ali Muhammad, kama barakta ‘ala Ibrahima wa ‘ala ali Ibrahim, innaka Hamidun Majid.',
    mTr: 'Allah’ım! İbrahim’e ve ailesine bereket verdiğin gibi Muhammed’e ve ailesine de bereket ver. Şüphesiz sen övülmeye layıksın, şanı yücesin.',
    mEn: 'O Allah, bless Muhammad and the family of Muhammad as You blessed Ibrahim and the family of Ibrahim. You are Praiseworthy, Glorious.',
  },
  rabbena: {
    nameTr: 'Rabbenâ âtinâ',
    nameEn: 'Rabbana atina',
    ar: 'رَبَّنَا اٰتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْاٰخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    tr: 'Rabbenâ âtinâ fid-dünyâ haseneten ve fil-âhirati haseneten ve kınâ azâben-nâr.',
    en: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina ‘adhaban-nar.',
    mTr: 'Rabbimiz! Bize dünyada da iyilik ver, ahirette de iyilik ver ve bizi cehennem azabından koru. (Bakara, 201)',
    mEn: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. (Al-Baqarah 2:201)',
  },
  rabbenagfirli: {
    nameTr: 'Rabbenâğfirlî',
    nameEn: 'Rabbanaghfir li',
    ar: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
    tr: 'Rabbenağfirlî ve li-vâlideyye ve lil-mü’minîne yevme yekûmül-hisâb.',
    en: 'Rabbanaghfir li wa li-walidayya wa lil-mu’minina yawma yaqumul-hisab.',
    mTr: 'Rabbimiz! Hesap gününde beni, anamı-babamı ve bütün müminleri bağışla. (İbrahim, 41)',
    mEn: 'Our Lord, forgive me, my parents and the believers on the Day the reckoning is established. (Ibrahim 14:41)',
  },
  kunut1: {
    nameTr: 'Kunut duası 1',
    nameEn: 'Qunut prayer 1',
    ar: 'اَللّٰهُمَّ اِنَّا نَسْتَعِينُكَ وَنَسْتَغْفِرُكَ وَنَسْتَهْدِيكَ وَنُؤْمِنُ بِكَ وَنَتُوبُ اِلَيْكَ وَنَتَوَكَّلُ عَلَيْكَ وَنُثْنِي عَلَيْكَ الْخَيْرَ كُلَّهُ نَشْكُرُكَ وَلَا نَكْفُرُكَ وَنَخْلَعُ وَنَتْرُكُ مَنْ يَفْجُرُكَ',
    tr: 'Allâhümme innâ nesteînüke ve nestağfirüke ve nestehdîk. Ve nü’minü bike ve netûbü ileyk. Ve netevekkelü aleyke ve nüsnî aleykel-hayra küllehû neşkürük. Ve lâ nekfürüke ve nahleu ve netrükü men yefcürük.',
    en: 'Allahumma inna nasta‘inuka wa nastaghfiruka wa nastahdik, wa nu’minu bika wa natubu ilaik, wa natawakkalu ‘alaika wa nuthni ‘alaikal-khaira kullahu nashkuruk, wa la nakfuruka wa nakhla‘u wa natruku man yafjuruk.',
    mTr: 'Allah’ım! Senden yardım isteriz, günahlarımızı bağışlamanı ister, rızana uygun olana hidayet etmeni dileriz. Sana inanır, sana tövbe eder, sana güveniriz. Bize verdiğin nimetleri bilerek seni hayır ile överiz. Sana şükrederiz, nankörlük etmeyiz. Sana karşı geleni bırakır ve ondan uzak dururuz.',
    mEn: 'O Allah, we seek Your help and forgiveness and ask You for guidance. We believe in You, turn to You in repentance and rely on You. We praise You for all good, we thank You and are not ungrateful, and we leave whoever disobeys You.',
  },
  kunut2: {
    nameTr: 'Kunut duası 2',
    nameEn: 'Qunut prayer 2',
    ar: 'اَللّٰهُمَّ اِيَّاكَ نَعْبُدُ وَلَكَ نُصَلِّي وَنَسْجُدُ وَاِلَيْكَ نَسْعٰى وَنَحْفِدُ نَرْجُو رَحْمَتَكَ وَنَخْشٰى عَذَابَكَ اِنَّ عَذَابَكَ بِالْكُفَّارِ مُلْحِقٌ',
    tr: 'Allâhümme iyyâke na’büdü ve leke nüsallî ve nescüdü ve ileyke nes’â ve nahfidü nercû rahmeteke ve nahşâ azâbek. İnne azâbeke bil-küffâri mülhık.',
    en: 'Allahumma iyyaka na‘budu wa laka nusalli wa nasjud, wa ilaika nas‘a wa nahfid, narju rahmataka wa nakhsha ‘adhabak, inna ‘adhabaka bil-kuffari mulhiq.',
    mTr: 'Allah’ım! Yalnız sana kulluk eder, yalnız senin için namaz kılar ve secde ederiz. Sana koşar ve sana yaklaşmaya çalışırız. Rahmetini umar, azabından korkarız. Şüphesiz senin azabın inkârcılara ulaşacaktır.',
    mEn: 'O Allah, You alone we worship, to You we pray and prostrate, to You we hasten and strive. We hope for Your mercy and fear Your punishment; surely Your punishment will reach the disbelievers.',
  },
};

export const DUA_ORDER: DuaKey[] = ['subhaneke', 'tahiyyat', 'salli', 'barik', 'rabbena', 'rabbenagfirli', 'kunut1', 'kunut2'];
