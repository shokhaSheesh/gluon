import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Blocks, Building2, UserPlus, Users } from 'lucide-react';
import { BankLogo, BrandMark } from '../../../components/ui';
import { ChartTip } from '../../../components/ChartTip';
import { SERVICES } from '../../../data/mock';
import { SERVICE_IDS, parseDate, useMerchant } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { ANIM } from '../../../lib/chart';
import { PeriodFilter, bucketsOf, inRange, rangeLabel, rangeOf, type Period } from './period';
import { bankName } from './BankClients';
import { fmtMonths, pct, tenureOf } from './serviceStats';
import './merchant.css';

const C_SELF = 'var(--primary)', C_BANK = '#E9B000';

/** Bank cabinet home: the bank's clients in Gluon — growth, how they joined, services and categories. */
export default function BankDashboard() {
  const { session } = useApp();
  const m = useMerchant();
  const bank = session?.orgId ?? '';
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const r = rangeOf(period);
  const buckets = bucketsOf(r);

  const mine = useMemo(() => m.clients.filter((c) => c.channel === bank), [m.clients, bank]);
  const reg = (c: { registered: string }) => parseDate(c.registered);
  const base = mine.filter((c) => reg(c) <= r.to);           // clients at the end of the period
  const fresh = mine.filter((c) => inRange(reg(c), r));
  const connections = mine.flatMap((c) => Object.values(c.services)).filter((s) => inRange(parseDate(s.since), r)).length;

  const growth = buckets.map((b) => {
    const xs = mine.filter((c) => inRange(reg(c), b));
    return { label: b.label, self: xs.filter((c) => c.joined === 'self').length, bank: xs.filter((c) => c.joined === 'bank').length };
  });
  const joined = [
    { key: 'self', name: 'По ссылке банка', value: base.filter((c) => c.joined === 'self').length, color: C_SELF },
    { key: 'bank', name: 'Создан банком', value: base.filter((c) => c.joined === 'bank').length, color: C_BANK },
  ];
  const services = SERVICE_IDS.map((id) => ({ s: SERVICES.find((x) => x.id === id)!, n: base.filter((c) => c.services[id] && parseDate(c.services[id].since) <= r.to).length }))
    .sort((a, b) => b.n - a.n);
  const cats = Object.entries(base.reduce<Record<string, number>>((a, c) => ({ ...a, [c.category]: (a[c.category] ?? 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxSvc = Math.max(1, ...services.map((x) => x.n));

  /* how long the bank's clients use services (connection → lapse or end of period) */
  const pairs = base.flatMap((c) => SERVICE_IDS.filter((id) => c.services[id] && parseDate(c.services[id].since) <= r.to).map((id) => ({ id, t: tenureOf(c, id, r.to) })));
  const avgOf = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const usage = SERVICE_IDS.map((id) => ({ s: SERVICES.find((x) => x.id === id)!, t: avgOf(pairs.filter((p) => p.id === id).map((p) => p.t)), n: pairs.filter((p) => p.id === id).length }))
    .filter((x) => x.n).sort((a, b) => b.t - a.t);
  const maxUse = Math.max(1, ...usage.map((x) => x.t));

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <div className="row gap-12">
          <BankLogo id={bank} name={bankName(bank)} height={28} />
          <div><h1 className="h4">Дашборд</h1><p className="t-sm muted">{rangeLabel(r)}</p></div>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="p-stats">
        <Kpi icon={<Users size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={base.length} label="Клиенты" />
        <Kpi icon={<UserPlus size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={fresh.length} label="Новые клиенты" />
        <Kpi icon={<Building2 size={22} />} color="linear-gradient(135deg,#b54708,#f79009)" value={fresh.filter((c) => c.joined === 'bank').length} label="Создано банком" />
        <Kpi icon={<Blocks size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={connections} label="Подключения сервисов" />
      </div>

      <div className="mc-row">
        <div className="col gap-20" style={{ minWidth: 0 }}>
        <section className="card db-card">
          <h3 className="medium">Новые клиенты</h3>
          <div style={{ height: 250, marginTop: 12 }}>
            <ResponsiveContainer>
              <BarChart data={growth}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTip total="Всего" />} />
                <Bar isAnimationActive={ANIM} dataKey="self" name="По ссылке банка" stackId="a" fill={C_SELF} maxBarSize={36} />
                <Bar isAnimationActive={ANIM} dataKey="bank" name="Создан банком" stackId="a" fill={C_BANK} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="db-legend"><span><i style={{ background: C_SELF }} />По ссылке банка</span><span><i style={{ background: C_BANK }} />Создан банком</span></div>
        </section>
        <section className="card db-card">
          <h3 className="medium">Какими сервисами пользуются</h3>
          <div className="col gap-12 mt-12">
            {services.map(({ s, n }) => (
              <div key={s.id} className="bd-svc">
                <BrandMark name={s.name} color={s.color} text={s.mark} size={32} />
                <div className="grow col gap-4" style={{ minWidth: 0 }}>
                  <div className="row between t-sm"><b className="medium">{s.name}</b><span className="row gap-8"><b>{n}</b><span className="muted db-pct">{pct(n, base.length)}%</span></span></div>
                  <div className="db-bar"><span style={{ width: `${(n / maxSvc) * 100}%`, background: s.color }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        </div>

        <div className="col gap-20" style={{ minWidth: 0 }}>
        <section className="card db-card">
          <h3 className="medium">Как пришли клиенты</h3>
          <div className="row gap-16 wrap" style={{ marginTop: 8 }}>
            <div style={{ width: 150, height: 150, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie isAnimationActive={ANIM} data={joined} dataKey="value" innerRadius={50} outerRadius={72} paddingAngle={2} stroke="none">
                    {joined.map((x) => <Cell key={x.key} fill={x.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="db-donut-c"><b>{base.length}</b><span>клиентов</span></div>
            </div>
            <div className="col gap-12 grow" style={{ minWidth: 160 }}>
              {joined.map((x) => (
                <div key={x.key} className="col gap-4">
                  <div className="row between t-sm">
                    <span className="row gap-8"><span className="dot" style={{ background: x.color }} />{x.name}</span>
                    <span className="row gap-8"><b>{x.value}</b><span className="muted db-pct">{pct(x.value, base.length)}%</span></span>
                  </div>
                  <div className="db-bar"><span style={{ width: `${pct(x.value, base.length)}%`, background: x.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="card db-card">
          <h3 className="medium">Клиенты по категориям</h3>
          <div className="col gap-12 mt-12">
            {cats.map(([name, n]) => (
              <div key={name} className="col gap-4">
                <div className="row between t-sm"><span>{name}</span><span className="row gap-8"><b>{n}</b><span className="muted db-pct">{pct(n, base.length)}%</span></span></div>
                <div className="db-bar"><span style={{ width: `${pct(n, cats[0][1])}%`, background: 'var(--primary)' }} /></div>
              </div>
            ))}
            {!cats.length && <p className="muted t-sm">Нет данных</p>}
          </div>
        </section>
        </div>
      </div>

        <section className="card db-card">
          <h3 className="medium">Сколько пользуются сервисами</h3>
          <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}><b className="h3">{fmtMonths(avgOf(pairs.map((p) => p.t)))}</b><span className="t-sm muted">в среднем по всем сервисам</span></div>
          <div className="bd-use mt-12">
            {usage.map(({ s, t, n }) => (
              <div key={s.id} className="bd-svc">
                <BrandMark name={s.name} color={s.color} text={s.mark} size={32} />
                <div className="grow col gap-4" style={{ minWidth: 0 }}>
                  <div className="row between t-sm"><b className="medium">{s.name}</b><span className="row gap-8"><b>{fmtMonths(t)}</b><span className="muted t-xs">{n} клиент.</span></span></div>
                  <div className="db-bar"><span style={{ width: `${(t / maxUse) * 100}%`, background: s.color }} /></div>
                </div>
              </div>
            ))}
            {!usage.length && <p className="muted t-sm">Нет данных</p>}
          </div>
        </section>
    </div>
  );
}

function Kpi({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) {
  return (
    <div className="p-stat">
      <span className="p-stat-ic" style={{ background: color }}>{icon}</span>
      <div className="col gap-2"><p><b>{value}</b></p><p className="t-sm muted">{label}</p></div>
    </div>
  );
}
