import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, ArrowLeft, Phone, CalendarCheck, CalendarClock, Clock, Download, MessageSquare, Repeat } from 'lucide-react';
import { Badge, formatPhone } from '../../../components/ui';
import { CHANNEL_LABEL, autoRenewOf, initials, paidUntilOf, servicePayments, useMerchant } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { BlockBanner } from './BankClientDetail';
import { downloadXlsx } from '../../../lib/excel';
import { RenewalStatus } from './ServiceSubscriptions';
import './merchant.css';

const addMonths = (date: string, months: number) => {
  const [d, m, y] = date.split('.').map(Number);
  const x = new Date(y, m - 1 + months, d);
  return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
};

/**
 * Service cabinet: one client's subscription history with this service.
 * Statuses and periods only — no amounts, no sync details, no INN / phone.
 */
export default function ServiceClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { session, toast } = useApp();
  const { clients } = useMerchant();
  const svcId = session?.orgId ?? '';
  const c = clients.find((x) => x.id === id);

  if (!c || !c.services[svcId]) {
    return (
      <div className="card empty-state">
        Клиент не найден или не подключал ваш сервис
        <button className="btn btn-secondary btn-sm" onClick={() => nav('/merchant/clients')}>К списку клиентов</button>
      </div>
    );
  }

  const sub = c.services[svcId];
  // periods = the same chain as payments, shown without money
  const periods = servicePayments(c, svcId, 0).filter((p) => p.status === 'paid').map((p) => ({
    id: p.id, from: p.date, to: p.status === 'paid' ? addMonths(p.date, p.months) : '—', months: p.months, paid: p.status === 'paid', paidOn: p.paidOn, late: p.late,
    kind: (p.status === 'failed' ? 'failed' : p.late ? 'late' : 'ontime') as 'failed' | 'late' | 'ontime',
  }));
  const paidCount = periods.filter((p) => p.paid).length;
  const until = paidUntilOf(c, svcId);
  const autoRenew = autoRenewOf(c, svcId);
  const [d, m, y] = sub.since.split('.').map(Number);
  const tenure = Math.max(1, (2026 - y) * 12 + (11 - m) + (25 >= d ? 1 : 0));
  const risk = sub.status === 'unpaid' ? 'Подписка не оплачена' : !autoRenew ? 'Автопродление выключено' : null;

  return (
    <div className="col gap-20">
      <button className="btn-link t-sm row gap-4" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/merchant/clients')}><ArrowLeft size={14} /> Все клиенты</button>

      <div className="card cd-head">
        <span className="cd-avatar">{initials(c.company)}</span>
        <div className="grow col gap-6" style={{ minWidth: 0 }}>
          <div className="row gap-8 wrap">
            <h1 className="h4">{c.company}</h1>
            {sub.status === 'active' ? <Badge kind="success">Подписка оплачена</Badge> : <Badge kind="error">Подписка не оплачена</Badge>}
            {c.blocked && <Badge kind="error">Заблокирована</Badge>}
            {risk && !c.blocked && <Badge kind="warning"><AlertTriangle size={12} /> Риск оттока</Badge>}
          </div>
          <p className="muted t-sm row gap-6 wrap">{c.owner} · <a className="mc-phone" href={`tel:+998${c.phone}`}><Phone size={13} /> {formatPhone(c.phone)}</a> · {c.category} · канал: {CHANNEL_LABEL[c.channel]}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => nav('/merchant/chat')}><MessageSquare size={16} /> Написать в чат</button>
      </div>

      <div className="cd-stats">
        <Stat icon={<Clock size={18} />} label="Клиент с" value={sub.since} sub={`${tenure} мес. с вами`} />
        <Stat icon={<CalendarCheck size={18} />} label="Оплаченных периодов" value={String(paidCount)} sub={`Всего ${periods.reduce((a, p) => a + (p.paid ? p.months : 0), 0)} мес.`} />
        <Stat icon={<CalendarClock size={18} />} label={sub.status === 'active' ? 'Оплачено до' : 'Не оплачено с'} value={until} sub={sub.status === 'active' ? (autoRenew ? 'Продлится автоматически' : 'Продление вручную') : 'Ожидаем продления'} tone={sub.status === 'active' ? undefined : 'err'} />
        <Stat icon={<Repeat size={18} />} label="Автопродление" value={autoRenew ? 'Включено' : 'Выключено'} sub="Оплата через Gluon" tone={autoRenew ? 'ok' : 'warn'} />
      </div>

      {c.blocked && <BlockBanner client={c} />}
      {risk && !c.blocked && (
        <div className="bl-alert" style={{ marginTop: 0, background: 'var(--warning-soft)', borderColor: 'var(--warning-border)', color: 'var(--warning)' }}>
          <AlertTriangle size={18} /><span className="grow">{risk}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/merchant/chat')}>Написать</button>
        </div>
      )}

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '14px 18px' }}>
          <h3 className="medium">История подписки</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            downloadXlsx(`${svcId}-${c.id}-periods.xlsx`, 'История подписки', ['С', 'По', 'Срок', 'Дата оплаты', 'Статус'], periods.map((p) => [p.from, p.to, `${p.months} мес.`, p.paid ? p.paidOn : '—', p.kind === 'failed' ? 'Не оплачено' : p.late ? `С опозданием (${p.late} дн.)` : 'Оплачено']));
            toast('success', 'История подписки выгружена');
          }}><Download size={14} /> Экспорт в Excel</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Период</th><th>Срок</th><th>Дата оплаты</th><th>Статус</th></tr></thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.paid ? <>с {p.from} по {p.to}</> : <>с {p.from}</>}</td>
                  <td>{p.months} мес.</td>
                  <td>{p.paid ? p.paidOn : '—'}</td>
                  <td><RenewalStatus r={p} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, sub, tone }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: 'ok' | 'warn' | 'err' }) {
  return (
    <div className="cd-stat">
      <span className={clsx('cd-stat-ic', tone)}>{icon}</span>
      <div className="col" style={{ minWidth: 0 }}>
        <span className="t-sm muted">{label}</span>
        <b className="h5" style={{ color: tone === 'err' ? 'var(--error)' : undefined }}>{value}</b>
        <span className="t-xs muted">{sub}</span>
      </div>
    </div>
  );
}
