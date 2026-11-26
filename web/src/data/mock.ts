/* All demo data for the prototype. Replace with API calls later. */

export interface Service {
  id: string;
  name: string;
  color: string;
  mark: string;
  type: string;
  description: string;
  status: 'connected' | 'review' | 'available';
  price: string;
}

/** Integrations agreed for Gluon (max 5). */
export const SERVICES: Service[] = [
  { id: 'robosell', name: 'Robosell', color: '#22A35B', mark: '∞', type: 'Онлайн-продажи', description: 'Запуск онлайн-магазина и Telegram-бота для вашего бизнеса за 15 минут.', status: 'connected', price: '150 000 сум' },
  { id: 'robohub', name: 'RoboHub', color: '#6D5DF6', mark: 'R', type: 'Агрегатор доставки', description: 'Единая панель для заказов из Telegram, сайта и агрегаторов доставки.', status: 'connected', price: '120 000 сум' },
  { id: 'billz', name: 'Billz', color: '#1677FF', mark: 'Z', type: 'POS-система', description: 'Учёт товаров, клиентов, касс, финансов и многое другое — всё в одной программе.', status: 'connected', price: '150 000 сум' },
  { id: 'ox', name: 'OX', color: '#F26B1D', mark: 'OX', type: 'Складской учёт', description: 'Складской учёт, закупки и управление остатками в реальном времени.', status: 'review', price: '99 000 сум' },
  { id: 'delever', name: 'Delever', color: '#7A3FF2', mark: 'D', type: 'Доставка', description: 'Система управления доставкой: курьеры, зоны, заказы и аналитика.', status: 'available', price: '110 000 сум' },
];

export interface Bank { id: string; name: string; color: string; mark: string }
export const BANKS: Bank[] = [
  { id: 'hayot', name: 'Hayot Bank', color: '#0F7B5F', mark: '✣' },
  { id: 'aloqa', name: 'Aloqabank', color: '#1E88E5', mark: 'A' },
  { id: 'kapital', name: 'Kapitalbank', color: '#E9B000', mark: 'K' },
  { id: 'anor', name: 'Anorbank', color: '#B4123A', mark: 'A' },
  { id: 'sqb', name: 'SQB', color: '#0B4EA2', mark: 'S' },
  { id: 'ipak', name: 'Ipak Yuli Bank', color: '#00843D', mark: 'IY' },
];

export const BUSINESS_CATEGORIES = ['Аксессуары', 'Автозапчасти', 'Электрика', 'Красота и уход', 'Товары для животных', 'Напитки', 'Одежда', 'Электроника', 'Продукты питания'];

/* ---------- Gluon user dashboard ---------- */
export const SALES_SERIES = [
  { m: '03.25', offline: 1150, online: 580 }, { m: '04.25', offline: 400, online: 650 },
  { m: '05.25', offline: 660, online: 150 }, { m: '06.25', offline: 1150, online: 300 },
  { m: '07.25', offline: 500, online: 150 }, { m: '08.25', offline: 1902, online: 1259 },
  { m: '09.25', offline: 700, online: 990 }, { m: '10.25', offline: 910, online: 250 },
  { m: '11.25', offline: 400, online: 150 }, { m: '12.25', offline: 1000, online: 300 },
  { m: '01.26', offline: 850, online: 200 }, { m: '02.26', offline: 930, online: 480 },
];
export const WEEKLY_SERIES = [
  { w: '08.02–02.02', v: 9.1 }, { w: '01.02–26.01', v: 12.4 }, { w: 'x1', v: 8.2 },
  { w: '25.01–19.01', v: 19.6 }, { w: 'x2', v: 19.1 }, { w: '18.01–12.01', v: 13.2 },
];
export const INCOME_SPLIT = [
  { name: 'Наличные', value: 55, color: 'var(--primary)' },
  { name: 'Click', value: 25, color: 'var(--secondary)' },
  { name: 'Payme', value: 20, color: 'var(--accent)' },
];
export const ORDERS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: ['Кожаный чехол для Macbook, 15/16 дюйма', 'Беспроводная мышь Logitech MX', 'USB-C хаб 7 в 1', 'Подставка для ноутбука'][i % 4],
  ikpu: '23124324023',
  price: ['17 500 сум', '420 000 сум', '260 000 сум', '185 000 сум'][i % 4],
  qty: [710, 128, 342, 96][i % 4],
  total: ['12 425 000 сум', '53 760 000 сум', '88 920 000 сум', '17 760 000 сум'][i % 4],
  channel: i % 3 === 0 ? 'offline' : 'online',
}));

/* ---------- Banking ---------- */
export const PARTNER_SERIES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'].map((m, i) => ({
  m,
  hayot: [8600, 9300, 9000, 10200, 11000, 10500, 11300, 10800, 12100, 11700, 12400, 12700][i],
  aloqa: [4200, 4500, 4900, 5100, 5600, 5900, 6100, 6400, 6300, 6800, 7100, 7400][i],
  kapital: [9800, 10100, 10600, 10900, 11500, 11800, 12000, 12600, 12900, 13100, 13400, 13700][i],
  anor: [6500, 6800, 7000, 7000, 7890, 7600, 7700, 7400, 7900, 7000, 7000, 6800][i],
  sqb: [3100, 3300, 3600, 3500, 3900, 4200, 4400, 4300, 4700, 5000, 5200, 5600][i],
}));
export const CREDIT_ROWS = [
  { bank: 'hayot', rate: '24%', max: '300 млн сум', term: '60 мес.', approve: '1–2 дней', fine: '0,05%', online: true },
  { bank: 'aloqa', rate: '25%', max: '250 млн сум', term: '60 мес.', approve: '1 день', fine: '0,07%', online: false },
  { bank: 'kapital', rate: '24%', max: '300 млн сум', term: '60 мес.', approve: '1–2 дней', fine: '0,05%', online: true },
  { bank: 'anor', rate: '24%', max: '300 млн сум', term: '60 мес.', approve: '1–2 дней', fine: '0,05%', online: true },
  { bank: 'sqb', rate: '24%', max: '300 млн сум', term: '60 мес.', approve: '1–2 дней', fine: '0,05%', online: true },
];
export const INSTALLMENT_ROWS = [
  { bank: 'hayot', free: true, term: '12 мес.', first: '0–20%', partners: '137 штук', doc: 'Паспорт', approve: '1 день' },
  { bank: 'aloqa', free: true, term: '12 мес.', first: '0%', partners: '137 штук', doc: 'Паспорт', approve: '1 день' },
  { bank: 'kapital', free: true, term: '12 мес.', first: '10%', partners: '137 штук', doc: 'Паспорт', approve: '1–2 дней' },
  { bank: 'anor', free: true, term: '9 мес.', first: '0%', partners: '137 штук', doc: 'Паспорт', approve: 'Быстро' },
  { bank: 'sqb', free: false, term: '6 мес.', first: '20%', partners: '137 штук', doc: 'Паспорт', approve: 'Очень быстро' },
];

/* ---------- Archive ---------- */
export const ARCHIVE_ITEMS: { name: string; files: string; size: string; tone: string; emoji: string; icon: string }[] = [
  { name: 'База Клиентов', files: '1 726 файлов', size: '12.73 GB', tone: '#6D5DF6', emoji: '👥', icon: 'clients' },
  { name: 'Продукты', files: '628 файлов', size: '3.56 GB', tone: '#D97706', emoji: '📦', icon: 'products' },
  { name: 'Заказы', files: '1 476 файлов', size: '12,09 GB', tone: '#DC2626', emoji: '🧾', icon: 'orders' },
  { name: 'Локации', files: '628 файлов', size: '0.56 GB', tone: '#DC2626', emoji: '📍', icon: 'locations' },
  { name: 'Баннеры и Медиа', files: '1 308 файлов', size: '21,28 GB', tone: '#D97706', emoji: '🖼️', icon: 'media' },
  { name: 'Курьеры (документы + фото)', files: '12 733 файлов', size: '20,87 GB', tone: '#DC2626', emoji: '🛵', icon: 'couriers' },
  { name: 'Отчёты (PDF, Excel)', files: '628 файлов', size: '1.35 GB', tone: '#D97706', emoji: '📊', icon: 'reports' },
  { name: 'Категории и Атрибуты', files: '628 файлов', size: '1.27 GB', tone: '#0891B2', emoji: '🏷️', icon: 'categories' },
  { name: 'Чаты и Вложения', files: '12 733 файлов', size: '8.40 GB', tone: '#CA8A04', emoji: '💬', icon: 'chats' },
];

/* ---------- Profile ---------- */
export const CARDS = [
  { id: 'c1', number: '2412 0344 0989 2345', exp: '01/31', brand: 'mastercard', name: 'Основная карта' },
  { id: 'c2', number: '4200 0344 0989 2345', exp: '01/31', brand: 'visa', name: 'Visa Business' },
  { id: 'c3', number: '5614 0987 2311 4500', exp: '01/31', brand: 'uzcard', name: 'Uzcard' },
  { id: 'c4', number: '9860 0987 2311 4500', exp: '01/31', brand: 'humo', name: 'Humo' },
];
export const EMPLOYEES = [
  { id: 'e1', name: 'Даулетмуратов Ахмет', role: 'Владелец', phone: '+998 90 702 53 29' },
  { id: 'e2', name: 'Сейтжанов Бекзод', role: 'Менеджер', phone: '+998 91 222 33 44' },
  { id: 'e3', name: 'Алимова Нилуфар', role: 'Бухгалтер', phone: '+998 93 555 66 77' },
  { id: 'e4', name: 'Каримов Жасур', role: 'Кассир', phone: '+998 94 101 20 30' },
  { id: 'e5', name: 'Турсунова Мадина', role: 'Менеджер', phone: '+998 97 444 12 12' },
];
export const ROLES = ['Владелец', 'Менеджер', 'Бухгалтер', 'Кассир'];
export const PERMISSIONS = ['Дашборд', 'Интеграции', 'Магазин Gluon', 'Онлайн банкинг', 'Баланс и оплата', 'Сотрудники'];
export const BALANCE_HISTORY = [
  { id: 1, title: 'Пополнение баланса', sub: 'Карта •••• 2345 · 12.02.2026', amount: '+ 100 000 сум', plus: true },
  { id: 2, title: 'Подписка Billz', sub: 'Ежемесячно · 10.02.2026', amount: '− 150 000 сум', plus: false },
  { id: 3, title: 'Подписка Robosell', sub: 'Ежемесячно · 10.02.2026', amount: '− 150 000 сум', plus: false },
  { id: 4, title: 'Gluon Архив · +100 GB', sub: 'Хранилище · 02.02.2026', amount: '− 49 000 сум', plus: false },
  { id: 5, title: 'Пополнение баланса', sub: 'Карта •••• 4500 · 01.02.2026', amount: '+ 500 000 сум', plus: true },
];

/* ---------- Panels (merchant cabinet + Gluon admin) ---------- */
const owners = ['Даулетмуратов Ахмет Кубейсинович', 'Серикбаев Нурлан Асанович', 'Турсунов Марат Салтанович', 'Нургалиев Тимур Амангельдыевич', 'Алимжанов Игорь Сергеевич', 'Кенжебаев Арман Жандосович', 'Бекмурзаев Асхат Болатбекович', 'Сагадиев Алишер Ермекович', 'Марченко Виктор Петрович', 'Ибраимов Нурлан Каирбекович', 'Султанов Айдын Серикбаевич'];
const cnames = ['ООО “Прометей”', 'АО “ТехноГрупп”', 'ЗАО “Инновации”', 'ИП “Новые Решения”', 'ОАО “ЭкоТех”', 'ТОО “СветЛаб”', 'ФГБУ “Научный Центр”', 'ООО “СтройСервис”', 'ООО “Глобал Инвест”', 'ЗАО “Креативные Идеи”', 'ООО “Дизайн Будущего”', 'ИП “Гармония Форм”'];
const addrs = ['пр. Амира Темура 129Б', 'ул. Байтик Баатыра 12', 'пр. Чуй 56', 'ул. Ленина 34', 'пр. Манаса 78', 'пер. Токтогула 5', 'ул. Калыка Акиева 21', 'пр. Жибек Жолу 90', 'ул. Исакова 48', 'пр. Советская 24', 'ул. Ленина 15', 'пл. Победы 10'];
const cats = ['Аксессуары', 'Электроника', 'Одежда', 'Обувь', 'Косметика', 'Игрушки', 'Спортивные товары', 'Книги', 'Часы', 'Украшения', 'Часы', 'Сумки'];

export interface Company {
  id: number; inn: string; name: string; active: boolean; address: string; owner: string; category: string;
  bank: string; services: string[]; revenue: number; users: number;
}
export const COMPANIES: Company[] = Array.from({ length: 48 }, (_, i) => ({
  id: i + 1,
  inn: String(123456789 + i * 7919).slice(0, 9),
  name: cnames[i % cnames.length],
  active: [0, 2, 3, 4, 6, 7, 10, 11].includes(i % 12),
  address: addrs[i % addrs.length],
  owner: owners[i % owners.length],
  category: cats[i % cats.length],
  bank: BANKS[i % BANKS.length].id,
  services: SERVICES.filter((_, j) => (i + j) % 3 !== 0).map((s) => s.id),
  revenue: 4_000_000 + ((i * 7_345_211) % 90_000_000),
  users: 2 + (i % 9),
}));

export const REVENUE_SERIES = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Ноя', 'Окт', 'Дек'].map((m, i) => ({
  m, v: [64, 36, 42, 64, 34, 98, 46, 52, 37, 55, 52, 56][i] * 1_000_000,
}));

export type TicketStatus = 'progress' | 'waiting' | 'closed';
export const TICKETS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  title: ['Не могу войти в аккаунт', 'Не приходит OTP-код', 'Ошибка при оплате подписки', 'Не синхронизируются данные Billz', 'Как подключить Robosell?'][i % 5],
  text: ['Не могу войти с паролем. Страница показывает ошибку.', 'СМС с кодом не приходит уже 10 минут.', 'Списались деньги, но подписка не активна.', 'Остатки в дашборде не совпадают с Billz.', 'Хочу подключить онлайн-магазин, с чего начать?'][i % 5],
  date: '01.12.2026',
  status: (['progress', 'closed', 'waiting', 'waiting', 'waiting'] as TicketStatus[])[i % 5],
  author: owners[i % owners.length].split(' ').slice(0, 2).join(' '),
  phone: '+998(50) 074 20 00',
}));

export interface ChatMsg { id: number; me: boolean; text: string; time: string }
export const CHAT_MESSAGES: ChatMsg[] = [
  { id: 1, me: false, text: 'Здравствуйте! Я администратор Gluon. Чем я могу вам помочь?', time: '10:00' },
  { id: 2, me: true, text: 'Здравствуйте. Пожалуйста, помогите мне подключить службу Robosell.', time: '10:05' },
  { id: 3, me: true, text: 'И какие ещё платформы я могу использовать, например', time: '10:05' },
  { id: 4, me: false, text: 'Конечно. Я проверю текущие тарифы и условия на Robosell. Какой вариант вам больше нравится?', time: '10:11' },
  { id: 5, me: false, text: 'Хорошо. Сравнивая все варианты через Gluon, я проведу вас по наиболее оптимальному.', time: '10:13' },
];

export const fmt = (n: number) => n.toLocaleString('ru-RU').replace(/,/g, ' ');
