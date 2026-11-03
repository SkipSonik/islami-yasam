import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Pusula yönü (gerçek kuzeye göre, derece, saat yönünde).
//
// Öncelik: Android'in jiroskop destekli "rotation vector" sensörü (DeviceMotion).
// Bu sensör manyetometreyi jiroskopla birleştirdiği için titremez ve yön
// değiştirince hızlı tepki verir. Jiroskopu olmayan telefonlarda konum
// kütüphanesinin ham pusulasına düşülür.
// Her iki durumda da çember üzerinde alçak geçiren filtre uygulanır
// (359° → 1° geçişinde zıplama olmaz).

export type CompassState = {
  heading: number | null;
  accuracy: number; // 0 (güvenilmez) – 3 (yüksek), konum kütüphanesinden
  source: 'fused' | 'magnetic' | null;
  tilted: boolean; // telefon düz tutulmuyor
};

const SMOOTH_FUSED = 0.25;
const SMOOTH_MAGNETIC = 0.08;

export function useCompass(active: boolean): CompassState {
  const [state, setState] = useState<CompassState>({ heading: null, accuracy: 3, source: null, tilted: false });

  const vec = useRef<{ x: number; y: number } | null>(null);
  const declination = useRef(0);
  const hasFused = useRef(false);
  const accuracy = useRef(3);
  const tilted = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    let motionSub: { remove: () => void } | null = null;
    let headingSub: Location.LocationSubscription | null = null;
    vec.current = null;

    const push = (deg: number, k: number, source: CompassState['source']) => {
      const r = (deg * Math.PI) / 180;
      const v = vec.current;
      if (!v) vec.current = { x: Math.cos(r), y: Math.sin(r) };
      else {
        v.x += k * (Math.cos(r) - v.x);
        v.y += k * (Math.sin(r) - v.y);
      }
      const { x, y } = vec.current!;
      const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      setState({ heading: h, accuracy: accuracy.current, source, tilted: tilted.current });
    };

    (async () => {
      // Konum kütüphanesinin pusulası: manyetik sapma (declination), doğruluk
      // bilgisi ve jiroskopsuz cihazlar için yedek kaynak.
      try {
        headingSub = await Location.watchHeadingAsync((h) => {
          accuracy.current = h.accuracy;
          if (h.trueHeading >= 0) {
            declination.current = ((h.trueHeading - h.magHeading + 540) % 360) - 180;
          }
          if (!hasFused.current) {
            push(h.trueHeading >= 0 ? h.trueHeading : h.magHeading, SMOOTH_MAGNETIC, 'magnetic');
          }
        });
        if (cancelled) headingSub.remove();
      } catch {
        // izin yoksa ekran zaten uyarı gösterir
      }

      try {
        // iOS'ta konum kütüphanesinin pusulası zaten sensör birleşimli ve kararlı.
        if (Platform.OS !== 'android') return;
        if (cancelled || !(await DeviceMotion.isAvailableAsync())) return;
        DeviceMotion.setUpdateInterval(33);
        motionSub = DeviceMotion.addListener((m) => {
          if (!m.rotation) return;
          hasFused.current = true;
          // beta/gamma: öne-arkaya ve yana eğim (radyan). 40°'den fazla eğikse uyar.
          const lim = (40 * Math.PI) / 180;
          tilted.current = Math.abs(m.rotation.beta) > lim || Math.abs(m.rotation.gamma) > lim;
          // Android: alpha = -azimut (radyan). Azimut manyetik kuzeye göre saat yönünde.
          const magnetic = ((-m.rotation.alpha * 180) / Math.PI + 360) % 360;
          push((magnetic + declination.current + 360) % 360, SMOOTH_FUSED, 'fused');
        });
        if (cancelled) motionSub.remove();
      } catch {
        // sensör yoksa yedek kaynakla devam
      }
    })();

    return () => {
      cancelled = true;
      motionSub?.remove();
      headingSub?.remove();
      hasFused.current = false;
    };
  }, [active]);

  return state;
}
