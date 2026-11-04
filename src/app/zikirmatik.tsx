import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Btn, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { useT } from '@/lib/app-state';
import { loadJSON, saveJSON } from '@/lib/storage';

const TARGETS = [33, 99, 100, 0]; // 0 = sınırsız
const KEY = 'zikirmatik-v1';

type State = { count: number; target: number; rounds: number; total: number };

export default function ZikirmatikScreen() {
  const [s, setS] = useState<State>({ count: 0, target: 33, rounds: 0, total: 0 });
  const tr = useT();

  useEffect(() => {
    loadJSON<State>(KEY, s).then(setS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (next: State) => {
    setS(next);
    saveJSON(KEY, next);
  };

  const tap = () => {
    const count = s.count + 1;
    if (s.target > 0 && count >= s.target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      set({ ...s, count: 0, rounds: s.rounds + 1, total: s.total + 1 });
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      set({ ...s, count, total: s.total + 1 });
    }
  };

  const reset = () =>
    Alert.alert(tr('zikir.reset'), tr('zikir.resetAsk'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('zikir.reset'), style: 'destructive', onPress: () => set({ ...s, count: 0, rounds: 0, total: 0 }) },
    ]);

  return (
    <Screen title={tr('zikir.title')} back scroll={false}>
      <View style={st.targets}>
        {TARGETS.map((t) => (
          <Pressable
            key={t}
            onPress={() => set({ ...s, target: t, count: 0 })}
            style={[st.chip, s.target === t && st.chipOn]}>
            <Text style={[st.chipText, s.target === t && { color: C.bgDeep }]}>{t === 0 ? '∞' : t}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={tap} style={({ pressed }) => [st.pad, pressed && { transform: [{ scale: 0.98 }] }]}>
        <Text style={st.count}>{s.count}</Text>
        {s.target > 0 ? <Text style={st.of}>/ {s.target}</Text> : null}
        <Text style={st.tapHint}>{tr('zikir.tap')}</Text>
      </Pressable>

      <View style={st.stats}>
        <Stat label={tr('zikir.rounds')} value={s.rounds} />
        <Stat label={tr('zikir.total')} value={s.total} />
      </View>

      <Btn label={tr('zikir.reset')} kind="danger" icon="refresh" onPress={reset} />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={st.stat}>
      <Text style={st.statVal}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  targets: { flexDirection: 'row', gap: S.sm, justifyContent: 'center' },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.text, fontWeight: '700', fontSize: 15 },
  pad: {
    flex: 1,
    backgroundColor: C.cardActive,
    borderRadius: R.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  count: { color: C.text, fontSize: 96, fontWeight: '800', fontVariant: ['tabular-nums'] },
  of: { color: C.textDim, fontSize: 20 },
  tapHint: { color: C.textMute, fontSize: 13, marginTop: S.md },
  stats: { flexDirection: 'row', gap: S.md },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: R.md, padding: S.md, alignItems: 'center' },
  statVal: { color: C.gold, fontSize: 22, fontWeight: '800' },
  statLabel: { color: C.textDim, fontSize: 12 },
});
