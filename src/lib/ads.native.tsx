import { useEffect, useState } from 'react';
import { View } from 'react-native';
import mobileAds, {
  AdEventType,
  AdsConsent,
  AdsConsentPrivacyOptionsRequirementStatus,
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  MaxAdContentRating,
  TestIds,
} from 'react-native-google-mobile-ads';

import { useColors } from '@/constants/theme';
import { IS_TV } from '@/lib/layout';
import { premiumStore } from '@/lib/premium-store';

// AdMob reklam birimleri (İslami Yaşam / Android)
const UNITS = {
  banner: __DEV__ ? TestIds.ADAPTIVE_BANNER : 'ca-app-pub-5704710295015571/8838359568',
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-5704710295015571/5187898320',
};

// Geçiş reklamı en fazla 4 dakikada bir, uygulama açıldıktan en az 2 dakika sonra.
const MIN_GAP = 4 * 60 * 1000;
const START_DELAY = 2 * 60 * 1000;

let ready = false;
let privacyRequired = false;
const readyListeners = new Set<() => void>();
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;
let lastShown = 0;
const startedAt = Date.now();

function loadInterstitial() {
  if (!ready || premiumStore.get().active) return;
  interstitial = InterstitialAd.createForAdRequest(UNITS.interstitial);
  interstitialLoaded = false;
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    lastShown = Date.now();
    loadInterstitial();
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    setTimeout(loadInterstitial, 60 * 1000);
  });
  interstitial.load();
}

async function init() {
  try {
    // KVKK/GDPR: Avrupa'daki kullanıcılara Google'ın izin formu gösterilir.
    await AdsConsent.gatherConsent().catch(() => null);
    const info = await AdsConsent.getConsentInfo();
    privacyRequired = info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    if (!info.canRequestAds) return;
    await mobileAds().setRequestConfiguration({
      // Dini bir uygulama: yalnızca genel izleyiciye uygun reklamlar
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    ready = true;
    readyListeners.forEach((l) => l());
    loadInterstitial();
  } catch {
    // reklamlar yüklenemezse uygulama normal çalışmaya devam eder
  }
}

/** Uygulama açılışında bir kez çağrılır. Premium kullanıcıda hiçbir şey yapmaz. */
export function AdsBootstrap() {
  const premium = premiumStore.useValue().active;
  useEffect(() => {
    // Televizyonda reklam gösterilmez (AdMob TV'yi desteklemiyor)
    if (premium || ready || IS_TV) return;
    // Premium durumu Play'den doğrulanana kadar kısa bir bekleme
    const id = setTimeout(() => {
      if (!premiumStore.get().active) init();
    }, 1500);
    return () => clearTimeout(id);
  }, [premium]);
  return null;
}

function useAdsReady() {
  const [r, setR] = useState(ready);
  useEffect(() => {
    const l = () => setR(true);
    readyListeners.add(l);
    return () => {
      readyListeners.delete(l);
    };
  }, []);
  return r;
}

/** Ekranın altına yerleşen uyarlanabilir banner. */
export function AdBanner() {
  const C = useColors();
  const premium = premiumStore.useValue().active;
  const isReady = useAdsReady();
  const [failed, setFailed] = useState(false);
  if (premium || !isReady || failed) return null;
  return (
    <View style={{ alignItems: 'center', backgroundColor: C.bgDeep }}>
      <BannerAd
        unitId={UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

/** Uygun bir geçiş anında çağrılır; sıklık sınırına uyuyorsa geçiş reklamı gösterir. */
export function maybeShowInterstitial() {
  if (premiumStore.get().active || !interstitial || !interstitialLoaded) return;
  const now = Date.now();
  if (now - startedAt < START_DELAY || now - lastShown < MIN_GAP) return;
  interstitialLoaded = false;
  interstitial.show().catch(() => loadInterstitial());
}

/** Avrupa'daki kullanıcılar için reklam izin tercihlerini yeniden açar. */
export async function showPrivacyOptions() {
  try {
    await AdsConsent.showPrivacyOptionsForm();
    return true;
  } catch {
    return false;
  }
}

export function usePrivacyOptionsRequired() {
  useAdsReady();
  return privacyRequired;
}
