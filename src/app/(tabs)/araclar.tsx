import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ListRow, Screen, type IconName } from '@/components/ui';
import { C, S } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { useT } from '@/lib/app-state';

type Item = { icon: IconName; title: StringKey; sub: StringKey; href: Href };

const WORSHIP: Item[] = [
  { icon: 'book-outline', title: 'tools.hatim', sub: 'tools.hatimSub', href: '/hatim' },
  { icon: 'calendar-outline', title: 'tools.religious', sub: 'tools.religiousSub', href: '/dini-gunler' },
  { icon: 'moon-outline', title: 'tools.imsakiye', sub: 'tools.imsakiyeSub', href: '/imsakiye' },
  { icon: 'sparkles-outline', title: 'tools.esma', sub: 'tools.esmaSub', href: '/esma' },
  { icon: 'ellipse-outline', title: 'tools.zikir', sub: 'tools.zikirSub', href: '/zikirmatik' },
  { icon: 'list-outline', title: 'tools.kaza', sub: 'tools.kazaSub', href: '/kaza' },
  { icon: 'calculator-outline', title: 'tools.zekat', sub: 'tools.zekatSub', href: '/zekat' },
];

const OTHER: Item[] = [
  { icon: 'videocam-outline', title: 'tools.kabe', sub: 'tools.kabeSub', href: '/kabe' },
  { icon: 'location-outline', title: 'tools.mosques', sub: 'tools.mosquesSub', href: '/camiler' },
  { icon: 'settings-outline', title: 'tools.settings', sub: 'tools.settingsSub', href: '/ayarlar' },
];

export default function AraclarScreen() {
  const t = useT();
  const list = (items: Item[]) => (
    <View style={{ gap: S.sm }}>
      {items.map((it) => (
        <ListRow key={it.title} icon={it.icon} title={t(it.title)} subtitle={t(it.sub)} onPress={() => router.push(it.href)} />
      ))}
    </View>
  );
  return (
    <Screen title={t('tools.title')}>
      <Text style={st.group}>{t('tools.worship')}</Text>
      {list(WORSHIP)}
      <Text style={st.group}>{t('tools.other')}</Text>
      {list(OTHER)}
      <Text style={st.soon}>{t('tools.soon')}</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  group: { color: C.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: -S.sm },
  soon: { color: C.textMute, fontSize: 13, lineHeight: 20 },
});
