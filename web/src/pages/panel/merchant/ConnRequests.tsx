import { useState } from 'react';
import clsx from 'clsx';
import { Check, Phone, X } from 'lucide-react';
import { Badge, Field, Modal, Pagination, usePaging, formatPhone } from '../../../components/ui';
import { fmtHours } from './serviceStats';
import { CHANNEL_LABEL, CONN_LABEL, DEMO_CLIENT_ID, initials, useMerchant, type ConnRequest, type ConnStatus } from '../../../lib/merchant';
import { useBilling } from '../../../lib/billing';
import { useApp } from '../../../lib/store';
import './merchant.css';

const REASONS = ['Не удалось найти аккаунт компании', 'Компания уже подключена напрямую', 'Неполные данные компании', 'Другое'];

/**
 * Users' requests to connect this service (user side shows «Ожидает подтверждения сервиса»).
 * Approve → the company appears in «Клиенты» and the user can link their own account.
 */
export default function ConnRequests() {
  const { session, toast } = useApp();
  const m = useMerchant();
  const billing = useBilling();
  const svcId = session?.orgId ?? '';
  const [tab, setTab] = useState<ConnStatus>('pending');
  const [reject, setReject] = useState<ConnRequest | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const pg = usePaging(); const { setPage } = pg;

  const mine = m.connRequests.filter((r) => r.service === svcId);
  const all = mine.filter((r) => r.status === tab).sort((a, b) => b.date.split('.').reverse().join('').localeCompare(a.date.split('.').reverse().join('')));
  const list = pg.slice(all);
  const count = (s: ConnStatus) => mine.filter((r) => r.status === s).length;

  const approve = (r: ConnRequest) => {
    m.setConnStatus(r.id, 'approved');
    m.log(svcId, 'service', { section: 'requests', action: 'Одобрил заявку', target: m.clients.find((c) => c.id === r.clientId)?.company ?? '' });
    m.addClientService(r.clientId, svcId);
    if (r.clientId === DEMO_CLIENT_ID) billing.setLink(svcId, 'link'); // user can now link their own account
    toast('success', 'Заявка одобрена');
  };

  return (
    <div className="col gap-16">
      <h1 className="h4">Заявки на подключение</h1>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        {(['pending', 'approved', 'rejected'] as ConnStatus[]).map((s) => (
          <button key={s} className={clsx(tab === s && 'active')} onClick={() => { setTab(s); setPage(1); }}>
            {{ pending: 'Ожидают', approved: 'Одобренные', rejected: 'Отклонённые' }[s]} <span className="op-tabcount">{count(s)}</span>
          </button>
        ))}
      </div>
      <div className="col gap-12">
        {list.map((r) => {
          const c = m.clients.find((x) => x.id === r.clientId);
          if (!c) return null;
          return (
            <div key={r.id} className="mc-req">
              <span className="mc-req-ic">{initials(c.company)}</span>
              <div className="grow col gap-4" style={{ minWidth: 0 }}>
                <div className="row gap-8 wrap"><b>{c.company}</b><Badge kind={CONN_LABEL[r.status].kind}>{CONN_LABEL[r.status].label}</Badge></div>
                <p className="t-sm muted row gap-6 wrap">{c.owner} · <a className="mc-phone" href={`tel:+998${c.phone}`}><Phone size={13} /> {formatPhone(c.phone)}</a> · {c.category} · канал: {CHANNEL_LABEL[c.channel]}</p>
                <p className="t-xs muted">Заявка от {r.date}{r.hours ? ` · рассмотрена за ${fmtHours(r.hours)}` : ''}{r.reason ? ` · причина: ${r.reason}` : ''}</p>
              </div>
              {r.status === 'pending' && (
                <div className="row gap-8 mc-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => { setReject(r); setReason(REASONS[0]); }}><X size={14} /> Отклонить</button>
                  <button className="btn btn-primary btn-sm" onClick={() => approve(r)}><Check size={14} /> Одобрить</button>
                </div>
              )}
            </div>
          );
        })}
        <Pagination {...pg.bar(all.length)} />
        {!list.length && <div className="card empty-state">{tab === 'pending' ? 'Новых заявок нет' : 'Здесь пока пусто'}</div>}
      </div>

      <Modal open={!!reject} onClose={() => setReject(null)} title="Отклонить заявку" width={440}>
        {reject && (
          <div className="col gap-16" style={{ padding: 24 }}>
            <p className="t-sm muted">Причину увидит пользователь.</p>
            <Field label="Причина">
              <div className="col gap-8">
                {REASONS.map((x) => (
                  <label key={x} className="checkbox"><input type="radio" checked={reason === x} onChange={() => setReason(x)} style={{ accentColor: 'var(--primary)' }} /> {x}</label>
                ))}
              </div>
            </Field>
            <div className="row gap-12">
              <button className="btn btn-secondary grow" onClick={() => setReject(null)}>Отмена</button>
              <button className="btn btn-danger grow" onClick={() => {
                m.setConnStatus(reject.id, 'rejected', reason);
                m.log(svcId, 'service', { section: 'requests', action: 'Отклонил заявку', target: m.clients.find((c) => c.id === reject.clientId)?.company ?? '', details: `Причина: ${reason}` });
                if (reject.clientId === DEMO_CLIENT_ID) billing.setLink(svcId, null);
                toast('info', 'Заявка отклонена');
                setReject(null);
              }}>Отклонить</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
