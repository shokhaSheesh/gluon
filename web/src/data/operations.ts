/**
 * Operations as they come out of a parsed bank statement (PDF/Excel via the "Detail" OCR service).
 * A statement only gives us: date, counterparty (+INN, account), the bank's payment purpose text,
 * amount and direction. Category, custom name and comment are filled in by the user.
 */
export type OpType = 'income' | 'expense' | 'transfer';

export interface Operation {
  id: number;
  date: string;
  time: string;
  counterparty: string;
  inn: string;
  counterAccount: string;
  purpose: string;        // «Назначение платежа» exactly as in the statement
  account: string;        // our account id
  type: OpType;
  amount: number;
  source: 'PDF' | 'Excel';
  file: string;
  // user-entered
  category?: string;
  title?: string;
  comment?: string;
}

export interface BankAccount { id: string; bank: string; number: string; name: string; lastStatement: string; ops: number }

export const ACCOUNTS: BankAccount[] = [
  { id: 'hayot', bank: 'hayot', number: '20208000100123451234', name: 'Основной счёт', lastStatement: '24.11.2026', ops: 9 },
  { id: 'kapital', bank: 'kapital', number: '20208000900987655678', name: 'Эквайринг', lastStatement: '23.11.2026', ops: 7 },
];

export const maskAccount = (n: string) => `${n.slice(0, 4)} ${n.slice(4, 8)} •••• ${n.slice(-4)}`;
export const accountLabel = (a: BankAccount, bankName: string) => `${bankName} · ${maskAccount(a.number)}`;

export const CATEGORIES = ['Продажи', 'Закупки', 'Аренда', 'Зарплата', 'Налоги', 'Логистика', 'Сервисы', 'Возвраты', 'Внутренний перевод'];

const rows: Omit<Operation, 'id'>[] = [
  { date: '24.11.2026', time: '16:42', counterparty: 'ООО “TEXNO GROUP”', inn: '305112233', counterAccount: '20208000400111222333', purpose: 'Оплата по счёту №145 от 20.11.2026 за товар, в т.ч. НДС 12%', account: 'hayot', type: 'income', amount: 28_450_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf', category: 'Продажи' },
  { date: '24.11.2026', time: '14:10', counterparty: 'ЯТТ KARIMOV JASUR', inn: '412778899', counterAccount: '20218000500333444555', purpose: 'Арендная плата по договору №7/24 от 01.01.2026 за ноябрь 2026, без НДС', account: 'hayot', type: 'expense', amount: 8_000_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf', title: 'Аренда офиса', category: 'Аренда' },
  { date: '24.11.2026', time: '11:05', counterparty: 'Собственный счёт', inn: '301234567', counterAccount: '20208000900987655678', purpose: 'Перевод собственных средств между счетами', account: 'hayot', type: 'transfer', amount: 5_000_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf' },
  { date: '23.11.2026', time: '18:30', counterparty: 'ООО “INSPIRED” (Payme)', inn: '303456789', counterAccount: '20208000600444555666', purpose: 'Зачисление по эквайрингу за 23.11.2026, реестр №5512, комиссия удержана', account: 'kapital', type: 'income', amount: 3_870_500, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '23.11.2026', time: '12:00', counterparty: 'Реестр зарплатных карт', inn: '301234567', counterAccount: '22618000100000000001', purpose: 'Заработная плата за ноябрь 2026 по реестру №11 от 23.11.2026', account: 'kapital', type: 'expense', amount: 11_500_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '22.11.2026', time: '17:15', counterparty: 'ООО “CLICK”', inn: '207321654', counterAccount: '20208000700555666777', purpose: 'Зачисление по эквайрингу за 22.11.2026, ТСП 0045123', account: 'kapital', type: 'income', amount: 2_940_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '22.11.2026', time: '10:20', counterparty: 'ООО “STROY SERVIS”', inn: '306998877', counterAccount: '20208000300666777888', purpose: 'Оплата по договору поставки №34 от 15.10.2026, в т.ч. НДС 12%', account: 'hayot', type: 'expense', amount: 14_300_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf' },
  { date: '21.11.2026', time: '15:48', counterparty: 'АО “INNOVATSIYA”', inn: '302887766', counterAccount: '20210000200777888999', purpose: 'Предоплата 50% по счёту №139 от 19.11.2026', account: 'hayot', type: 'income', amount: 9_100_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf' },
  { date: '21.11.2026', time: '09:30', counterparty: 'Казначейство (ГНК)', inn: '201122334', counterAccount: '23402000300100001010', purpose: 'Уплата НДС за октябрь 2026, код платежа 00101', account: 'hayot', type: 'expense', amount: 4_650_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf', category: 'Налоги' },
  { date: '20.11.2026', time: '19:02', counterparty: 'Корпоративная карта •••• 2345', inn: '301234567', counterAccount: '22618000800000002345', purpose: 'Пополнение корпоративной карты', account: 'kapital', type: 'transfer', amount: 2_000_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '20.11.2026', time: '13:44', counterparty: 'ООО “BILLZ”', inn: '306555444', counterAccount: '20208000100888999000', purpose: 'Оплата по счёту-оферте №B-20981, подписка', account: 'kapital', type: 'expense', amount: 150_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '19.11.2026', time: '16:00', counterparty: 'ООО “GLOBAL INVEST”', inn: '305443322', counterAccount: '20208000500999000111', purpose: 'Возврат излишне перечисленных средств по п/п №412', account: 'hayot', type: 'income', amount: 1_250_000, source: 'PDF', file: 'vypiska_hayot_24-11.pdf' },
  { date: '19.11.2026', time: '11:11', counterparty: 'ООО “DELEVER”', inn: '307112200', counterAccount: '20208000600000111222', purpose: 'Оплата услуг по договору №D-77 за октябрь 2026', account: 'kapital', type: 'expense', amount: 1_780_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
  { date: '18.11.2026', time: '14:25', counterparty: 'Собственный счёт', inn: '301234567', counterAccount: '20208000100123451234', purpose: 'Перевод собственных средств между счетами', account: 'kapital', type: 'transfer', amount: 3_500_000, source: 'Excel', file: 'kapitalbank_noyabr.xlsx' },
];

export const OPERATIONS: Operation[] = rows.map((r, i) => ({ ...r, id: i + 1 }));
