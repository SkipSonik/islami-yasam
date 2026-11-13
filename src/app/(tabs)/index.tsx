import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AyahShareCard, type AyahShareHandle } from '@/components/ayah-share';
import { PrayerChecks } from '@/components/prayer-checks';
import { ReliabilityBanner } from '@/components/reliability-card';
import { Card, Screen, SectionTitle, Split } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';
import { ayahForDate } from '@/data/daily-ayahs';
import { surahName } from '@/data/surahs';
import { formatDateLong, type StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { formatHijri, toHijri } from '@/lib/hijri';
import { fmtTime, getCurrentPrayer, getDayTimes, getNextPrayer, PRAYER_KEYS } from '@/lib/prayer';
import { getAyah, type Ayah } from '@/lib/quran';
import { daysUntil, ramadanDays, upcomingReligiousDays, whenLabel } from '@/lib/religious-days';
import { currentStreak, FARZ_TIME_KEY, trackerStore } from '@/lib/tracker';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');

export default function HomeScreen() {
  const C = useColors();
  const st = useSt();
  const { settings, lang, calc } = useAppState();
  const t = useT();
  const { place, hijriOffset } = settings;
  const now = useNow(1000);

  const dayKey = startOfDay(now).getTime();
  const times = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(dayKey), calc),
    [place.lat, place.lng, dayKey, calc],
  );
  const next = getNextPrayer(place.lat, place.lng, now, calc);
  const current = getCurrentPrayer(times, now);

  const left = Math.max(0, next.time.getTime() - now.getTime());
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  const span = next.time.getTime() - next.prevTime.getTime();
  const progress = span > 0 ? 1 - left / span : 0;

  const gregorian = formatDateLong(now, lang);
  const trackData = trackerStore.useValue();
  const streak = currentStreak(trackData, now);
  const nextDay = useMemo(() => upcomingReligiousDays(new Date(dayKey), hijriOffset, 2)[0], [dayKey, hijriOffset]);

  const header = (
    <View style={{ gap: 4 }}>
      <View style={st.topRow}>
        <Text style={st.appTitle}>{t('app.name')}</Text>
        <Pressable style={st.placeBtn} onPress={() => router.push('/sehir')} hitSlop={8}>
          <Ionicons name="location-outline" size={15} color={C.accent} />
          <Text style={st.placeText} numberOfLines={1}>
            {place.name}
          </Text>
        </Pressable>
      </View>
      <Text style={st.meta}>{gregorian}</Text>
      {nextDay ? (
        <Pressable style={st.metaRow} onPress={() => router.push('/dini-gunler')}>
          <Ionicons name="star-outline" size={15} color={C.gold} />
          <Text style={[st.meta, { color: C.gold, fontWeight: '600' }]}>
            {t('rd.upcoming', {
              name: t(`rd.${nextDay.key}` as StringKey),
              when: whenLabel(nextDay, new Date(dayKey), t),
            })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );

  const leftCol = (
    <>
      {header}
      <ReliabilityBanner />
      {/* Çini çerçeveli mihrap kemeri: sıradaki vakte geri sayım */}
      <View style={st.archOuter}>
        <View style={st.archGap}>
          <View style={st.arch}>
            <View style={st.archStars}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[st.archStar, i === 1 && st.archStarBig]} />
              ))}
            </View>
            <Text style={st.archLabel}>{t('home.timeLeft', { prayer: t(`prayer.${next.key}`) })}</Text>
            <Text style={st.count} numberOfLines={1} adjustsFontSizeToFit>
              {pad(h)}:{pad(m)}:{pad(s)}
            </Text>
            <View style={st.progressTrack}>
              <View style={[st.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
            </View>
            <Text style={st.archSub}>
              {fmtTime(next.time)} · {formatHijri(now, hijriOffset, lang)}
            </Text>
          </View>
        </View>
      </View>
      <View style={st.grid}>
        {PRAYER_KEYS.map((key) => {
          const active = key === current;
          const upcoming = key === next.key && !active;
          return (
            <View key={key} style={[st.cell, active && st.cellActive, upcoming && st.cellNext]}>
              <Text
                style={[st.cellLabel, active && { color: C.onAccent }, upcoming && { color: C.accent }]}
                numberOfLines={1}
                adjustsFontSizeToFit>
                {t(`prayer.${key}`)}
              </Text>
              <Text style={[st.cellTime, active && { color: C.onAccent }, upcoming && { color: C.accent }]}>
                {fmtTime(times[key])}
              </Text>
            </View>
          );
        })}
      </View>
      <RamadanBanner now={now} />
    </>
  );

  return (
    <Screen wide>
      <Split
        left={leftCol}
        right={
          <>
            <Card>
              <Pressable style={st.trackHead} onPress={() => router.push('/namaz-takip')}>
                <SectionTitle icon="checkmark-done-outline">{t('tracker.homeTitle')}</SectionTitle>
                <View style={st.streak}>
                  <Ionicons name="flame" size={16} color={streak > 0 ? C.gold : C.textMute} />
                  <Text style={[st.streakText, streak > 0 && { color: C.gold }]}>{streak}</Text>
                  <Ionicons name="chevron-forward" size={16} color={C.textMute} />
                </View>
              </Pressable>
              <PrayerChecks day={new Date(dayKey)} isFuture={(f) => times[FARZ_TIME_KEY[f]] > now} compact />
            </Card>

            <DailyAyah date={now} />

            <View style={st.quick}>
              <QuickBtn
                icon="ellipse-outline"
                label={t('home.quickZikir')}
                onPress={() => router.push('/zikirmatik')}
              />
              <QuickBtn
                icon="infinite-outline"
                label={t('home.quickTesbihat')}
                onPress={() => router.push('/tesbihat')}
              />
              <QuickBtn icon="book-outline" label={t('home.quickDua')} onPress={() => router.push('/dualar')} />
            </View>
            <View style={st.quick}>
              <QuickBtn
                icon="reader-outline"
                label={t('home.quickReading')}
                onPress={() => router.push('/okuma-plani')}
              />
              <QuickBtn icon="list-outline" label={t('home.quickKaza')} onPress={() => router.push('/kaza')} />
              <QuickBtn
                icon="location-outline"
                label={t('home.quickMosques')}
                onPress={() => router.push('/camiler')}
              />
            </View>
          </>
        }
      />
    </Screen>
  );
}

/** Ramazan'da iftar/sahur sayacı, Ramazan'a 30 gün kala geri sayım */
function RamadanBanner({ now }: { now: Date }) {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { settings, calc } = useAppState();
  const { place, hijriOffset } = settings;
  const dayMs = startOfDay(now).getTime();
  const inRamadan = toHijri(now, hijriOffset).month === 9;
  const days = useMemo(() => ramadanDays(new Date(dayMs), hijriOffset), [dayMs, hijriOffset]);
  const times = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(dayMs), calc),
    [place.lat, place.lng, dayMs, calc],
  );
  const startsIn = daysUntil(days[0], now);
  if (!inRamadan && (startsIn > 30 || startsIn < 0)) return null;

  let text: string;
  if (inRamadan) {
    const target = now < times.imsak ? times.imsak : now < times.aksam ? times.aksam : null;
    if (target) {
      const ms = target.getTime() - now.getTime();
      const label = target === times.aksam ? t('ims.toIftar') : t('ims.toSahur');
      text = `${label}: ${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}`;
    } else text = t('ramazan.iftarDone');
  } else text = t('ramazan.countdown', { n: startsIn });

  return (
    <Pressable
      onPress={() => router.push('/ramazan')}
      style={({ pressed }) => [st.ramadan, pressed && { opacity: 0.85 }]}>
      <Ionicons name="moon" size={22} color={C.gold} />
      <View style={{ flex: 1 }}>
        <Text style={st.ramadanTitle}>{t('ramazan.title')}</Text>
        <Text style={st.ramadanText}>{text}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textMute} />
    </Pressable>
  );
}

function DailyAyah({ date }: { date: Date }) {
  const C = useColors();
  const st = useSt();
  const [surahNo, ayahNo] = ayahForDate(date);
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [failed, setFailed] = useState(false);
  const { lang } = useAppState();
  const t = useT();
  const shareRef = useRef<AyahShareHandle>(null);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareRef.current?.share();
    } catch {
      // paylaşım iptal edildi
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    let alive = true;
    setFailed(false);
    getAyah(surahNo, ayahNo)
      .then((a) => alive && setAyah(a))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [surahNo, ayahNo, lang]);

  return (
    <Card>
      <View style={st.ayahHead}>
        <SectionTitle icon="book-outline">{t('home.dailyAyah')}</SectionTitle>
        <View style={st.badge}>
          <Text style={st.badgeText}>
            {surahNo}:{ayahNo}
          </Text>
        </View>
      </View>
      {ayah ? (
        <AyahShareCard
          ref={shareRef}
          ar={ayah.ar}
          meal={ayah.tr}
          reference={t('home.ayahRef', { surah: surahName(surahNo, lang), ayah: ayahNo })}
          title={t('home.dailyAyah')}
          brand={`${t('app.name')} · namazyolu.com`}
        />
      ) : null}
      {ayah ? (
        <>
          <Pressable onPress={() => router.push(`/mushaf?sure=${surahNo}&ayet=${ayahNo}`)} style={{ gap: S.md }}>
            <Text style={st.ar}>{ayah.ar}</Text>
            <Text style={st.tr}>{ayah.tr}</Text>
            <Text style={st.ref}>
              {t('home.ayahRef', {
                surah: surahName(surahNo, lang),
                ayah: ayahNo,
              })}
            </Text>
          </Pressable>
          {/* Ayet, görsel olarak WhatsApp, Instagram vb. uygulamalarda paylaşılır */}
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel={t('msg.share')}
            style={({ pressed }) => [st.shareBtn, pressed && { opacity: 0.8 }]}>
            {sharing ? (
              <ActivityIndicator size="small" color={C.onAccent} />
            ) : (
              <Ionicons name="logo-whatsapp" size={18} color={C.onAccent} />
            )}
            <Text style={st.shareText}>{t('msg.share')}</Text>
            <Ionicons name="image-outline" size={16} color={C.onAccent} />
          </Pressable>
        </>
      ) : failed ? (
        <Text style={st.tr}>{t('home.ayahNeedsNet')}</Text>
      ) : (
        <ActivityIndicator color={C.accent} />
      )}
    </Card>
  );
}

function QuickBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const C = useColors();
  const st = useSt();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.quickBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={22} color={C.gold} />
      <Text style={st.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const ARCH = 170;

const useSt = makeStyles((C) => ({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.md },
  appTitle: { color: C.accent, fontSize: 26, fontWeight: '800' },
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    borderWidth: 1.5,
    borderColor: C.accent,
    borderRadius: 18,
    paddingHorizontal: 10,
    minHeight: 36,
  },
  placeText: { color: C.accent, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: C.textDim, fontSize: 14 },
  archOuter: {
    padding: 6,
    borderTopLeftRadius: ARCH,
    borderTopRightRadius: ARCH,
    borderBottomLeftRadius: R.lg,
    borderBottomRightRadius: R.lg,
    backgroundColor: C.ornament,
    borderWidth: 3,
    borderColor: C.accent,
  },
  archGap: {
    padding: 5,
    borderTopLeftRadius: ARCH - 8,
    borderTopRightRadius: ARCH - 8,
    borderBottomLeftRadius: R.lg - 4,
    borderBottomRightRadius: R.lg - 4,
    backgroundColor: C.bg,
  },
  arch: {
    minHeight: 270,
    borderTopLeftRadius: ARCH - 14,
    borderTopRightRadius: ARCH - 14,
    borderBottomLeftRadius: R.md,
    borderBottomRightRadius: R.md,
    backgroundColor: C.dark ? C.cardActive : C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: S.xl,
    paddingTop: 44,
    paddingBottom: S.xl,
  },
  archStars: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  archStar: { width: 8, height: 8, backgroundColor: C.ornament, transform: [{ rotate: '45deg' }] },
  archStarBig: { width: 13, height: 13 },
  archLabel: { color: '#F3D2B9', fontSize: 14, fontWeight: '700', letterSpacing: 0.5, textAlign: 'center' },
  archSub: { color: '#D6E6E3', fontSize: 13, textAlign: 'center' },
  count: {
    color: '#FFFFFF',
    fontSize: 54,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  progressTrack: {
    alignSelf: 'stretch',
    marginHorizontal: S.lg,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  progressFill: { height: 5, backgroundColor: C.ornament },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: S.sm,
    alignSelf: 'stretch',
  },
  cell: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: C.cardSoft,
    borderRadius: R.sm + 4,
    paddingVertical: S.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cellActive: { backgroundColor: C.ornament, borderColor: C.ornament },
  cellNext: { backgroundColor: C.card, borderColor: C.accent },
  cellLabel: { color: C.textDim, fontWeight: '700', fontSize: 13 },
  cellTime: {
    color: C.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  ayahHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.ornament,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  badgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11, transform: [{ rotate: '-45deg' }] },
  ar: {
    color: C.accent,
    fontSize: 25,
    lineHeight: 50,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontFamily: 'AmiriQuran_400Regular',
  },
  tr: { color: C.text, fontSize: 15, lineHeight: 22 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    minHeight: 48,
    borderRadius: R.md,
    marginTop: S.xs,
  },
  shareText: { color: C.onAccent, fontWeight: '800', fontSize: 15 },
  ref: { color: C.gold, fontSize: 13, fontWeight: '700' },
  quick: { flexDirection: 'row', gap: S.sm, marginBottom: -S.sm },
  trackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { color: C.textMute, fontWeight: '800', fontSize: 15 },
  ramadan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.lg,
    borderWidth: 1.5,
    borderColor: C.gold,
  },
  ramadanTitle: { color: C.text, fontSize: 16, fontWeight: '800' },
  ramadanText: {
    color: C.gold,
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  quickBtn: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.accent,
    paddingVertical: S.lg,
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: { color: C.accent, fontSize: 13, fontWeight: '700' },
}));
