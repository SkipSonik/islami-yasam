import * as Sharing from 'expo-sharing';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

import { QURAN_FONT } from '@/components/mushaf-page';
import { makeStyles } from '@/constants/theme';

export type AyahShareHandle = { share: () => Promise<void> };

type Props = { ar: string; meal: string; reference: string; title: string; brand: string };

// Paylaşım görseli 4:5 (Instagram/WhatsApp uyumlu). Ekranda görünmez, yalnızca resme çevrilir.
const W = 360;
const H = 450;

/**
 * Günün ayetini görsel olarak paylaşmak için ekran dışında çizilen kart.
 * share(): kartı 1080x1350 JPEG'e çevirip telefonun paylaşım ekranını açar.
 */
export const AyahShareCard = forwardRef<AyahShareHandle, Props>(function AyahShareCard(
  { ar, meal, reference, title, brand },
  ref,
) {
  const st = useSt();
  const view = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  // Uzun ayetlerde yazıyı küçült
  const arSize = ar.length > 260 ? 15 : ar.length > 160 ? 18 : 22;
  const mealSize = meal.length > 380 ? 10.5 : meal.length > 220 ? 12 : 13.5;

  useImperativeHandle(ref, () => ({
    async share() {
      if (!view.current) return;
      const tmp = await captureRef(view, {
        format: 'jpg',
        quality: 0.92,
        width: 1080,
        height: 1350,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(tmp.startsWith('file://') ? tmp : `file://${tmp}`, {
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
        dialogTitle: title,
      });
    },
  }));

  return (
    <View style={st.offscreen} pointerEvents="none">
      <View ref={view} collapsable={false} style={st.card}>
        <View style={st.frame}>
          <View style={st.headRow}>
            <View style={st.line} />
            <Text style={st.title}>{title}</Text>
            <View style={st.line} />
          </View>
          <View style={st.body}>
            <Text style={[st.ar, { fontSize: arSize, lineHeight: arSize * 1.9, fontFamily: QURAN_FONT }]}>{ar}</Text>
            <View style={st.diamondRow}>
              <View style={st.diamond} />
            </View>
            <Text style={[st.meal, { fontSize: mealSize, lineHeight: mealSize * 1.45 }]}>{meal}</Text>
            <Text style={st.ref}>{reference}</Text>
          </View>
          <Text style={st.brand}>{brand}</Text>
        </View>
      </View>
    </View>
  );
});

const useSt = makeStyles((C) => ({
  offscreen: { position: 'absolute', left: -10000, top: 0, width: W, height: H },
  card: { width: W, height: H, backgroundColor: C.bgDeep, padding: 14 },
  frame: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.gold,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    justifyContent: 'space-between',
    backgroundColor: C.card,
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: C.gold, opacity: 0.6 },
  title: { color: C.gold, fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },
  body: { flex: 1, justifyContent: 'center', gap: 10 },
  ar: { color: C.text, textAlign: 'center', writingDirection: 'rtl' },
  diamondRow: { alignItems: 'center' },
  diamond: { width: 7, height: 7, backgroundColor: C.gold, transform: [{ rotate: '45deg' }] },
  meal: { color: C.text, textAlign: 'center', opacity: 0.92 },
  ref: { color: C.gold, textAlign: 'center', fontSize: 11.5, fontWeight: '700' },
  brand: { color: C.textDim, textAlign: 'center', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
}));
