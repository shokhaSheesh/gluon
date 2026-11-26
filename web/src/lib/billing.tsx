import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Billing demo state shared by the Gluon user (buys plans, pays for services)
 * and Gluon admin (manages plans and service prices). Persisted in localStorage
 * so admin changes show up on the user side in the same browser.
 */

export interface Plan {
  id: string;
  name: string;
  gb: number;
  price: number;            // per month, sum
  features: string[];
  popular?: boolean;
  active: boolean;          // visible to users
}

/** legacy: price kept for already-subscribed users when a change applies only to new users. */
export interface ServicePrice { price: number; active: boolean; legacy?: number; changed?: { at: string; mode: 'all' | 'new'; from: number } }

export type SubStatus = 'active' | 'unpaid' | 'trial';
export interface ServiceSub { status: SubStatus; paidUntil: string; autoRenew: boolean }

/** connected = linked & syncing; review = waiting for the service; link = paid, account not linked yet */
export type LinkStatus = 'connected' | 'review' | 'link';

export interface Payment { id: number; date: string; title: string; amount: number; kind: 'topup' | 'plan' | 'service' }

interface BillingData {
  plans: Plan[];
  prices: Record<string, ServicePrice>;
  currentPlan: string;
  planUntil: string;
  subs: Record<string, ServiceSub>;
  balance: number;
  payments: Payment[];
  usedGb: number;
  linked: Record<string, LinkStatus>;
}

const DEFAULT: BillingData = {
  plans: [
    { id: 'base', name: 'Базовый', gb: 512, price: 0, active: true, features: ['512 GB в Gluon Архиве', 'До 3 сервисов', '2 сотрудника', 'Поддержка в чате'] },
    { id: 'business', name: 'Бизнес', gb: 1024, price: 49_000, active: true, popular: true, features: ['1 TB в Gluon Архиве', 'До 10 сервисов', '10 сотрудников', 'Импорт банковских выписок', 'Приоритетная поддержка'] },
    { id: 'pro', name: 'Про', gb: 2048, price: 89_000, active: true, features: ['2 TB в Gluon Архиве', 'Безлимит сервисов', '30 сотрудников', 'Расширенная аналитика', 'Персональный менеджер'] },
    { id: 'corp', name: 'Корпоративный', gb: 5120, price: 199_000, active: true, features: ['5 TB в Gluon Архиве', 'Безлимит сервисов и сотрудников', 'API доступ', 'SLA 99.9%'] },
  ],
  prices: {
    robosell: { price: 150_000, active: true },
    robohub: { price: 120_000, active: true },
    billz: { price: 150_000, active: true },
    ox: { price: 99_000, active: true },
    delever: { price: 110_000, active: true },
  },
  currentPlan: 'base',
  planUntil: '—',
  subs: {
    robosell: { status: 'active', paidUntil: '10.12.2026', autoRenew: true },
    billz: { status: 'active', paidUntil: '10.12.2026', autoRenew: true },
    robohub: { status: 'unpaid', paidUntil: '20.11.2026', autoRenew: false },
  },
  balance: 120_500,
  usedGb: 210,
  linked: { robosell: 'connected', robohub: 'connected', billz: 'connected', ox: 'review' },
  payments: [
    { id: 1, date: '12.11.2026', title: 'Пополнение баланса · карта •••• 2345', amount: 100_000, kind: 'topup' },
    { id: 2, date: '10.11.2026', title: 'Подписка Billz · 1 мес.', amount: -150_000, kind: 'service' },
    { id: 3, date: '10.11.2026', title: 'Подписка Robosell · 1 мес.', amount: -150_000, kind: 'service' },
    { id: 4, date: '01.11.2026', title: 'Пополнение баланса · карта •••• 4500', amount: 500_000, kind: 'topup' },
  ],
};

export type PayResult = 'ok' | 'insufficient';

interface BillingState extends BillingData {
  topUp: (amount: number) => void;
  buyPlan: (id: string, months: number) => PayResult;
  payService: (id: string, months: number) => PayResult;
  setAutoRenew: (id: string, v: boolean) => void;
  savePlan: (p: Plan) => void;
  deletePlan: (id: string) => void;
  setPrice: (id: string, patch: Partial<ServicePrice>) => void;
  reset: () => void;
  setLink: (id: string, s: LinkStatus | null) => void;
}

const Ctx = createContext<BillingState | null>(null);
const KEY = 'gluon.billing.v2';

const today = () => new Date().toLocaleDateString('ru-RU');
const addMonths = (m: number) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('ru-RU'); };

export function BillingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<BillingData>(() => {
    try { const v = localStorage.getItem(KEY); return v ? { ...DEFAULT, ...JSON.parse(v) } : DEFAULT; } catch { return DEFAULT; }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ } }, [data]);

  const pay = useCallback((amount: number, title: string, kind: Payment['kind'], apply: (d: BillingData) => Partial<BillingData>): PayResult => {
    let result: PayResult = 'ok';
    setData((d) => {
      if (d.balance < amount) { result = 'insufficient'; return d; }
      return { ...d, ...apply(d), balance: d.balance - amount, payments: [{ id: Date.now(), date: today(), title, amount: -amount, kind }, ...d.payments] };
    });
    return result;
  }, []);

  const value = useMemo<BillingState>(() => ({
    ...data,
    topUp: (amount) => setData((d) => ({ ...d, balance: d.balance + amount, payments: [{ id: Date.now(), date: today(), title: 'Пополнение баланса', amount, kind: 'topup' }, ...d.payments] })),
    buyPlan: (id, months) => {
      const plan = data.plans.find((p) => p.id === id)!;
      if (data.balance < plan.price * months) return 'insufficient';
      return pay(plan.price * months, `Тариф «${plan.name}» · ${months} мес.`, 'plan', () => ({ currentPlan: id, planUntil: plan.price ? addMonths(months) : '—' }));
    },
    payService: (id, months) => {
      const price = data.prices[id]?.price ?? 0;
      if (data.balance < price * months) return 'insufficient';
      const name = id.charAt(0).toUpperCase() + id.slice(1);
      return pay(price * months, `Подписка ${name} · ${months} мес.`, 'service', (d) => ({
        subs: { ...d.subs, [id]: { status: 'active', paidUntil: addMonths(months), autoRenew: d.subs[id]?.autoRenew ?? true } },
      }));
    },
    setAutoRenew: (id, v) => setData((d) => ({ ...d, subs: { ...d.subs, [id]: { ...d.subs[id], autoRenew: v } } })),
    savePlan: (p) => setData((d) => ({ ...d, plans: d.plans.some((x) => x.id === p.id) ? d.plans.map((x) => (x.id === p.id ? p : x)) : [...d.plans, p] })),
    deletePlan: (id) => setData((d) => ({ ...d, plans: d.plans.filter((x) => x.id !== id) })),
    setPrice: (id, patch) => setData((d) => ({ ...d, prices: { ...d.prices, [id]: { ...d.prices[id], ...patch } } })),
    reset: () => setData(DEFAULT),
    setLink: (id, st) => setData((d) => { const linked = { ...d.linked }; if (st) linked[id] = st; else delete linked[id]; return { ...d, linked }; }),
  }), [data, pay]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBilling() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBilling outside BillingProvider');
  return v;
}

export const sum = (n: number) => `${n.toLocaleString('ru-RU')} сум`;
export const gbLabel = (gb: number) => (gb >= 1024 ? `${+(gb / 1024).toFixed(1)} TB` : `${gb} GB`);
