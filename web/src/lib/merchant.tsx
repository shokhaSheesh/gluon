import { BANKS, SERVICES } from '../data/mock';
import { BANK_LOGOS, LOGO_BY_NAME } from '../assets';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Shared demo state for the merchant side (service + bank cabinets) and the links to the user side.
 * Only fields that exist in the flows are used:
 *  - company / INN / owner / phone / address / category → user registration
 *  - channel / joined → registration domain (bank subdomain) or the bank created the account
 *  - services, plan → Store + «Подписки и тарифы»
 *  - account requests → «Предложения банков» → «Открыть счёт»
 */

export type Channel = 'gluon' | 'kapital' | 'hayot';
/** Who runs a cabinet: a startup service, an aggregator bank, or the Gluon team (admin). */
export type OrgKind = 'service' | 'bank' | 'admin';

/** Partner cabinets created by Gluon admin. aggregator = bank-type cabinet (white-label, service switches, creates clients). */
export interface Partner { id: string; name: string; aggregator: boolean; login: string; password: string; status: 'active' | 'blocked'; created: string; subdomain?: string; logo?: string }
/** A service added by Gluon admin (the 5 built-in integrations live in data/mock). */
export interface CatalogService { id: string; name: string; type: string; description: string; color: string; logo?: string }
/** Store banner («Специальные предложения») tied to a service; order = array order. */
export interface Banner { id: string; service: string; title: string; active: boolean }
export type SubStatus = 'active' | 'unpaid';

export interface ClientService { status: SubStatus; since: string; paidUntil: string }
export interface Client {
  id: string;
  company: string;
  inn: string;
  owner: string;
  phone: string;          // 9 digits
  address: string;
  category: string;
  channel: Channel;
  joined: 'self' | 'bank';
  registered: string;
  plan: string;           // billing plan id
  services: Record<string, ClientService>;
  credentials?: { login: string; password: string }; // issued by a bank (login = phone)
  blocked?: boolean;                                   // blocked by the bank — cannot sign in
  block?: CompanyBlock;                                // why / who / when (seen by admin, the bank and services)
  accounts?: ClientAccount[];                          // settlement accounts opened by the client's bank
  lastActive?: string;                                 // last sign-in (dd.mm.yyyy); empty = never signed in
}

export interface CompanyBlock { reason: string; note: string; at: string; by: string; org: string }
export const BLOCK_REASONS = ['Подозрительная активность', 'Задолженность перед банком', 'Закрытие расчётного счёта', 'По запросу клиента', 'Другое'];

/** Расчётный счёт opened by the bank for its client (shown in the client's profile → «Банк аккаунт»). */
/** source: who added it — the client's bank (opened it), the company itself (in its profile) or Gluon admin. */
export interface ClientAccount { id: string; bank?: string; source?: 'bank' | 'user' | 'admin'; number: string; currency: 'UZS' | 'USD'; name: string; opened: string; status: 'active' | 'closed'; closed?: string }

const MFO: Record<string, string> = { kapital: '01158', hayot: '01183' };
/** 20-digit account number: 20208 (settlement) + currency code + bank MFO + 7 digits. */
export function genAccountNumber(bank: string, currency: 'UZS' | 'USD', seedN = Math.floor(Math.random() * 1e7)) {
  return `20208${currency === 'USD' ? '840' : '000'}${MFO[bank] ?? '01000'}${String(seedN % 1e7).padStart(7, '0')}`;
}

export type ConnStatus = 'pending' | 'approved' | 'rejected';
export interface ConnRequest { id: string; clientId: string; service: string; date: string; status: ConnStatus; reason?: string; hours?: number /* time to decision */ }

export type AccStatus = 'new' | 'progress' | 'opened' | 'rejected';
export interface AccountRequest {
  id: string; clientId: string; bank: string; product: string; date: string; status: AccStatus;
  contact: string; phone: string; comment?: string;
}

/** A label/value row typed by Gluon admin (e.g. «Обслуживание» — «Бесплатно»). */
export interface BankTerm { label: string; value: string }
/** Product directory (admin): a product and the parameters every bank fills in — the columns of its comparison table. */
export interface ProductParam { id: string; label: string }
export interface ProductDef { id: string; name: string; params: ProductParam[] }
/** A bank's product: a directory product + the bank's values for its parameters (by parameter id). */
export interface BankProduct { productId: string; values: Record<string, string> }
/** Bank card in «Предложения банков» — managed by Gluon admin; array order = order for users. */
export interface BankCard { id: string; name: string; logo?: string; rating: number; online: boolean; perk: string; terms: BankTerm[]; products: BankProduct[]; active: boolean }

interface MerchantData {
  clients: Client[];
  connRequests: ConnRequest[];
  accountRequests: AccountRequest[];
  bankServices: Record<string, string[]>;   // bank → service ids visible to its clients
  banks: BankCard[];
  bankProducts: ProductDef[];                // directory; order = order of tables for users
  serviceOrder?: string[];                   // admin's order of services (store, lists)
  teams: Record<string, Team>;               // org id → employees & roles
  audit: Record<string, AuditEntry[]>;       // org id → journal (newest first)
  chatRead?: Record<string, string[]>;       // org id → chats already opened
  partners: Partner[];
  recommended: Record<string, string[]>;     // 'gluon' = admin default; bank id = override for that bank's clients
  banners: Banner[];
  catalog?: CatalogService[];
}

/** The two demo users (must match data/accounts.ts). */
export const DEMO_CLIENT_ID = 'c-gluon-user';
export const KAPITAL_CLIENT_ID = 'c-kapital-user';

/* ---------- deterministic mock generation ---------- */
const COMPANIES = ['ООО “TEXNO GROUP”', 'ООО “MALIKA TEXTILE”', 'ЯТТ “JASUR MARKET”', 'ООО “SAFIA BAKERY”', 'ООО “ZOOM SHOES”', 'ООО “ORIENT COSMETICS”', 'ЯТТ “AZIZ AUTO PARTS”', 'ООО “GREEN FOOD”', 'ООО “BAHOR KIDS”', 'ООО “SILK ROAD TOYS”', 'ЯТТ “NUR ELECTRIC”', 'ООО “SAMARQAND DECOR”', 'ООО “PET LAND”', 'ООО “FRESH DRINKS”', 'ООО “ALFA SPORT”', 'ЯТТ “KITOB OLAMI”', 'ООО “TIME WATCH”', 'ООО “GOLD STYLE”', 'ООО “BAG HOUSE”', 'ЯТТ “OPTIKA PLUS”', 'ООО “MEBEL CITY”', 'ООО “CHOYXONA №1”', 'ООО “FLORA”', 'ЯТТ “AVTO SERVIS 24”',
  'ООО “UZ PLAST”', 'ООО “DIYOR TEXTILE”', 'ЯТТ “ASAL SHIRINLIKLAR”', 'ООО “MEGA BUILD”', 'ООО “LAZZAT FOOD”', 'ООО “SMART PHONE UZ”', 'ЯТТ “BARAKA MARKET”', 'ООО “NAVRUZ TEXTILE”', 'ООО “KIDS PLANET”', 'ООО “OILA MEBEL”', 'ЯТТ “SHIFO APTEKA”', 'ООО “TOSHKENT NON”', 'ООО “ELITE PARFUM”', 'ООО “COFFEE POINT”', 'ЯТТ “SARDOR TEXNIKA”', 'ООО “YASHIL BOG”', 'ООО “MODA LINE”', 'ООО “AQUA LIFE”', 'ЯТТ “OLTIN QOSH”', 'ООО “SPORT MASTER UZ”', 'ООО “MAKON HOME”', 'ООО “ZIYO BOOKS”', 'ЯТТ “GULSHAN FLOWERS”', 'ООО “ROYAL SHOES”'];
const OWNERS = ['Каримов Азиз', 'Саидова Малика', 'Рустамов Жасур', 'Юсупова Сафия', 'Абдуллаев Бобур', 'Ахмедова Нигора', 'Тошматов Азамат', 'Назарова Гулнора', 'Исмоилов Шерзод', 'Хасанова Дилноза', 'Мирзаев Нурбек', 'Холматов Санжар', 'Рахимова Зарина', 'Эргашев Тимур', 'Усмонов Алишер', 'Олимова Камола', 'Турсунов Фаррух', 'Жураева Мадина', 'Каюмов Улугбек', 'Собирова Лола', 'Норматов Отабек', 'Шарипов Достон', 'Аминова Феруза', 'Бекмуродов Ислом',
  'Расулов Диёр', 'Камалова Асал', 'Хайдаров Санжар', 'Юлдашева Нилуфар', 'Азимов Бехзод', 'Пулатова Севара', 'Мухаммадиев Акмал', 'Ибрагимова Шахноза', 'Латипов Жавохир', 'Тураева Мохира', 'Солиев Рустам', 'Халилова Гулчехра', 'Каримов Сардор', 'Юсупов Шохрух', 'Абдуллаева Мадина', 'Назаров Илхом', 'Рашидова Камила', 'Алимов Фарход', 'Холикова Дилфуза', 'Мирзаев Отабек', 'Сафарова Нодира', 'Бобоев Элёр', 'Умарова Гулшан', 'Хамидов Анвар'];
const CATS = ['Электроника', 'Одежда', 'Продукты питания', 'Продукты питания', 'Обувь', 'Красота и уход', 'Автозапчасти', 'Продукты питания', 'Одежда', 'Аксессуары', 'Электрика', 'Аксессуары', 'Товары для животных', 'Напитки', 'Одежда', 'Аксессуары', 'Аксессуары', 'Аксессуары', 'Аксессуары', 'Аксессуары', 'Аксессуары', 'Напитки', 'Аксессуары', 'Автозапчасти',
  'Хозтовары', 'Одежда', 'Продукты питания', 'Стройматериалы', 'Продукты питания', 'Электроника', 'Продукты питания', 'Одежда', 'Детские товары', 'Мебель', 'Аптека', 'Продукты питания', 'Красота и уход', 'Напитки', 'Электроника', 'Продукты питания', 'Одежда', 'Хозтовары', 'Аксессуары', 'Одежда', 'Мебель', 'Книги', 'Цветы', 'Обувь'];
const STREETS = ['ул. Амира Темура 129Б', 'ул. Навои 12', 'Чиланзар, 9 квартал', 'ул. Бабура 45', 'ул. Шота Руставели 3', 'Юнусабад, 4 квартал', 'ул. Мукими 88', 'ул. Фурката 7'];
const SVC = ['billz', 'robosell', 'robohub', 'ox', 'delever'];
const PLANS = ['base', 'base', 'business', 'base', 'pro', 'business'];

const pad = (n: number) => String(n).padStart(2, '0');
const dateFrom = (i: number, month = 11) => `${pad(1 + ((i * 7) % 27))}.${pad(month)}.2026`;
/** Demo "today" — every period and statistic is counted up to this date. */
export const TODAY = new Date(2026, 10, 25);
export const parseDate = (d: string) => { const [dd, mm, yy] = d.split('.').map(Number); return new Date(yy, mm - 1, dd); };
export const fmtDate = (d: Date) => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
/** month index 0 = Jun 2025 … 17 = Nov 2026 */
const monthDate = (mi: number, day: number) => fmtDate(new Date(2025, 5 + mi, mi === 17 ? Math.min(day, 24) : day));

function genClients(): Client[] {
  const list: Client[] = COMPANIES.map((company, i) => {
    const channel: Channel = i % 4 === 1 || i % 7 === 3 ? 'kapital' : i % 9 === 5 ? 'hayot' : 'gluon';
    const services: Record<string, ClientService> = {};
    SVC.forEach((s, j) => {
      if ((i + j * 3) % 4 === 0 || (j === 0 && i % 3 !== 2)) {
        services[s] = { status: (i + j) % 6 === 0 ? 'unpaid' : 'active', since: monthDate((i * 5 + j * 7) % 18, 1 + ((i + j) * 7) % 27), paidUntil: (i + j) % 6 === 0 ? '20.11.2026' : '10.12.2026' };
      }
    });
    const joined = channel === 'kapital' && i % 2 === 1 ? 'bank' : 'self';
    return {
      id: `c-${i + 1}`,
      company,
      inn: String(302_000_000 + ((i * 7_919_311) % 9_000_000)).slice(0, 9),
      owner: OWNERS[i],
      phone: `9${(i * 37) % 10}${String(1_000_000 + ((i * 912_773) % 8_999_999)).slice(0, 7)}`,
      address: `Ташкент, ${STREETS[i % STREETS.length]}`,
      category: CATS[i],
      channel,
      joined,
      registered: fmtDate(new Date(Math.min(parseDate(dateFrom(i, 6 + (i % 6))).getTime(), ...Object.values(services).map((x) => parseDate(x.since).getTime() - 86_400_000 * (3 + (i % 9)))))),
      plan: PLANS[i % PLANS.length],
      services,
      accounts: channel !== 'gluon' ? [
        { id: `acc-${i}-1`, bank: channel, source: 'bank' as const, number: genAccountNumber(channel, 'UZS', 1_000_003 + i * 7_919), currency: 'UZS', name: 'Основной счёт', opened: dateFrom(i, 6 + (i % 6)), status: 'active' },
        ...(i % 3 === 0 ? [{ id: `acc-${i}-2`, bank: channel, source: 'bank' as const, number: genAccountNumber(channel, 'USD', 2_000_011 + i * 3_571), currency: 'USD' as const, name: 'Валютный счёт', opened: dateFrom(i + 2, 7 + (i % 5)), status: (i % 2 ? 'closed' : 'active') as 'active' | 'closed', closed: i % 2 ? '10.11.2026' : undefined }] : []),
      ] : undefined,
      credentials: { login: `9${(i * 37) % 10}${String(1_000_000 + ((i * 912_773) % 8_999_999)).slice(0, 7)}`, password: `client${100 + i}` },
    };
  });
  // recent Kapitalbank clients (this month), so the bank dashboard has fresh data
  const fresh: [string, string, string, string, Client['joined'], string, string[]][] = [
    ['ООО “NUR PHARM”', 'Аптека', 'Ганиев Бахтиёр', '05.11.2026', 'bank', '931114455', ['billz']],
    ['ЯТТ “SHOH MEBEL”', 'Мебель', 'Шохидов Шохрух', '12.11.2026', 'self', '997775511', ['billz', 'robosell']],
    ['ООО “TOSH DECOR”', 'Хозтовары', 'Тошева Мунира', '18.11.2026', 'bank', '946660022', []],
    ['ООО “ASIA FOOD”', 'Продукты питания', 'Алиев Фаррух', '23.11.2026', 'bank', '903332211', ['robosell']],
  ];
  fresh.forEach(([company, category, owner, registered, joined, phone, svcs], k) => list.push({
    id: `c-kb-${k + 1}`, company, inn: String(311_200_100 + k * 7_313), owner, phone, address: `Ташкент, ${STREETS[(k + 3) % STREETS.length]}`, category,
    channel: 'kapital', joined, registered, plan: 'base', credentials: { login: phone, password: `client${200 + k}` },
    ...(k === 0 ? { blocked: true, block: { reason: 'Задолженность перед банком', note: 'Просрочка по кредитной линии более 60 дней. Разблокируем после погашения.', at: '20.11.2026 15:40', by: 'Нигора Ахмедова', org: 'kapital' } } : {}),
    accounts: k === 2 ? [] : [{ id: `acc-kb-${k}`, bank: 'kapital', source: 'bank' as const, number: genAccountNumber('kapital', 'UZS', 3_000_017 + k * 4_111), currency: 'UZS' as const, name: 'Основной счёт', opened: registered, status: 'active' as const }],
    services: Object.fromEntries(svcs.map((sv) => [sv, { status: 'active' as const, since: registered, paidUntil: registered.replace('.11.', '.12.') }])),
  }));
  // the two demo users (Gluon User / Kapitalbank User) — same data as on the user side
  list.unshift(
    { id: DEMO_CLIENT_ID, accounts: [
        { id: 'acc-demo-hayot', bank: 'hayot', source: 'user', number: '20208000100123451234', currency: 'UZS', name: 'Основной счёт', opened: '20.06.2026', status: 'active' },
        { id: 'acc-demo-kapital', bank: 'kapital', source: 'user', number: '20208000900987655678', currency: 'UZS', name: 'Эквайринг', opened: '02.07.2026', status: 'active' },
      ], company: 'ООО “Прометей”', inn: '123456789', owner: 'Даулетмуратов Ахмет', phone: '901234567', address: 'Ташкент, пр. Амира Темура 129Б', category: 'Аксессуары', channel: 'gluon', joined: 'self', registered: '14.06.2026', plan: 'base',
      services: { robosell: { status: 'active', since: '10.09.2026', paidUntil: '10.12.2026' }, billz: { status: 'active', since: '10.08.2026', paidUntil: '10.12.2026' }, robohub: { status: 'unpaid', since: '20.10.2026', paidUntil: '20.11.2026' } } },
    { id: KAPITAL_CLIENT_ID, company: 'ООО “Sagadiev Trade”', inn: '305667788', owner: 'Сагадиев Алишер', phone: '909876543', address: 'Ташкент, ул. Навои 30', category: 'Электроника', channel: 'kapital', joined: 'bank', registered: '02.10.2026', plan: 'base',
      services: { billz: { status: 'active', since: '05.10.2026', paidUntil: '05.12.2026' }, robosell: { status: 'active', since: '05.10.2026', paidUntil: '05.12.2026' } },
      credentials: { login: '909876543', password: 'kapital123' },
      accounts: [
        { id: 'acc-kb-main', bank: 'kapital', source: 'bank', number: '20208000900987655678', currency: 'UZS', name: 'Основной счёт', opened: '02.10.2026', status: 'active' },
        { id: 'acc-kb-usd', bank: 'kapital', source: 'bank', number: '20208840001158004321', currency: 'USD', name: 'Валютный счёт', opened: '15.10.2026', status: 'active' },
        { id: 'acc-kb-hayot', bank: 'hayot', source: 'user', number: '20208000100123451234', currency: 'UZS', name: 'Основной счёт', opened: '20.10.2026', status: 'active' },
      ] },
  );
  // last sign-in: most clients are active, some went quiet, a few bank-created ones never signed in
  const AGO = [0, 1, 2, 4, 7, 12, 19, 27, 38, 55, 74, 96, 130, 180];
  list.forEach((c, i) => {
    if (c.id === DEMO_CLIENT_ID || c.id === KAPITAL_CLIENT_ID) { c.lastActive = fmtDate(TODAY); return; }
    if (c.joined === 'bank' && i % 6 === 4) return;
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - AGO[(i * 5) % AGO.length]);
    const reg = parseDate(c.registered);
    c.lastActive = fmtDate(d < reg ? reg : d);
  });
  return list;
}

function genConnRequests(clients: Client[]): ConnRequest[] {
  // the Gluon user's OX request — user side shows «Ожидает подтверждения сервиса»
  const out: ConnRequest[] = [{ id: 'cr-demo', clientId: DEMO_CLIENT_ID, service: 'ox', date: '24.11.2026', status: 'pending' }];
  const reasons = ['Не удалось найти аккаунт компании', 'Компания уже подключена напрямую', 'Неполные данные компании'];
  const hoursOf = (k: number) => [2, 5, 9, 18, 26, 4, 40, 7, 13, 60, 3, 22][k % 12];
  SVC.forEach((svc, si) => {
    // approved: every client of the service came through a request, decided `hours` before the connection
    clients.filter((c) => c.services[svc]).forEach((c, k) => {
      const hours = hoursOf(k + si);
      const d = parseDate(c.services[svc].since);
      d.setDate(d.getDate() - Math.ceil(hours / 24));
      out.push({ id: `cr-${svc}-a${k}`, clientId: c.id, service: svc, date: fmtDate(d), status: 'approved', hours });
    });
    const others = clients.filter((c) => !c.services[svc] && c.id !== DEMO_CLIENT_ID && c.id !== KAPITAL_CLIENT_ID);
    // pending: recent requests from companies that do not use the service yet
    others.slice(si % 3, si % 3 + 3).forEach((c, k) => {
      out.push({ id: `cr-${svc}-p${k}`, clientId: c.id, service: svc, date: `${pad(24 - k * 2 - si)}.11.2026`, status: 'pending' });
    });
    // rejected: spread over the whole history
    others.slice(si % 3 + 3, si % 3 + 11).forEach((c, k) => {
      out.push({ id: `cr-${svc}-r${k}`, clientId: c.id, service: svc, date: monthDate((k * 5 + si * 3) % 18, 2 + ((k * 11 + si) % 24)), status: 'rejected', reason: reasons[(k + si) % reasons.length], hours: hoursOf(k * 3 + si + 1) });
    });
  });
  return out;
}

function genAccountRequests(clients: Client[]): AccountRequest[] {
  const reqs: AccountRequest[] = [
    { id: 'ar-1', clientId: DEMO_CLIENT_ID, bank: 'anor', product: 'Расчётный счёт', date: '22.11.2026', status: 'progress', contact: 'Даулетмуратов Ахмет', phone: '901234567' },
  ];
  const products = ['Расчётный счёт', 'Кредит', 'Эквайринг', 'Бизнес-карта', 'Рассрочка'];
  const statuses: AccStatus[] = ['new', 'new', 'progress', 'opened', 'rejected', 'new', 'progress'];
  clients.filter((c) => c.channel === 'gluon' && c.id !== DEMO_CLIENT_ID).slice(0, 9).forEach((c, i) => {
    reqs.push({ id: `ar-${i + 2}`, clientId: c.id, bank: i % 3 === 2 ? 'hayot' : 'kapital', product: products[i % products.length], date: dateFrom(i + 1), status: statuses[i % statuses.length], contact: c.owner, phone: c.phone, comment: i % 3 === 0 ? 'Удобно связаться после 14:00' : undefined });
  });
  return reqs;
}

function initial(): MerchantData {
  const clients = genClients();
  return {
    clients,
    connRequests: genConnRequests(clients),
    accountRequests: genAccountRequests(clients),
    bankServices: { kapital: ['billz', 'robosell', 'robohub', 'ox'], hayot: SVC },
    teams: {},
    audit: {},
    partners: [
      { id: 'kapital', name: 'Kapitalbank', aggregator: true, login: 'kapitalbank', password: 'kapital123', status: 'active', created: '01.06.2025', subdomain: 'kapitalbank.gluon.uz' },
      { id: 'hayot', name: 'Hayot Bank', aggregator: true, login: 'hayotbank', password: 'hayot123', status: 'active', created: '15.03.2026', subdomain: 'hayot.gluon.uz' },
      { id: 'billz', name: 'Billz', aggregator: false, login: 'billz', password: 'billz123', status: 'active', created: '01.06.2025' },
      { id: 'ox', name: 'OX', aggregator: false, login: 'ox', password: 'ox12345', status: 'active', created: '10.08.2025' },
      { id: 'robosell', name: 'Robosell', aggregator: false, login: 'robosell', password: 'robosell1', status: 'active', created: '20.09.2025' },
      { id: 'robohub', name: 'RoboHub', aggregator: false, login: 'robohub', password: 'robohub1', status: 'active', created: '05.02.2026' },
    ],
    recommended: { gluon: ['billz', 'robosell'], kapital: ['billz', 'ox'] },
    banners: [
      { id: 'bn-1', service: 'robosell', title: 'Суперсила для бизнеса с Robosell', active: true },
      { id: 'bn-2', service: 'robohub', title: 'Суперсила для бизнеса с RoboHub', active: true },
      { id: 'bn-3', service: 'billz', title: 'Billz для магазинов одежды', active: true },
      { id: 'bn-4', service: 'ox', title: 'Суперсила для бизнеса с OX', active: true },
      { id: 'bn-5', service: 'delever', title: 'Доставка без хаоса с Delever', active: false },
    ],
    banks: seedBanks(),
    bankProducts: PRODUCT_DEFS,
  };
}

/* ---------- provider ---------- */
interface MerchantState extends MerchantData {
  setConnStatus: (id: string, status: ConnStatus, reason?: string) => void;
  addAccountRequest: (r: Omit<AccountRequest, 'id' | 'date' | 'status'>) => void;
  setAccountStatus: (id: string, status: AccStatus, comment?: string) => void;
  setBankServices: (bank: string, ids: string[]) => void;
  saveBank: (b: BankCard) => void;
  setBanks: (list: BankCard[]) => void;
  setProductDefs: (list: ProductDef[]) => void;
  setServiceOrder: (ids: string[]) => void;
  addClient: (c: Omit<Client, 'id' | 'registered'>) => Client;
  addClientService: (clientId: string, service: string) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  reset: () => void;
  teamOf: (org: string, kind: OrgKind) => Team;
  setTeam: (org: string, t: Team) => void;
  auditOf: (org: string, kind: OrgKind) => AuditEntry[];
  /** Chats with unread messages (counted per chat, not per message). */
  unreadChats: (org: string, contactIds: string[]) => string[];
  markChatRead: (org: string, id: string) => void;
  savePartner: (p: Partner) => void;
  setRecommended: (key: string, ids: string[]) => void;
  setBanners: (b: Banner[]) => void;
  addService: (svc: CatalogService) => void;   // add or update (built-in services are overridden by id)
  log: (org: string, kind: OrgKind, e: Omit<AuditEntry, 'id' | 'at' | 'actor'> & { actor?: string }) => void;
}

const Ctx = createContext<MerchantState | null>(null);
const KEY = 'gluon.merchant.v14';
const today = () => new Date().toLocaleDateString('ru-RU');

export function MerchantProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MerchantData>(() => {
    try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as MerchantData) : initial(); } catch { return initial(); }
  });
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ } }, [data]);
  // partners / services created by admin join the shared catalogs (store, logos, bank lists)
  (data.catalog ?? []).forEach(registerService);
  data.partners.forEach(registerPartner);
  (data.banks ?? []).forEach(registerBankCard);

  const value = useMemo<MerchantState>(() => ({
    ...data,
    setConnStatus: (id, status, reason) => setData((d) => ({ ...d, connRequests: d.connRequests.map((r) => (r.id === id ? { ...r, status, reason, hours: Math.max(1, Math.round((Date.now() - parseDate(r.date).getTime()) / 3_600_000) - 9) } : r)) })),
    addAccountRequest: (r) => setData((d) => ({ ...d, accountRequests: [{ ...r, id: `ar-${Date.now()}`, date: today(), status: 'new' }, ...d.accountRequests] })),
    setAccountStatus: (id, status, comment) => setData((d) => ({ ...d, accountRequests: d.accountRequests.map((r) => (r.id === id ? { ...r, status, comment: comment ?? r.comment } : r)) })),
    setBankServices: (bank, ids) => setData((d) => ({ ...d, bankServices: { ...d.bankServices, [bank]: ids } })),
    saveBank: (b) => { registerBankCard(b); setData((d) => ({ ...d, banks: d.banks.some((x) => x.id === b.id) ? d.banks.map((x) => (x.id === b.id ? b : x)) : [...d.banks, b] })); },
    setBanks: (banks) => setData((d) => ({ ...d, banks })),
    setProductDefs: (bankProducts) => setData((d) => ({ ...d, bankProducts })),
    setServiceOrder: (serviceOrder) => setData((d) => ({ ...d, serviceOrder })),
    addClient: (c) => {
      const client: Client = { ...c, id: `c-${Date.now()}`, registered: today() };
      setData((d) => ({ ...d, clients: [client, ...d.clients] }));
      return client;
    },
    updateClient: (id, patch) => setData((d) => ({ ...d, clients: d.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
    addClientService: (clientId, service) => setData((d) => ({
      ...d,
      clients: d.clients.map((c) => (c.id === clientId ? { ...c, services: { ...c.services, [service]: { status: 'active', since: today(), paidUntil: '—' } } } : c)),
    })),
    reset: () => setData(initial()),
    teamOf: (org, kind) => data.teams?.[org] ?? defaultTeam(kind),
    setTeam: (org, t) => setData((d) => ({ ...d, teams: { ...(d.teams ?? {}), [org]: t } })),
    unreadChats: (org, ids) => ids.filter((id, i) => (id === 'support' || i <= 2) && !(data.chatRead?.[org] ?? []).includes(id)),
    savePartner: (p) => setData((d) => ({ ...d, partners: d.partners.some((x) => x.id === p.id) ? d.partners.map((x) => (x.id === p.id ? p : x)) : [...d.partners, p] })),
    setRecommended: (key, ids) => setData((d) => ({ ...d, recommended: { ...d.recommended, [key]: ids } })),
    setBanners: (banners) => setData((d) => ({ ...d, banners })),
    addService: (svc) => { registerService(svc); setData((d) => ({ ...d, catalog: [...(d.catalog ?? []).filter((x) => x.id !== svc.id), svc] })); },
    markChatRead: (org, id) => setData((d) => ((d.chatRead?.[org] ?? []).includes(id) ? d : { ...d, chatRead: { ...(d.chatRead ?? {}), [org]: [...(d.chatRead?.[org] ?? []), id] } })),
    auditOf: (org, kind) => data.audit?.[org] ?? defaultAudit(kind, data.teams?.[org] ?? defaultTeam(kind)),
    log: (org, kind, e) => setData((d) => {
      const team = d.teams?.[org] ?? defaultTeam(kind);
      const list = d.audit?.[org] ?? defaultAudit(kind, team);
      const now = new Date();
      const at = `${fmtDate(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const entry: AuditEntry = { ...e, id: `a-${Date.now()}`, at, actor: e.actor ?? currentActor(team) };
      return { ...d, audit: { ...(d.audit ?? {}), [org]: [entry, ...list] } };
    }),
  }), [data]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMerchant() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMerchant outside MerchantProvider');
  return v;
}

/** Initials from the name inside quotes: ООО “TEXNO GROUP” → TG */
export const initials = (company: string) => {
  const inner = company.match(/[“"]([^”"]+)[”"]/)?.[1] ?? company;
  return inner.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
};

export const CHANNEL_LABEL: Record<string, string> = { gluon: 'Gluon', kapital: 'Kapitalbank', hayot: 'Hayot Bank' };
export const CONN_LABEL: Record<ConnStatus, { label: string; kind: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Ожидает', kind: 'warning' },
  approved: { label: 'Одобрена', kind: 'success' },
  rejected: { label: 'Отклонена', kind: 'error' },
};
export const ACC_LABEL: Record<AccStatus, { label: string; kind: 'info' | 'warning' | 'success' | 'error' }> = {
  new: { label: 'Новая', kind: 'info' },
  progress: { label: 'В работе', kind: 'warning' },
  opened: { label: 'Счёт открыт', kind: 'success' },
  rejected: { label: 'Отклонена', kind: 'error' },
};

/* ---------- per-client service history (deterministic demo data) ---------- */
/** `date` — period start (due date); `paidOn` — when it was actually paid (= date unless `late` > 0). */
export interface ServicePayment { id: string; date: string; paidOn: string; late: number; months: number; amount: number; status: 'paid' | 'failed'; note?: string }

const parse = parseDate;
const fmtD = fmtDate;
const seed = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7);

/** Subscription payments of one client for one service, from `since` until today (newest first). */
export function servicePayments(client: Client, svc: string, price: number): ServicePayment[] {
  return paymentChain(client, svc, price).payments;
}

/** «Оплачено до» derived from the payment history — the single source for list, detail and export. */
export function paidUntilOf(client: Client, svc: string): string {
  return paymentChain(client, svc, 0).until;
}

function paymentChain(client: Client, svc: string, price: number): { payments: ServicePayment[]; until: string } {
  const sub = client.services[svc];
  if (!sub || sub.paidUntil === '—') return { payments: [], until: sub?.paidUntil ?? '—' };
  const now = TODAY;
  const k = seed(client.id + svc);
  const demo = client.id === DEMO_CLIENT_ID || client.id === KAPITAL_CLIENT_ID; // keep in sync with the user side (monthly)
  const out: ServicePayment[] = [];
  let d = parse(sub.since);
  let i = 0;
  while (d <= now) {
    const months = !demo && (k + i) % 5 === 3 ? 3 : 1;
    // some renewals go through a few days after the due date (the period still starts on the due date)
    const late = !demo && i > 0 && (k * 3 + i) % (k % 3 === 0 ? 4 : 9) === 2 ? 1 + ((k + i) % 6) : 0;
    const paid = new Date(d.getFullYear(), d.getMonth(), d.getDate() + late);
    out.push({ id: `${client.id}-${svc}-${i}`, date: fmtD(d), paidOn: fmtD(paid > now ? now : paid), late, months, amount: price * months, status: 'paid' });
    d = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
    i++;
  }
  if (sub.status === 'unpaid' && out.length > 1) {
    // a renewal failed and the client stopped paying — for some clients that happened months ago
    const keep = demo ? out.length - 1 : Math.max(1, out.length - 1 - [0, 3, 0, 6][Math.floor((parseInt(client.id.slice(2)) || 0) / 6) % 4]);
    const last = out[keep];
    out.length = keep;
    out.push({ ...last, id: `${client.id}-${svc}-fail`, paidOn: last.date, late: 0, months: 1, amount: price, status: 'failed', note: 'Недостаточно средств на балансе Gluon' });
    return { payments: out.reverse(), until: last.date };
  }
  return { payments: out.reverse(), until: fmtD(d) };
}

export const autoRenewOf = (client: Client, svc: string) => client.services[svc]?.status === 'active' && seed(client.id + svc) % 4 !== 0;

/* ---------- employees & roles of a merchant organisation (CRUD permissions per page) ---------- */
export type Perm = [boolean, boolean, boolean, boolean]; // create, read, update, delete
export interface Role { id: string; name: string; system?: boolean; perms: Record<string, Perm> }
export interface Employee { id: string; name: string; phone: string; login: string; roleId: string; status: 'active' | 'blocked'; lastActive: string }
export interface Team { roles: Role[]; employees: Employee[] }

export const PAGES: Record<OrgKind, { id: string; label: string }[]> = {
  admin: [
    { id: 'dashboard', label: 'Дашборд' }, { id: 'companies', label: 'Компании' }, { id: 'subscriptions', label: 'Подписки' }, { id: 'account-requests', label: 'Заявки на счёт' }, { id: 'storage', label: 'Хранилище' },
    { id: 'payments', label: 'Платежи' }, { id: 'operations', label: 'Операции' }, { id: 'pricing', label: 'Тарифы' },
    { id: 'partners', label: 'Партнёры' }, { id: 'services', label: 'Сервисы' }, { id: 'banks', label: 'Банки' }, { id: 'bank-products', label: 'Продукты банков' }, { id: 'banners', label: 'Баннеры' },
    { id: 'chat', label: 'Чат' }, { id: 'team', label: 'Сотрудники и роли' }, { id: 'audit', label: 'Журнал действий' },
  ],
  service: [
    { id: 'dashboard', label: 'Дашборд' }, { id: 'clients', label: 'Клиенты' }, { id: 'subscriptions', label: 'Подписки' }, { id: 'requests', label: 'Заявки на подключение' },
    { id: 'chat', label: 'Чат' }, { id: 'team', label: 'Сотрудники и роли' }, { id: 'audit', label: 'Журнал действий' },
  ],
  bank: [
    { id: 'dashboard', label: 'Дашборд' }, { id: 'clients', label: 'Клиенты' }, { id: 'services', label: 'Сервисы для клиентов' }, { id: 'branding', label: 'Брендинг' },
    { id: 'chat', label: 'Чат' }, { id: 'team', label: 'Сотрудники и роли' }, { id: 'audit', label: 'Журнал действий' },
  ],
};

const ALL: Perm = [true, true, true, true];
const R: Perm = [false, true, false, false];
const RU: Perm = [false, true, true, false];
const NONE: Perm = [false, false, false, false];

export function defaultTeam(kind: OrgKind): Team {
  const pages = PAGES[kind].map((p) => p.id);
  const make = (f: (p: string) => Perm) => Object.fromEntries(pages.map((p) => [p, f(p)]));
  return {
    roles: [
      { id: 'owner', name: 'Владелец', system: true, perms: make(() => ALL) },
      { id: 'manager', name: 'Менеджер', perms: make((p) => (p === 'team' ? R : p === 'chat' ? ALL : p === 'dashboard' ? R : RU)) },
      { id: 'support', name: 'Поддержка', perms: make((p) => (p === 'chat' ? ALL : p === 'clients' ? R : NONE)) },
    ],
    employees: kind === 'admin'
      ? [
          { id: 'e1', name: 'Даулетмуратов Ахмет', phone: '907025329', login: 'admin', roleId: 'owner', status: 'active', lastActive: 'Сейчас в сети' },
          { id: 'e2', name: 'Сейтжанов Бекзод', phone: '912223344', login: 'bekzod.s', roleId: 'manager', status: 'active', lastActive: 'Сегодня, 10:05' },
          { id: 'e3', name: 'Алимова Нилуфар', phone: '935556677', login: 'nilufar.a', roleId: 'support', status: 'active', lastActive: 'Сегодня, 09:12' },
        ]
      : kind === 'service'
      ? [
          { id: 'e1', name: 'Рустам Эргашев', phone: '901112233', login: 'rustam', roleId: 'owner', status: 'active', lastActive: 'Сейчас в сети' },
          { id: 'e2', name: 'Дилноза Хасанова', phone: '935557788', login: 'dilnoza.h', roleId: 'manager', status: 'active', lastActive: 'Сегодня, 11:20' },
          { id: 'e3', name: 'Шерзод Исмоилов', phone: '977001122', login: 'sherzod', roleId: 'support', status: 'active', lastActive: 'Вчера, 18:04' },
          { id: 'e4', name: 'Камола Олимова', phone: '946663344', login: 'kamola.o', roleId: 'support', status: 'blocked', lastActive: '02.11.2026' },
        ]
      : [
          { id: 'e1', name: 'Улугбек Каюмов', phone: '901234000', login: 'ulugbek', roleId: 'owner', status: 'active', lastActive: 'Сейчас в сети' },
          { id: 'e2', name: 'Нигора Ахмедова', phone: '935550011', login: 'nigora.a', roleId: 'manager', status: 'active', lastActive: 'Сегодня, 09:45' },
          { id: 'e4', name: 'Жасур Рахимов', phone: '939990022', login: 'jasur.r', roleId: 'support', status: 'active', lastActive: 'Сегодня, 10:12' },
          { id: 'e3', name: 'Тимур Эргашев', phone: '977773311', login: 'timur.e', roleId: 'support', status: 'blocked', lastActive: '12.11.2026' },
        ],
  };
}

/* ---------- audit log: team, chat and requests actions of a merchant organisation ---------- */
export type AuditSection = 'team' | 'chat' | 'requests' | 'clients' | 'accounts' | 'services' | 'companies' | 'partners' | 'banners';
export interface AuditEntry { id: string; at: string /* dd.mm.yyyy HH:mm */; actor: string; section: AuditSection; action: string; target: string; details?: string }
/** Sections each cabinet logs (in tab order). */
export const AUDIT_SECTION: Record<OrgKind, Partial<Record<AuditSection, string>>> = {
  service: { team: 'Сотрудники и роли', chat: 'Чат', requests: 'Заявки на подключение' },
  bank: { clients: 'Клиенты', accounts: 'Расчётные счета', services: 'Сервисы для клиентов', team: 'Сотрудники и роли', chat: 'Чат' },
  admin: { companies: 'Компании', partners: 'Партнёры', services: 'Сервисы', banners: 'Баннеры', team: 'Сотрудники и роли', chat: 'Чат' },
};

/** The signed-in person — the demo signs in as the organisation owner. */
export const currentActor = (team: Team) => team.employees.find((e) => e.roleId === 'owner')?.name ?? 'Владелец';

function defaultAudit(kind: OrgKind, team: Team): AuditEntry[] {
  const [owner, manager, support, other] = [team.employees[0]?.name, team.employees[1]?.name, team.employees[2]?.name, team.employees[3]?.name ?? team.employees[2]?.name];
  const co = COMPANIES;
  if (kind === 'admin') {
    const rows: [string, AuditSection, string, string, string?][] = [
      [manager, 'banners', 'Изменил порядок баннеров', 'Специальные предложения', 'Billz перемещён на 3 место'],
      [owner, 'services', 'Отметил сервис рекомендуемым', 'Robosell'],
      [support, 'companies', 'Изменил данные компании', co[4], 'телефон'],
      [owner, 'partners', 'Создал партнёра', 'RoboHub', 'Сервис · логин robohub'],
      [manager, 'chat', 'Ответил на сообщение', co[7]],
      [owner, 'companies', 'Заблокировал компанию', co[19], 'Подозрительная активность'],
      [manager, 'banners', 'Отключил баннер', 'Delever'],
      [owner, 'partners', 'Создал партнёра', 'Hayot Bank', 'Агрегатор · hayot.gluon.uz'],
      [owner, 'team', 'Добавил сотрудника', support, 'Роль: Поддержка'],
      [owner, 'services', 'Скрыл сервис из магазина', 'Smartup'],
    ];
    return rows.map(([actor, section, action, target, details], i) => {
      const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - Math.floor(i * 2.3));
      return { id: `a-seed-${i}`, at: `${fmtDate(d)} ${pad(16 - (i % 7))}:${pad((i * 17) % 60)}`, actor: actor ?? 'Владелец', section, action, target: target ?? '—', details };
    });
  }
  const bank = kind === 'bank';
  const sec: AuditSection = bank ? 'clients' : 'requests';
  const req = bank
    ? [['Создал клиента', 'Логин выдан по номеру телефона'], ['Сбросил пароль клиента', ''], ['Заблокировал компанию', ''], ['Изменил данные клиента', 'адрес']]
    : [['Одобрил заявку', ''], ['Отклонил заявку', 'Причина: Неполные данные компании'], ['Одобрил заявку', ''], ['Отклонил заявку', 'Причина: Компания уже подключена напрямую']];
  const rows: [string, AuditSection, string, string, string?][] = [
    [support, 'chat', 'Ответил на сообщение', co[2]],
    [manager, sec, req[0][0], co[5], req[0][1]],
    [support, 'chat', 'Отправил сообщение', co[7]],
    [owner, 'team', 'Изменил права роли', 'Поддержка', 'Клиенты: просмотр'],
    [manager, 'chat', 'Отправил сообщение', co[11]],
    [manager, sec, req[1][0], co[9], req[1][1]],
    [owner, 'team', 'Заблокировал сотрудника', other],
    [support, 'chat', 'Ответил на сообщение', co[3]],
    [owner, 'team', 'Сменил пароль сотрудника', support],
    [manager, sec, req[2][0], co[14], req[2][1]],
    [support, 'chat', 'Отправил сообщение', 'Gluon поддержка'],
    [owner, 'team', 'Добавил сотрудника', other, 'Роль: Поддержка'],
    [owner, 'team', 'Создал роль', 'Поддержка', 'Чат: CRUD · Клиенты: просмотр'],
    [manager, sec, req[3][0], co[17], req[3][1]],
    [manager, 'chat', 'Ответил на сообщение', co[6]],
    [owner, 'team', 'Добавил сотрудника', support, 'Роль: Поддержка'],
    [owner, 'team', 'Добавил сотрудника', manager, 'Роль: Менеджер'],
    [owner, sec, req[0][0], co[20], req[0][1]],
    ...(bank ? [
      [owner, 'services', 'Отключил сервис', 'Delever', 'Скрыт для новых клиентов'],
      [manager, 'accounts', 'Открыл расчётный счёт', co[1], 'UZS · 2020 8000 •••• 2210'],
      [manager, 'accounts', 'Закрыл расчётный счёт', co[9], 'USD · 2020 8840 •••• 7731'],
      [support, 'accounts', 'Открыл расчётный счёт', co[15], 'USD · 2020 8840 •••• 0918'],
    ] as [string, AuditSection, string, string, string][] : []),
    [owner, 'chat', 'Отправил сообщение', co[1]],
    [owner, 'team', 'Изменил права роли', 'Менеджер', 'Заявки: изменение'],
  ];
  // spread over the last weeks, newest first
  return rows.map(([actor, section, action, target, details], i) => {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - Math.floor(i * 1.6));
    return { id: `a-seed-${i}`, at: `${fmtDate(d)} ${pad(17 - (i % 9))}:${pad((i * 13) % 60)}`, actor: actor ?? 'Владелец', section, action, target: target ?? '—', details };
  });
}

/** Contacts of a panel chat: Gluon support (not for admin) + the cabinet's own clients. */
export function chatContactIds(clients: Client[], platform: string | undefined, kind: string | undefined, orgId: string | undefined) {
  const mine = platform === 'admin' ? clients : kind === 'bank' ? clients.filter((c) => c.channel === orgId) : clients.filter((c) => orgId && c.services[orgId]);
  return { mine: mine.slice(0, 12), ids: [...(platform === 'admin' ? [] : ['support']), ...mine.slice(0, 12).map((c) => c.id)] };
}

/** Business categories used in registration and the bank's «Создать клиента». */
export const CATEGORIES = [...new Set(CATS)].sort((a, b) => a.localeCompare(b, 'ru'));
export const SERVICE_IDS = SVC;

/** The cabinet of the signed-in panel user: admin → 'gluon', otherwise the partner's org id. */
export function orgOf(session: { platform: string; kind?: string; orgId?: string } | null): { kind: OrgKind; org: string } {
  if (session?.platform === 'admin') return { kind: 'admin', org: 'gluon' };
  return { kind: session?.kind === 'bank' ? 'bank' : 'service', org: session?.orgId ?? '' };
}
/** Services recommended to a client: its bank's choice, otherwise Gluon's default. */
export const recommendedFor = (rec: Record<string, string[]>, bank?: string) => (bank && rec[bank]) || rec.gluon || [];

/** Make an admin-created service visible everywhere the built-in ones are listed. */
export function registerService(svc: CatalogService) {
  const known = SERVICES.find((x) => x.id === svc.id);
  if (known) Object.assign(known, { type: svc.type, description: svc.description });
  else {
    SERVICES.push({ id: svc.id, name: svc.name, color: svc.color, mark: svc.name.slice(0, 1).toUpperCase(), type: svc.type, description: svc.description, status: 'available', price: 'по подписке' });
  }
  if (!SVC.includes(svc.id)) SVC.push(svc.id);
  if (svc.logo) LOGO_BY_NAME[svc.name] = svc.logo;
}
/** Bank partners: name in channel lists, uploaded logo as the bank wordmark. */
export function registerPartner(p: Partner) {
  if (p.aggregator) {
    if (!CHANNEL_LABEL[p.id]) CHANNEL_LABEL[p.id] = p.name;
    if (!BANKS.some((b) => b.id === p.id)) BANKS.push({ id: p.id, name: p.name, color: '#1D3B6F', mark: p.name.slice(0, 1).toUpperCase() });
    if (p.logo) BANK_LOGOS[p.id] = { word: p.logo, mark: p.logo };
  } else if (p.logo) {
    LOGO_BY_NAME[p.name] = p.logo;
  }
}
export const slug = (s: string) => s.toLowerCase().replace(/[“”"«»']/g, '').replace(/bank|банк/gi, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `p${Date.now() % 10000}`;

/** Banks typed by admin in «Банки» also appear in bank lists (requests, lead form, logos). */
export function registerBankCard(b: BankCard) {
  if (!BANKS.some((x) => x.id === b.id)) BANKS.push({ id: b.id, name: b.name, color: '#1D3B6F', mark: b.name.slice(0, 1).toUpperCase() });
  if (b.logo) BANK_LOGOS[b.id] = { word: b.logo, mark: b.logo };
}
/** Services in admin's order (new ones at the end). */
export const orderedServices = (order: string[] | undefined) => [...(order ?? []).filter((id) => SVC.includes(id)), ...SVC.filter((id) => !(order ?? []).includes(id))];

const T = (label: string, value: string): BankTerm => ({ label, value });
const P = (id: string, name: string, params: [string, string][]): ProductDef => ({ id, name, params: params.map(([pid, label]) => ({ id: pid, label })) });
const PRODUCT_DEFS: ProductDef[] = [
  P('account', 'Расчётный счёт', [['fee', 'Обслуживание'], ['open', 'Открытие'], ['currency', 'Валюта'], ['ib', 'Интернет-банк']]),
  P('credit', 'Кредит', [['rate', 'Годовой процент'], ['max', 'Макс. сумма'], ['term', 'Срок'], ['decision', 'Решение'], ['fine', 'Штраф в день'], ['online', 'Онлайн']]),
  P('installment', 'Рассрочка', [['free', 'Без процентов'], ['term', 'Макс. срок'], ['first', 'Первый взнос'], ['partners', 'Магазины-партнёры'], ['docs', 'Документы'], ['decision', 'Решение']]),
  P('card', 'Бизнес-карта', [['issue', 'Выпуск'], ['cashback', 'Кэшбэк'], ['system', 'Платёжная система']]),
  P('acquiring', 'Эквайринг', [['fee', 'Комиссия'], ['connect', 'Подключение'], ['terminal', 'Терминал']]),
];
function seedBanks(): BankCard[] {
  const v = (productId: string, values: Record<string, string>): BankProduct => ({ productId, values });
  const acc = (fee: string, open: string) => v('account', { fee, open, currency: 'UZS, USD', ib: 'Да' });
  const credit = (rate: string, max: string, term: string, decision: string, fine: string, online: boolean) => v('credit', { rate, max, term, decision, fine, online: online ? 'Да' : 'Нет' });
  const inst = (free: boolean, term: string, first: string, decision: string) => v('installment', { free: free ? 'Да' : 'Нет', term, first, partners: '137', docs: 'Паспорт', decision });
  const card = (issue: string, cashback: string) => v('card', { issue, cashback, system: 'Uzcard, Visa' });
  const acq = (fee: string) => v('acquiring', { fee, connect: '1 день', terminal: 'Бесплатно' });
  return [
    { id: 'hayot', name: 'Hayot Bank', rating: 4.8, online: true, perk: '0% за переводы первые 3 месяца', active: true,
      terms: [T('Обслуживание', 'Бесплатно'), T('Открытие счёта', '1 день')], products: [acc('Бесплатно', '1 день'), credit('24%', '300 млн сум', '60 мес.', '1–2 дня', '0,05%', true), inst(true, '12 мес.', '0–20%', '1 день')] },
    { id: 'aloqa', name: 'Aloqabank', rating: 4.5, online: false, perk: 'Бесплатная бизнес-карта', active: true,
      terms: [T('Обслуживание', '50 000 сум/мес'), T('Открытие счёта', '1–2 дня')], products: [acc('50 000 сум/мес', '1–2 дня'), card('Бесплатно', '1%'), credit('25%', '250 млн сум', '60 мес.', '1 день', '0,07%', false)] },
    { id: 'kapital', name: 'Kapitalbank', rating: 4.7, online: true, perk: 'Эквайринг от 0,9%', active: true,
      terms: [T('Обслуживание', '35 000 сум/мес'), T('Открытие счёта', 'Сегодня')], products: [acc('35 000 сум/мес', 'Сегодня'), acq('от 0,9%'), credit('24%', '300 млн сум', '60 мес.', '1–2 дня', '0,05%', true), card('20 000 сум', '0,5%'), inst(true, '12 мес.', '10%', '1–2 дня')] },
    { id: 'anor', name: 'Anorbank', rating: 4.6, online: true, perk: 'Полностью онлайн, без визита', active: true,
      terms: [T('Обслуживание', 'Бесплатно'), T('Открытие счёта', '1 день')], products: [acc('Бесплатно', '1 день'), inst(true, '9 мес.', '0%', 'Быстро'), credit('24%', '300 млн сум', '60 мес.', '1–2 дня', '0,05%', true)] },
    { id: 'sqb', name: 'SQB', rating: 4.4, online: false, perk: 'Льготные кредиты для МСБ', active: true,
      terms: [T('Обслуживание', '45 000 сум/мес'), T('Открытие счёта', '1–3 дня')], products: [acc('45 000 сум/мес', '1–3 дня'), credit('22%', '500 млн сум', '84 мес.', '3–5 дней', '0,04%', false), inst(false, '6 мес.', '20%', 'Очень быстро')] },
  ];
}
