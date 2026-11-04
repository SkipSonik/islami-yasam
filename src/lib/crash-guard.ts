import * as SplashScreen from 'expo-splash-screen';
import { Alert } from 'react-native';

// Uygulama açılırken bir JavaScript hatası olursa, sürüm derlemesinde uygulama
// sessizce kapanır ve kullanıcı neyin bozulduğunu göremez. Bu dosya en önce
// yüklenir ve hatayı ekranda gösterir; böylece ekran görüntüsüyle sebep bulunur.

type Handler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsType = { getGlobalHandler: () => Handler; setGlobalHandler: (h: Handler) => void };

const EU = (globalThis as unknown as { ErrorUtils?: ErrorUtilsType }).ErrorUtils;

if (EU) {
  const previous = EU.getGlobalHandler();
  let shown = false;
  EU.setGlobalHandler((error, isFatal) => {
    if (!shown) {
      shown = true;
      const e = error as { name?: string; message?: string; stack?: string } | undefined;
      const detail = `${e?.name ?? 'Hata'}: ${e?.message ?? String(error)}\n\n${String(e?.stack ?? '').slice(0, 900)}`;
      try {
        SplashScreen.hideAsync().catch(() => {});
        Alert.alert(
          isFatal ? 'Uygulama açılırken hata oluştu' : 'Beklenmeyen hata',
          `Lütfen bu ekranın görüntüsünü geliştiriciye gönder.\n\n${detail}`,
        );
      } catch {
        // uyarı gösterilemezse varsayılan davranışa bırak
        previous?.(error, isFatal);
        return;
      }
    }
    // Ölümcül hatada uygulamayı kapatma ki uyarı okunabilsin.
    if (!isFatal) previous?.(error, isFatal);
  });
}
