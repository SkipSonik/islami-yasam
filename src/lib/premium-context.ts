import { createContext, useContext } from 'react';

export type PremiumApi = {
  available: boolean;
  price: string | null;
  busy: boolean;
  error: string | null;
  buy: () => void;
  restore: () => void;
};

export const PremiumContext = createContext<PremiumApi>({
  available: false,
  price: null,
  busy: false,
  error: null,
  buy: () => {},
  restore: () => {},
});

export const usePremium = () => useContext(PremiumContext);
