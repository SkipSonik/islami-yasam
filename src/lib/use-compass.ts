import * as Location from 'expo-location';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { fieldStrength, tiltCompensatedHeading, type Vec } from './compass-math';

// Pusula yönü (gerçek kuzeye göre, derece, saat yönünde).
//
// Android: ivmeölçer + manyetometre ham verisinden eğim düzeltmeli hesap
// (compass-math.ts). Telefon düz de dursa, önüne doğru eğik ya da dik de tutulsa
// doğru yön verir. Manyetik sapma (gerçek kuzey farkı) konum servisinden alınır.
// iOS: sistemin kendi pusulası zaten sensör birleşimli ve eğim düzeltmeli.

export type CompassState = {
  heading: number | null;
  /** 0 (güvenilmez) – 3 (yüksek): sistemin manyetometre kalibrasyon bilgisi */
  accuracy: number;
  /** Manyetik alan olağandışı: yakında metal, mıknatıs veya elektronik cihaz var */
  interference: boolean;
  /** Ekran yere bakıyor */
  faceDown: boolean;
};

const SENSOR_MS = 40;
const LOWPASS = 0.18; // ham sensör verisi yumuşatma
const SMOOTH = 0.2; // yön yumuşatma

export function useCompass(active: boolean): CompassState {
  const [state, setState] = useState<CompassState>({
    heading: null,
    accuracy: 3,
    interference: false,
    faceDown: false,
  });

  const grav = useRef<Vec | null>(null);
  const mag = useRef<Vec | null>(null);
  const vec = useRef<{ x: number; y: number } | null>(null);
  const declination = useRef(0);
  const accuracy = useRef(3);
  const gotSensor = useRef(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const subs: { remove: () => void }[] = [];
    let headingSub: Location.LocationSubscription | null = null;
    grav.current = null;
    mag.current = null;
    vec.current = null;
    gotSensor.current = false;

    const smoothPush = (deg: number, extra: Partial<CompassState>) => {
      const r = (deg * Math.PI) / 180;
      const v = vec.current;
      if (!v) vec.current = { x: Math.cos(r), y: Math.sin(r) };
      else {
        v.x += SMOOTH * (Math.cos(r) - v.x);
        v.y += SMOOTH * (Math.sin(r) - v.y);
      }
      const { x, y } = vec.current!;
      const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
      setState((s) => ({ ...s, ...extra, heading: h, accuracy: accuracy.current }));
    };

    const lowpass = (ref: { current: Vec | null }, v: Vec) => {
      const p = ref.current;
      ref.current = p
        ? { x: p.x + LOWPASS * (v.x - p.x), y: p.y + LOWPASS * (v.y - p.y), z: p.z + LOWPASS * (v.z - p.z) }
        : { ...v };
    };

    const compute = () => {
      if (!grav.current || !mag.current) return;
      const res = tiltCompensatedHeading(grav.current, mag.current);
      if (res.heading == null) {
        setState((s) => ({ ...s, faceDown: res.faceDown }));
        return;
      }
      gotSensor.current = true;
      const strength = fieldStrength(mag.current);
      smoothPush((res.heading + declination.current + 360) % 360, {
        faceDown: res.faceDown,
        interference: strength < 20 || strength > 75,
      });
    };

    (async () => {
      // Sistemin pusulası: manyetik sapma ve kalibrasyon doğruluğu için (iOS'ta yönün kendisi).
      try {
        headingSub = await Location.watchHeadingAsync((h) => {
          accuracy.current = h.accuracy;
          if (h.trueHeading >= 0) {
            declination.current = ((h.trueHeading - h.magHeading + 540) % 360) - 180;
          }
          // iOS'ta veya Android'de ham sensör verisi gelmiyorsa sistem pusulasını kullan
          if (Platform.OS !== 'android' || !gotSensor.current) {
            smoothPush(h.trueHeading >= 0 ? h.trueHeading : h.magHeading, {});
          }
        });
        if (cancelled) headingSub.remove();
      } catch {
        // izin yoksa ekran zaten uyarı gösterir
      }

      if (Platform.OS !== 'android' || cancelled) return;
      try {
        Accelerometer.setUpdateInterval(SENSOR_MS);
        Magnetometer.setUpdateInterval(SENSOR_MS);
        subs.push(
          Accelerometer.addListener((a) => {
            lowpass(grav, a);
          }),
        );
        subs.push(
          Magnetometer.addListener((m) => {
            lowpass(mag, m);
            compute();
          }),
        );
        if (cancelled) subs.forEach((s) => s.remove());
      } catch {
        // sensör yoksa sistem pusulasıyla devam
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach((s) => s.remove());
      headingSub?.remove();
    };
  }, [active]);

  return state;
}
