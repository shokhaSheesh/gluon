/**
 * Money and usage history of a company inside Gluon (admin views), built deterministically from the shared client data:
 *  - subscriptions: the Gluon plan + every connected service (what the company bought)
 *  - operations: the Gluon balance ledger — top-ups, service / plan payments, extra archive space, refunds
 *  - payments: transactions through the payment provider (Plum) — successful top-ups, failed and refunded attempts
 *  - storage, employees and bank-statement operations for the company page
 */
import { useMemo } from 'react';
import { OPERATIONS } from '../data/operations';
import { EMPLOYEES, SERVICES } from '../data/mock';
import { DEMO_CLIENT_ID, TODAY, fmtDate, parseDate, servicePayments, useMerchant, type Client } from './merchant';
import { useBilling, type Plan, type ServicePrice } from './billing';

export type OpKind = 'topup' | 'service' | 'plan' | 'storage' | 'refund';
export interface LedgerOp { id: string; date: string; time: string; kind: OpKind; title: string; amount: number; balance: number; ref?: string }
export type PayStatus = 'success' | 'failed' | 'refunded';
export interface ProviderPayment { id: string; date: string; time: string; method: string; card: string; amount: number; fee: number; status: PayStatus; error?: string }
export type SubKind = 'plan' | 'service';
export interface Subscription { id: string; kind: SubKind; item: string; itemId: string; since: string; paidUntil: string; price: number; months: number; totalPaid: number; autoRenew: boolean; status: 'active' | 'expired' }
export interface Employee { name: string; role: string; phone: string; lastActive: string }
export interface BankOp { id: string; date: string; counterparty: string; purpose: string; amount: number; account: string }
export interface Storage { totalGb: number; usedGb: number; parts: { name: string; gb: number; color: string }[] }
export interface CompanyLedger { subs: Subscription[]; ops: LedgerOp[]; payments: ProviderPayment[]; balance: number; storage: Storage; employees: Employee[]; bankOps: BankOp[] }

export const OP_LABEL: Record<OpKind, string> = { topup: 'Пополнение', service: 'Оплата сервиса', plan: 'Оплата тарифа', storage: 'Место в архиве', refund: 'Возврат' };
export const PAY_LABEL: Record<PayStatus, { label: string; kind: 'success' | 'error' | 'neutral' }> = {
  success: { label: 'Успешно', kind: 'success' }, failed: { label: 'Ошибка', kind: 'error' }, refunded: { label: 'Возврат', kind: 'neutral' },
};
const METHODS = [['Uzcard', '8600'], ['Humo', '9860'], ['Visa', '4200'], ['Mastercard', '5614']] as const;
const ERRORS = ['Недостаточно средств на карте', 'Карта заблокирована', 'Неверный SMS-код', 'Превышен лимит по карте'];
const FIRST = ['Сардор', 'Нигора', 'Бобур', 'Малика', 'Жасур', 'Дилноза', 'Азиз', 'Севара', 'Отабек', 'Зарина', 'Тимур', 'Гулнора'];
const LAST = ['Каримов', 'Саидова', 'Рахимов', 'Юсупова', 'Турсунов', 'Назарова', 'Алимов', 'Хасанова'];
const ROLES = ['Менеджер', 'Бухгалтер', 'Кассир', 'Склад', 'Маркетолог'];
const PARTS = [['Заказы', '#6D5DF6'], ['Клиенты', '#0891B2'], ['Продукты', '#D97706'], ['Медиа', '#DC2626'], ['Отчёты', '#079455']] as const;
const COUNTER = [['ООО “CLICK”', 'Зачисление по эквайрингу'], ['ООО “INSPIRED” (Payme)', 'Зачисление по эквайрингу'], ['ООО “ARENDA PLUS”', 'Оплата аренды помещения'], ['ГНК', 'Уплата НДС'], ['Реестр зарплатных карт', 'Зарплата сотрудникам'], ['ООО “OPT TRADE”', 'Оплата за товар по договору'], ['ООО “UZ LOGISTIC”', 'Доставка товара']] as const;

const seed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 99_991, 11);
const pad = (n: number) => String(n).padStart(2, '0');
const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate());

export function companyLedger(c: Client, prices: Record<string, ServicePrice>, plans: Plan[], names: Record<string, string>): CompanyLedger {
  const k = seed(c.id);
  const plan = plans.find((p) => p.id === c.plan);
  const debits: { date: Date; kind: OpKind; title: string; amount: number; ref?: string }[] = [];
  const subs: Subscription[] = [];

  // plan: monthly from registration (free plan has no payments)
  if (plan) {
    let d = parseDate(c.registered), n = 0;
    while (d <= TODAY) { if (plan.price) debits.push({ date: d, kind: 'plan', title: `Тариф «${plan.name}» · 1 мес.`, amount: plan.price, ref: plan.id }); n++; d = addMonths(d, 1); }
    subs.push({ id: `${c.id}-plan`, kind: 'plan', item: `Тариф «${plan.name}»`, itemId: plan.id, since: c.registered, paidUntil: plan.price ? fmtDate(d) : '—', price: plan.price, months: n, totalPaid: plan.price * n, autoRenew: true, status: 'active' });
  }
  // services: paid periods from the shared payment chain
  Object.entries(c.services).forEach(([sid, s]) => {
    const price = prices[sid]?.price ?? 0;
    const paid = servicePayments(c, sid, price).filter((p) => p.status === 'paid');
    paid.forEach((p) => debits.push({ date: parseDate(p.paidOn), kind: 'service', title: `${names[sid] ?? sid} · ${p.months} мес.`, amount: price * p.months, ref: sid }));
    const last = paid[0];
    const until = last ? fmtDate(addMonths(parseDate(last.date), last.months)) : '—';
    subs.push({
      id: `${c.id}-${sid}`, kind: 'service', item: names[sid] ?? sid, itemId: sid, since: s.since, paidUntil: until, price,
      months: paid.reduce((a, p) => a + p.months, 0), totalPaid: paid.reduce((a, p) => a + p.amount, 0), autoRenew: s.status === 'active' && (k + sid.length) % 4 !== 0,
      status: s.status === 'active' ? 'active' : 'expired',
    });
  });
  // extra archive space once in a while
  if (k % 3 === 0) { const d = addMonths(parseDate(c.registered), 2 + (k % 4)); if (d <= TODAY) debits.push({ date: d, kind: 'storage', title: 'Доп. место в архиве · +100 GB', amount: 19_000 }); }
  debits.sort((a, b) => a.date.getTime() - b.date.getTime());

  // balance: top up through the provider whenever a payment would not fit
  const ops: LedgerOp[] = [];
  const payments: ProviderPayment[] = [];
  let bal = 0, i = 0;
  const [method, bin] = METHODS[k % METHODS.length];
  const card = `${bin} •••• ${String(1000 + (k % 9000)).slice(-4)}`;
  // times inside a day follow the real order of events (top-up → payment → …)
  let day = '', slot = 0;
  const clock = (d: Date) => {
    const ds = fmtDate(d);
    if (ds !== day) { day = ds; slot = 0; }
    const m = 9 * 60 + ((k * 7) % 50) + slot * 23 + (slot ? (k + slot) % 9 : 0);
    slot++;
    return `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  };
  const pay = (date: Date, amount: number, status: PayStatus, at: string, error?: string) => {
    payments.push({ id: `PLM-${String(k).padStart(5, '0')}${pad(i % 100)}${payments.length}`, date: fmtDate(date), time: at, method, card, amount, fee: Math.round(amount * 0.01), status, error });
  };
  for (const d of debits) {
    if (bal < d.amount) {
      const need = d.amount - bal;
      const top = Math.ceil((need * (1 + ((k + i) % 3))) / 100_000) * 100_000;
      if ((k + i) % 7 === 3) pay(d.date, top, 'failed', clock(d.date), ERRORS[(k + i) % ERRORS.length]);
      const t = clock(d.date);
      pay(d.date, top, 'success', t);
      bal += top;
      ops.push({ id: `${c.id}-t${i}`, date: fmtDate(d.date), time: t, kind: 'topup', title: `Пополнение · ${method} ${card.slice(-4)}`, amount: top, balance: bal });
    }
    bal -= d.amount;
    ops.push({ id: `${c.id}-d${i}`, date: fmtDate(d.date), time: clock(d.date), kind: d.kind, title: d.title, amount: -d.amount, balance: bal, ref: d.ref });
    i++;
  }
  if (k % 5 === 1 && ops.length > 2) {
    // one refunded top-up (charged twice by the provider)
    const t = ops.find((o) => o.kind === 'topup');
    if (t) { pay(parseDate(t.date), t.amount, 'refunded', t.time); }
  }
  ops.reverse(); payments.reverse();

  // storage (plan size; usage grows with time on the platform and connected services)
  const totalGb = (plan?.gb ?? 512) + (debits.some((d) => d.kind === 'storage') ? 100 : 0);
  const usedGb = Math.min(totalGb - 4, Math.round(totalGb * (0.15 + ((k % 60) / 100)) ));
  const weights = PARTS.map((_, j) => 1 + ((k >> j) % 5));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const storage: Storage = { totalGb, usedGb, parts: PARTS.map(([name, color], j) => ({ name, color, gb: Math.round((usedGb * weights[j]) / wsum) })) };

  // employees of the company (owner + staff)
  const employees: Employee[] = c.id === DEMO_CLIENT_ID
    ? EMPLOYEES.map((e, j) => ({ name: e.name, role: e.role, phone: e.phone, lastActive: j < 2 ? fmtDate(TODAY) : '18.11.2026' }))
    : [{ name: c.owner, role: 'Владелец', phone: c.phone, lastActive: c.lastActive ?? '—' },
      ...Array.from({ length: k % 4 }, (_, j) => ({ name: `${LAST[(k + j) % LAST.length]} ${FIRST[(k * 3 + j) % FIRST.length]}`, role: ROLES[(k + j) % ROLES.length], phone: `9${(k + j) % 10}${String(1_000_000 + ((k * 7_919 + j * 104_729) % 8_999_999)).slice(0, 7)}`, lastActive: fmtDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - ((k + j * 5) % 20))) }))];

  // bank operations from uploaded statements
  const accs = (c.accounts ?? []).filter((a) => a.status === 'active');
  const bankOps: BankOp[] = c.id === DEMO_CLIENT_ID
    ? OPERATIONS.map((o) => ({ id: String(o.id), date: o.date, counterparty: o.counterparty, purpose: o.purpose, amount: o.type === 'expense' ? -o.amount : o.amount, account: o.account }))
    : accs.length ? Array.from({ length: 4 + (k % 6) }, (_, j) => {
        const [cp, purpose] = COUNTER[(k + j) % COUNTER.length];
        const income = purpose.startsWith('Зачисление');
        return { id: `${c.id}-b${j}`, date: fmtDate(new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - j * 2 - (k % 3))), counterparty: cp, purpose, amount: (income ? 1 : -1) * (500_000 + ((k * (j + 3) * 7_919) % 12_000_000)), account: accs[j % accs.length].number };
      }) : [];

  return { subs, ops, payments, balance: bal, storage, employees, bankOps };
}

export const fmtSum = (n: number) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${Math.abs(n).toLocaleString('ru-RU')} сум`;

const NAMES = Object.fromEntries(SERVICES.map((s) => [s.id, s.name]));
/** Ledgers of every company (memoized) — used by the admin finance pages and the company page. */
export function useLedgers() {
  const { clients } = useMerchant();
  const { prices, plans } = useBilling();
  return useMemo(() => clients.map((c) => ({ c, l: companyLedger(c, prices, plans, NAMES) })), [clients, prices, plans]);
}
