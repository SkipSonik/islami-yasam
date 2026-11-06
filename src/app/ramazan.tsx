import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { Btn, Card, Screen, SectionTitle } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { formatDateLong } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { NOTIFY_EXTRA_DEFAULTS } from '@/lib/notifications';
import { fmtTime, getDayTimes } from '@/lib/prayer';
import { cycleFast, fastCount, fastStore, missedCount } from '@/lib/ramadan';
import { daysUntil, ramadanDays } from '@/lib/religious-days';
import { dayKey } from '@/lib/tracker';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');
const SAHUR_OPTIONS = [15, 30, 45, 60, 90];

export default function RamazanScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { settings, lang, calc, update } = useAppState();
  const { place, hijriOffset, notify } = settings;
  const x = { ...NOTIFY_EXTRA_DEFAULTS, ...notify };
  const now = useNow(1000);
  const today = startOfDay(now);
  const todayMs = today.getTime();
  const fasts = fastStore.useValue();

  const days = useMemo(() => ramadanDays(new Date(todayMs), hijriOffset), [todayMs, hijriOffset]);
  const inRamadan = toHijri(today, hijriOffset).month === 9;
  const times = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(todayMs), calc),
    [place.lat, place.lng, todayMs, calc],
  );
  const tomorrow = useMemo(
    () => getDayTimes(place.lat, place.lng, new Date(todayMs + 86400000), calc),
    [place.lat, place.lng, todayMs, calc],
  );

  let cd: { label: string; ms: number } | null = null;
  if (inRamadan) {
    if (now < times.imsak) cd = { label: t('ims.toSahur'), ms: times.imsak.getTime() - now.getTime() };
    else if (now < times.aksam) cd = { label: t('ims.toIftar'), ms: times.aksam.getTime() - now.getTime() };
    else cd = { label: t('ims.toSahur'), ms: tomorrow.imsak.getTime() - now.getTime() };
  }
  const dayNo = days.findIndex((d) => d.getTime() === todayMs) + 1;
  const startsIn = daysUntil(days[0], now);

  return (
    <Screen title={t('ramazan.title')} back>
      <Card style={{ backgroundColor: C.cardActive, alignItems: 'center' }}>
        <Ionicons name="moon" size={30} color={C.gold} />
        {inRamadan && cd ? (
          <>
            <Text style={st.day}>{t('ramazan.dayOf', { n: dayNo, total: days.length })}</Text>
            <Text style={st.cdLabel}>{cd.label}</Text>
            <Text style={st.cd}>
              {pad(Math.floor(cd.ms / 3600000))}:{pad(Math.floor((cd.ms % 3600000) / 60000))}:
              {pad(Math.floor((cd.ms % 60000) / 1000))}
            </Text>
          </>
        ) : (
          <>
            <Text style={st.day}>{t('ramazan.countdown', { n: startsIn })}</Text>
            <Text style={st.cdLabel}>{formatDateLong(days[0], lang)}</Text>
          </>
        )}
        <View style={st.timesRow}>
          <View style={st.timeBox}>
            <Text style={st.timeLabel}>{t('ims.sahur')}</Text>
            <Text style={st.time}>{fmtTime(times.imsak)}</Text>
          </View>
          <View style={st.timeBox}>
            <Text style={st.timeLabel}>{t('ims.iftar')}</Text>
            <Text style={st.time}>{fmtTime(times.aksam)}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <SectionTitle icon="calendar-outline">{t('ramazan.fasts')}</SectionTitle>
        <Text style={st.hint}>{t('ramazan.fastsHint')}</Text>
        <View style={st.grid}>
          {days.map((d, i) => {
            const mark = fasts[dayKey(d)];
            const future = d.getTime() > todayMs;
            return (
              <Pressable
                key={i}
                disabled={future}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  cycleFast(d);
                }}
                style={[
                  st.cell,
                  mark === 1 && { backgroundColor: C.accent },
                  mark === 2 && { backgroundColor: C.dangerBg, borderColor: C.danger },
                  d.getTime() === todayMs && { borderColor: C.gold },
                  future && { opacity: 0.4 },
                ]}>
                <Text style={[st.cellText, mark === 1 && { color: C.onAccent }]}>{i + 1}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={st.statsRow}>
          <Text style={st.stat}>{t('ramazan.kept', { n: fastCount(fasts) })}</Text>
          <Text style={[st.stat, { color: C.danger }]}>{t('ramazan.missed', { n: missedCount(fasts) })}</Text>
        </View>
        {!inRamadan ? (
          <Btn
            label={fasts[dayKey(today)] === 1 ? t('ramazan.nafileDone') : t('ramazan.nafile')}
            kind="ghost"
            icon="add-circle-outline"
            onPress={() => cycleFast(today)}
          />
        ) : null}
      </Card>

      <Card>
        <SectionTitle icon="notifications-outline">{t('ramazan.notif')}</SectionTitle>
        <View style={st.switchRow}>
          <Text style={st.switchLabel}>{t('ramazan.notifToggle')}</Text>
          <Switch
            value={x.ramazan}
            onValueChange={(v) => update({ notify: { ...notify, ramazan: v } })}
            trackColor={{ true: C.accent, false: C.border }}
          />
        </View>
        {x.ramazan ? (
          <>
            <Text style={st.hint}>{t('ramazan.sahurBefore')}</Text>
            <View style={st.chips}>
              {SAHUR_OPTIONS.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => update({ notify: { ...notify, sahurBefore: n } })}
                  style={[st.chip, x.sahurBefore === n && st.chipOn]}>
                  <Text style={[st.chipText, x.sahurBefore === n && { color: C.onAccent }]}>
                    {t('common.minutes', { n })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
      </Card>

      <Btn label={t('ramazan.imsakiye')} icon="list-outline" onPress={() => router.push('/imsakiye')} />
      <Btn label={t('ramazan.duas')} kind="ghost" icon="book-outline" onPress={() => router.push('/dualar')} />
      <Text style={st.hint}>{t('ramazan.teravih')}</Text>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  day: { color: C.text, fontSize: 18, fontWeight: '800', marginTop: 4, textAlign: 'center' },
  cdLabel: { color: C.textDim, fontSize: 14 },
  cd: { color: C.accent, fontSize: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
  timesRow: { flexDirection: 'row', gap: S.sm, alignSelf: 'stretch', marginTop: S.sm },
  timeBox: { flex: 1, backgroundColor: C.card, borderRadius: R.sm, padding: S.md, alignItems: 'center' },
  timeLabel: { color: C.textDim, fontSize: 13 },
  time: { color: C.gold, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  hint: { color: C.textMute, fontSize: 12.5, lineHeight: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: R.sm,
    backgroundColor: C.bgDeep,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellText: { color: C.text, fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { color: C.text, fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: C.text, fontSize: 15, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: C.cardSoft },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.textDim, fontWeight: '700', fontSize: 13 },
}));
