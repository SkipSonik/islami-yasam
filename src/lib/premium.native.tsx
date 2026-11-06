import { useIAP, type Purchase } from 'expo-iap';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { PremiumContext, type PremiumApi } from '@/lib/premium-context';
import { PREMIUM_SKU, premiumStore } from '@/lib/premium-store';

/** Google Play ile tek seferlik "reklamsız premium" satın alma ve geri yükleme. */
export function PremiumProvider({ children }: { children: ReactNode }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grant = useCallback((p: Purchase | undefined) => {
    if (p && p.productId === PREMIUM_SKU && p.purchaseState === 'purchased') {
      premiumStore.set({ active: true });
      return true;
    }
    return false;
  }, []);

  const { connected, products, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases, availablePurchases } =
    useIAP({
      onPurchaseSuccess: async (purchase) => {
        // Satın alma onaylanmazsa Google 3 gün içinde iade eder; bu yüzden hemen onaylanır.
        try {
          await finishTransaction({ purchase, isConsumable: false });
        } catch {
          // onay bir sonraki açılışta tekrar denenir
        }
        grant(purchase);
        setBusy(false);
      },
      onPurchaseError: (e) => {
        setBusy(false);
        if (String(e.code).toLowerCase().includes('cancel')) return;
        setError(e.message);
      },
      onError: () => setBusy(false),
    });

  // Bağlanınca ürünü ve önceki satın almaları getir
  useEffect(() => {
    if (!connected || Platform.OS !== 'android') return;
    fetchProducts({ skus: [PREMIUM_SKU], type: 'in-app' }).catch(() => {});
    getAvailablePurchases().catch(() => {});
  }, [connected, fetchProducts, getAvailablePurchases]);

  // Play'deki satın almalar premium durumunun tek doğru kaynağıdır
  useEffect(() => {
    if (!connected) return;
    const owned = availablePurchases.find((p) => p.productId === PREMIUM_SKU && p.purchaseState === 'purchased');
    if (owned) {
      premiumStore.set({ active: true });
      if (!(owned as { isAcknowledgedAndroid?: boolean | null }).isAcknowledgedAndroid) finishTransaction({ purchase: owned, isConsumable: false }).catch(() => {});
    }
  }, [connected, availablePurchases, finishTransaction]);

  const product = products.find((p) => p.id === PREMIUM_SKU);

  const api = useMemo<PremiumApi>(
    () => ({
      available: connected && !!product,
      price: product?.displayPrice ?? null,
      busy,
      error,
      buy: () => {
        setError(null);
        setBusy(true);
        requestPurchase({ request: { google: { skus: [PREMIUM_SKU] } }, type: 'in-app' }).catch(() => setBusy(false));
      },
      restore: () => {
        setError(null);
        setBusy(true);
        getAvailablePurchases()
          .catch(() => {})
          .finally(() => setBusy(false));
      },
    }),
    [connected, product, busy, error, requestPurchase, getAvailablePurchases],
  );

  return <PremiumContext.Provider value={api}>{children}</PremiumContext.Provider>;
}
