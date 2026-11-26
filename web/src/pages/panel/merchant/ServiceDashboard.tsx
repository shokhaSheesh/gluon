import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, CheckCircle2, ChevronRight, UserPlus, Users } from 'lucide-react';
import { Badge, BrandMark } from '../../../components/ui';
import { SERVICES } from '../../../data/mock';
import { CHANNEL_LABEL, TODAY, parseDate, paidUntilOf, useMerchant, type Channel, type Client } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { ANIM } from '../../../lib/chart';
import { ChartTip } from '../../../components/ChartTip';
import { PeriodFilter, bucketsOf, inRange, rangeLabel, rangeOf, type Period } from './period';
import { fmtHours, fmtMonths, isClientOn, paidMonthsOf, pct, renewalsOf, tenureOf } from './serviceStats';
import './merchant.css';

const C_OK = 'var(--success)', C_LATE = '#F79009', C_FAIL = 'var(--error)';
const CH_COLOR: Record<Channel, string> = { gluon: 'var(--primary)', kapital: '#E9B000', hayot: '#0F9D76' };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);

export default function ServiceDashboard() {
  const { session } = useApp();
  const nav = useNavigate();
  const { clients, connRequests } = useMerchant();
  const svcId = session?.orgId ?? '';
  const svc = SERVICES.find((s) => s.id === svcId);
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const r = rangeOf(period);
  const buckets = bucketsOf(r);

  const mine = useMemo(() => clients.filter((c) => c.services[svcId]), [clients, svcId]);
  const renewals = useMemo(() => renewalsOf(mine, svcId), [mine, svcId]);
  const reqs = useMemo(() => connRequests.filter((x) => x.service === svcId), [connRequests, svcId]);
  const since = (c: Client) => parseDate(c.services[svcId].since);

  /* KPIs — counted inside the selected period */
  const kpi = (rg: { from: Date; to: Date }) => {
    const rn = renewals.filter((x) => inRange(x.at, rg));
    return {
      clients: mine.filter((c) => isClientOn(c, svcId, rg.to)).length,
      fresh: mine.filter((c) => inRange(since(c), rg)).length,
      paid: rn.filter((x) => x.kind !== 'failed').length,
      failed: rn.filter((x) => x.kind === 'failed').length,
    };
  };
  const cur = kpi(r);

  /* payment regularity */
  const rnIn = renewals.filter((x) => inRange(x.at, r));
  const regularity = buckets.map((b) => {
    const xs = rnIn.filter((x) => inRange(x.at, b));
    return { label: b.label, ontime: xs.filter((x) => x.kind === 'ontime').length, late: xs.filter((x) => x.kind === 'late').length, failed: xs.filter((x) => x.kind === 'failed').length };
  });
  const lateOnes = rnIn.filter((x) => x.kind === 'late');
  const ontimeShare = pct(rnIn.filter((x) => x.kind === 'ontime').length, rnIn.length);
  const avgLate = avg(lateOnes.map((x) => x.late));

  // clients who were with the service during the period, measured at its end
  const cohort = mine.filter((c) => since(c) <= r.to && (c.services[svcId].status === 'active' || parseDate(paidUntilOf(c, svcId)) >= r.from));
  const habit = (c: Client) => {
    const xs = renewals.filter((x) => x.client.id === c.id && x.at <= r.to);
    return xs.some((x) => x.kind === 'failed') ? 'failed' : xs.some((x) => x.kind === 'late') ? 'late' : 'ontime';
  };
  const habits = cohort.map(habit);
  const habitPie = [
    { key: 'ontime', name: 'Всегда вовремя', value: habits.filter((h) => h === 'ontime').length, color: C_OK },
    { key: 'late', name: 'Бывают опоздания', value: habits.filter((h) => h === 'late').length, color: C_LATE },
    { key: 'failed', name: 'Перестали платить', value: habits.filter((h) => h === 'failed').length, color: C_FAIL },
  ];

  /* where clients come from: directly to Gluon or through a partner bank */
  const byChannel = (Object.keys(CHANNEL_LABEL) as Channel[]).map((ch) => ({ key: ch, name: CHANNEL_LABEL[ch], value: cohort.filter((c) => c.channel === ch).length, color: CH_COLOR[ch] })).filter((x) => x.value);

  /* new clients */
  const newByBucket = buckets.map((b) => ({ label: b.label, v: mine.filter((c) => inRange(since(c), b)).length }));

  /* connection requests */
  const reqIn = reqs.filter((x) => inRange(parseDate(x.date), r));
  const byStatus = [
    { key: 'pending', label: 'Ожидают', n: reqIn.filter((x) => x.status === 'pending').length, color: C_LATE },
    { key: 'approved', label: 'Одобрены', n: reqIn.filter((x) => x.status === 'approved').length, color: C_OK },
    { key: 'rejected', label: 'Отклонены', n: reqIn.filter((x) => x.status === 'rejected').length, color: C_FAIL },
  ];
  const tApprove = avg(reqIn.filter((x) => x.status === 'approved' && x.hours).map((x) => x.hours!));
  const tReject = avg(reqIn.filter((x) => x.status === 'rejected' && x.hours).map((x) => x.hours!));
  const tAll = avg(reqIn.filter((x) => x.hours).map((x) => x.hours!));
  const waiting = reqs.filter((x) => x.status === 'pending');
  const oldest = waiting.length ? Math.max(...waiting.map((x) => (TODAY.getTime() - parseDate(x.date).getTime()) / 3_600_000)) : NaN;

  /* how long clients pay / stay */
  const veterans = cohort.filter((c) => tenureOf(c, svcId, r.to) >= 1);
  const paidRows = cohort.map((c) => ({ c, v: paidMonthsOf(c, svcId, r.to) }));
  const stayRows = cohort.map((c) => ({ c, v: tenureOf(c, svcId, r.to) }));
  const vetIds = new Set(veterans.map((c) => c.id));

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <div className="row gap-12">
          {svc && <BrandMark name={svc.name} color={svc.color} text={svc.mark} size={40} />}
          <div><h1 className="h4">Дашборд</h1><p className="t-sm muted">{rangeLabel(r)}</p></div>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="p-stats">
        <Kpi icon={<Users size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={cur.clients} label="Клиенты" />
        <Kpi icon={<UserPlus size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={cur.fresh} label="Новые клиенты" />
        <Kpi icon={<CheckCircle2 size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={cur.paid} label="Оплаченные подписки" />
        <Kpi icon={<AlertCircle size={22} />} color="linear-gradient(135deg,#d92d20,#f97066)" value={cur.failed} label="Не продлили подписку" />
      </div>

      <div className="mc-row">
        <div className="col gap-20" style={{ minWidth: 0 }}>
        <section className="card db-card">
          <div className="row between wrap gap-8">
            <h3 className="medium">Регулярность оплат</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('subscriptions')}>Все подписки <ChevronRight size={14} /></button>
          </div>
          <div className="db-figures">
            <div><b>{ontimeShare}%</b><span>оплачено вовремя</span></div>
            <div><b>{lateOnes.length}</b><span>с опозданием</span></div>
            <div><b>{isFinite(avgLate) ? `${avgLate.toFixed(1).replace('.', ',')} дн.` : '—'}</b><span>среднее опоздание</span></div>
          </div>
          <div style={{ height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={regularity}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTip total="Всего" />} />
                <Bar isAnimationActive={ANIM} dataKey="ontime" name="Вовремя" stackId="a" fill={C_OK} maxBarSize={36} />
                <Bar isAnimationActive={ANIM} dataKey="late" name="С опозданием" stackId="a" fill={C_LATE} maxBarSize={36} />
                <Bar isAnimationActive={ANIM} dataKey="failed" name="Не продлили" stackId="a" fill={C_FAIL} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="db-legend">
            <span><i style={{ background: C_OK }} />Вовремя</span><span><i style={{ background: C_LATE }} />С опозданием</span><span><i style={{ background: C_FAIL }} />Не продлили</span>
          </div>
        </section>
        <section className="card db-card">
          <h3 className="medium">Новые клиенты</h3>
          <div style={{ height: 250, marginTop: 12 }}>
            <ResponsiveContainer>
              <BarChart data={newByBucket}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} interval="preserveStartEnd" minTickGap={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip cursor={{ fill: 'var(--surface-3)', radius: 6 }} content={<ChartTip names={{ v: 'Новых клиентов' }} />} />
                <Bar isAnimationActive={ANIM} dataKey="v" name="Новых клиентов" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        </div>
        <div className="col gap-20" style={{ minWidth: 0 }}>
        <section className="card db-card">
          <h3 className="medium">Как платят клиенты</h3>
          <div className="row gap-16 wrap" style={{ marginTop: 8 }}>
            <div style={{ width: 160, height: 160, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie isAnimationActive={ANIM} data={habitPie} dataKey="value" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none">
                    {habitPie.map((x) => <Cell key={x.key} fill={x.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="db-donut-c"><b>{cohort.length}</b><span>клиентов</span></div>
            </div>
            <div className="col gap-12 grow" style={{ minWidth: 160 }}>
              {habitPie.map((x) => (
                <div key={x.key} className="col gap-4">
                  <div className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: x.color }} />{x.name}</span><b>{x.value}</b></div>
                  <div className="db-bar"><span style={{ width: `${pct(x.value, cohort.length)}%`, background: x.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card db-card">
          <h3 className="medium">Откуда приходят клиенты</h3>
          <div className="row gap-16 wrap" style={{ marginTop: 8 }}>
            <div style={{ width: 140, height: 140, position: 'relative' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie isAnimationActive={ANIM} data={byChannel} dataKey="value" innerRadius={46} outerRadius={66} paddingAngle={2} stroke="none">
                    {byChannel.map((x) => <Cell key={x.key} fill={x.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="db-donut-c"><b>{cohort.length}</b><span>клиентов</span></div>
            </div>
            <div className="col gap-12 grow" style={{ minWidth: 160 }}>
              {byChannel.map((x) => (
                <div key={x.key} className="col gap-4">
                  <div className="row between t-sm">
                    <span className="row gap-8"><span className="dot" style={{ background: x.color }} />{x.name}</span>
                    <span className="row gap-8"><b>{x.value}</b><span className="muted db-pct">{pct(x.value, cohort.length)}%</span></span>
                  </div>
                  <div className="db-bar"><span style={{ width: `${pct(x.value, cohort.length)}%`, background: x.color }} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="card db-card">
          <div className="row between">
            <h3 className="medium">Заявки на подключение</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => nav('requests')}>Все заявки <ChevronRight size={14} /></button>
          </div>
          <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}><b className="h3">{reqIn.length}</b><span className="t-sm muted">заявок за период</span></div>
          <div className="db-stack">
            {byStatus.filter((s) => s.n).map((s) => <span key={s.key} style={{ flex: s.n, background: s.color }} title={`${s.label}: ${s.n}`} />)}
          </div>
          <div className="db-status">
            {byStatus.map((s) => (
              <div key={s.key}><span className="row gap-6 t-sm muted"><span className="dot" style={{ background: s.color }} />{s.label}</span><b>{s.n}</b><span className="t-xs muted">{pct(s.n, reqIn.length)}%</span></div>
            ))}
          </div>
          <div className="db-divider" />
          <h4 className="t-sm medium">Скорость обработки</h4>
          <div className="db-speed">
            <div><span className="t-xs muted">До одобрения</span><b>{fmtHours(tApprove)}</b></div>
            <div><span className="t-xs muted">До отклонения</span><b>{fmtHours(tReject)}</b></div>
            <div><span className="t-xs muted">В среднем</span><b>{fmtHours(tAll)}</b></div>
          </div>
          {waiting.length > 0 && (
            <button className="db-waiting" onClick={() => nav('requests')}>
              <span>Сейчас ждут ответа: <b>{waiting.length}</b></span>
              <span className="muted">самая старая — {fmtHours(oldest)}</span>
            </button>
          )}
        </section>
        </div>
      </div>

      <div className="db-two">
        <RankCard title="Сколько месяцев платят" avgLabel="в среднем оплачено" avg={avg(paidRows.map((x) => x.v))}
          rows={paidRows} least={paidRows.filter((x) => vetIds.has(x.c.id))} svcId={svcId} onOpen={(id) => nav(`clients/${id}`)} />
        <RankCard title="Сколько остаются с сервисом" avgLabel="в среднем с вами" avg={avg(stayRows.map((x) => x.v))}
          rows={stayRows} least={stayRows.filter((x) => vetIds.has(x.c.id))} svcId={svcId} onOpen={(id) => nav(`clients/${id}`)} showLeft />
      </div>
    </div>
  );
}

function Kpi({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number; label: string }) {
  return (
    <div className="p-stat">
      <span className="p-stat-ic" style={{ background: color }}>{icon}</span>
      <div className="col gap-2">
        <p><b>{value}</b></p>
        <p className="t-sm muted">{label}</p>
      </div>
    </div>
  );
}

type Row = { c: Client; v: number };
function RankCard({ title, avgLabel, avg: a, rows, least, svcId, onOpen, showLeft }: {
  title: string; avgLabel: string; avg: number; rows: Row[]; least: Row[]; svcId: string; onOpen: (id: string) => void; showLeft?: boolean;
}) {
  const top = [...rows].sort((x, y) => y.v - x.v).slice(0, 5);
  const low = [...least].sort((x, y) => x.v - y.v).slice(0, 5);
  const List = ({ items, tone }: { items: Row[]; tone: 'top' | 'low' }) => (
    <ol className="db-rank">
      {items.map((x, i) => (
        <li key={x.c.id} onClick={() => onOpen(x.c.id)}>
          <span className={`db-rank-n ${tone}`}>{i + 1}</span>
          <span className="grow ellipsis">{x.c.company}</span>
          {showLeft && x.c.services[svcId].status === 'unpaid' && <Badge kind="error">Ушёл</Badge>}
          <b>{fmtMonths(x.v)}</b>
        </li>
      ))}
      {!items.length && <li className="muted t-sm">Нет данных</li>}
    </ol>
  );
  return (
    <section className="card db-card">
      <h3 className="medium">{title}</h3>
      <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}><b className="h3">{isFinite(a) ? fmtMonths(a) : '—'}</b><span className="t-sm muted">{avgLabel}</span></div>
      <div className="db-rank-cols">
        <div><h4 className="t-xs muted db-rank-h">Дольше всех</h4><List items={top} tone="top" /></div>
        <div><h4 className="t-xs muted db-rank-h">Меньше всех</h4><List items={low} tone="low" /></div>
      </div>
    </section>
  );
}
