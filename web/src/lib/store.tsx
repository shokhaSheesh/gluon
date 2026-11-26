import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type DictKey, type Lang } from './i18n';
import { AS_ALIASES, DEMO_ACCOUNTS, type AccountKind, type DemoAccount } from '../data/accounts';

export type Platform = 'user' | 'merchant' | 'admin';
export type Theme = 'light' | 'dark';
export type ToastKind = 'success' | 'error' | 'info';
export interface Toast { id: number; kind: ToastKind; text: string }

export interface Session {
  platform: Platform;
  kind: AccountKind;
  name: string;
  login: string;
  org?: string;
  orgId?: string;
}

export const sessionFrom = (a: DemoAccount): Session => ({
  platform: a.platform, kind: a.kind, name: a.name, login: a.login, org: a.org, orgId: a.orgId,
});

interface AppState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  session: Session | null;
  login: (s: Session) => void;
  logout: () => void;
  toasts: Toast[];
  toast: (kind: ToastKind, text: string) => void;
  dismiss: (id: number) => void;
}

const Ctx = createContext<AppState | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const q = new URLSearchParams(window.location.search).get('theme');
    if (q === 'dark' || q === 'light') { write('gluon.theme', q); return q; }
    return read('gluon.theme', 'light');
  });
  const [lang, setLangState] = useState<Lang>(() => read('gluon.lang', 'ru'));
  const [session, setSession] = useState<Session | null>(() => {
    // Demo shortcut: ?as=user|kapital|service|bank|admin opens an account without the login form.
    const as = new URLSearchParams(window.location.search).get('as');
    const acc = as ? DEMO_ACCOUNTS.find((a) => a.id === (AS_ALIASES[as] ?? as)) : undefined;
    if (acc) {
      const s = sessionFrom(acc);
      write('gluon.session', s);
      return s;
    }
    const saved = read<Session | null>('gluon.session', null);
    if (saved && !saved.kind) return null; // session from an older build
    return saved;
  });
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setTheme = useCallback((t: Theme) => { setThemeState(t); write('gluon.theme', t); }, []);
  const setLang = useCallback((l: Lang) => { setLangState(l); write('gluon.lang', l); }, []);
  const login = useCallback((s: Session) => { setSession(s); write('gluon.session', s); }, []);
  const logout = useCallback(() => { setSession(null); write('gluon.session', null); }, []);
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);
  const toast = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts, { id, kind, text }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3500);
  }, []);
  const t = useCallback((k: DictKey) => translate(lang, k), [lang]);

  const value = useMemo(
    () => ({ theme, setTheme, lang, setLang, t, session, login, logout, toasts, toast, dismiss }),
    [theme, setTheme, lang, setLang, t, session, login, logout, toasts, toast, dismiss],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}


export const PLATFORM_HOME: Record<Platform, string> = {
  user: '/app',
  merchant: '/merchant',
  admin: '/admin',
};
