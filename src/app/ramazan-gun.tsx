import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FocusPressable } from '@/components/focus-pressable';
import { Card, Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { LIFE_DUAS } from '@/data/dualar';
import { dayContent, refreshRamazanContent, remoteStore, rg } from '@/data/ramazan-gun';
import { formatDateLong, hijriMonthName } from '@/i18n';
import { useAppState } from '@/lib/app-state';
import { startOfDay } from '@/lib/dates';
import { toHijri } from '@/lib/hijri';
import { IS_TV, useLayout } from '@/lib/layout';
import { cycleFast, fastStore } from '@/lib/ramadan';
import { fmtTime, getDayTimes } from '@/lib/prayer';
import { ramadanDays } from '@/lib/religious-days';
import { dayKey } from '@/lib/tracker';
import { useNow } from '@/lib/use-now';

const pad = (n: number) => String(n).padStart(2, '0');
const hms = (ms: number) =>
  `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor((ms % 3600000) / 60000))}:${pad(Math.floor((ms % 60000) / 1000))}`;

/**
 * Ramazan gün sayfası: iftara/sahura geri sayım, günün iftar menüsü, iftar duası ve günün düşüncesi.
 * /ramazan-gun?i=<1 tabanlı Ramazan günü>  (yoksa bugün; Ramazan dışındaysa 1. gün)
 */
export default function RamazanGunScreen() {
  const C = useColors();
  const st = useSt();
  const { settings, lang, calc } = useAppState();
  const { place, hijriOffset } = settings;
  const { wide } = useLayout();
  const params = useLocalSearchParams<{ i?: string }>();
  const now = useNow(1000);
  const todayMs = startOfDay(now).getTime();
  const remote = remoteStore.useValue().data;
  const fasts = fastStore.useValue();

  useEffect(() => {
    refreshRamazanContent();
  }, []);

  const days = useMemo(() => ramadanDays(new Date(todayMs), hijriOffset), [todayMs, hijriOffset]);
  const todayIdx = days.findIndex((d) => d.getTime() === todayMs);
  const wanted = Number(params.i);
  const idx = Math.min(
    Math.max((Number.isFinite(wanted) && wanted >= 1 ? wanted : todayIdx >= 0 ? todayIdx + 1 : 1) - 1, 0),
    Math.max(days.length - 1, 0),
  );
  const day = days[idx];
  const times = useMemo(
    () => (day ? getDayTimes(place.lat, place.lng, day, calc) : null),
    [day, place.lat, place.lng, calc],
  );
  if (!day || !times) {
    return (
      <Screen title="Ramazan" back>
        <Text style={st.dim}>{rg(lang, 'notFound')}</Text>
      </Screen>
    );
  }

  const n = idx + 1;
  const isToday = idx === todayIdx;
  const { menu, thought } = dayContent(n, lang, remote);
  const h = toHijri(day, hijriOffset);
  const iftarDua = LIFE_DUAS.find((d) => d.id === 'iftar');
  const kadirDua = n >= 20 ? LIFE_DUAS.find((d) => d.id === 'kadir') : undefined;
  const fastMs = times.aksam.getTime() - times.imsak.getTime();
  const fastH = Math.floor(fastMs / 3600000);
  const fastM = Math.round((fastMs % 3600000) / 60000);

  // Geri sayım yalnızca bugün için anlamlıdır.
  let label = '';
  let left = 0;
  let progress = 0;
  let finished = false;
  if (isToday) {
    if (now < times.imsak) {
      label = rg(lang, 'toSahur');
      left = times.imsak.getTime() - now.getTime();
    } else if (now < times.aksam) {
      label = rg(lang, 'toIftar');
      left = times.aksam.getTime() - now.getTime();
      progress = (now.getTime() - times.imsak.getTime()) / fastMs;
    } else finished = true;
  }

  const mark = fasts[dayKey(day)];
  const go = (i: number) => router.replace({ pathname: '/ramazan-gun', params: { i: String(i) } });
  const dateText = `${formatDateLong(day, lang)} · ${h.day} ${hijriMonthName(h.month, lang)} ${h.year} · ${place.name}`;

  const countdown = (
    <Card style={st.cdCard}>
      {isToday ? (
        finished ? (
          <Text style={st.done}>{rg(lang, 'done')}</Text>
        ) : (
          <>
            <Text style={st.cdLabel}>{label}</Text>
            <Text style={st.cd} numberOfLines={1} adjustsFontSizeToFit>
              {hms(left)}
            </Text>
            {progress > 0 ? (
              <View style={st.bar}>
                <View style={[st.barFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
              </View>
            ) : null}
          </>
        )
      ) : (
        <Text style={st.cdLabel}>{dateText}</Text>
      )}
      <View style={st.pair}>
        <View style={st.pairBox}>
          <Text style={st.pairLabel}>{rg(lang, 'sahur')}</Text>
          <Text style={st.pairTime}>{fmtTime(times.imsak)}</Text>
        </View>
        <View style={st.pairBox}>
          <Text style={st.pairLabel}>{rg(lang, 'iftar')}</Text>
          <Text style={st.pairTime}>{fmtTime(times.aksam)}</Text>
        </View>
        <View style={st.pairBox}>
          <Text style={st.pairLabel}>{rg(lang, 'fast')}</Text>
          <Text style={st.pairTime}>
            {fastH}:{pad(fastM)}
          </Text>
        </View>
      </View>
    </Card>
  );

  const menuCard = (
    <Card>
      <Text style={st.head}>{rg(lang, 'menu')}</Text>
      <Text style={st.menu}>{menu}</Text>
      <Text style={st.small}>{rg(lang, 'menuNote')}</Text>
    </Card>
  );

  const duaCard = iftarDua ? (
    <Card style={{ backgroundColor: C.cardActive }}>
      <Text style={st.kicker}>{rg(lang, 'dua').toUpperCase()}</Text>
      <Text style={st.arabic}>{iftarDua.ar}</Text>
      <Text style={st.duaRead}>{iftarDua.tr}</Text>
      <Text style={st.dim}>{lang === 'tr' ? iftarDua.mTr : iftarDua.mEn}</Text>
      <Text style={st.small}>{iftarDua.src}</Text>
    </Card>
  ) : null;

  const kadirCard = kadirDua ? (
    <Card>
      <Text style={st.kicker}>{rg(lang, 'kadir').toUpperCase()}</Text>
      <Text style={st.arabic}>{kadirDua.ar}</Text>
      <Text style={st.duaRead}>{kadirDua.tr}</Text>
      <Text style={st.dim}>{lang === 'tr' ? kadirDua.mTr : kadirDua.mEn}</Text>
      <Text style={st.small}>{kadirDua.src}</Text>
    </Card>
  ) : null;

  const thoughtCard = (
    <Card>
      <Text style={[st.kicker, { color: C.gold }]}>{rg(lang, 'thought').toUpperCase()}</Text>
      <Text style={st.thought}>{thought}</Text>
      {isToday ? (
        <Pressable
          onPress={() => cycleFast(day)}
          style={({ pressed }) => [st.fastBtn, mark === 1 && st.fastBtnOn, pressed && { opacity: 0.85 }]}>
          <Ionicons name={mark === 1 ? 'checkmark-circle' : 'checkmark-circle-outline'} size={20} color={C.onAccent} />
          <Text style={st.fastText}>{mark ? rg(lang, 'keptDone') : rg(lang, 'kept')}</Text>
        </Pressable>
      ) : null}
    </Card>
  );

  const nav = (
    <View style={st.nav}>
      {idx > 0 ? (
        <NavBtn label={rg(lang, 'prev', { n: n - 1 })} onPress={() => go(n - 1)} first={IS_TV} />
      ) : null}
      {idx < days.length - 1 ? (
        <NavBtn label={rg(lang, 'next', { n: n + 1 })} onPress={() => go(n + 1)} first={IS_TV && idx === 0} />
      ) : null}
      <NavBtn label={rg(lang, 'list')} onPress={() => router.push('/imsakiye')} />
    </View>
  );

  return (
    <Screen title={rg(lang, 'title', { n })} back wide>
      {isToday ? <Text style={st.dim}>{dateText}</Text> : null}
      {wide ? (
        <View style={st.cols}>
          <View style={st.col}>
            {countdown}
            {thoughtCard}
          </View>
          <View style={st.col}>
            {menuCard}
            {duaCard}
            {kadirCard}
          </View>
        </View>
      ) : (
        <>
          {countdown}
          {menuCard}
          {duaCard}
          {kadirCard}
          {thoughtCard}
        </>
      )}
      {nav}
    </Screen>
  );
}

function NavBtn({ label, onPress, first }: { label: string; onPress: () => void; first?: boolean }) {
  const st = useSt();
  return (
    <FocusPressable onPress={onPress} hasTVPreferredFocus={first} style={st.navBtn} focusStyle={st.navFocus}>
      <Text style={st.navText}>{label}</Text>
    </FocusPressable>
  );
}

const useSt = makeStyles((C) => ({
  cols: { flexDirection: 'row', gap: S.md, alignItems: 'flex-start' },
  col: { flex: 1, gap: S.md },
  dim: { color: C.textDim, fontSize: 14, lineHeight: 21 },
  small: { color: C.textMute, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  cdCard: { alignItems: 'center', gap: 6 },
  cdLabel: { color: C.textDim, fontSize: 15, textAlign: 'center' },
  cd: { color: C.accent, fontSize: 52, fontWeight: '800', fontVariant: ['tabular-nums'], maxWidth: '100%' },
  done: { color: C.text, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  bar: { alignSelf: 'stretch', height: 8, borderRadius: 4, backgroundColor: C.bgDeep, marginTop: 6 },
  barFill: { height: 8, borderRadius: 4, backgroundColor: C.gold },
  pair: { flexDirection: 'row', gap: S.sm, alignSelf: 'stretch', marginTop: S.sm },
  pairBox: { flex: 1, backgroundColor: C.cardSoft, borderRadius: R.md, paddingVertical: 10, alignItems: 'center' },
  pairLabel: { color: C.textDim, fontSize: 12 },
  pairTime: { color: C.gold, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'] },
  head: { color: C.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  menu: { color: C.text, fontSize: 17, lineHeight: 26 },
  kicker: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  arabic: { color: C.text, fontSize: 24, lineHeight: 42, textAlign: 'right', marginTop: 8 },
  duaRead: { color: C.text, fontSize: 16, lineHeight: 24, marginVertical: 6 },
  thought: { color: C.text, fontSize: 17, lineHeight: 26, marginTop: 6 },
  fastBtn: {
    marginTop: S.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
    borderRadius: R.md,
    backgroundColor: C.accent,
    paddingHorizontal: 16,
  },
  fastBtnOn: { backgroundColor: C.gold },
  fastText: { color: C.onAccent, fontSize: 15, fontWeight: '700' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, marginTop: S.sm },
  navBtn: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: R.md,
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
  },
  navFocus: { borderColor: C.text, backgroundColor: C.cardActive },
  navText: { color: C.text, fontSize: 15, fontWeight: '700' },
}));
