import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Btn, Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { TESBIHAT } from '@/data/tesbihat';
import { useAppState, useT } from '@/lib/app-state';
import { completeTesbihat, tesbihatStore } from '@/lib/tesbihat';

export default function TesbihatScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { lang } = useAppState();
  const tr = lang === 'tr';
  const [step, setStep] = useState(0);
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const stats = tesbihatStore.useValue();

  const s = TESBIHAT[step];
  const advance = () => {
    if (step + 1 >= TESBIHAT.length) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      completeTesbihat();
      setDone(true);
      return;
    }
    setStep(step + 1);
    setCount(0);
  };

  const tap = () => {
    if (s.count === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      advance();
      return;
    }
    const next = count + 1;
    if (next >= s.count) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      advance();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCount(next);
    }
  };

  const restart = () => {
    setStep(0);
    setCount(0);
    setDone(false);
  };

  if (done)
    return (
      <Screen title={t('tesbihat.title')} back>
        <View style={st.doneBox}>
          <Ionicons name="checkmark-circle" size={72} color={C.accent} />
          <Text style={st.doneTitle}>{t('tesbihat.done')}</Text>
          <Text style={st.doneSub}>{t('tesbihat.doneSub', { n: stats.completed })}</Text>
          <Btn label={t('tesbihat.again')} icon="refresh" onPress={restart} />
          <Btn label={t('tesbihat.back')} kind="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );

  return (
    <Screen title={t('tesbihat.title')} back scroll={false}>
      <View style={st.progress}>
        {TESBIHAT.map((x, i) => (
          <View key={x.key} style={[st.pDot, i < step && st.pDone, i === step && st.pNow]} />
        ))}
      </View>

      <Pressable onPress={tap} style={({ pressed }) => [st.main, pressed && { opacity: 0.92 }]}>
        <Text style={st.ar}>{s.ar}</Text>
        <Text style={st.read}>{tr ? s.tr : s.en}</Text>
        <Text style={st.meaning}>{tr ? s.mTr : s.mEn}</Text>
        {s.count > 0 ? (
          <View style={st.counter}>
            <Text style={st.count}>{count}</Text>
            <Text style={st.target}>/ {s.count}</Text>
          </View>
        ) : (
          <Text style={st.tapHint}>{t('tesbihat.tapNext')}</Text>
        )}
      </Pressable>

      {s.quran ? (
        <Btn
          label={t('tesbihat.openKursi')}
          kind="ghost"
          icon="book-outline"
          onPress={() =>
            router.push({ pathname: '/mushaf', params: { sure: String(s.quran!.surah), ayet: String(s.quran!.ayah) } })
          }
        />
      ) : null}
      <View style={st.row}>
        <Btn label={t('tesbihat.skip')} kind="ghost" onPress={advance} />
        <Btn label={t('tesbihat.restart')} kind="ghost" icon="refresh" onPress={restart} />
      </View>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  progress: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  pDot: { width: 26, height: 6, borderRadius: 3, backgroundColor: C.card },
  pDone: { backgroundColor: C.accent },
  pNow: { backgroundColor: C.gold },
  main: {
    flex: 1,
    backgroundColor: C.cardActive,
    borderRadius: R.lg,
    padding: S.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: S.md,
  },
  ar: { color: C.text, fontSize: 30, lineHeight: 58, textAlign: 'center', fontFamily: 'AmiriQuran_400Regular' },
  read: { color: C.gold, fontSize: 17, fontWeight: '700', textAlign: 'center', lineHeight: 24 },
  meaning: { color: C.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  counter: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: S.lg },
  count: { color: C.accent, fontSize: 72, fontWeight: '800', fontVariant: ['tabular-nums'] },
  target: { color: C.textMute, fontSize: 24, fontWeight: '700', marginBottom: 14 },
  tapHint: { color: C.accent, fontSize: 14, fontWeight: '700', marginTop: S.lg },
  row: { flexDirection: 'row', gap: S.sm, justifyContent: 'center' },
  doneBox: { alignItems: 'center', gap: S.md, paddingTop: 60 },
  doneTitle: { color: C.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  doneSub: { color: C.textDim, fontSize: 14, textAlign: 'center' },
}));
