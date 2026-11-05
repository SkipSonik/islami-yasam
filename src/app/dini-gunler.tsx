import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';
import { formatDateLong, type StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { addDays, startOfDay } from '@/lib/dates';
import { formatHijri } from '@/lib/hijri';
import { daysUntil, upcomingReligiousDays, whenLabel } from '@/lib/religious-days';

export default function DiniGunlerScreen() {
  const C = useColors();
  const st = useSt();
  const { settings, lang } = useAppState();
  const t = useT();
  const dayKey = startOfDay(new Date()).getTime();
  const days = useMemo(
    () => upcomingReligiousDays(new Date(dayKey), settings.hijriOffset),
    [dayKey, settings.hijriOffset],
  );
  const now = new Date(dayKey);

  return (
    <Screen title={t('rd.title')} back>
      {days.map((d, i) => {
        const n = daysUntil(d.date, now);
        const first = i === 0;
        const icon = d.kind === 'bayram' ? 'gift-outline' : d.kind === 'kandil' ? 'flame-outline' : 'calendar-outline';
        const color = d.kind === 'bayram' ? C.accent : d.kind === 'kandil' ? C.gold : C.textDim;
        const end = d.days > 1 ? addDays(d.date, d.days - 1) : null;
        return (
          <View key={d.key + d.date.getTime()} style={[st.row, first && st.rowFirst]}>
            <View style={[st.icon, { borderColor: color }]}>
              <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={st.name}>{t(`rd.${d.key}` as StringKey)}</Text>
              <Text style={st.date}>
                {formatDateLong(d.date, lang)}
                {end ? ` – ${formatDateLong(end, lang)}` : ''}
              </Text>
              <Text style={st.hijri}>
                {formatHijri(d.night ? addDays(d.date, 1) : d.date, settings.hijriOffset, lang)}
                {d.night ? ` · ${t('rd.night')}` : ''}
              </Text>
            </View>
            <View style={[st.badge, n <= 0 && { backgroundColor: C.accent }]}>
              <Text style={[st.badgeText, n <= 0 && { color: C.onAccent }]}>{whenLabel(d, now, t)}</Text>
            </View>
          </View>
        );
      })}
      <Text style={st.note}>{t('rd.note')}</Text>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: -S.sm,
  },
  rowFirst: { borderColor: C.gold },
  icon: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  name: { color: C.text, fontSize: 16, fontWeight: '700' },
  date: { color: C.textDim, fontSize: 13 },
  hijri: { color: C.textMute, fontSize: 12 },
  badge: { backgroundColor: C.cardSoft, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, maxWidth: 110 },
  badgeText: { color: C.text, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  note: { color: C.textMute, fontSize: 12.5, lineHeight: 19, marginTop: S.md },
}));
