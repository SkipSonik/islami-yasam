import { useEffect } from 'react';
import { Linking, Modal, Text, View } from 'react-native';

import { FocusPressable } from '@/components/focus-pressable';
import { R, S, makeStyles } from '@/constants/theme';
import { useAppState } from '@/lib/app-state';
import { checkForUpdate, MARKET_URL, PLAY_URL, updateNeed, updateStore } from '@/lib/update-check';

/**
 * Yeni sürüm penceresi. Zorunlu güncellemede kapatılamaz; isteğe bağlı güncellemede "Sonra" ile kapanır.
 * Pencere tüm ekranların üstünde, kök düzende bir kez bağlanır.
 */
export function UpdateGate() {
  const st = useSt();
  const { lang } = useAppState();
  const state = updateStore.useValue();

  useEffect(() => {
    checkForUpdate();
  }, []);

  const need = updateNeed(state);
  if (need === 'none') return null;
  const info = state.info;
  const tr = lang === 'tr';
  const message = (tr ? info?.messageTr : info?.messageEn)?.trim() || (tr
    ? 'Namaz Yolu’nun yeni bir sürümü var. En iyi deneyim için güncelle.'
    : 'A new version of Namaz Yolu is available. Update for the best experience.');

  const open = () => {
    Linking.openURL(MARKET_URL).catch(() => Linking.openURL(PLAY_URL).catch(() => undefined));
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={st.backdrop}>
        <View style={st.card}>
          <Text style={st.title}>
            {need === 'required'
              ? tr ? 'Güncelleme gerekli' : 'Update required'
              : tr ? 'Yeni sürüm var' : 'New version available'}
          </Text>
          <Text style={st.body}>{message}</Text>
          <FocusPressable onPress={open} hasTVPreferredFocus style={st.btn} focusStyle={st.focus}>
            <Text style={st.btnText}>{tr ? 'Güncelle' : 'Update'}</Text>
          </FocusPressable>
          {need === 'optional' ? (
            <FocusPressable
              onPress={() => updateStore.set((p) => ({ ...p, dismissedFor: info?.latest ?? '' }))}
              style={[st.btn, st.ghost]}
              focusStyle={st.focus}>
              <Text style={[st.btnText, st.ghostText]}>{tr ? 'Sonra' : 'Later'}</Text>
            </FocusPressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const useSt = makeStyles((C) => ({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: S.xl },
  card: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 460,
    backgroundColor: C.card,
    borderRadius: R.lg,
    padding: S.xl,
    gap: S.md,
  },
  title: { color: C.text, fontSize: 20, fontWeight: '800' },
  body: { color: C.textDim, fontSize: 15, lineHeight: 22 },
  btn: {
    minHeight: 48,
    borderRadius: R.md,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  btnText: { color: C.onAccent, fontSize: 16, fontWeight: '700' },
  ghost: { backgroundColor: 'transparent', borderColor: C.border },
  ghostText: { color: C.text },
  focus: { borderColor: C.text },
}));
