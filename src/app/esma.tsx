import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/ui';
import { R, S, useColors, makeStyles } from '@/constants/theme';
import { ESMA } from '@/data/esma';
import { useAppState, useT } from '@/lib/app-state';

const fold = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ'’ʿ-]/g, '')
    .replace(/ı/g, 'i');

export default function EsmaScreen() {
  const C = useColors();
  const st = useSt();
  const { lang } = useAppState();
  const t = useT();
  const [q, setQ] = useState('');
  const turkish = lang === 'tr';

  const items = useMemo(() => {
    const all = ESMA.map((e, i) => ({
      n: i + 1,
      ar: e[0],
      name: turkish ? e[1] : e[3],
      meaning: turkish ? e[2] : e[4],
    }));
    const f = fold(q.trim());
    if (!f) return all;
    return all.filter(
      (x) => String(x.n) === f || fold(x.name).includes(f) || fold(x.meaning).includes(f) || x.ar.includes(q.trim()),
    );
  }, [q, turkish]);

  return (
    <Screen title={t('esma.title')} back scroll={false}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder={t('esma.search')}
        placeholderTextColor={C.textMute}
        style={st.search}
      />
      <FlatList
        data={items}
        keyExtractor={(x) => String(x.n)}
        contentContainerStyle={{ gap: S.sm, paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={q ? undefined : <Text style={st.intro}>{t('esma.intro')}</Text>}
        renderItem={({ item }) => (
          <View style={st.card}>
            <View style={st.num}>
              <Text style={st.numText}>{item.n}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={st.name}>{item.name}</Text>
              <Text style={st.meaning}>{item.meaning}</Text>
            </View>
            <Text style={st.ar}>{item.ar}</Text>
          </View>
        )}
      />
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  search: {
    backgroundColor: C.card,
    color: C.text,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingVertical: 12,
    fontSize: 15,
  },
  intro: { color: C.gold, fontSize: 14, lineHeight: 21, textAlign: 'center', fontStyle: 'italic', marginBottom: S.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.md,
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
  },
  num: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.cardSoft, alignItems: 'center', justifyContent: 'center' },
  numText: { color: C.gold, fontWeight: '800', fontSize: 13 },
  name: { color: C.text, fontSize: 16, fontWeight: '700' },
  meaning: { color: C.textDim, fontSize: 13.5, lineHeight: 19 },
  ar: { color: C.gold, fontSize: 26, fontFamily: 'AmiriQuran_400Regular', maxWidth: 140, textAlign: 'right' },
}));
