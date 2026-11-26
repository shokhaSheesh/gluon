import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BANK_LOGOS } from '../assets';

/**
 * White-label settings a partner bank sets in its merchant cabinet («Брендинг»).
 * Clients of that bank see this logo, name and main colour instead of Gluon's.
 * Persisted in localStorage so the bank cabinet and the client app share it in the demo.
 */
export interface Brand {
  bankId: string;
  name: string;          // e.g. "Kapitalbank Business"
  logo?: string;         // uploaded data URL; falls back to the bank wordmark
  primary: string;       // hex
  subdomain: string;     // kapitalbank.gluon.uz
}

const DEFAULTS: Record<string, Brand> = {
  kapital: { bankId: 'kapital', name: 'Kapitalbank Business', primary: '#1D3B6F', subdomain: 'kapitalbank.gluon.uz' },
};

interface BrandingState {
  brands: Record<string, Brand>;
  save: (b: Brand) => void;
  reset: (bankId: string) => void;
  logoOf: (b: Brand) => string | undefined;
}

const Ctx = createContext<BrandingState | null>(null);
const KEY = 'gluon.branding.v1';

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [brands, setBrands] = useState<Record<string, Brand>>(() => {
    try { const v = localStorage.getItem(KEY); return v ? { ...DEFAULTS, ...JSON.parse(v) } : DEFAULTS; } catch { return DEFAULTS; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(brands)); } catch { /* storage unavailable */ } }, [brands]);
  const value = useMemo<BrandingState>(() => ({
    brands,
    save: (b) => setBrands((x) => ({ ...x, [b.bankId]: b })),
    reset: (id) => setBrands((x) => ({ ...x, [id]: DEFAULTS[id] })),
    logoOf: (b) => b.logo || BANK_LOGOS[b.bankId]?.word,
  }), [brands]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Brand of a bank tenant; banks without saved settings get a default one. */
export const brandFor = (brands: Record<string, Brand>, bankId: string, bankName = bankId): Brand =>
  brands[bankId] ?? { bankId, name: `${bankName} Business`, primary: '#1D3B6F', subdomain: `${bankId}.gluon.uz` };

export function useBranding() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBranding outside BrandingProvider');
  return v;
}

/** Applies a bank's colour to the whole app (CSS vars derive hover/soft tones from --brand). */
export function useApplyBrand(brand: Brand | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (!brand) return;
    root.dataset.brand = brand.bankId;
    root.style.setProperty('--brand', brand.primary);
    return () => {
      delete root.dataset.brand;
      root.style.removeProperty('--brand');
    };
  }, [brand]);
}

export const BRAND_PRESETS = ['#1D3B6F', '#0F7B5F', '#B4123A', '#0B4EA2', '#6D28D9', '#C2410C', '#1F2937', '#385D5D'];
