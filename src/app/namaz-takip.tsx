import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { PrayerChecks } from '@/components/prayer-checks';
import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { formatDateShort, weekdayShort } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { addDays, startOfDay } from '@/lib/dates';
import { getDayTimes } from '@/lib/prayer';
import {
  countDay,
  currentStreak,
  FARZ,
  FARZ_TIME_KEY,
  lastDays,
  longestStreak,
  totalPrayers,
  trackerStore,
} from '@/lib/tracker';
import { useNow } from '@/lib/use-now';

export default function NamazTakipScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { settings, lang, calc } = useAppState();
  const now = useNow(30000);
  const data = trackerStore.useValue();
  const today = startOfDay(now);
  const times = useMemo(
    () => getDayTimes(settings.place.lat, settings.place.lng, today, calc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.place.lat, settings.place.lng, today.getTime(), calc],
  );

  const week = lastDays(data, today, 7);
  const weekCount = week.reduce((a, d) => a + countDay(d.mask), 0);
  const streak = currentStreak(data, today);
  const best = longestStreak(data);
  const total = totalPrayers(data);
  const yesterday = addDays(today, -1);

  return (
    <Screen title={t('tracker.title')} back>
      <Card style={{ backgroundColor: C.cardActive }}>
        <View style={st.streakRow}>
          <Ionicons name="flame" size={34} color={streak > 0 ? C.gold : C.textMute} />
          <View style={{ flex: 1 }}>
            <Text style={st.streakNum}>{t('tracker.streak', { n: streak })}</Text>
            <Text style={st.streakSub}>{t('tracker.streakHint')}</Text>
          </View>
        </View>
        <View style={st.stats}>
          <Stat label={t('tracker.thisWeek')} value={`${weekCount}/35`} />
          <Stat label={t('tracker.best')} value={String(best)} />
          <Stat label={t('tracker.total')} value={String(total)} />
        </View>
      </Card>

      <Card>
        <SectionTitle icon="today-outline">{t('tracker.today')}</SectionTitle>
        <PrayerChecks day={today} isFuture={(f) => times[FARZ_TIME_KEY[f]] > now} />
      </Card>

      <Card>
        <SectionTitle icon="time-outline">{t('tracker.yesterday')}</SectionTitle>
        <PrayerChecks day={yesterday} compact />
      </Card>

      <Card>
        <SectionTitle icon="calendar-outline">{t('tracker.last7')}</SectionTitle>
        <View style={st.weekHead}>
          <View style={{ width: 74 }} />
          {FARZ.map((f) => (
            <Text key={f} style={st.weekHeadText} numberOfLines={1}>
              {t(`tracker.${f}`).slice(0, 3)}
            </Text>
          ))}
        </View>
        {week
          .slice()
          .reverse()
          .map((d) => (
            <View key={d.date.getTime()} style={st.weekRow}>
              <Text style={st.weekDay} numberOfLines={1}>
                {weekdayShort(d.date, lang)} {formatDateShort(d.date, lang)}
              </Text>
              {FARZ.map((f, i) => (
                <View key={f} style={st.weekCellWrap}>
                  <View style={[st.weekCell, (d.mask & (1 << i)) !== 0 && st.weekCellOn]} />
                </View>
              ))}
            </View>
          ))}
      </Card>

      <Btn label={t('tracker.badges')} icon="ribbon-outline" onPress={() => router.push('/rozetler')} />
      <Btn label={t('tracker.toKaza')} kind="ghost" icon="list-outline" onPress={() => router.push('/kaza')} />
      <Text style={st.hint}>{t('tracker.hint')}</Text>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const st = useSt();
  return (
    <View style={st.stat}>
      <Text style={st.statValue}>{value}</Text>
      <Text style={st.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const useSt = makeStyles((C) => ({
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  streakNum: { color: C.text, fontSize: 22, fontWeight: '800' },
  streakSub: { color: C.textDim, fontSize: 13 },
  stats: { flexDirection: 'row', gap: S.sm },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: R.sm, paddingVertical: S.md, alignItems: 'center' },
  statValue: { color: C.text, fontSize: 18, fontWeight: '800' },
  statLabel: { color: C.textDim, fontSize: 12 },
  weekHead: { flexDirection: 'row', alignItems: 'center' },
  weekHeadText: { flex: 1, color: C.textMute, fontSize: 11.5, textAlign: 'center', fontWeight: '700' },
  weekRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  weekDay: { width: 74, color: C.textDim, fontSize: 12.5 },
  weekCellWrap: { flex: 1, alignItems: 'center' },
  weekCell: { width: 22, height: 22, borderRadius: 6, backgroundColor: C.bgDeep, borderWidth: 1, borderColor: C.border },
  weekCellOn: { backgroundColor: C.accent, borderColor: C.accent },
  hint: { color: C.textMute, fontSize: 12.5, lineHeight: 18 },
}));
