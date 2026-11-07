import Ionicons from '@expo/vector-icons/Ionicons';
import { useKeepAwake } from 'expo-keep-awake';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';

import { FocusPressable } from '@/components/focus-pressable';
import { R, THEME_IDS, makeStyles, useColors } from '@/constants/theme';
import { HADISLER } from '@/data/hadisler';
import { formatDateLong } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { formatHijri } from '@/lib/hijri';
import { fmtTime, getCurrentPrayer, getDayTimes, getNextPrayer, PRAYER_KEYS } from '@/lib/prayer';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Televizyon ekranı: evde ya da camide açık bırakılan büyük vakit panosu.
 * Kumandanın yön tuşlarıyla alttaki düğmeler arasında gezilir.
 */
export default function TvScreen() {
  useKeepAwake();
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { settings, lang, calc, update } = useAppState();
  const { place, hijriOffset } = settings;
  const now = useNow(1000);
  const { width } = useWindowDimensions();
  const k = Math.max(0.6, Math.min(1.6, width / 1280)); // 1280 genişliğe göre ölçek

  const dayKey = startOfDay(now).getTime();
  const times = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(dayKey), calc),
    [place.lat, place.lng, dayKey, calc],
  );
  const next = getNextPrayer(place.lat, place.lng, now, calc);
  const current = getCurrentPrayer(times, now);
  const left = Math.max(0, next.time.getTime() - now.getTime());
  const hadis = HADISLER[Math.floor(dayKey / 86400000) % HADISLER.length];

  const nextTheme = () => {
    const i = THEME_IDS.indexOf(settings.theme);
    update({ theme: THEME_IDS[(i + 1) % THEME_IDS.length] });
  };

  return (
    <View style={[st.root, { padding: 36 * k }]}>
      <View style={st.top}>
        <View style={{ flex: 1, gap: 6 * k }}>
          <Text style={[st.clock, { fontSize: 120 * k }]}>
            {pad(now.getHours())}:{pad(now.getMinutes())}
          </Text>
          <Text style={[st.date, { fontSize: 26 * k }]}>{formatDateLong(now, lang)}</Text>
          <Text style={[st.hijri, { fontSize: 24 * k }]}>{formatHijri(now, hijriOffset, lang)}</Text>
          <View style={st.placeRow}>
            <Ionicons name="location" size={22 * k} color={C.textDim} />
            <Text style={[st.place, { fontSize: 22 * k }]}>{place.name}</Text>
          </View>
        </View>
        <View style={[st.nextBox, { padding: 28 * k, borderRadius: R.lg * k }]}>
          <Text style={[st.nextLabel, { fontSize: 24 * k }]}>{t('tv.nextPrayer')}</Text>
          <Text style={[st.nextName, { fontSize: 52 * k }]}>{t(`prayer.${next.key}`)}</Text>
          <Text style={[st.count, { fontSize: 76 * k }]}>
            {pad(Math.floor(left / 3600000))}:{pad(Math.floor((left % 3600000) / 60000))}:
            {pad(Math.floor((left % 60000) / 1000))}
          </Text>
        </View>
      </View>

      <View style={[st.row, { gap: 16 * k }]}>
        {PRAYER_KEYS.map((key) => {
          const active = key === current;
          return (
            <View
              key={key}
              style={[st.cell, { paddingVertical: 22 * k, borderRadius: R.lg * k }, active && st.cellActive]}>
              <Text style={[st.cellName, { fontSize: 26 * k }, active && { color: C.onAccent }]}>
                {t(`prayer.${key}`)}
              </Text>
              <Text style={[st.cellTime, { fontSize: 50 * k }, active && { color: C.onAccent }]}>
                {fmtTime(times[key])}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[st.bottom, { gap: 20 * k }]}>
        <View style={{ flex: 1, gap: 4 * k }}>
          <Text style={[st.hadisLabel, { fontSize: 18 * k }]}>{t('tv.hadith')}</Text>
          <Text style={[st.hadis, { fontSize: 24 * k }]} numberOfLines={2}>
            “{lang === 'tr' ? hadis.tr : hadis.en}”
          </Text>
          <Text style={[st.hadisSrc, { fontSize: 16 * k }]}>{hadis.src}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 * k }}>
          <TvBtn k={k} icon="location-outline" label={t('city.pick')} onPress={() => router.push('/sehir')} first />
          <TvBtn k={k} icon="color-palette-outline" label={t('tv.theme')} onPress={nextTheme} />
          <TvBtn k={k} icon="grid-outline" label={t('tv.allFeatures')} onPress={() => router.push('/(tabs)')} />
        </View>
      </View>
    </View>
  );
}

function TvBtn({
  k,
  icon,
  label,
  onPress,
  first,
}: {
  k: number;
  icon: 'location-outline' | 'color-palette-outline' | 'grid-outline';
  label: string;
  onPress: () => void;
  first?: boolean;
}) {
  const C = useColors();
  const st = useSt();
  return (
    <FocusPressable
      onPress={onPress}
      hasTVPreferredFocus={first}
      style={[
        st.btn,
        {
          paddingHorizontal: 22 * k,
          paddingVertical: 14 * k,
          borderRadius: R.md * k,
        },
      ]}
      focusStyle={st.btnFocus}>
      <Ionicons name={icon} size={24 * k} color={C.text} />
      <Text style={[st.btnText, { fontSize: 20 * k }]}>{label}</Text>
    </FocusPressable>
  );
}

const useSt = makeStyles((C) => ({
  root: { flex: 1, backgroundColor: C.bg, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  clock: {
    color: C.text,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  date: { color: C.text, fontWeight: '600' },
  hijri: { color: C.gold, fontWeight: '600' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  place: { color: C.textDim },
  nextBox: {
    backgroundColor: C.cardActive,
    alignItems: 'center',
    minWidth: '38%',
  },
  nextLabel: { color: C.textDim, fontWeight: '700' },
  nextName: { color: C.text, fontWeight: '800' },
  count: { color: C.gold, fontWeight: '800', fontVariant: ['tabular-nums'] },
  row: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', backgroundColor: C.card, gap: 6 },
  cellActive: { backgroundColor: C.accent },
  cellName: { color: C.textDim, fontWeight: '700' },
  cellTime: { color: C.text, fontWeight: '800', fontVariant: ['tabular-nums'] },
  bottom: { flexDirection: 'row', alignItems: 'flex-end' },
  hadisLabel: {
    color: C.accent,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hadis: { color: C.text, fontStyle: 'italic' },
  hadisSrc: { color: C.textMute },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.card,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  btnFocus: {
    borderColor: C.gold,
    backgroundColor: C.cardActive,
    transform: [{ scale: 1.06 }],
  },
  btnText: { color: C.text, fontWeight: '700' },
}));
