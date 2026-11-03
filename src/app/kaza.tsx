import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { C, R, S } from '@/constants/theme';
import { loadJSON, saveJSON } from '@/lib/storage';

const ITEMS = [
  { key: 'sabah', label: 'Sabah' },
  { key: 'ogle', label: 'Öğle' },
  { key: 'ikindi', label: 'İkindi' },
  { key: 'aksam', label: 'Akşam' },
  { key: 'yatsi', label: 'Yatsı' },
  { key: 'vitir', label: 'Vitir' },
] as const;

type Key = (typeof ITEMS)[number]['key'];
type Counts = Record<Key, number>;
const ZERO: Counts = { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0, vitir: 0 };
const KEY = 'kaza-v1';

export default function KazaScreen() {
  const [c, setC] = useState<Counts>(ZERO);

  useEffect(() => {
    loadJSON<Counts>(KEY, ZERO).then(setC);
  }, []);

  const set = (k: Key, v: number) => {
    const next = { ...c, [k]: Math.max(0, Math.min(99999, v)) };
    setC(next);
    saveJSON(KEY, next);
  };

  const total = Object.values(c).reduce((a, b) => a + b, 0);

  return (
    <Screen title="Kaza Takibi" back>
      <Card style={{ backgroundColor: C.cardActive, alignItems: 'center' }}>
        <Text style={st.totalLabel}>Toplam kaza borcu</Text>
        <Text style={st.total}>{total}</Text>
        <Text style={st.hint}>Sayıya dokunarak doğrudan yazabilir, kıldıkça "−" ile düşebilirsin.</Text>
      </Card>

      {ITEMS.map((it) => (
        <View key={it.key} style={st.row}>
          <Text style={st.label}>{it.label}</Text>
          <Pressable
            style={st.btn}
            onPress={() => {
              if (c[it.key] > 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              set(it.key, c[it.key] - 1);
            }}>
            <Ionicons name="remove" size={22} color={C.danger} />
          </Pressable>
          <TextInput
            style={st.input}
            keyboardType="number-pad"
            value={String(c[it.key])}
            selectTextOnFocus
            onChangeText={(t) => set(it.key, parseInt(t.replace(/\D/g, '') || '0', 10))}
          />
          <Pressable style={st.btn} onPress={() => set(it.key, c[it.key] + 1)}>
            <Ionicons name="add" size={22} color={C.accent} />
          </Pressable>
        </View>
      ))}
    </Screen>
  );
}

const st = StyleSheet.create({
  totalLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  total: { color: C.text, fontSize: 48, fontWeight: '800' },
  hint: { color: C.textDim, fontSize: 12, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    gap: S.sm,
  },
  label: { flex: 1, color: C.text, fontSize: 17, fontWeight: '700' },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    minWidth: 70,
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
