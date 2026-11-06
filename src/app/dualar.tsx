import { useState } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import { DUA_CATS, LIFE_DUAS, type DuaCat } from '@/data/dualar';
import type { StringKey } from '@/i18n';
import { useAppState, useT } from '@/lib/app-state';

export default function DualarScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const { lang } = useAppState();
  const tr = lang === 'tr';
  const [cat, setCat] = useState<DuaCat | 'all'>('all');
  const list = cat === 'all' ? LIFE_DUAS : LIFE_DUAS.filter((d) => d.cat === cat);

  return (
    <Screen title={t('dua.title')} back>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: S.sm }}>
        {(['all', ...DUA_CATS] as const).map((c) => {
          const on = c === cat;
          return (
            <Pressable key={c} onPress={() => setCat(c)} style={[st.chip, on && st.chipOn]}>
              <Text style={[st.chipText, on && { color: C.onAccent }]}>{t(`dua.cat.${c}` as StringKey)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {list.map((d) => (
        <Card key={d.id}>
          <View style={st.head}>
            <Text style={st.title}>{tr ? d.titleTr : d.titleEn}</Text>
            {d.times ? <Text style={st.times}>{t('dua.times', { n: d.times })}</Text> : null}
          </View>
          <Text style={st.ar}>{d.ar}</Text>
          <Text style={st.read}>{tr ? d.tr : d.en}</Text>
          <Text style={st.meaning}>{tr ? d.mTr : d.mEn}</Text>
          <Text style={st.src}>{d.src}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: C.card },
  chipOn: { backgroundColor: C.accent },
  chipText: { color: C.textDim, fontWeight: '700', fontSize: 13 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: S.sm },
  title: { color: C.text, fontSize: 16, fontWeight: '800', flex: 1 },
  times: {
    color: C.gold,
    fontSize: 12,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: R.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  ar: { color: C.gold, fontSize: 23, lineHeight: 44, textAlign: 'right', fontFamily: 'AmiriQuran_400Regular' },
  read: { color: C.text, fontSize: 14.5, lineHeight: 21, fontStyle: 'italic' },
  meaning: { color: C.textDim, fontSize: 14, lineHeight: 21 },
  src: { color: C.textMute, fontSize: 12 },
}));
