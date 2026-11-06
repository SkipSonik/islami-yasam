// Farz namazlardan sonra okunan tesbihat (Diyanet sırası).
export type TesbihatStep = {
  key: string;
  ar: string;
  tr: string;
  en: string;
  mTr: string;
  mEn: string;
  /** 0 = sayaçsız (bir kez okunur) */
  count: number;
  /** Kur'an'dan okunacaksa */
  quran?: { surah: number; ayah: number };
};

export const TESBIHAT: TesbihatStep[] = [
  {
    key: 'selam',
    ar: 'اَللّٰهُمَّ اَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْاِكْرَامِ',
    tr: 'Allâhümme ente’s-selâmü ve minke’s-selâm, tebârekte yâ ze’l-celâli ve’l-ikrâm.',
    en: 'Allahumma antas-salamu wa minkas-salam, tabarakta ya dhal-jalali wal-ikram.',
    mTr: 'Allah’ım! Sen selamsın, selamet sendendir. Ey celal ve ikram sahibi, sen ne yücesin!',
    mEn: 'O Allah, You are Peace and from You is peace. Blessed are You, O Possessor of majesty and honour.',
    count: 0,
  },
  {
    key: 'salavat',
    ar: 'اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى اٰلِ سَيِّدِنَا مُحَمَّدٍ',
    tr: 'Allâhümme salli alâ seyyidinâ Muhammedin ve alâ âli seyyidinâ Muhammed.',
    en: 'Allahumma salli ‘ala sayyidina Muhammadin wa ‘ala ali sayyidina Muhammad.',
    mTr: 'Allah’ım! Efendimiz Muhammed’e ve ailesine rahmet eyle.',
    mEn: 'O Allah, send blessings upon our master Muhammad and his family.',
    count: 0,
  },
  {
    key: 'kursi',
    ar: 'آيَةُ الْكُرْسِيِّ',
    tr: 'Âyete’l-Kürsî (Bakara, 255) okunur.',
    en: 'Recite Ayat al-Kursi (Al-Baqarah 2:255).',
    mTr: '“Allah, kendisinden başka ilah olmayandır. Diridir, kayyumdur…” Okumak için dokun.',
    mEn: '“Allah — there is no deity except Him, the Ever-Living, the Sustainer…” Tap to read.',
    count: 0,
    quran: { surah: 2, ayah: 255 },
  },
  {
    key: 'subhanallah',
    ar: 'سُبْحَانَ اللّٰهِ',
    tr: 'Sübhânallâh',
    en: 'Subhanallah',
    mTr: 'Allah’ı her türlü noksanlıktan tenzih ederim.',
    mEn: 'Glory be to Allah.',
    count: 33,
  },
  {
    key: 'elhamdulillah',
    ar: 'اَلْحَمْدُ لِلّٰهِ',
    tr: 'Elhamdülillâh',
    en: 'Alhamdulillah',
    mTr: 'Hamd Allah’a mahsustur.',
    mEn: 'All praise is due to Allah.',
    count: 33,
  },
  {
    key: 'allahuekber',
    ar: 'اَللّٰهُ اَكْبَرُ',
    tr: 'Allâhü ekber',
    en: 'Allahu akbar',
    mTr: 'Allah en büyüktür.',
    mEn: 'Allah is the Greatest.',
    count: 33,
  },
  {
    key: 'tehlil',
    ar: 'لَا اِلٰهَ اِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلٰى كُلِّ شَيْءٍ قَدِيرٌ',
    tr: 'Lâ ilâhe illallâhü vahdehû lâ şerîke leh, lehü’l-mülkü ve lehü’l-hamdü ve hüve alâ külli şey’in kadîr.',
    en: 'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa huwa ‘ala kulli shay’in qadir.',
    mTr: 'Allah’tan başka ilah yoktur. O tektir, ortağı yoktur. Mülk O’nundur, hamd O’na mahsustur. O her şeye kadirdir.',
    mEn: 'There is no god but Allah alone, with no partner. His is the dominion and His is the praise, and He has power over all things.',
    count: 0,
  },
];
