import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Text, View } from 'react-native';

import { Btn, Card, Screen } from '@/components/ui';
import { S, makeStyles, useColors } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { useT } from '@/lib/app-state';
import { usePremium } from '@/lib/premium-context';
import { premiumStore } from '@/lib/premium-store';

const BENEFITS: { icon: 'ban-outline' | 'heart-outline' | 'flash-outline' | 'sparkles-outline'; key: StringKey }[] = [
  { icon: 'ban-outline', key: 'premium.b1' },
  { icon: 'flash-outline', key: 'premium.b2' },
  { icon: 'sparkles-outline', key: 'premium.b3' },
  { icon: 'heart-outline', key: 'premium.b4' },
];

export default function PremiumScreen() {
  const C = useColors();
  const st = useSt();
  const t = useT();
  const active = premiumStore.useValue().active;
  const { available, price, busy, error, buy, restore } = usePremium();

  return (
    <Screen title={t('premium.title')} back>
      <View style={st.hero}>
        <View style={st.badge}>
          <Ionicons name="diamond" size={40} color={C.onAccent} />
        </View>
        <Text style={st.heading}>{active ? t('premium.thanks') : t('premium.heading')}</Text>
        <Text style={st.sub}>{active ? t('premium.thanksSub') : t('premium.sub')}</Text>
      </View>

      <Card>
        {BENEFITS.map((b) => (
          <View key={b.key} style={st.row}>
            <Ionicons name={b.icon} size={22} color={C.accent} />
            <Text style={st.benefit}>{t(b.key)}</Text>
          </View>
        ))}
      </Card>

      {!active ? (
        <>
          {busy ? (
            <ActivityIndicator color={C.accent} />
          ) : (
            <Btn
              label={price ? t('premium.buyPrice', { price }) : t('premium.buy')}
              icon="diamond-outline"
              onPress={buy}
            />
          )}
          {!available && !busy ? <Text style={st.note}>{t('premium.unavailable')}</Text> : null}
          <Btn label={t('premium.restore')} kind="ghost" icon="refresh" onPress={restore} />
          {error ? <Text style={[st.note, { color: C.danger }]}>{error}</Text> : null}
          <Text style={st.note}>{t('premium.legal')}</Text>
        </>
      ) : null}
    </Screen>
  );
}

const useSt = makeStyles((C) => ({
  hero: { alignItems: 'center', gap: S.sm, paddingVertical: S.md },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: C.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { color: C.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  sub: { color: C.textDim, fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  benefit: { color: C.text, fontSize: 15, flex: 1, lineHeight: 21 },
  note: { color: C.textMute, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },
}));
