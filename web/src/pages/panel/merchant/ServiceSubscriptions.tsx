import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Download, Search } from 'lucide-react';
import { Badge, Pagination } from '../../../components/ui';
import { useMerchant } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { downloadXlsx } from '../../../lib/excel';
import { PeriodFilter, inRange, rangeOf, type Period } from './period';
import { renewalsOf, type Renewal, type RenewalKind } from './serviceStats';
import './merchant.css';

const PER = 15;
const TABS: { key: 'all' | RenewalKind; label: string }[] = [
  { key: 'all', label: 'Все' }, { key: 'ontime', label: 'Вовремя' }, { key: 'late', label: 'С опозданием' },
];

export function RenewalStatus({ r }: { r: Pick<Renewal, 'kind' | 'late'> }) {
  if (r.kind === 'failed') return <Badge kind="error">Не оплачено</Badge>;
  if (r.kind === 'late') return <span className="row gap-6 wrap"><Badge kind="warning">С опозданием</Badge><span className="t-xs muted">{r.late} дн.</span></span>;
  return <Badge kind="success">Оплачено</Badge>;
}

/** Every paid subscription period of every company using the service. */
export default function ServiceSubscriptions() {
  const { session, toast } = useApp();
  const { clients } = useMerchant();
  const nav = useNavigate();
  const svcId = session?.orgId ?? '';
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const [tab, setTab] = useState<'all' | RenewalKind>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  // a subscription exists only once it is paid — failed renewals are not listed
  const all = useMemo(() => renewalsOf(clients, svcId).filter((x) => x.kind !== 'failed'), [clients, svcId]);
  const r = rangeOf(period);
  const inPeriod = all.filter((x) => inRange(x.at, r) && (x.client.company + x.client.owner).toLowerCase().includes(q.toLowerCase()));
  const rows = inPeriod.filter((x) => tab === 'all' || x.kind === tab);
  const total = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);
  const count = (k: 'all' | RenewalKind) => (k === 'all' ? inPeriod.length : inPeriod.filter((x) => x.kind === k).length);
  const reset = () => setPage(1);

  const exportXlsx = () => {
    downloadXlsx(`${svcId}-subscriptions.xlsx`, 'Подписки', ['Компания', 'Владелец', 'С', 'По', 'Срок', 'Дата оплаты', 'Статус'],
      rows.map((x) => [x.client.company, x.client.owner, x.from, x.to, `${x.months} мес.`, x.kind === 'failed' ? '—' : x.paidOn,
        x.kind === 'failed' ? 'Не оплачено' : x.kind === 'late' ? `С опозданием (${x.late} дн.)` : 'Оплачено']));
    toast('success', `Выгружено подписок: ${rows.length}`);
  };

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Подписки</h1>
        <div className="row gap-12 wrap">
          <PeriodFilter value={period} onChange={(p) => { setPeriod(p); reset(); }} />
          <button className="btn btn-secondary" onClick={exportXlsx}><Download size={16} /> Экспорт в Excel</button>
        </div>
      </div>

      <div className="mc-filters">
        <div className="tabs-seg">
          {TABS.map((t) => (
            <button key={t.key} className={clsx(tab === t.key && 'active')} onClick={() => { setTab(t.key); reset(); }}>
              {t.label} <span className="op-tabcount">{count(t.key)}</span>
            </button>
          ))}
        </div>
        <label className="u-search" style={{ display: 'flex', width: 260 }}><Search size={16} /><input placeholder="Компания или владелец" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} /></label>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>Период</th><th>Срок</th><th>Дата оплаты</th><th>Статус</th></tr></thead>
            <tbody>
              {view.map((x) => (
                <tr key={x.id} className="clickable" onClick={() => nav(`../clients/${x.client.id}`)}>
                  <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{x.client.company}</span><span className="t-xs muted">{x.client.owner}</span></span></td>
                  <td>{x.kind === 'failed' ? <>с {x.from}</> : <>с {x.from} по {x.to}</>}</td>
                  <td>{x.months} мес.</td>
                  <td>{x.kind === 'failed' ? '—' : x.paidOn}</td>
                  <td><RenewalStatus r={x} /></td>
                </tr>
              ))}
              {!view.length && <tr><td colSpan={5}><div className="empty-state">За этот период подписок нет</div></td></tr>}
            </tbody>
          </table>
        </div>
        {total > 1 && <Pagination page={page} total={total} onPage={setPage} />}
      </div>
    </div>
  );
}
