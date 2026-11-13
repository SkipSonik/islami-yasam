import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';

import { Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { formatDateLong, hijriMonthName, type StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { addDays, startOfDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { fmtTime, getDayTimes, PRAYER_KEYS, type PrayerKey } from '@/lib/prayer';
import { useNow } from '@/lib/use-now';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<PrayerKey, IconName> = {
  imsak: 'moon-outline',
  gunes: 'sunny-outline',
  ogle: 'sunny',
  ikindi: 'partly-sunny-outline',
  aksam: 'cloudy-night-outline',
  yatsi: 'moon',
};

// Yay üzerindeki konumu hesaplamak için örnek nokta sayısı (Animated.interpolate için)
const STEPS = 24;
const ARC_H = 0.5; // yay yüksekliği / genişlik

const hm = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60000));
  return { h: Math.floor(m / 60), m: m % 60 };
};

/**
 * Bir günün namaz vakitleri: güneşin yay üzerinde ilerlediği animasyonlu gökyüzü
 * ve sırayla beliren vakit kartları. /gun?t=<gün başlangıcı, ms>
 */
export default function GunScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { settings, lang, calc } = useAppState();
  const { place, hijriOffset } = settings;
  const params = useLocalSearchParams<{ t?: string }>();
  const now = useNow(30_000);
  const today = startOfDay(now).getTime();
  const dayMs = startOfDay(new Date(Number(params.t) || today)).getTime();
  const day = new Date(dayMs);
  const isToday = dayMs === today;

  const times = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(dayMs), calc),
    [place.lat, place.lng, dayMs, calc],
  );
  const h = toHijri(day, hijriOffset);

  const rise = times.gunes.getTime();
  const set = times.aksam.getTime();
  const daylight = hm(set - rise);
  // Güneşin yay üzerindeki yeri: bugün için şu an, diğer günlerde öğle vakti
  const target = isToday
    ? Math.min(1, Math.max(0, (now.getTime() - rise) / (set - rise)))
    : (times.ogle.getTime() - rise) / (set - rise);
  const night = isToday && (now.getTime() < rise || now.getTime() > set);

  // Gökyüzü yayı
  const [w, setW] = useState(0);
  const sun = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    sun.setValue(0);
    Animated.timing(sun, {
      toValue: target,
      duration: 1600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dayMs, target, sun]);

  const arc = useMemo(() => {
    if (!w) return null;
    const r = w / 2;
    const input = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS);
    const xs = input.map((f) => r - r * Math.cos(Math.PI * f));
    const ys = input.map((f) => r * ARC_H * 2 - r * ARC_H * 2 * Math.sin(Math.PI * f));
    return {
      r,
      tx: sun.interpolate({ inputRange: input, outputRange: xs }),
      ty: sun.interpolate({ inputRange: input, outputRange: ys }),
      at: (ms: number) => {
        const f = Math.min(1, Math.max(0, (ms - rise) / (set - rise)));
        return { x: r - r * Math.cos(Math.PI * f), y: r * ARC_H * 2 - r * ARC_H * 2 * Math.sin(Math.PI * f) };
      },
    };
  }, [w, sun, rise, set]);

  // Vakit kartları sırayla belirir
  const anims = useRef(PRAYER_KEYS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    anims.forEach((a) => a.setValue(0));
    Animated.stagger(
      90,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ),
    ).start();
  }, [dayMs, anims]);

  // Bugünse: şu anki ve sıradaki vakit
  const nowMs = now.getTime();
  let current: PrayerKey | null = null;
  for (const k of PRAYER_KEYS) if (times[k].getTime() <= nowMs) current = k;
  const nextKey = PRAYER_KEYS.find((k) => times[k].getTime() > nowMs) ?? null;

  const go = (n: number) => router.setParams({ t: String(addDays(day, n).getTime()) });

  return (
    <Screen title={formatDateLong(day, lang)} back>
      <View style={st.sky}>
        <View style={st.skyHead}>
          <View style={{ flex: 1 }}>
            <Text style={st.hijri}>
              {h.day} {hijriMonthName(h.month, lang)} {h.year}
            </Text>
            <Text style={st.place} numberOfLines={1}>
              {place.name}
            </Text>
          </View>
          {isToday ? (
            <View style={st.todayPill}>
              <Text style={st.todayPillText}>{t('day.today')}</Text>
            </View>
          ) : null}
        </View>

        <View
          style={[st.arcBox, w ? { height: w * ARC_H + 2 } : null]}
          onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
          {arc ? (
            <>
              <View
                style={[
                  st.arcLine,
                  {
                    width: arc.r * 2,
                    height: arc.r * ARC_H * 2,
                    borderTopLeftRadius: arc.r,
                    borderTopRightRadius: arc.r,
                  },
                ]}
              />
              {(['gunes', 'ogle', 'ikindi', 'aksam'] as const).map((k) => {
                const p = arc.at(times[k].getTime());
                return (
                  <View key={k} style={[st.mark, { left: p.x - 5, top: p.y - 5 }]}>
                    <Text
                      style={[
                        st.markLabel,
                        k === 'gunes' && { left: 0 },
                        (k === 'ogle' || k === 'ikindi') && { top: 14 },
                        k === 'aksam' && { right: 0 },
                      ]}>
                      {t(`prayer.${k}`)}
                    </Text>
                  </View>
                );
              })}
              <Animated.View
                style={[st.sun, night && st.moon, { transform: [{ translateX: arc.tx }, { translateY: arc.ty }] }]}>
                <Ionicons name={night ? 'moon' : 'sunny'} size={20} color={night ? '#F6EFE0' : '#8A4B12'} />
              </Animated.View>
            </>
          ) : null}
          <View style={st.horizon} />
        </View>

        <View style={st.skyFoot}>
          <View style={st.footItem}>
            <Ionicons name="sunny-outline" size={16} color={C.gold} />
            <Text style={st.footText}>
              {fmtTime(times.gunes)} – {fmtTime(times.aksam)}
            </Text>
          </View>
          <Text style={st.footText}>{t('day.daylight', { h: daylight.h, m: daylight.m })}</Text>
        </View>
      </View>

      <View style={{ gap: S.sm }}>
        {PRAYER_KEYS.map((k, i) => {
          const a = anims[i];
          const at = times[k].getTime();
          const isCur = isToday && k === current;
          const isNext = isToday && k === nextKey;
          const passed = isToday && at <= nowMs && !isCur;
          const left = hm(at - nowMs);
          const following = PRAYER_KEYS[i + 1];
          const gap = following ? hm(times[following].getTime() - at) : null;
          return (
            <Animated.View
              key={k}
              style={{
                opacity: a,
                transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
              }}>
              <View style={[st.card, isCur && st.cardCur, isNext && st.cardNext, passed && st.cardPassed]}>
                <View style={[st.icon, isCur && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Ionicons name={ICONS[k]} size={22} color={isCur ? C.onAccent : C.accent} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[st.name, isCur && st.onCur]}>{t(`prayer.${k}`)}</Text>
                  <Text style={[st.meta, isCur && st.onCurDim]} numberOfLines={1}>
                    {isCur
                      ? t('day.now')
                      : isNext
                        ? t('day.left', { h: left.h, m: left.m })
                        : gap && following
                          ? t('day.until', { prayer: t(`prayer.${following}` as StringKey), h: gap.h, m: gap.m })
                          : t('day.night')}
                  </Text>
                </View>
                <Text style={[st.time, isCur && st.onCur, isNext && { color: C.accent }]}>{fmtTime(times[k])}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={st.nav}>
        <Pressable
          onPress={() => go(-1)}
          accessibilityRole="button"
          style={({ pressed }) => [st.navBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="chevron-back" size={18} color={C.accent} />
          <Text style={st.navText}>{t('day.prev')}</Text>
        </Pressable>
        <Pressable
          onPress={() => go(1)}
          accessibilityRole="button"
          style={({ pressed }) => [st.navBtn, pressed && { opacity: 0.7 }]}>
          <Text style={st.navText}>{t('day.next')}</Text>
          <Ionicons name="chevron-forward" size={18} color={C.accent} />
        </Pressable>
      </View>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  sky: {
    backgroundColor: C.dark ? C.cardActive : C.accent,
    borderRadius: R.lg,
    padding: S.lg,
    gap: S.md,
    overflow: 'hidden',
  },
  skyHead: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  hijri: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  place: { color: '#D6E6E3', fontSize: 13, marginTop: 2 },
  todayPill: { backgroundColor: C.ornament, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  todayPillText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  arcBox: {
    height: 150,
    marginTop: 26,
    justifyContent: 'flex-end',
    width: '88%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  arcLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  horizon: { height: 2, marginHorizontal: -18, backgroundColor: 'rgba(255,255,255,0.35)' },
  mark: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.ornament,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  markLabel: {
    position: 'absolute',
    top: -20,
    width: 70,
    left: -30,
    textAlign: 'center',
    color: '#F3D2B9',
    fontSize: 11,
    fontWeight: '700',
  },
  sun: {
    position: 'absolute',
    left: -17,
    top: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFD9A0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD9A0',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
  },
  moon: { backgroundColor: '#24414A', shadowColor: '#FFFFFF' },
  skyFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.md },
  footItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footText: { color: '#E6F0EE', fontSize: 13, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardCur: { backgroundColor: C.ornament, borderColor: C.ornament },
  cardNext: { borderColor: C.accent },
  cardPassed: { opacity: 0.6 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: C.text, fontSize: 17, fontWeight: '800' },
  meta: { color: C.textDim, fontSize: 13 },
  onCur: { color: '#FFFFFF' },
  onCurDim: { color: '#FFF1E6' },
  time: { color: C.text, fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: S.md, marginTop: S.xs },
  navBtn: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: R.md,
    borderWidth: 1.5,
    borderColor: C.accent,
  },
  navText: { color: C.accent, fontWeight: '700', fontSize: 14 },
}));
