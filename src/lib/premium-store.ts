import { createStore } from '@/lib/store';

// Premium (reklamsız) durumu. Satın alma Google Play üzerinden yapılır; burada yalnızca
// son bilinen durum tutulur, uygulama her açılışta Play'den doğrular.
export const PREMIUM_SKU = 'premium_omur_boyu';
export const premiumStore = createStore<{ active: boolean }>('premium-v1', { active: false });
export const isPremium = () => premiumStore.get().active;
