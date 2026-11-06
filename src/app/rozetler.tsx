import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { R, S, makeStyles, useColors } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { useT } from '@/lib/app-state';
import { computeBadges, type Badge } from '@/lib/badges';

export default function RozetlerScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const [badges, setBadges] = useState<Badge[]>([]);

  useFocusEffect(
    useCallback(() => {
      computeBadges().then(setBadges);
    }, []),
  );

  const earned = badges.filter((b) => b.value >= b.goal).length;

  return (
    <Screen title={t('badges.title')} back>
      <Text style={st.summary}>{t('badges.summary', { n: earned, total: badges.length })}</Text>
      <View style={st.grid}>
        {badges.map((b) => {
          const done = b.value >= b.goal;
          return (
            <View key={b.id} style={[st.badge, done && st.badgeOn]}>
              <View style={[st.icon, done && { backgroundColor: C.gold }]}>
                <Ionicons name={done ? b.icon : 'lock-closed-outline'} size={26} color={done ? C.onAccent : C.textMute} />
              </View>
              <Text style={[st.name, !done && { color: C.textDim }]} numberOfLines={2}>
                {t(`badges.${b.id}` as StringKey)}
              </Text>
              <Text style={st.desc} numberOfLines={2}>
                {t(`badges.${b.id}Desc` as StringKey)}
              </Text>
              {!done && b.goal > 1 ? (
                <View style={st.bar}>
                  <View style={[st.barFill, { width: `${(b.value / b.goal) * 100}%` }]} />
                </View>
              ) : null}
              {!done && b.goal > 1 ? (
                <Text style={st.progress}>
                  {b.value}/{b.goal}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  summary: { color: C.textDim, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: S.sm, justifyContent: 'space-between' },
  badge: {
    width: '48.5%',
    backgroundColor: C.card,
    borderRadius: R.md,
    padding: S.md,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  badgeOn: { borderColor: C.gold },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.bgDeep, alignItems: 'center', justifyContent: 'center' },
  name: { color: C.text, fontSize: 14.5, fontWeight: '800', textAlign: 'center' },
  desc: { color: C.textMute, fontSize: 12, textAlign: 'center', lineHeight: 16 },
  bar: { alignSelf: 'stretch', height: 5, borderRadius: 3, backgroundColor: C.bgDeep, overflow: 'hidden' },
  barFill: { height: 5, backgroundColor: C.accent },
  progress: { color: C.textDim, fontSize: 11.5 },
}));
