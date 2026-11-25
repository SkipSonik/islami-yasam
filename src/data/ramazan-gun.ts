import Constants from 'expo-constants';

import type { Lang } from '@/i18n';
import { createStore } from '@/lib/store';

// Ramazan gün sayfasının içeriği: iftar menüsü ve günün düşüncesi.
// Varsayılanlar uygulamanın içindedir. Yönetim panelinden (namazyolu.com/icerik/ramazan.json)
// yazılan menüler ve sözler uygulama güncellemesi gerekmeden bunların yerine geçer.
// Günün düşünceleri hadis ya da ayet iddiası taşımaz; yalnızca iyilik hatırlatmasıdır.

export const MENUS_TR = [
  'Mercimek çorbası · Etli türlü · Pilav · Cacık · Sütlaç',
  'Ezogelin çorbası · Tavuk sote · Bulgur pilavı · Mevsim salata · Revani',
  'Domates çorbası · Kuru fasulye · Pilav · Turşu · Kabak tatlısı',
  'Tarhana çorbası · Izgara köfte · Piyaz · Pilav · Güllaç',
  'Mercimek çorbası · Etli nohut · Pirinç pilavı · Cacık · Irmik helvası',
  'Yayla çorbası · Fırın tavuk · Patates · Çoban salata · Baklava',
  'Ezogelin çorbası · Karnıyarık · Pilav · Cacık · Sütlü irmik tatlısı',
  'Süzme mercimek çorbası · Etli bamya · Bulgur pilavı · Salata · Kemalpaşa',
  'Domates çorbası · Tavuklu pilav · Yoğurt · Havuç salatası · Aşure',
  'Tarhana çorbası · Etli kuru patlıcan dolması · Pilav · Cacık · Muhallebi',
  'Mercimek çorbası · Orman kebabı · Pilav · Mevsim salata · Elmalı kurabiye',
  'Ezogelin çorbası · Etli nohut · Pirinç pilavı · Cacık · Güllaç',
  'Yayla çorbası · Mantı · Sarımsaklı yoğurt · Salata · Sütlaç',
  'Mercimek çorbası · Kabak mücver · Fırın köfte · Pilav · Revani',
  'Domates çorbası · Etli taze fasulye · Bulgur pilavı · Cacık · Tulumba',
  'Tarhana çorbası · Tavuk haşlama · Pilav · Turşu · Kazandibi',
  'Ezogelin çorbası · Etli güveç · Pilav · Çoban salata · Baklava',
  'Mercimek çorbası · Biber dolması · Yoğurt · Pilav · Sütlü tatlı',
  'Süzme mercimek çorbası · Kuru fasulye · Pilav · Cacık · Kabak tatlısı',
  'Yayla çorbası · Hünkâr beğendi · Pilav · Salata · Güllaç',
  'Domates çorbası · Tavuk tantuni · Bulgur pilavı · Piyaz · İrmik helvası',
  'Ezogelin çorbası · Etli ıspanak · Pilav · Cacık · Sütlaç',
  'Mercimek çorbası · Kıymalı börek · Ayran · Mevsim salata · Revani',
  'Tarhana çorbası · İzmir köfte · Pilav · Turşu · Kemalpaşa',
  'Ezogelin çorbası · Etli nohut · Pirinç pilavı · Cacık · Güllaç',
  'Yayla çorbası · Tavuklu sebze güveci · Pilav · Salata · Muhallebi',
  'Mercimek çorbası · Dolma ve sarma · Yoğurt · Pilav · Baklava',
  'Domates çorbası · Etli patates · Bulgur pilavı · Cacık · Aşure',
  'Tarhana çorbası · Izgara tavuk · Pilav · Çoban salata · Sütlaç',
  'Ezogelin çorbası · Etli türlü · Pilav · Cacık · Bayram şekeri ile tatlı son',
];

export const MENUS_EN = [
  'Lentil soup · Meat and vegetable stew · Rice pilaf · Tzatziki · Rice pudding',
  'Ezogelin soup · Chicken sauté · Bulgur pilaf · Seasonal salad · Revani cake',
  'Tomato soup · White bean stew · Rice · Pickles · Pumpkin dessert',
  'Tarhana soup · Grilled meatballs · Bean salad · Rice · Güllaç',
  'Lentil soup · Chickpeas with meat · Rice pilaf · Tzatziki · Semolina halva',
  'Yogurt soup · Roast chicken · Potatoes · Shepherd salad · Baklava',
  'Ezogelin soup · Stuffed aubergine · Rice · Tzatziki · Semolina pudding',
  'Strained lentil soup · Okra with meat · Bulgur pilaf · Salad · Kemalpaşa dessert',
  'Tomato soup · Chicken rice · Yogurt · Carrot salad · Ashura pudding',
  'Tarhana soup · Dried aubergine dolma · Rice · Tzatziki · Milk pudding',
  'Lentil soup · Forest kebab · Rice · Seasonal salad · Apple cookies',
  'Ezogelin soup · Chickpeas with meat · Rice pilaf · Tzatziki · Güllaç',
  'Yogurt soup · Manti dumplings · Garlic yogurt · Salad · Rice pudding',
  'Lentil soup · Zucchini fritters · Baked meatballs · Rice · Revani cake',
  'Tomato soup · Green beans with meat · Bulgur pilaf · Tzatziki · Tulumba',
  'Tarhana soup · Boiled chicken · Rice · Pickles · Kazandibi',
  'Ezogelin soup · Meat casserole · Rice · Shepherd salad · Baklava',
  'Lentil soup · Stuffed peppers · Yogurt · Rice · Milk dessert',
  'Strained lentil soup · White bean stew · Rice · Tzatziki · Pumpkin dessert',
  'Yogurt soup · Hünkâr beğendi · Rice · Salad · Güllaç',
  'Tomato soup · Chicken tantuni · Bulgur pilaf · Bean salad · Semolina halva',
  'Ezogelin soup · Spinach with meat · Rice · Tzatziki · Rice pudding',
  'Lentil soup · Minced-meat börek · Ayran · Seasonal salad · Revani cake',
  'Tarhana soup · İzmir meatballs · Rice · Pickles · Kemalpaşa dessert',
  'Ezogelin soup · Chickpeas with meat · Rice pilaf · Tzatziki · Güllaç',
  'Yogurt soup · Chicken vegetable casserole · Rice · Salad · Milk pudding',
  'Lentil soup · Dolma and sarma · Yogurt · Rice · Baklava',
  'Tomato soup · Potatoes with meat · Bulgur pilaf · Tzatziki · Ashura pudding',
  'Tarhana soup · Grilled chicken · Rice · Shepherd salad · Rice pudding',
  'Ezogelin soup · Meat and vegetable stew · Rice · Tzatziki · A sweet to end the month',
];

export const THOUGHTS_TR = [
  'Bugün bir kişinin gönlünü al: bir selam, bir dua, bir ikram.',
  'Bugün birine teşekkür et; uzun zamandır söylemediğin birine.',
  'Bir komşunun kapısını çal, iftardan bir tabak götür.',
  'Bugün sinirlendiğin anda bir nefes al ve cevap vermeden önce bekle.',
  'Telefonu bir saat bırak, o saati Kur’an’a ya da sessizliğe ayır.',
  'Ailenden birini ara; sadece hâlini hatırını sormak için.',
  'Bugün küçük de olsa bir sadaka ver. Önemli olan sürekliliktir.',
  'Bir arkadaşının bir iyiliğini ona hatırlat ve dua et.',
  'Evdeki birine yardım et; sofrayı hazırlamak da ibadettir.',
  'Bugün gıybet etme; konuşma açılırsa konuyu nazikçe değiştir.',
  'Bir hastayı ya da yaşlıyı ara, hatırını sor.',
  'Bugün bir günahın için içtenlikle istiğfar et.',
  'İftardan önce birkaç dakikanı dua etmeye ayır.',
  'Bir çocuğa güzel bir söz söyle ya da ona bir şey öğret.',
  'Bugün israf etme: tabağına ihtiyacın kadar koy.',
  'Birini affet. Affetmek önce kalbi hafifletir.',
  'Bir güzel söz söyle; güzel söz de sadakadır.',
  'Bugün namazlarını vaktinde kılmaya özen göster.',
  'Yolda yürürken bir başkasına yol ver, sabırlı ol.',
  'Dua listene birkaç isim ekle ve onlar için dua et.',
  'Son on gün başladı: bu geceyi bir miktar uyanık geçirmeyi düşün.',
  'Bir kitabın birkaç sayfasını oku ve öğrendiğini birine anlat.',
  'Kapıda bekleyen birini içeri al; misafire güler yüz göster.',
  'Bugün mutfakta ya da evde birinin yükünü hafiflet.',
  'Bir yakınına mektup ya da mesaj yaz ve onun için dua et.',
  'Bugün telefonda ve sofrada daha az konuşup daha çok dinle.',
  'Bir borcunu ya da helalleşmen gereken birini hatırla ve adım at.',
  'Bir hayır kurumuna bağış yapmayı düşün; fitreni unutma.',
  'Ayın sonuna yaklaşıyoruz: bu ayın sana kazandırdığı güzel bir alışkanlığı seç ve sürdür.',
  'Ramazan’ı uğurla: bu ay okuduğun, ettiğin her dua için şükret.',
];

export const THOUGHTS_EN = [
  'Make someone’s heart glad today: a greeting, a prayer, a treat.',
  'Thank someone you haven’t thanked in a long time.',
  'Knock on a neighbour’s door and bring a plate from your iftar.',
  'When anger rises today, take a breath and wait before answering.',
  'Put the phone down for an hour and give it to the Quran or to silence.',
  'Call a family member just to ask how they are.',
  'Give a small charity today. What matters is consistency.',
  'Remind a friend of a kindness they did and pray for them.',
  'Help someone at home; preparing the table is also worship.',
  'Avoid backbiting today; if it starts, gently change the subject.',
  'Call someone who is sick or elderly and ask after them.',
  'Sincerely ask forgiveness for one of your sins today.',
  'Set aside a few minutes for dua before iftar.',
  'Say a kind word to a child or teach them something.',
  'Avoid waste today: serve yourself only what you need.',
  'Forgive someone. Forgiving lightens your own heart first.',
  'Say one good word; a good word is also charity.',
  'Take care to pray each prayer on time today.',
  'Let someone go first on the road and be patient.',
  'Add a few names to your dua list and pray for them.',
  'The last ten days have begun: consider staying up a little tonight.',
  'Read a few pages of a book and tell someone what you learned.',
  'Welcome whoever is at the door; show a smiling face to guests.',
  'Lighten someone’s load in the kitchen or at home today.',
  'Write a letter or message to a relative and pray for them.',
  'Talk less and listen more at the table and on the phone today.',
  'Remember a debt or someone you need to make peace with, and take a step.',
  'Consider a donation to charity; don’t forget your fitr.',
  'We are near the end: pick one good habit this month gave you and keep it.',
  'Bid Ramadan farewell: be thankful for every prayer you made this month.',
];

type Remote = { menus?: string[]; sozler?: string[] };
const BASE = (
  ((Constants.expoConfig?.extra as { messagesBase?: string } | undefined)?.messagesBase ??
    'https://namazyolu.com/mesajlar/') as string
).replace(/mesajlar\/$/, 'icerik/');

export const remoteStore = createStore<{ data: Remote | null; at: number }>('ramazan-icerik-v1', { data: null, at: 0 });
const STALE = 6 * 60 * 60 * 1000;

/** Sunucudaki menü/söz listesini indirir (6 saatte bir). Hata olursa varsayılanlar kullanılır. */
export async function refreshRamazanContent() {
  await remoteStore.ready;
  if (Date.now() - remoteStore.get().at < STALE) return;
  try {
    const res = await fetch(`${BASE}ramazan.json?t=${Math.floor(Date.now() / STALE)}`);
    if (!res.ok) return;
    const j = (await res.json()) as Remote;
    remoteStore.set({ data: { menus: j.menus ?? [], sozler: j.sozler ?? [] }, at: Date.now() });
  } catch {
    // yok say
  }
}

/** n: 1 tabanlı Ramazan günü. */
export function dayContent(n: number, lang: Lang, remote: Remote | null) {
  const i = Math.max(0, n - 1);
  const rm = remote?.menus?.[i]?.trim();
  const defMenu = (lang === 'tr' ? MENUS_TR : MENUS_EN)[i % 30];
  const menu = rm || defMenu;
  // Sunucudaki sözler yalnızca Türkçe yazıldığı için diğer dillerde varsayılanlar kullanılır.
  const rs = lang === 'tr' && remote?.sozler?.length ? remote.sozler : null;
  const thought = rs ? rs[i % rs.length] : (lang === 'tr' ? THOUGHTS_TR : THOUGHTS_EN)[i % 30];
  return { menu, thought };
}

// Bu ekrana özel metinler. Ana dil dosyalarına dokunmadan Türkçe ve İngilizce (diğer diller İngilizce) sunulur.
const S = {
  tr: {
    title: 'Ramazan · {n}. gün',
    toIftar: 'İftara kalan süre',
    toSahur: 'Sahura (imsağa) kalan süre',
    done: 'Bugünkü iftar vakti geçti, Allah kabul etsin.',
    sahur: 'Sahur',
    iftar: 'İftar',
    fast: 'Oruç süresi',
    menu: 'Günün iftar menüsü',
    menuNote: 'Örnek menü; sofranızı dilediğiniz gibi kurun.',
    dua: 'İftar duası',
    kadir: 'Kadir Gecesi duası',
    thought: 'Günün düşüncesi',
    kept: 'Bugün orucumu tuttum',
    keptDone: 'Bugünkü oruç işaretli (değiştirmek için dokun)',
    prev: '‹ {n}. gün',
    next: '{n}. gün ›',
    back: 'Ana panoya dön',
    list: 'İmsakiye',
    open: 'Gün sayfası',
    card: 'Menü',
    tvStrip: 'Gün sayfası ›',
    hint: 'Kumanda: ← → ile gün değiştir',
    notFound: 'Ramazan günleri bulunamadı.',
    bayram: 'Bayramınız mübarek olsun. Allah kabul etsin.',
    notifWeekTitle: 'Ramazan’a bir hafta kaldı',
    notifWeekBody: 'Ramazan {date} tarihinde başlıyor. Hazırlık için imsakiyeye göz at.',
    notifFirstTitle: 'Ramazan-ı şerif hayırlı olsun',
    notifFirstBody: 'Bugün Ramazan’ın ilk günü. Sahur ve iftar vakitleri için imsakiyeye dokun.',
  },
  en: {
    title: 'Ramadan · day {n}',
    toIftar: 'Time left until iftar',
    toSahur: 'Time left until suhoor ends',
    done: 'Today’s iftar time has passed. May Allah accept.',
    sahur: 'Suhoor',
    iftar: 'Iftar',
    fast: 'Fasting length',
    menu: 'Today’s iftar menu',
    menuNote: 'A sample menu; set your table as you like.',
    dua: 'Prayer at iftar',
    kadir: 'Prayer for Laylat al-Qadr',
    thought: 'Thought of the day',
    kept: 'I fasted today',
    keptDone: 'Today’s fast is marked (tap to change)',
    prev: '‹ Day {n}',
    next: 'Day {n} ›',
    back: 'Back to board',
    list: 'Timetable',
    open: 'Day page',
    card: 'Menu',
    tvStrip: 'Day page ›',
    hint: 'Remote: ← → to change day',
    notFound: 'Ramadan days not found.',
    bayram: 'Eid Mubarak. May Allah accept our fasts.',
    notifWeekTitle: 'One week until Ramadan',
    notifWeekBody: 'Ramadan starts on {date}. Take a look at the timetable to prepare.',
    notifFirstTitle: 'Ramadan Mubarak',
    notifFirstBody: 'Today is the first day of Ramadan. Tap for suhoor and iftar times.',
  },
} as const;

export type RgKey = keyof typeof S.tr;
export function rg(lang: Lang, key: RgKey, params?: Record<string, string | number>): string {
  let s: string = (lang === 'tr' ? S.tr : S.en)[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
