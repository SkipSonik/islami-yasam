import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { C, R, S } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import {
  ensureNotificationPermission,
  isReliable,
  openAppSettings,
  requestBatteryExemption,
  requestExactAlarms,
} from '@/lib/notifications';

import { Card, SectionTitle } from './ui';

// Ana sayfada: ayarlar eksikse kısa bir uyarı şeridi.
export function ReliabilityBanner() {
  const { reliability, settings } = useAppState();
  const anyOn = Object.values(settings.notify.enabled).some(Boolean);
  if (Platform.OS !== 'android' || !reliability || !anyOn || isReliable(reliability)) return null;
  return (
    <Pressable style={st.banner} onPress={() => router.push('/ayarlar')}>
      <Ionicons name="warning-outline" size={20} color={C.gold} />
      <Text style={st.bannerText}>
        Uygulama kapalıyken vakit bildirimleri gelmeyebilir. Düzeltmek için dokun.
      </Text>
      <Ionicons name="chevron-forward" size={18} color={C.gold} />
    </Pressable>
  );
}

// Ayarlarda: her bir gerekli izin ve düzeltme düğmesi.
export function ReliabilityCard() {
  const { reliability, recheckReliability } = useAppState();
  if (Platform.OS !== 'android' || !reliability) return null;

  return (
    <Card>
      <SectionTitle icon="shield-checkmark-outline">Uygulama kapalıyken bildirim</SectionTitle>
      <Text style={st.small}>
        Vakit bildirimlerinin uygulama kapalıyken de zamanında gelmesi için aşağıdaki üç ayarın açık olması gerekir.
      </Text>
      <Item
        ok={reliability.notifications}
        title="Bildirim izni"
        action="İzin ver"
        onPress={() => ensureNotificationPermission().then(recheckReliability)}
      />
      <Item
        ok={reliability.exactAlarms}
        title="Alarm ve hatırlatıcı izni"
        hint="Bildirimin tam vaktinde gelmesini sağlar. Açılan ekranda İslami Yaşam'a izin ver."
        action="Aç"
        onPress={requestExactAlarms}
      />
      <Item
        ok={reliability.batteryUnrestricted}
        title="Pil kısıtlaması kapalı"
        hint="Telefonun uygulamayı uyutup bildirimleri engellemesini önler. Çıkan soruya 'İzin ver' de."
        action="Kaldır"
        onPress={requestBatteryExemption}
      />
      <View style={st.oem}>
        <Text style={st.small}>
          Xiaomi, Huawei, Oppo ve bazı Samsung telefonlarda ayrıca uygulama ayarlarından{' '}
          <Text style={{ color: C.text, fontWeight: '700' }}>Otomatik başlatma</Text> açılmalı ve pil ayarı{' '}
          <Text style={{ color: C.text, fontWeight: '700' }}>Kısıtlama yok</Text> yapılmalı.
        </Text>
        <Pressable onPress={openAppSettings} style={st.linkBtn}>
          <Text style={st.link}>Uygulama ayarlarını aç</Text>
        </Pressable>
      </View>
    </Card>
  );
}

function Item({
  ok,
  title,
  hint,
  action,
  onPress,
}: {
  ok: boolean;
  title: string;
  hint?: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={st.item}>
      <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={22} color={ok ? C.accent : C.gold} />
      <View style={{ flex: 1 }}>
        <Text style={st.title}>{title}</Text>
        {!ok && hint ? <Text style={st.small}>{hint}</Text> : null}
      </View>
      {ok ? (
        <Text style={st.okText}>Açık</Text>
      ) : (
        <Pressable onPress={onPress} style={st.btn}>
          <Text style={st.btnText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
    backgroundColor: '#4A3B17',
    borderRadius: R.md,
    padding: S.md,
  },
  bannerText: { flex: 1, color: C.gold, fontSize: 13.5, lineHeight: 19, fontWeight: '600' },
  small: { color: C.textDim, fontSize: 13, lineHeight: 19 },
  item: { flexDirection: 'row', alignItems: 'center', gap: S.md },
  title: { color: C.text, fontSize: 15, fontWeight: '600' },
  okText: { color: C.accent, fontSize: 13, fontWeight: '700' },
  btn: { backgroundColor: C.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: R.sm },
  btnText: { color: C.bgDeep, fontWeight: '700', fontSize: 13 },
  oem: { backgroundColor: C.bgDeep, borderRadius: R.sm, padding: S.md, gap: S.sm },
  linkBtn: { alignSelf: 'flex-start' },
  link: { color: C.accent, fontWeight: '700', fontSize: 13 },
});
