import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AlertCircle, ArrowDownLeft, Check, Copy, FileJson, ArrowUpRight, Blocks, CreditCard, Download, Layers, Percent, Receipt, Repeat, Search, Wallet } from 'lucide-react';
import { Badge, Modal, Pagination, Select } from '../../components/ui';
import { parseDate } from '../../lib/merchant';
import { sum } from '../../lib/billing';
import { useApp } from '../../lib/store';
import { downloadXlsx } from '../../lib/excel';
import { OP_LABEL, PAY_LABEL, fmtSum, providerResponse, useLedgers, type OpKind, type PayStatus, type ProviderPayment } from '../../lib/ledger';
import { PeriodFilter, inRange, rangeOf, type Period } from './merchant/period';
import { Stat } from './AdminCompanies';
import './merchant/merchant.css';

const PER = 15;
export const PlanMark = ({ name }: { name: string }) => <span className="row gap-8"><span className="af-plan"><Layers size={13} /></span><span>{name}</span></span>;
const Company = ({ name, sub }: { name: string; sub?: string }) => (
  <span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{name}</span>{sub && <span className="t-xs muted">{sub}</span>}</span>
);
const Search_ = ({ q, setQ, placeholder }: { q: string; setQ: (v: string) => void; placeholder: string }) => (
  <label className="u-search" style={{ display: 'flex', width: 260 }}><Search size={16} /><input placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} /></label>
);

/* ---------------- Подписки (тарифы Gluon) ---------------- */
export function AdminSubscriptions() {
  const { toast } = useApp();
  const nav = useNavigate();
  const ledgers = useLedgers();
  const [tab, setTab] = useState<'current' | 'history'>('current');
  const [plan, setPlan] = useState('all');
  const [period, setPeriod] = useState<Period>({ key: 'all' });
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const reset = () => setPage(1);
  const current = useMemo(() => ledgers.map(({ c, l }) => ({ c, s: l.subs.find((x) => x.status === 'active'), l })).filter((x) => !!x.s) as { c: (typeof ledgers)[number]['c']; s: import('../../lib/ledger').Subscription; l: (typeof ledgers)[number]['l'] }[], [ledgers]);
  const history = useMemo(() => ledgers.flatMap(({ c, l }) => l.planPayments.map((p) => ({ c, p }))).sort((a, b) => parseDate(b.p.date).getTime() - parseDate(a.p.date).getTime()), [ledgers]);
  const plans = [...new Map(current.map(({ s }) => [s.planId, s.plan])).entries()];
  const r = rangeOf(period);
  const curRows = current.filter(({ c, s }) => (plan === 'all' || s.planId === plan) && c.company.toLowerCase().includes(q.toLowerCase()));
  const histRows = history.filter(({ c, p }) => (plan === 'all' || p.planId === plan) && inRange(parseDate(p.date), r) && c.company.toLowerCase().includes(q.toLowerCase()));
  const paid = current.filter(({ s }) => s.price > 0);
  const total = Math.ceil((tab === 'current' ? curRows.length : histRows.length) / PER);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Подписки</h1>
        <div className="row gap-12 wrap">
          {tab === 'history' && <PeriodFilter value={period} onChange={(p) => { setPeriod(p); reset(); }} />}
          <button className="btn btn-secondary" onClick={() => {
            if (tab === 'current') downloadXlsx('gluon-subscriptions.xlsx', 'Подписки', ['Компания', 'ИНН', 'Тариф', 'С', 'Оплачено до', 'Цена / мес', 'Оплачено мес.', 'Всего оплачено', 'Автопродление'],
              curRows.map(({ c, s }) => [c.company, c.inn, s.plan, s.since, s.paidUntil, s.price, s.months, s.totalPaid, s.price ? (s.autoRenew ? 'Да' : 'Нет') : '—']));
            else downloadXlsx('gluon-subscription-payments.xlsx', 'Оплаты тарифов', ['Дата', 'Компания', 'ИНН', 'Тариф', 'Период с', 'Период по', 'Сумма'],
              histRows.map(({ c, p }) => [p.date, c.company, c.inn, p.plan, p.from, p.to, p.amount]));
            toast('success', 'Выгружено в Excel');
          }}><Download size={16} /> Экспорт в Excel</button>
        </div>
      </div>
      <div className="p-stats">
        <Stat icon={<Repeat size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={paid.length} label="Платные подписки" />
        <Stat icon={<Layers size={22} />} color="linear-gradient(135deg,#7a5af8,#a48afb)" value={current.length - paid.length} label="На бесплатном тарифе" />
        <Stat icon={<Wallet size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={sum(paid.reduce((a, { s }) => a + s.price, 0))} label="В месяц" />
        <Stat icon={<Receipt size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={current.filter(({ l }) => l.subs.length > 1).length} label="Меняли тариф" />
      </div>
      <div className="mc-filters">
        <div className="tabs-seg">
          <button className={clsx(tab === 'current' && 'active')} onClick={() => { setTab('current'); reset(); }}>Текущие <span className="op-tabcount">{current.length}</span></button>
          <button className={clsx(tab === 'history' && 'active')} onClick={() => { setTab('history'); reset(); }}>История оплат <span className="op-tabcount">{history.length}</span></button>
        </div>
        <Search_ q={q} setQ={(v) => { setQ(v); reset(); }} placeholder="Компания" />
        <div style={{ width: 200 }}><Select value={plan} onChange={(v) => { setPlan(v); reset(); }} options={[{ value: 'all', label: 'Все тарифы' }, ...plans.map(([id, name]) => ({ value: id, label: name }))]} /></div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          {tab === 'current' ? (
            <table className="table">
              <thead><tr><th>Компания</th><th>Тариф</th><th>С</th><th>Оплачено до</th><th>Цена</th><th>Всего оплачено</th><th>Автопродление</th></tr></thead>
              <tbody>
                {curRows.slice((page - 1) * PER, page * PER).map(({ c, s, l }) => (
                  <tr key={c.id} className="clickable" onClick={() => nav(`/admin/companies/${c.id}`)}>
                    <td><Company name={c.company} sub={c.owner} /></td>
                    <td><span className="col"><PlanMark name={s.plan} />{l.subs.length > 1 && <span className="t-xs muted">до этого: {l.subs.slice(1).map((x) => x.plan).join(', ')}</span>}</span></td>
                    <td>{s.since}</td>
                    <td>{s.paidUntil}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.price ? `${sum(s.price)} / мес` : 'Бесплатно'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{sum(l.subs.reduce((a, x) => a + x.totalPaid, 0))}</td>
                    <td>{s.price ? (s.autoRenew ? 'Включено' : <span style={{ color: 'var(--warning)' }}>Выключено</span>) : '—'}</td>
                  </tr>
                ))}
                {!curRows.length && <tr><td colSpan={7}><div className="empty-state">Подписок нет</div></td></tr>}
              </tbody>
            </table>
          ) : (
            <table className="table">
              <thead><tr><th>Дата оплаты</th><th>Компания</th><th>Тариф</th><th>Период</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
              <tbody>
                {histRows.slice((page - 1) * PER, page * PER).map(({ c, p }) => (
                  <tr key={p.id} className="clickable" onClick={() => nav(`/admin/companies/${c.id}`)}>
                    <td>{p.date}</td>
                    <td><Company name={c.company} sub={c.owner} /></td>
                    <td><PlanMark name={p.plan} /></td>
                    <td>с {p.from} по {p.to}</td>
                    <td className="strong" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{sum(p.amount)}</td>
                  </tr>
                ))}
                {!histRows.length && <tr><td colSpan={5}><div className="empty-state">Оплат нет</div></td></tr>}
              </tbody>
            </table>
          )}
        </div>
        {total > 1 && <Pagination page={page} total={total} onPage={setPage} />}
      </div>
    </div>
  );
}

/* ---------------- Платежи (провайдер) ---------------- */
/** Raw JSON the payment provider returned for a transaction. */
export function ResponseModal({ data, onClose }: { data: { p: ProviderPayment; c: { company: string; inn: string } } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const json = data ? JSON.stringify(providerResponse(data.p, data.c), null, 2) : '';
  return (
    <Modal open={!!data} onClose={onClose} title={data ? `Ответ провайдера · ${data.p.id}` : ''} width={620}>
      {data && (
        <div className="col gap-12" style={{ padding: 24 }}>
          <div className="row between t-sm">
            <span className="row gap-8"><Badge kind={PAY_LABEL[data.p.status].kind}>{PAY_LABEL[data.p.status].label}</Badge><span className="muted">Plum · {data.p.date} {data.p.time}</span></span>
            <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard?.writeText(json).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Скопировано' : 'Копировать'}</button>
          </div>
          <pre className="af-json">{json}</pre>
        </div>
      )}
    </Modal>
  );
}

export function AdminPayments() {
  const { toast } = useApp();
  const nav = useNavigate();
  const ledgers = useLedgers();
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const [status, setStatus] = useState<'all' | PayStatus>('all');
  const [method, setMethod] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [resp, setResp] = useState<{ p: ProviderPayment; c: { company: string; inn: string } } | null>(null);
  const r = rangeOf(period);
  const all = useMemo(() => ledgers.flatMap(({ c, l }) => l.payments.map((p) => ({ c, p }))).sort((a, b) => parseDate(b.p.date).getTime() - parseDate(a.p.date).getTime() || b.p.time.localeCompare(a.p.time)), [ledgers]);
  const inP = all.filter(({ c, p }) => inRange(parseDate(p.date), r) && (method === 'all' || p.method === method) && (c.company + p.id).toLowerCase().includes(q.toLowerCase()));
  const rows = inP.filter(({ p }) => status === 'all' || p.status === status);
  const view = rows.slice((page - 1) * PER, page * PER);
  const ok = inP.filter(({ p }) => p.status === 'success');
  const reset = () => setPage(1);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Платежи</h1><p className="t-sm muted">Транзакции через платёжного провайдера (Plum)</p></div>
        <div className="row gap-12 wrap">
          <PeriodFilter value={period} onChange={(p) => { setPeriod(p); reset(); }} />
          <button className="btn btn-secondary" onClick={() => {
            downloadXlsx('gluon-payments.xlsx', 'Платежи', ['ID транзакции', 'Дата', 'Время', 'Компания', 'ИНН', 'Способ', 'Карта', 'Сумма', 'Комиссия', 'Статус', 'Ошибка'],
              rows.map(({ c, p }) => [p.id, p.date, p.time, c.company, c.inn, p.method, p.card, p.amount, p.fee, PAY_LABEL[p.status].label, p.error ?? '']));
            toast('success', `Выгружено платежей: ${rows.length}`);
          }}><Download size={16} /> Экспорт в Excel</button>
        </div>
      </div>
      <div className="p-stats">
        <Stat icon={<Wallet size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={sum(ok.reduce((a, { p }) => a + p.amount, 0))} label="Получено" />
        <Stat icon={<Receipt size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={inP.length} label="Транзакций" />
        <Stat icon={<Percent size={22} />} color="linear-gradient(135deg,#b54708,#f79009)" value={sum(ok.reduce((a, { p }) => a + p.fee, 0))} label="Комиссия провайдера" />
        <Stat icon={<AlertCircle size={22} />} color="linear-gradient(135deg,#d92d20,#f97066)" value={inP.filter(({ p }) => p.status === 'failed').length} label="С ошибкой" />
      </div>
      <div className="mc-filters">
        <Search_ q={q} setQ={(v) => { setQ(v); reset(); }} placeholder="Компания или ID транзакции" />
        <div className="tabs-seg">
          {(['all', 'success', 'failed', 'refunded'] as const).map((k) => (
            <button key={k} className={clsx(status === k && 'active')} onClick={() => { setStatus(k); reset(); }}>
              {k === 'all' ? 'Все' : PAY_LABEL[k].label} <span className="op-tabcount">{k === 'all' ? inP.length : inP.filter(({ p }) => p.status === k).length}</span>
            </button>
          ))}
        </div>
        <div style={{ width: 180 }}><Select value={method} onChange={(v) => { setMethod(v); reset(); }} options={[{ value: 'all', label: 'Все способы' }, ...['Uzcard', 'Humo', 'Visa', 'Mastercard'].map((m) => ({ value: m, label: m }))]} /></div>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Транзакция</th><th>Компания</th><th>Способ</th><th>Сумма</th><th>Комиссия</th><th>Статус</th><th /></tr></thead>
            <tbody>
              {view.map(({ c, p }) => (
                <tr key={p.id + p.status} className="clickable" onClick={() => nav(`/admin/companies/${c.id}`)}>
                  <td><span className="col"><span className="mono-ish strong" style={{ color: 'var(--text)' }}>{p.id}</span><span className="t-xs muted">{p.date} {p.time}</span></span></td>
                  <td><Company name={c.company} sub={`ИНН ${c.inn}`} /></td>
                  <td><span className="row gap-6"><CreditCard size={14} color="var(--text-3)" />{p.method} <span className="muted">{p.card}</span></span></td>
                  <td className="strong" style={{ whiteSpace: 'nowrap' }}>{sum(p.amount)}</td>
                  <td className="muted" style={{ whiteSpace: 'nowrap' }}>{p.status === 'success' ? sum(p.fee) : '—'}</td>
                  <td>{p.status === 'failed' ? <span className="col gap-2"><Badge kind="error">Ошибка</Badge><span className="t-xs muted">{p.error}</span></span> : <Badge kind={PAY_LABEL[p.status].kind}>{PAY_LABEL[p.status].label}</Badge>}</td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setResp({ p, c }); }}><FileJson size={14} /> Ответ</button></td>
                </tr>
              ))}
              {!view.length && <tr><td colSpan={7}><div className="empty-state">Платежей за этот период нет</div></td></tr>}
            </tbody>
          </table>
        </div>
        {rows.length > PER && <Pagination page={page} total={Math.ceil(rows.length / PER)} onPage={setPage} />}
      </div>
      <ResponseModal data={resp} onClose={() => setResp(null)} />
    </div>
  );
}

/* ---------------- Операции (баланс Gluon) ---------------- */
export const OP_KIND_BADGE: Record<OpKind, 'success' | 'info' | 'primary' | 'warning' | 'neutral'> = { topup: 'success', service: 'info', plan: 'primary', storage: 'warning', refund: 'neutral' };

export function AdminOperations() {
  const { toast } = useApp();
  const nav = useNavigate();
  const ledgers = useLedgers();
  const [period, setPeriod] = useState<Period>({ key: 'month' });
  const [kind, setKind] = useState<'all' | OpKind>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const r = rangeOf(period);
  const all = useMemo(() => ledgers.flatMap(({ c, l }) => l.ops.map((o) => ({ c, o }))).sort((a, b) => parseDate(b.o.date).getTime() - parseDate(a.o.date).getTime() || b.o.time.localeCompare(a.o.time)), [ledgers]);
  const inP = all.filter(({ c, o }) => inRange(parseDate(o.date), r) && (c.company + o.title).toLowerCase().includes(q.toLowerCase()));
  const rows = inP.filter(({ o }) => kind === 'all' || o.kind === kind);
  const view = rows.slice((page - 1) * PER, page * PER);
  const total = (k: OpKind) => inP.filter(({ o }) => o.kind === k).reduce((a, { o }) => a + Math.abs(o.amount), 0);
  const reset = () => setPage(1);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Операции</h1><p className="t-sm muted">Движение по балансам компаний в Gluon</p></div>
        <div className="row gap-12 wrap">
          <PeriodFilter value={period} onChange={(p) => { setPeriod(p); reset(); }} />
          <button className="btn btn-secondary" onClick={() => {
            downloadXlsx('gluon-operations.xlsx', 'Операции', ['Дата', 'Время', 'Компания', 'ИНН', 'Операция', 'Тип', 'Сумма', 'Баланс после'],
              rows.map(({ c, o }) => [o.date, o.time, c.company, c.inn, o.title, OP_LABEL[o.kind], o.amount, o.balance]));
            toast('success', `Выгружено операций: ${rows.length}`);
          }}><Download size={16} /> Экспорт в Excel</button>
        </div>
      </div>
      <div className="p-stats">
        <Stat icon={<ArrowDownLeft size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={sum(total('topup'))} label="Пополнения" />
        <Stat icon={<Blocks size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={sum(total('service'))} label="Оплата сервисов" />
        <Stat icon={<Layers size={22} />} color="linear-gradient(135deg,#7a5af8,#a48afb)" value={sum(total('plan') + total('storage'))} label="Тарифы и архив" />
        <Stat icon={<Wallet size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={sum(ledgers.reduce((a, { l }) => a + l.balance, 0))} label="На балансах сейчас" />
      </div>
      <div className="mc-filters">
        <Search_ q={q} setQ={(v) => { setQ(v); reset(); }} placeholder="Компания или операция" />
        <div className="tabs-seg">
          {(['all', 'topup', 'service', 'plan', 'storage'] as const).map((k) => (
            <button key={k} className={clsx(kind === k && 'active')} onClick={() => { setKind(k); reset(); }}>
              {k === 'all' ? 'Все' : OP_LABEL[k]} <span className="op-tabcount">{k === 'all' ? inP.length : inP.filter(({ o }) => o.kind === k).length}</span>
            </button>
          ))}
        </div>
      </div>
      <OpsTable rows={view} onOpen={(id) => nav(`/admin/companies/${id}`)} />
      {rows.length > PER && <div className="card"><Pagination page={page} total={Math.ceil(rows.length / PER)} onPage={setPage} /></div>}
    </div>
  );
}

export function OpsTable({ rows, onOpen, hideCompany }: { rows: { c: { id: string; company: string; owner: string }; o: import('../../lib/ledger').LedgerOp }[]; onOpen?: (id: string) => void; hideCompany?: boolean }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Дата</th>{!hideCompany && <th>Компания</th>}<th>Операция</th><th>Тип</th><th style={{ textAlign: 'right' }}>Сумма</th><th style={{ textAlign: 'right' }}>Баланс после</th></tr></thead>
          <tbody>
            {rows.map(({ c, o }) => (
              <tr key={o.id} className={onOpen ? 'clickable' : undefined} onClick={() => onOpen?.(c.id)}>
                <td style={{ whiteSpace: 'nowrap' }}>{o.date} <span className="muted t-xs">{o.time}</span></td>
                {!hideCompany && <td><Company name={c.company} sub={c.owner} /></td>}
                <td><span className="row gap-8">{o.amount > 0 ? <ArrowDownLeft size={15} color="var(--success)" /> : <ArrowUpRight size={15} color="var(--text-3)" />}{o.title}</span></td>
                <td><Badge kind={OP_KIND_BADGE[o.kind]}>{OP_LABEL[o.kind]}</Badge></td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: o.amount > 0 ? 'var(--success)' : 'var(--text)' }} className="strong">{fmtSum(o.amount)}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }} className="muted">{sum(o.balance)}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6}><div className="empty-state">Операций нет</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
