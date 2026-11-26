import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Building2, UserPlus, Wallet } from 'lucide-react';
import { BrandMark } from '../../components/ui';
import { ChartTip } from '../../components/ChartTip';
import { SERVICES } from '../../data/mock';
import { CHANNEL_LABEL, SERVICE_IDS, TODAY, parseDate, useMerchant, type Channel } from '../../lib/merchant';
import { sum, useBilling } from '../../lib/billing';
import { ANIM } from '../../lib/chart';
import { PeriodFilter, bucketsOf, inRange, rangeLabel, rangeOf, type Period } from './merchant/period';
import { pct, renewalsOf } from './merchant/serviceStats';
import { Stat } from './AdminCompanies';
import './merchant/merchant.css';

const CH_COLOR: Record<Channel, string> = { gluon: 'var(--primary)', kapital: '#E9B000', hayot: '#0F9D76' };
const C_SVC = 'var(--primary)', C_PLAN = '#53b1fd';
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} млн` : n >= 1e3 ? `${Math.round(n / 1e3)} тыс` : String(n));

/** Gluon admin home: companies, channels, services and Gluon's own revenue (service subscriptions + plans). */
export default function PanelDashboard() {
  const { clients } = useMerchant();
  const b = useBilling();
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const r = rangeOf(period);
  const buckets = bucketsOf(r);
  const reg = (d: string) => parseDate(d);

  const base = clients.filter((c) => reg(c.registered) <= r.to);
  const fresh = clients.filter((c) => inRange(reg(c.registered), r));
  const active30 = clients.filter((c) => !c.blocked && c.lastActive && (TODAY.getTime() - parseDate(c.lastActive).getTime()) / 86_400_000 <= 30).length;

  // revenue: paid service periods × service price, plus paid plans (monthly, from registration)
  const payments = useMemo(() => SERVICE_IDS.flatMap((id) => renewalsOf(clients, id).filter((x) => x.kind !== 'failed').map((x) => ({ id, at: x.at, amount: (b.prices[id]?.price ?? 0) * x.months }))), [clients, b.prices]);
  const planPrice = (pid: string) => b.plans.find((p) => p.id === pid)?.price ?? 0;
  const planIn = (rg: { from: Date; to: Date }) => clients.reduce((a, c) => {
    const price = planPrice(c.plan);
    if (!price) return a;
    const start = reg(c.registered);
    let n = 0;
    for (let d = new Date(start); d <= rg.to; d = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate())) if (d >= rg.from) n++;
    return a + n * price;
  }, 0);
  const svcIn = (rg: { from: Date; to: Date }) => payments.filter((p) => inRange(p.at, rg)).reduce((a, p) => a + p.amount, 0);
  const revenue = svcIn(r) + planIn(r);

  const growth = buckets.map((bk) => {
    const xs = clients.filter((c) => inRange(reg(c.registered), bk));
    return { label: bk.label, gluon: xs.filter((c) => c.channel === 'gluon').length, kapital: xs.filter((c) => c.channel === 'kapital').length, hayot: xs.filter((c) => c.channel === 'hayot').length };
  });
  const money = buckets.map((bk) => ({ label: bk.label, svc: svcIn(bk), plan: planIn(bk) }));
  const channels = (Object.keys(CHANNEL_LABEL) as Channel[]).map((ch) => ({ key: ch, name: CHANNEL_LABEL[ch], value: base.filter((c) => c.channel === ch).length, color: CH_COLOR[ch] }));
  const bySvc = SERVICE_IDS.map((id) => ({ s: SERVICES.find((x) => x.id === id)!, n: base.filter((c) => c.services[id] && parseDate(c.services[id].since) <= r.to).length, money: payments.filter((p) => p.id === id && inRange(p.at, r)).reduce((a, p) => a + p.amount, 0) }))
    .sort((a, b2) => b2.money - a.money);
  const maxMoney = Math.max(1, ...bySvc.map((x) => x.money));

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Дашборд</h1><p className="t-sm muted">{rangeLabel(r)}</p></div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="p-stats">
        <Stat icon={<Building2 size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={base.length} label="Компании" />
        <Stat icon={<UserPlus size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={fresh.length} label="Новые компании" />
        <Stat icon={<Activity size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={active30} label="Активные за 30 дней" />
        <Stat icon={<Wallet size={22} />} color="linear-gradient(135deg,#b54708,#f79009)" value={sum(revenue)} label="Выручка Gluon" />
      </div>

      <div className="mc-row">
        <div className="col gap-20" style={{ minWidth: 0 }}>
          <section className="card db-card">
            <h3 className="medium">Выручка</h3>
            <div style={{ height: 240, marginTop: 12 }}>
              <ResponsiveContainer>
                <BarChart data={money}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} tickFormatter={short} />
                  <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTip total="Всего" unit="сум" />} />
                  <Bar isAnimationActive={ANIM} dataKey="svc" name="Подписки на сервисы" stackId="a" fill={C_SVC} maxBarSize={36} />
                  <Bar isAnimationActive={ANIM} dataKey="plan" name="Тарифы Gluon" stackId="a" fill={C_PLAN} radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="db-legend"><span><i style={{ background: C_SVC }} />Подписки на сервисы</span><span><i style={{ background: C_PLAN }} />Тарифы Gluon</span></div>
          </section>
          <section className="card db-card">
            <h3 className="medium">Новые компании</h3>
            <div style={{ height: 220, marginTop: 12 }}>
              <ResponsiveContainer>
                <BarChart data={growth}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={12} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                  <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTip total="Всего" />} />
                  {(Object.keys(CHANNEL_LABEL) as Channel[]).map((ch, i, arr) => (
                    <Bar key={ch} isAnimationActive={ANIM} dataKey={ch} name={CHANNEL_LABEL[ch]} stackId="a" fill={CH_COLOR[ch]} radius={i === arr.length - 1 ? [4, 4, 0, 0] : undefined} maxBarSize={36} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="db-legend">{channels.map((x) => <span key={x.key}><i style={{ background: x.color }} />{x.name}</span>)}</div>
          </section>
        </div>

        <div className="col gap-20" style={{ minWidth: 0 }}>
          <section className="card db-card">
            <h3 className="medium">Компании по каналам</h3>
            <div className="row gap-16 wrap" style={{ marginTop: 8 }}>
              <div style={{ width: 140, height: 140, position: 'relative' }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie isAnimationActive={ANIM} data={channels.filter((x) => x.value)} dataKey="value" innerRadius={46} outerRadius={66} paddingAngle={2} stroke="none">
                      {channels.filter((x) => x.value).map((x) => <Cell key={x.key} fill={x.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="db-donut-c"><b>{base.length}</b><span>компаний</span></div>
              </div>
              <div className="col gap-12 grow" style={{ minWidth: 160 }}>
                {channels.map((x) => (
                  <div key={x.key} className="col gap-4">
                    <div className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: x.color }} />{x.name}</span><span className="row gap-8"><b>{x.value}</b><span className="muted db-pct">{pct(x.value, base.length)}%</span></span></div>
                    <div className="db-bar"><span style={{ width: `${pct(x.value, base.length)}%`, background: x.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="card db-card">
            <h3 className="medium">Сервисы</h3>
            <div className="col gap-12 mt-12">
              {bySvc.map(({ s, n, money: mny }) => (
                <div key={s.id} className="bd-svc">
                  <BrandMark name={s.name} color={s.color} text={s.mark} size={32} />
                  <div className="grow col gap-4" style={{ minWidth: 0 }}>
                    <div className="row between t-sm"><b className="medium">{s.name}</b><span className="row gap-8"><b>{sum(mny)}</b><span className="muted t-xs">{n} комп.</span></span></div>
                    <div className="db-bar"><span style={{ width: `${(mny / maxMoney) * 100}%`, background: s.color }} /></div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
