import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? ({ ...fallbackObj(fallback), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

// Nesne değilse olduğu gibi döndür (sayı, dizi vb.)
function fallbackObj<T>(v: T) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}

export async function loadValue<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveJSON(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // depolama hatası uygulamayı durdurmasın
  }
}
