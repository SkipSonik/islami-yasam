import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';
import { formatDateLong, formatDateShort, weekdayShort } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { fmtTime, getDayTimes, PRAYER_KEYS } from '@/lib/prayer';
import { daysUntil, ramadanDays } from '@/lib/religious-days';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');

export default function ImsakiyeScreen() {
  const C = useColors();
  const st = useSt();
  const { settings, lang, calc } = useAppState();
  const t = useT();
  const { place, hijriOffset } = settings;
  const now = useNow(1000);
  const dayKey = startOfDay(now).getTime();

  const rows = useMemo(
    () =>
      ramadanDays(new Date(dayKey), hijriOffset).map((d) => ({
        date: d,
        times: getDayTimes(place.lat, place.lng, d, calc),
      })),
    [dayKey, hijriOffset, place.lat, place.lng, calc],
  );
  if (!rows.length) return <Screen title={t('ims.title')} back>{null}</Screen>;

  const hijriYear = toHijri(rows[0].date, hijriOffset).year;
  const todayIdx = rows.findIndex((r) => r.date.getTime() === dayKey);
  const startsIn = daysUntil(rows[0].date, now);

  // Ramazan içindeysek sıradaki sahur/iftar geri sayımı
  let countdown: { label: string; ms: number } | null = null;
  if (todayIdx >= 0) {
    const today = rows[todayIdx].times;
    if (now < today.imsak) countdown = { label: t('ims.toSahur'), ms: today.imsak.getTime() - now.getTime() };
    else if (now < today.aksam) countdown = { label: t('ims.toIftar'), ms: today.aksam.getTime() - now.getTime() };
    else if (rows[todayIdx + 1])
      countdown = { label: t('ims.toSahur'), ms: rows[todayIdx + 1].times.imsak.getTime() - now.getTime() };
  }

  return (
    <Screen title={t('ims.title')} back>
      <Text style={st.sub}>{t('ims.sub', { y: hijriYear, place: place.name })}</Text>

      {countdown ? (
        <Card style={{ alignItems: 'center', gap: 4 }}>
          <Text style={st.cdLabel}>{countdown.label}</Text>
          <Text style={st.cd}>
            {pad(Math.floor(countdown.ms / 3600000))}:{pad(Math.floor((countdown.ms % 3600000) / 60000))}:
            {pad(Math.floor((countdown.ms % 60000) / 1000))}
          </Text>
        </Card>
      ) : startsIn > 0 ? (
        <Card>
          <Text style={st.starts}>{t('ims.starts', { date: formatDateLong(rows[0].date, lang), n: startsIn })}</Text>
        </Card>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={st.table}>
          <View style={[st.tr, st.th]}>
            <Text style={[st.cell, st.cDay, st.hText]}>{t('ims.day')}</Text>
            <Text style={[st.cell, st.cDate, st.hText]}>{t('times.date')}</Text>
            {PRAYER_KEYS.map((k) => (
              <Text
                key={k}
                style={[st.cell, st.hText, (k === 'imsak' || k === 'aksam') && { color: C.gold }]}
                numberOfLines={1}>
                {k === 'imsak' ? t('ims.sahur') : k === 'aksam' ? t('ims.iftar') : t(`prayer.${k}`)}
              </Text>
            ))}
          </View>
          {rows.map((r, i) => {
            const isToday = i === todayIdx;
            const past = r.date.getTime() < dayKey;
            return (
              <View key={i} style={[st.tr, i % 2 === 1 && st.alt, isToday && st.today, past && { opacity: 0.45 }]}>
                <Text style={[st.cell, st.cDay, st.num]}>{i + 1}</Text>
                <Text style={[st.cell, st.cDate]} numberOfLines={1}>
                  {formatDateShort(r.date, lang)} {weekdayShort(r.date, lang)}
                </Text>
                {PRAYER_KEYS.map((k) => (
                  <Text key={k} style={[st.cell, (k === 'imsak' || k === 'aksam') && st.key]}>
                    {fmtTime(r.times[k])}
                  </Text>
                ))}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Text style={st.note}>{t('ims.note')}</Text>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  sub: { color: C.textDim, fontSize: 14, marginTop: -S.sm },
  cdLabel: { color: C.textDim, fontSize: 14 },
  cd: { color: C.accent, fontSize: 40, fontWeight: '800', fontVariant: ['tabular-nums'] },
  starts: { color: C.text, fontSize: 15, lineHeight: 22 },
  table: { backgroundColor: C.card, borderRadius: R.md, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6 },
  th: { backgroundColor: C.bgDeep },
  alt: { backgroundColor: C.cardSoft },
  today: { backgroundColor: C.cardActive, borderLeftWidth: 3, borderLeftColor: C.accent },
  hText: { color: C.textDim, fontWeight: '700', fontSize: 12 },
  cell: { width: 52, color: C.text, fontSize: 13.5, textAlign: 'center', fontVariant: ['tabular-nums'] },
  cDay: { width: 30 },
  cDate: { width: 86, textAlign: 'left' },
  num: { color: C.textDim, fontWeight: '700' },
  key: { color: C.gold, fontWeight: '700' },
  note: { color: C.textMute, fontSize: 12.5, lineHeight: 19 },
}));
