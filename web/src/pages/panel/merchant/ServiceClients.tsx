import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search } from 'lucide-react';
import { Badge, Pagination, usePaging, Select, formatPhone } from '../../../components/ui';
import { CHANNEL_LABEL, paidUntilOf, useMerchant, type Channel } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { downloadXlsx } from '../../../lib/excel';
import './merchant.css';


/**
 * Service cabinet: companies that connected this service via Gluon.
 * Shares what a service needs: company, owner, contact phone, category, channel and the subscription (no INN).
 */
export default function ServiceClients() {
  const { session, toast } = useApp();
  const { clients } = useMerchant();
  const svcId = session?.orgId ?? '';
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const pg = usePaging(); const { setPage } = pg;
  const nav = useNavigate();

  const mine = useMemo(() => clients.filter((c) => c.services[svcId]), [clients, svcId]);
  const rows = mine.filter((c) =>
    (channel === 'all' || c.channel === channel) &&
    (status === 'all' || c.services[svcId].status === status) &&
    ((c.company + c.owner + c.category).toLowerCase().includes(q.toLowerCase()) || (q.replace(/\D/g, '').length >= 3 && c.phone.includes(q.replace(/\D/g, '').replace(/^998/, '')))));
  const view = pg.slice(rows);

  const exportXlsx = () => {
    downloadXlsx(`${svcId}-clients.xlsx`, 'Клиенты', ['Компания', 'Владелец', 'Телефон', 'Категория', 'Канал', 'Подписка', 'Оплачено до', 'Подключён'],
      rows.map((c) => [c.company, c.owner, formatPhone(c.phone), c.category, CHANNEL_LABEL[c.channel], c.services[svcId].status === 'active' ? 'Оплачена' : 'Не оплачена', paidUntilOf(c, svcId), c.services[svcId].since]));
    toast('success', `Выгружено ${rows.length} клиентов`);
  };

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Клиенты</h1><p className="t-sm muted">Всего: {mine.length}</p></div>
        <button className="btn btn-secondary" onClick={exportXlsx}><Download size={16} /> Экспорт в Excel</button>
      </div>

      <div className="mc-filters">
        <label className="u-search" style={{ display: 'flex', width: 280 }}><Search size={16} /><input placeholder="Компания, владелец, телефон" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></label>
        <div style={{ width: 190 }}><Select value={channel} onChange={(v) => { setChannel(v); setPage(1); }} options={[{ value: 'all', label: 'Все каналы' }, ...(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))]} /></div>
        <div style={{ width: 200 }}><Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[{ value: 'all', label: 'Любая подписка' }, { value: 'active', label: 'Оплачена' }, { value: 'unpaid', label: 'Не оплачена' }]} /></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>Телефон</th><th>Категория</th><th>Канал</th><th>Подписка</th><th>Оплачено до</th><th>Подключён</th></tr></thead>
            <tbody>
              {view.map((c) => {
                const s = c.services[svcId];
                return (
                  <tr key={c.id} className="clickable" onClick={() => nav(c.id)}>
                    <td><span className="col"><span className="row gap-6"><span className="strong" style={{ color: 'var(--text)' }}>{c.company}</span>{c.blocked && <span title={c.block ? `${c.block.reason}${c.block.note ? `: ${c.block.note}` : ''}` : undefined}><Badge kind="error">Заблокирована</Badge></span>}</span><span className="t-xs muted">{c.owner}</span></span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatPhone(c.phone)}</td>
                    <td>{c.category}</td>
                    <td>{c.channel === 'gluon' ? <Badge kind="primary">Gluon</Badge> : <Badge kind="neutral">{CHANNEL_LABEL[c.channel]}</Badge>}</td>
                    <td>{s.status === 'active' ? <Badge kind="success">Оплачена</Badge> : <Badge kind="error">Не оплачена</Badge>}</td>
                    <td>{paidUntilOf(c, svcId)}</td>
                    <td>{s.since}</td>
                  </tr>
                );
              })}
              {!view.length && <tr><td colSpan={7}><div className="empty-state">Клиенты не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...pg.bar(rows.length)} />
      </div>

    </div>
  );
}
