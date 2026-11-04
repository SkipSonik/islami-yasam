import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { ReliabilityBanner } from '@/components/reliability-card';
import { Card, Screen, SectionTitle } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { ayahForDate } from '@/data/daily-ayahs';
import { surahName } from '@/data/surahs';
import { formatDateLong } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { formatHijri } from '@/lib/hijri';
import { fmtTime, getCurrentPrayer, getDayTimes, getNextPrayer, PRAYER_KEYS } from '@/lib/prayer';
import { getAyah, type Ayah } from '@/lib/quran';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');

export default function HomeScreen() {
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

  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Text style={st.appTitle}>{t('app.name')}</Text>
        <Pressable style={st.metaRow} onPress={() => router.push('/ayarlar')}>
          <Ionicons name="location-outline" size={15} color={C.textDim} />
          <Text style={st.meta}>{place.name}</Text>
          {!place.auto ? <Text style={st.metaHint}>{t('home.change')}</Text> : null}
        </Pressable>
        <View style={st.metaRow}>
          <Ionicons name="calendar-outline" size={15} color={C.textDim} />
          <Text style={st.meta}>{gregorian}</Text>
        </View>
        <View style={st.metaRow}>
          <Ionicons name="moon-outline" size={15} color={C.gold} />
          <Text style={[st.meta, { color: C.gold }]}>{formatHijri(now, hijriOffset, lang)}</Text>
        </View>
      </View>

      <ReliabilityBanner />

      <Card style={{ backgroundColor: C.cardActive, alignItems: 'center' }}>
        <Text style={st.countLabel}>{t('home.timeLeft', { prayer: t(`prayer.${next.key}`) })}</Text>
        <Text style={st.count}>
          {pad(h)}:{pad(m)}:{pad(s)}
        </Text>
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${Math.min(100, progress * 100)}%` }]} />
        </View>
        <View style={st.grid}>
          {PRAYER_KEYS.map((key) => {
            const active = key === current;
            return (
              <View key={key} style={[st.cell, active && st.cellActive]}>
                <Text style={[st.cellLabel, active && { color: C.bgDeep }]} numberOfLines={1} adjustsFontSizeToFit>
                  {t(`prayer.${key}`)}
                </Text>
                <Text style={[st.cellTime, active && { color: C.bgDeep }]}>{fmtTime(times[key])}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      <DailyAyah date={now} />

      <View style={st.quick}>
        <QuickBtn icon="ellipse-outline" label={t('home.quickZikir')} onPress={() => router.push('/zikirmatik')} />
        <QuickBtn icon="list-outline" label={t('home.quickKaza')} onPress={() => router.push('/kaza')} />
        <QuickBtn icon="location-outline" label={t('home.quickMosques')} onPress={() => router.push('/camiler')} />
      </View>
    </Screen>
  );
}

function DailyAyah({ date }: { date: Date }) {
  const [surahNo, ayahNo] = ayahForDate(date);
  const [ayah, setAyah] = useState<Ayah | null>(null);
  const [failed, setFailed] = useState(false);
  const { lang } = useAppState();
  const t = useT();

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
      <SectionTitle icon="book-outline">{t('home.dailyAyah')}</SectionTitle>
      {ayah ? (
        <Pressable onPress={() => router.push(`/mushaf?sure=${surahNo}&ayet=${ayahNo}`)} style={{ gap: S.md }}>
          <Text style={st.ar}>{ayah.ar}</Text>
          <Text style={st.tr}>{ayah.tr}</Text>
          <Text style={st.ref}>{t('home.ayahRef', { surah: surahName(surahNo, lang), ayah: ayahNo })}</Text>
        </Pressable>
      ) : failed ? (
        <Text style={st.tr}>{t('home.ayahNeedsNet')}</Text>
      ) : (
        <ActivityIndicator color={C.accent} />
      )}
    </Card>
  );
}

function QuickBtn({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [st.quickBtn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={icon} size={22} color={C.accent} />
      <Text style={st.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  appTitle: { color: C.text, fontSize: 28, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: C.textDim, fontSize: 14 },
  metaHint: { color: C.accent, fontSize: 13 },
  countLabel: { color: C.text, fontSize: 16, fontWeight: '600' },
  count: { color: C.text, fontSize: 48, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 1 },
  progressTrack: { alignSelf: 'stretch', height: 6, borderRadius: 3, backgroundColor: C.bgDeep, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, alignSelf: 'stretch', marginTop: S.xs },
  cell: {
    width: '31.5%',
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: R.sm,
    paddingVertical: S.md,
    alignItems: 'center',
  },
  cellActive: { backgroundColor: C.accent },
  cellLabel: { color: C.text, fontWeight: '700', fontSize: 14 },
  cellTime: { color: C.textDim, fontSize: 14, marginTop: 2, fontVariant: ['tabular-nums'] },
  ar: { color: C.text, fontSize: 24, lineHeight: 44, textAlign: 'right', writingDirection: 'rtl' },
  tr: { color: C.textDim, fontSize: 15, lineHeight: 22 },
  ref: { color: C.gold, fontSize: 13, fontWeight: '600' },
  quick: { flexDirection: 'row', gap: S.sm },
  quickBtn: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingVertical: S.lg,
    alignItems: 'center',
    gap: 6,
  },
  quickLabel: { color: C.text, fontSize: 13, fontWeight: '600' },
});
