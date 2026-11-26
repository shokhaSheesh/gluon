import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDown, ChevronRight, Landmark, LayoutGrid } from 'lucide-react';
import { BrandMark, Select, Trend } from '../../components/ui';
import { useApp } from '../../lib/store';
import { IMAGES } from '../../assets';
import { INCOME_SPLIT, ORDERS, SALES_SERIES, SERVICES, WEEKLY_SERIES, fmt } from '../../data/mock';
import { useBilling } from '../../lib/billing';
import './dashboard.css';
import { ANIM } from '../../lib/chart';

const PERIODS = ['За все время', 'Ежедневно', 'Еженедельно', 'Ежемесячно', 'Выбрать период'];

export default function Dashboard() {
  const nav = useNavigate();
  const { session } = useApp();
  const gluonUser = session?.kind !== 'bank';
  const [period, setPeriod] = useState(0);
  const [tab, setTab] = useState<'all' | 'online' | 'offline'>('all');
  const orders = ORDERS.filter((o) => tab === 'all' || o.channel === tab).slice(0, 5);
  const { linked } = useBilling();
  const [svc, setSvc] = useState('all');
  const connected = SERVICES.filter((s) => linked[s.id] === 'connected');
  // Demo: each service contributes a share of the combined numbers.
  const share = svc === 'all' ? 1 : ({ billz: 0.48, robosell: 0.32, robohub: 0.2 } as Record<string, number>)[svc] ?? 0.15;
  const k = (n: number) => Math.round(n * share);
  const sales = SALES_SERIES.map((d) => ({ ...d, offline: k(d.offline), online: k(d.online) }));
  const weekly = WEEKLY_SERIES.map((d) => ({ ...d, v: +(d.v * share).toFixed(1) }));

  return (
    <div className="col gap-16">
      <div className="section" style={{ padding: '0 16px 0 8px' }}>
        <div className="row between gap-16 d-top">
          <div className="row gap-12 d-filters soon-off" aria-disabled>
            <div className="tabs-line" style={{ borderBottom: 'none' }}>
              {PERIODS.map((p, i) => (
                <button key={p} className={clsx(period === i && 'active')} onClick={() => setPeriod(i)}>{p}</button>
              ))}
            </div>
            <div className="d-svc">
              <Select value={svc} onChange={setSvc} options={[
                { value: 'all', label: 'Все сервисы', icon: <LayoutGrid size={16} color="var(--text-3)" /> },
                ...connected.map((x) => ({ value: x.id, label: x.name, icon: <BrandMark name={x.name} color={x.color} text={x.mark} size={20} /> })),
              ]} />
            </div>
          </div>
          {gluonUser ? (
          <button className="d-bank-btn" onClick={() => nav('/app/banking')}>
            <span className="d-bank-ic"><Landmark size={18} /></span>
            <span className="t-sm medium" style={{ textAlign: 'left', lineHeight: 1.25 }}>Предложения<br />банков</span>
            <ChevronRight size={16} />
          </button>
          ) : (
            <button className="d-bank-btn" onClick={() => nav('/app/operations')}>
              <span className="d-bank-ic"><Landmark size={18} /></span>
              <span className="t-sm medium" style={{ textAlign: 'left', lineHeight: 1.25 }}>Операции<br />по счёту</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* charts are not final yet — shown dimmed behind a «Скоро» card */}
      <div className="soon-wrap">
        <div className="soon-body" aria-hidden inert>
      <div className={clsx('d-kpis', !gluonUser && 'no-promo')}>
        <Kpi title="Общий оборот" value={`${fmt(k(48_789_500))} сум`} trend={4.6} />
        <Kpi title="Средний чек" value={`${fmt(svc === "all" ? 172_500 : Math.round(172_500 * (0.8 + share)))} сум`} trend={12.3} />
        <Kpi title="Кол-во онлайн заказов" value={fmt(k(5000))} trend={8.9} />
        <Kpi title="Кол-во оффлайн заказов" value={fmt(k(100))} trend={-1.4} />
        {gluonUser && (
          <div className="d-promo">
            <div className="col gap-4" style={{ position: 'relative', zIndex: 1 }}>
              <p className="medium" style={{ lineHeight: 1.25 }}><b style={{ fontSize: 18 }}>ГДЕ?</b> <span className="t-xs">САМЫЙ УДОБНЫЙ БАНКОВСКИЙ СЕРВИС</span></p>
              <p className="t-xs">Мы сравнили — вы выбираете.</p>
              <button className="btn btn-secondary btn-sm mt-8" style={{ alignSelf: 'flex-start', height: 28 }} onClick={() => nav('/app/banking')}>Попробовать <ChevronRight size={14} /></button>
            </div>
            <img className="d-promo-art" src={IMAGES.promoBank} alt="" />
          </div>
        )}
      </div>

      <div className="section">
        <h3 className="h5">Количество продаж</h3>
        <div style={{ height: 320, marginTop: 16 }}>
          <ResponsiveContainer>
            <AreaChart data={sales} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gOff" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--logo)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--logo)" stopOpacity={0.03} /></linearGradient>
                <linearGradient id="gOn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--secondary)" stopOpacity={0.03} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12}  />
              <Tooltip content={<SalesTip />} cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }} />
              <Area isAnimationActive={ANIM} type="monotone" dataKey="offline" stroke="var(--primary)" strokeWidth={1.5} fill="url(#gOff)" dot={{ r: 3.5, fill: 'var(--surface)', stroke: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
              <Area isAnimationActive={ANIM} type="monotone" dataKey="online" stroke="var(--secondary)" strokeWidth={1.5} fill="url(#gOn)" dot={{ r: 3.5, fill: 'var(--surface)', stroke: 'var(--secondary)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="row center gap-20 t-xs muted">
          <span className="row gap-6"><span className="dot" style={{ background: 'var(--primary)' }} /> Оффлайн</span>
          <span className="row gap-6"><span className="dot" style={{ background: 'var(--secondary)' }} /> Онлайн</span>
        </div>
      </div>

      <div className="d-row2">
        <div className="section">
          <p className="medium">Статистика доходов</p>
          <p className="h4 mt-12">{fmt(k(14_789_500))} сум</p>
          <p className="t-sm muted">Доход: 10.09.2025 – 10.11.2025</p>
          <div style={{ height: 250, position: 'relative', marginTop: 8 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie isAnimationActive={ANIM} data={INCOME_SPLIT} dataKey="value" innerRadius={78} outerRadius={112} paddingAngle={4} cornerRadius={10} startAngle={70} endAngle={-290} stroke="none">
                  {INCOME_SPLIT.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="d-donut-c">
              <b style={{ fontSize: 30, color: 'var(--accent)', fontWeight: 500 }}>+14%</b>
              <span className="t-xs muted">за прошлый месяц</span>
            </div>
          </div>
          <div className="row center gap-16 t-sm">
            {INCOME_SPLIT.map((s) => <span key={s.name} className="row gap-6"><span style={{ width: 3, height: 12, borderRadius: 2, background: s.color }} />{s.name}</span>)}
          </div>
        </div>

        <div className="section" style={{ paddingRight: 0, paddingBottom: 12 }}>
          <p className="medium">Еженедельный объем продаж</p>
          <p className="h4 mt-12">{fmt(k(19_899_800))} сум</p>
          <p className="t-sm success-text">+12% рост за прошлую неделю</p>
          <div style={{ height: 270, marginTop: 8 }}>
            <ResponsiveContainer>
              <AreaChart data={weekly} margin={{ left: 36, right: 36 }}>
                <defs>
                  <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.02} /></linearGradient>
                </defs>
                <XAxis dataKey="w" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(w: string) => (w.startsWith('x') ? '' : w)} interval={0} />
                <YAxis hide domain={[0, 'dataMax + 4']} />
                <Tooltip formatter={(v) => [`${v} млн сум`, 'Объём']} labelFormatter={(l) => (String(l).startsWith('x') ? '' : String(l))} />
                <Area isAnimationActive={ANIM} type="linear" dataKey="v" stroke="var(--accent)" strokeWidth={1.5} fill="url(#gW)" dot={{ r: 3, fill: 'var(--surface)', stroke: 'var(--accent)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="d-row3">
        <div className="section" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="row between" style={{ padding: '18px 20px' }}>
            <h3 className="h5">Недавние заказы</h3>
            <div className="tabs-seg">
              {(['all', 'online', 'offline'] as const).map((k) => (
                <button key={k} className={clsx(tab === k && 'active')} onClick={() => setTab(k)}>{{ all: 'Все', online: 'Онлайн', offline: 'Оффлайн' }[k]}</button>
              ))}
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th><span className="row gap-4">Название товара <ArrowDown size={12} /></span></th><th>ИКПУ</th><th>Цена за единицу</th><th>Кол-во продаж</th><th>Общая цена</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="strong"><span className="row gap-12"><img className="d-thumb" src={IMAGES.productCase} alt="" />{o.name}</span></td>
                    <td>{o.ikpu}</td><td>{o.price}</td><td>{o.qty}</td><td>{o.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="section">
          <h3 className="medium" style={{ fontSize: 16 }}>Самые продаваемые товары</h3>
          <div className="col gap-12 mt-12">
            {ORDERS.slice(0, 4).map((o) => (
              <div key={o.id} className="row gap-12">
                <img className="d-thumb lg" src={IMAGES.productCase} alt="" />
                <div className="col">
                  <p className="t-sm medium">{o.name}</p>
                  <p className="t-xs muted">ИКПУ: {o.ikpu}</p>
                  <p className="semibold" style={{ fontSize: 16, color: 'var(--primary)' }}>{o.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>
        <div className="soon-card">
          <span className="badge badge-warning">Скоро</span>
          <h3 className="h4">Дашборд в разработке</h3>
          <p className="t-sm muted">Здесь появится аналитика продаж из подключённых сервисов.</p>
        </div>
      </div>
    </div>
  );
}

function Kpi({ title, value, trend }: { title: string; value: string; trend: number }) {
  return (
    <div className="d-kpi">
      <div className="d-kpi-top">
        <p className="t-sm">{title}</p>
        <p className="h5" style={{ fontWeight: 600 }}>{value}</p>
      </div>
      <div style={{ padding: '8px 12px' }}><Trend value={trend} /></div>
    </div>
  );
}

function SalesTip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const [mm, yy] = String(label).split('.');
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  return (
    <div className="chart-tip">
      <p className="medium">{months[Number(mm) - 1]}, 20{yy}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="row gap-8 t-sm mt-4">
          <span className="dot" style={{ background: p.dataKey === 'online' ? 'var(--secondary)' : 'var(--logo)' }} />
          <b>{p.value.toLocaleString('en-US')}</b>
          <span className="success-text t-xs" style={{ marginLeft: 'auto' }}>+{p.dataKey === 'online' ? '2.6' : '4.6'}%</span>
        </p>
      ))}
    </div>
  );
}
