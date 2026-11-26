import { useState, type ReactNode } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { Boxes, ChevronLeft, CircleHelp, Filter, LayoutDashboard, Package, Pencil, Plus, Search, Settings, ShoppingCart, Trash2, Truck, Users, MessageSquare, Megaphone, CreditCard, MapPin, Bot, Store, BarChart3, Warehouse, ArrowLeftRight, FileText, ChevronDown } from 'lucide-react';
import { BrandMark, Badge, Pagination, usePaging } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { FOOD } from '../../assets';
import './integration.css';

type Cell = string | number | { badge: string; kind: 'success' | 'error' | 'warning' | 'info' | 'neutral' } | { link: string } | { img: string; text: string };
interface Config {
  menu: { label: string; icon: ReactNode; count?: number; children?: string[] }[];
  active: string;
  title: string;
  count?: string;
  stats?: { label: string; value: string; unit: string; icon: ReactNode }[];
  chips?: string[];
  createLabel: string;
  searchPh: string;
  columns: string[];
  rows: Cell[][];
  actions?: boolean;
  accent: string;
}

const thumb = (e: string) => e;

const CONFIGS: Record<string, Config> = {
  billz: {
    accent: '#1677FF',
    menu: [{ label: 'Товары', icon: <ShoppingCart size={18} />, children: ['Каталог', 'Справочник', 'Импорт', 'Инвентаризация', 'Трансфер', 'Переоценка', 'Списание'] }],
    active: 'Каталог', title: 'Каталог',
    stats: [
      { label: 'Наименований', value: '15 000', unit: 'шт', icon: <Boxes size={18} /> },
      { label: 'Товарных единиц', value: '50 000', unit: 'шт', icon: <Package size={18} /> },
      { label: 'Сумма по цене поставки', value: '5.5 млрд', unit: 'сум', icon: <CreditCard size={18} /> },
      { label: 'Сумма по цене продажи', value: '7.5 млрд', unit: 'сум', icon: <BarChart3 size={18} /> },
    ],
    chips: ['Все (10 000)', 'Активные (9 500)', 'Неактивные (500)', 'Малый остаток (700)', 'Нулевой остаток (100)'],
    createLabel: 'Создать', searchPh: 'Артикул, баркод, наименование',
    columns: ['Фото', 'Наименование', 'Артикул', 'Баркод', 'Категория', 'Кол-во'],
    rows: [
      [thumb('👕'), { link: 'Футболка Basic' }, 'TSH-57313', '579135791397', 'Футболки', '1 500 шт'],
      [thumb('🎁'), { link: 'Подарочная упаковка' }, 'GIT-13573', '957135791397', 'Отсутствует', '—'],
      [thumb('👖'), { link: 'Джинсы Style' }, 'JNS-57313', '579135791393', 'Брюки', '300 шт'],
      [thumb('🧥'), { link: 'Комплект Basic' }, 'TSH-13573', '975135791397', 'Футболки, Брюки', '70 шт'],
      [thumb('👟'), { link: 'Кроссовки Run' }, 'SNK-24680', '579135791401', 'Обувь', '120 шт'],
      [thumb('🧢'), { link: 'Кепка Classic' }, 'CAP-11223', '579135791455', 'Аксессуары', '640 шт'],
    ],
  },
  robosell: {
    accent: '#7C6CF5',
    menu: [
      { label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { label: 'Orders', icon: <FileText size={18} />, count: 7 },
      { label: 'Customers', icon: <Users size={18} /> },
      { label: 'Chat', icon: <MessageSquare size={18} />, count: 94 },
      { label: 'Marketing', icon: <Megaphone size={18} /> },
      { label: 'Products', icon: <Package size={18} />, children: ['Categories', 'Products', 'IKPU'] },
      { label: 'Payment', icon: <CreditCard size={18} /> },
      { label: 'Branches', icon: <MapPin size={18} /> },
      { label: 'Telegram bots', icon: <Bot size={18} /> },
      { label: 'Settings', icon: <Settings size={18} /> },
      { label: 'Robo market', icon: <Store size={18} /> },
    ],
    active: 'Categories', title: 'List of categories', count: '27 categories',
    createLabel: 'Create Category', searchPh: 'Search by category name',
    columns: ['Category name', 'Products', 'Created date'], actions: true,
    rows: [
      [{ img: FOOD.blinchiki, text: 'Блинчики' }, 15, '11.04.2020, 17:30'], [{ img: FOOD.sety, text: 'Сеты' }, 27, '28.01.2020, 07:00'], [{ img: FOOD.chicken, text: 'Хон Chicken' }, 12, '18.02.2020, 13:00'],
      [{ img: FOOD.salad, text: 'Салаты' }, 21, '22.05.2020, 13:00'], [{ img: FOOD.soup, text: 'Первые блюда' }, 17, '13.04.2020, 11:00'], [{ img: FOOD.drinks, text: 'Холодные напитки' }, 19, '14.04.2020, 10:00'],
      [{ img: FOOD.watermelon, text: 'Арбуз' }, 24, '10.04.2020, 12:45'], [{ img: FOOD.pirozhki, text: 'Пирожки' }, 5, '14.02.2020, 18:00'], [{ img: FOOD.sauce, text: 'Соус' }, 1, '22.03.2020, 04:00'],
    ],
  },
  robohub: {
    accent: '#6D5DF6',
    menu: [
      { label: 'Заказы', icon: <FileText size={18} />, count: 12 },
      { label: 'Агрегаторы', icon: <Store size={18} /> },
      { label: 'Меню', icon: <Package size={18} /> },
      { label: 'Филиалы', icon: <MapPin size={18} /> },
      { label: 'Отчёты', icon: <BarChart3 size={18} /> },
      { label: 'Настройки', icon: <Settings size={18} /> },
    ],
    active: 'Заказы', title: 'Заказы', count: '1 248 заказов',
    chips: ['Все', 'Новые (12)', 'Готовятся (8)', 'В пути (5)', 'Доставлены', 'Отменены'],
    createLabel: 'Новый заказ', searchPh: 'Номер заказа, клиент, телефон',
    columns: ['№', 'Источник', 'Клиент', 'Филиал', 'Сумма', 'Статус', 'Время'],
    rows: [
      ['#10482', 'Telegram-бот', 'Азиз Каримов', 'Чиланзар', '186 000 сум', { badge: 'Новый', kind: 'info' }, '12:41'],
      ['#10481', 'Uzum Tezkor', 'Малика С.', 'Юнусабад', '94 000 сум', { badge: 'Готовится', kind: 'warning' }, '12:38'],
      ['#10480', 'Yandex Eats', 'Jasur R.', 'Чиланзар', '312 000 сум', { badge: 'В пути', kind: 'neutral' }, '12:30'],
      ['#10479', 'Wolt', 'Нигора А.', 'Мирабад', '58 000 сум', { badge: 'Доставлен', kind: 'success' }, '12:12'],
      ['#10478', 'Сайт', 'Бекзод Т.', 'Юнусабад', '140 000 сум', { badge: 'Отменён', kind: 'error' }, '11:57'],
      ['#10477', 'Telegram-бот', 'Ольга П.', 'Мирабад', '226 000 сум', { badge: 'Доставлен', kind: 'success' }, '11:40'],
    ],
  },
  ox: {
    accent: '#F26B1D',
    menu: [
      { label: 'Склад', icon: <Warehouse size={18} />, children: ['Остатки', 'Поступления', 'Перемещения', 'Инвентаризация'] },
      { label: 'Поставщики', icon: <Truck size={18} /> },
      { label: 'Закупки', icon: <ShoppingCart size={18} /> },
      { label: 'Отчёты', icon: <BarChart3 size={18} /> },
      { label: 'Настройки', icon: <Settings size={18} /> },
    ],
    active: 'Остатки', title: 'Остатки на складе',
    stats: [
      { label: 'Позиций на складе', value: '3 420', unit: 'шт', icon: <Boxes size={18} /> },
      { label: 'Общий остаток', value: '128 900', unit: 'ед.', icon: <Package size={18} /> },
      { label: 'Себестоимость', value: '2.1 млрд', unit: 'сум', icon: <CreditCard size={18} /> },
      { label: 'Заканчиваются', value: '86', unit: 'поз.', icon: <ArrowLeftRight size={18} /> },
    ],
    chips: ['Все склады', 'Основной склад', 'Склад №2', 'Магазин Чиланзар'],
    createLabel: 'Поступление', searchPh: 'Товар, артикул, штрихкод',
    columns: ['Товар', 'Артикул', 'Склад', 'Остаток', 'Мин. остаток', 'Статус'],
    rows: [
      ['Футболка Basic, белая M', 'TSH-57313-W', 'Основной склад', '1 500 шт', '200 шт', { badge: 'В наличии', kind: 'success' }],
      ['Джинсы Style 32', 'JNS-57313', 'Склад №2', '42 шт', '50 шт', { badge: 'Мало', kind: 'warning' }],
      ['Кроссовки Run 42', 'SNK-24680', 'Магазин Чиланзар', '0 шт', '10 шт', { badge: 'Нет', kind: 'error' }],
      ['Кепка Classic', 'CAP-11223', 'Основной склад', '640 шт', '100 шт', { badge: 'В наличии', kind: 'success' }],
      ['Худи Oversize L', 'HD-90871', 'Склад №2', '18 шт', '30 шт', { badge: 'Мало', kind: 'warning' }],
    ],
  },
  delever: {
    accent: '#7A3FF2',
    menu: [
      { label: 'Заказы', icon: <FileText size={18} />, count: 5 },
      { label: 'Курьеры', icon: <Truck size={18} /> },
      { label: 'Зоны доставки', icon: <MapPin size={18} /> },
      { label: 'Клиенты', icon: <Users size={18} /> },
      { label: 'Аналитика', icon: <BarChart3 size={18} /> },
      { label: 'Настройки', icon: <Settings size={18} /> },
    ],
    active: 'Курьеры', title: 'Курьеры', count: '24 курьера',
    chips: ['Все', 'На линии (14)', 'Свободны (6)', 'Не в сети (4)'],
    createLabel: 'Добавить курьера', searchPh: 'Имя, телефон',
    columns: ['Курьер', 'Телефон', 'Транспорт', 'Заказов сегодня', 'Рейтинг', 'Статус'],
    rows: [
      ['Шерзод Алиев', '+998 90 111 22 33', 'Мото', 14, '4.9', { badge: 'На линии', kind: 'success' }],
      ['Дилшод Р.', '+998 91 222 33 44', 'Авто', 9, '4.8', { badge: 'Доставляет', kind: 'info' }],
      ['Анвар К.', '+998 93 333 44 55', 'Вело', 6, '4.7', { badge: 'Свободен', kind: 'neutral' }],
      ['Сардор М.', '+998 94 444 55 66', 'Мото', 0, '4.6', { badge: 'Не в сети', kind: 'error' }],
      ['Умид Т.', '+998 97 555 66 77', 'Авто', 11, '4.9', { badge: 'На линии', kind: 'success' }],
    ],
  },
};

export default function Integration() {
  const { id = '' } = useParams();
  const svc = SERVICES.find((s) => s.id === id);
  const cfg = CONFIGS[id];
  const [chip, setChip] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const pg = usePaging();
  if (!svc || !cfg) return <Navigate to="/app" replace />;
  const cur = active ?? cfg.active;

  return (
    <div className="ig" style={{ ['--ig' as string]: cfg.accent }}>
      <aside className={clsx('ig-side', collapsed && 'collapsed')}>
        <div className="row between" style={{ padding: '4px 8px 16px' }}>
          <span className="row gap-8"><BrandMark name={svc.name} color={svc.color} text={svc.mark} size={30} />{!collapsed && <b style={{ fontSize: 18 }}>{svc.name}</b>}</span>
          <button className="icon-btn sm" onClick={() => setCollapsed((c) => !c)} aria-label="collapse"><ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : undefined }} /></button>
        </div>
        <nav className="col gap-2">
          {cfg.menu.map((m) => (
            <div key={m.label}>
              <button className={clsx('ig-link', cur === m.label && 'active')} onClick={() => !m.children && setActive(m.label)}>
                {m.icon}{!collapsed && <span className="grow" style={{ textAlign: 'left' }}>{m.label}</span>}
                {!collapsed && m.count !== undefined && <span className="ig-count">{m.count}</span>}
                {!collapsed && m.children && <ChevronDown size={14} />}
              </button>
              {!collapsed && m.children?.map((c) => (
                <button key={c} className={clsx('ig-link sub', cur === c && 'active')} onClick={() => setActive(c)}>{c}</button>
              ))}
            </div>
          ))}
        </nav>
        {!collapsed && (
          <div className="ig-help"><CircleHelp size={16} /> Нужна помощь?</div>
        )}
      </aside>

      <section className="ig-body">
        <div className="row between gap-12 wrap">
          <div className="row gap-8">
            <h1 className="h3">{cfg.title === cfg.active && cur !== cfg.active ? cur : cfg.title}</h1>
            {cfg.count && <span className="t-sm" style={{ color: 'var(--ig)' }}>{cfg.count}</span>}
          </div>
          <span className="badge badge-success">Синхронизировано · 2 мин назад</span>
        </div>

        {cfg.stats && (
          <div className="ig-stats">
            {cfg.stats.map((s) => (
              <div key={s.label} className="ig-stat">
                <span className="ig-stat-ic">{s.icon}</span>
                <p className="medium t-sm">{s.label}</p>
                <p><b style={{ color: 'var(--ig)', fontSize: 22 }}>{s.value}</b> <span className="medium">{s.unit}</span></p>
              </div>
            ))}
          </div>
        )}

        {cfg.chips && (
          <div className="row gap-8 wrap ig-chips">
            {cfg.chips.map((c, i) => (
              <button key={c} className={clsx('ig-chip', chip === i && 'active')} onClick={() => setChip(i)}>{c}</button>
            ))}
          </div>
        )}

        <div className="row gap-12 wrap">
          <label className="ig-search grow"><Search size={16} /><input placeholder={cfg.searchPh} /></label>
          <button className="btn btn-secondary"><Filter size={16} /> Фильтры</button>
          <button className="btn" style={{ background: 'var(--ig)', color: '#fff' }}><Plus size={16} /> {cfg.createLabel}</button>
        </div>

        <div className="table-wrap card">
          <table className="table">
            <thead><tr><th style={{ width: 36 }}><input type="checkbox" /></th>{cfg.columns.map((c) => <th key={c}>{c}</th>)}{cfg.actions && <th style={{ textAlign: 'right' }}>Action</th>}</tr></thead>
            <tbody>
              {pg.slice(cfg.rows).map((r, i) => (
                <tr key={i}>
                  <td><input type="checkbox" /></td>
                  {r.map((c, j) => <td key={j} className={j === 0 ? 'strong' : undefined}>{renderCell(c, j === 0 && cfg.columns[0] === 'Фото')}</td>)}
                  {cfg.actions && (
                    <td style={{ textAlign: 'right' }}>
                      <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button className="ig-act ok" aria-label="edit"><Pencil size={14} /></button>
                        <button className="ig-act no" aria-label="delete"><Trash2 size={14} /></button>
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card"><Pagination {...pg.bar(cfg.rows.length)} /></div>
      </section>
    </div>
  );
}

function renderCell(c: Cell, isPhoto: boolean) {
  if (typeof c === 'object' && 'badge' in c) return <Badge kind={c.kind}>{c.badge}</Badge>;
  if (typeof c === 'object' && 'link' in c) return <span style={{ color: 'var(--ig)', fontWeight: 500 }}>{c.link}</span>;
  if (typeof c === 'object' && 'img' in c) return <span className="row gap-12"><img className="ig-thumb" src={c.img} alt="" />{c.text}</span>;
  if (isPhoto) return <span className="ig-photo">{c}</span>;
  return c;
}
