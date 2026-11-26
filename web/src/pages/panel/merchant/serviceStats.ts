import { TODAY, parseDate, paidUntilOf, servicePayments, type Client } from '../../../lib/merchant';

export type RenewalKind = 'ontime' | 'late' | 'failed';
export interface Renewal {
  id: string; client: Client; at: Date; paidOn: string; from: string; to: string; months: number; kind: RenewalKind; late: number;
}

const addMonths = (d: Date, m: number) => new Date(d.getFullYear(), d.getMonth() + m, d.getDate());
export const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

/** Every subscription period of every client of the service (newest first). `at` = when it was paid or failed. */
export function renewalsOf(clients: Client[], svc: string): Renewal[] {
  const out: Renewal[] = [];
  clients.forEach((c) => {
    if (!c.services[svc]) return;
    servicePayments(c, svc, 0).forEach((p) => {
      const start = parseDate(p.date);
      out.push({
        id: p.id, client: c, at: parseDate(p.paidOn), paidOn: p.paidOn, from: p.date, to: p.status === 'paid' ? fmt(addMonths(start, p.months)) : '—',
        months: p.months, kind: p.status === 'failed' ? 'failed' : p.late ? 'late' : 'ontime', late: p.late,
      });
    });
  });
  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/** The client still had the service on that day (connected and not lapsed). */
export function isClientOn(c: Client, svc: string, day: Date) {
  const s = c.services[svc];
  if (!s || parseDate(s.since) > day) return false;
  return s.status === 'active' || parseDate(paidUntilOf(c, svc)) > day;
}

const MONTH_MS = 30.44 * 86_400_000;
/** Months with the service up to `asOf` (stops at the lapse date for clients who stopped paying). */
export function tenureOf(c: Client, svc: string, asOf = TODAY) {
  const s = c.services[svc];
  const end = s.status === 'active' ? asOf : new Date(Math.min(asOf.getTime(), parseDate(paidUntilOf(c, svc)).getTime()));
  return Math.max(0, (end.getTime() - parseDate(s.since).getTime()) / MONTH_MS);
}

/** Paid months up to `asOf`. */
export function paidMonthsOf(c: Client, svc: string, asOf = TODAY) {
  return servicePayments(c, svc, 0).filter((p) => p.status === 'paid' && parseDate(p.date) <= asOf).reduce((a, p) => a + p.months, 0);
}

export const fmtMonths = (m: number) => `${m.toFixed(1).replace('.', ',').replace(',0', '')} мес.`;
export const fmtHours = (h: number) => {
  if (!isFinite(h)) return '—';
  if (h < 24) return `${Math.round(h)} ч`;
  const d = Math.floor(h / 24), r = Math.round(h % 24);
  return r ? `${d} д ${r} ч` : `${d} д`;
};
export const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
