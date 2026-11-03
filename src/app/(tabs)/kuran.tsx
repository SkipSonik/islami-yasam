import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, R, S } from '@/constants/theme';
import { normalizeTr, SURAHS } from '@/data/surahs';
import { isSurahCached } from '@/lib/quran';

export default function KuranScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [, setTick] = useState(0);

  // Sayfaya her dönüşte "indirildi" işaretlerini tazele.
  useFocusEffect(useCallback(() => setTick((t) => t + 1), []));

  const list = useMemo(() => {
    const n = normalizeTr(q.trim());
    if (!n) return SURAHS;
    return SURAHS.filter((s) => normalizeTr(s.name).includes(n) || String(s.number) === n);
  }, [q]);

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      <View style={st.head}>
        <Text style={st.title}>Kur'an-ı Kerim</Text>
        <Text style={st.sub}>Açtığın sureler telefona kaydedilir, sonra internetsiz okunur.</Text>
        <View style={st.search}>
          <Ionicons name="search" size={18} color={C.textMute} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Sure ara (ad veya numara)"
            placeholderTextColor={C.textMute}
            style={st.input}
          />
        </View>
      </View>
      <FlatList
        data={list}
        keyExtractor={(s) => String(s.number)}
        contentContainerStyle={{ padding: S.lg, paddingTop: 0, gap: S.sm }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/kuran/${item.number}`)}
            style={({ pressed }) => [st.row, pressed && { backgroundColor: C.cardSoft }]}>
            <View style={st.num}>
              <Text style={st.numText}>{item.number}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={st.name}>{item.name}</Text>
              <Text style={st.meta}>{item.ayahs} ayet</Text>
            </View>
            {isSurahCached(item.number) ? (
              <Ionicons name="checkmark-circle" size={18} color={C.accent} />
            ) : (
              <Ionicons name="cloud-download-outline" size={18} color={C.textMute} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  head: { padding: S.lg, gap: S.sm },
  title: { color: C.text, fontSize: 22, fontWeight: '700' },
  sub: { color: C.textDim, fontSize: 13 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: C.card,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    marginTop: S.sm,
  },
  input: { flex: 1, color: C.text, fontSize: 15, paddingVertical: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
  },
  num: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  numText: { color: C.gold, fontWeight: '700', transform: [{ rotate: '-45deg' }] },
  name: { color: C.text, fontSize: 16, fontWeight: '600' },
  meta: { color: C.textDim, fontSize: 12, marginTop: 2 },
});
