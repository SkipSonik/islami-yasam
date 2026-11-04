import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ListRow, Screen } from '@/components/ui';
import { C, S } from '@/constants/theme';
import { useT } from '@/lib/app-state';

export default function AraclarScreen() {
  const t = useT();
  return (
    <Screen title={t('tools.title')}>
      <View style={{ gap: S.sm }}>
        <ListRow
          icon="location-outline"
          title={t('tools.mosques')}
          subtitle={t('tools.mosquesSub')}
          onPress={() => router.push('/camiler')}
        />
        <ListRow
          icon="ellipse-outline"
          title={t('tools.zikir')}
          subtitle={t('tools.zikirSub')}
          onPress={() => router.push('/zikirmatik')}
        />
        <ListRow
          icon="list-outline"
          title={t('tools.kaza')}
          subtitle={t('tools.kazaSub')}
          onPress={() => router.push('/kaza')}
        />
        <ListRow
          icon="settings-outline"
          title={t('tools.settings')}
          subtitle={t('tools.settingsSub')}
          onPress={() => router.push('/ayarlar')}
        />
      </View>

      <Text style={st.soon}>{t('tools.soon')}</Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  soon: { color: C.textMute, fontSize: 13, lineHeight: 20 },
});
