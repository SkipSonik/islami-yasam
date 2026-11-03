import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Her `ms` milisaniyede ve uygulama ön plana döndüğünde güncellenen saat.
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(new Date());
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [ms]);
  return now;
}
