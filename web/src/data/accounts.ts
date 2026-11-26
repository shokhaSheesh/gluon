import type { Platform } from '../lib/store';

/**
 * Demo accounts shown on the login screen.
 * - user: company owners. `bank` users came through a partner bank (co-branded, no bank-offers page).
 * - merchant: partner cabinets. `bank` = aggregator bank, `service` = connected startup.
 * - admin: Gluon team.
 */
export type AccountKind = 'gluon' | 'bank' | 'service' | 'admin';

export interface DemoAccount {
  id: string;
  platform: Platform;
  kind: AccountKind;
  title: string;        // label on the login screen
  name: string;         // shown in the app
  login: string;        // phone digits for users, login for merchant/admin
  password: string;
  org?: string;         // bank / service the account belongs to
  orgId?: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { id: 'gluon-user', platform: 'user', kind: 'gluon', title: 'Gluon User', name: 'Даулетмуратов Ахмет', login: '901234567', password: 'gluon123' },
  { id: 'kapital-user', platform: 'user', kind: 'bank', title: 'Kapitalbank User', name: 'Сагадиев Алишер', login: '909876543', password: 'kapital123', org: 'Kapitalbank', orgId: 'kapital' },
  { id: 'service-merchant', platform: 'merchant', kind: 'service', title: 'Сервис (Billz)', name: 'Billz', login: 'billz', password: 'billz123', org: 'Billz', orgId: 'billz' },
  { id: 'ox-merchant', platform: 'merchant', kind: 'service', title: 'Сервис (OX)', name: 'OX', login: 'ox', password: 'ox12345', org: 'OX', orgId: 'ox' },
  { id: 'bank-merchant', platform: 'merchant', kind: 'bank', title: 'Банк (Kapitalbank)', name: 'Kapitalbank', login: 'kapitalbank', password: 'kapital123', org: 'Kapitalbank', orgId: 'kapital' },
  { id: 'admin', platform: 'admin', kind: 'admin', title: 'Gluon Админ', name: 'Gluon Админ', login: 'admin', password: 'admin123' },
];

/** `?as=` shortcut aliases → account id */
export const AS_ALIASES: Record<string, string> = {
  user: 'gluon-user',
  kapital: 'kapital-user',
  merchant: 'bank-merchant',
  bank: 'bank-merchant',
  service: 'service-merchant',
  ox: 'ox-merchant',
  admin: 'admin',
};
