import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ListRow, Screen, type IconName } from '@/components/ui';
import { S, useColors, makeStyles } from '@/constants/theme';
import type { StringKey } from '@/i18n';
import { maybeShowInterstitial } from '@/lib/ads';
import { useT } from '@/lib/app-state';

type Item = { icon: IconName; title: StringKey; sub: StringKey; href: Href };

const WORSHIP: Item[] = [
  { icon: 'water-outline', title: 'tools.rehber', sub: 'tools.rehberSub', href: '/rehber' },
  { icon: 'checkmark-done-outline', title: 'tools.tracker', sub: 'tools.trackerSub', href: '/namaz-takip' },
  { icon: 'moon-outline', title: 'tools.ramazan', sub: 'tools.ramazanSub', href: '/ramazan' },
  { icon: 'book-outline', title: 'tools.hatim', sub: 'tools.hatimSub', href: '/hatim' },
  { icon: 'reader-outline', title: 'tools.reading', sub: 'tools.readingSub', href: '/okuma-plani' },
  { icon: 'infinite-outline', title: 'tools.tesbihat', sub: 'tools.tesbihatSub', href: '/tesbihat' },
  { icon: 'heart-outline', title: 'tools.dualar', sub: 'tools.dualarSub', href: '/dualar' },
  { icon: 'calendar-outline', title: 'tools.religious', sub: 'tools.religiousSub', href: '/dini-gunler' },
  { icon: 'time-outline', title: 'tools.imsakiye', sub: 'tools.imsakiyeSub', href: '/imsakiye' },
  { icon: 'sparkles-outline', title: 'tools.esma', sub: 'tools.esmaSub', href: '/esma' },
  { icon: 'ellipse-outline', title: 'tools.zikir', sub: 'tools.zikirSub', href: '/zikirmatik' },
  { icon: 'list-outline', title: 'tools.kaza', sub: 'tools.kazaSub', href: '/kaza' },
  { icon: 'calculator-outline', title: 'tools.zekat', sub: 'tools.zekatSub', href: '/zekat' },
];

const OTHER: Item[] = [
  { icon: 'diamond-outline', title: 'tools.premium', sub: 'tools.premiumSub', href: '/premium' },
  { icon: 'ribbon-outline', title: 'tools.badges', sub: 'tools.badgesSub', href: '/rozetler' },
  { icon: 'videocam-outline', title: 'tools.kabe', sub: 'tools.kabeSub', href: '/kabe' },
  { icon: 'location-outline', title: 'tools.mosques', sub: 'tools.mosquesSub', href: '/camiler' },
  { icon: 'settings-outline', title: 'tools.settings', sub: 'tools.settingsSub', href: '/ayarlar' },
];

export default function AraclarScreen() {
  // Bir araçtan geri dönüldüğünde (ilk açılışta değil) geçiş reklamı gösterilebilir
  const visits = useRef(0);
  useFocusEffect(
    useCallback(() => {
      if (visits.current++ > 0) maybeShowInterstitial();
    }, []),
  );
  const st = useSt();
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

const useSt = makeStyles((C) => ({
  group: { color: C.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: -S.sm },
  soon: { color: C.textMute, fontSize: 13, lineHeight: 20 },
}));
