import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ListRow, Screen } from '@/components/ui';
import { C, S } from '@/constants/theme';

export default function AraclarScreen() {
  return (
    <Screen title="Araçlar">
      <View style={{ gap: S.sm }}>
        <ListRow
          icon="location-outline"
          title="Yakındaki Camiler"
          subtitle="En yakın camiler, uzaklık ve yol tarifi"
          onPress={() => router.push('/camiler')}
        />
        <ListRow
          icon="ellipse-outline"
          title="Zikirmatik"
          subtitle="Dijital tesbih, hedef sayılı"
          onPress={() => router.push('/zikirmatik')}
        />
        <ListRow
          icon="list-outline"
          title="Kaza Namazı Takibi"
          subtitle="Borç namazlarını say, kıldıkça düş"
          onPress={() => router.push('/kaza')}
        />
        <ListRow
          icon="settings-outline"
          title="Ayarlar"
          subtitle="Konum, bildirimler, Hicri tarih düzeltmesi"
          onPress={() => router.push('/ayarlar')}
        />
      </View>

      <Text style={st.soon}>
        Sıradaki sürümde: Esmaül Hüsna, dini günler ve kandiller, abdest ve namaz rehberi,
        ezan sesi ve ana ekran widget'ı.
      </Text>
    </Screen>
  );
}

const st = StyleSheet.create({
  soon: { color: C.textMute, fontSize: 13, lineHeight: 20 },
});
