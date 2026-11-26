import { useState, type ReactNode } from 'react';
import { useBilling } from '../../lib/billing';
import { DEMO_CLIENT_ID, currentActor, useMerchant } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import { CardBrand } from '../user/ProfileModal';
import clsx from 'clsx';
import { ArrowDownLeft, ArrowUpRight, CreditCard, FileJson, HardDrive, Pencil, Repeat, Users, Wallet } from 'lucide-react';
import { Badge, Field, Input, Modal, Select, formatPhone, Pagination, usePaging } from '../../components/ui';
import { maskAccount } from '../../data/operations';
import { sum } from '../../lib/billing';
import { PAY_LABEL, fmtSum, useLedgers, type ProviderPayment } from '../../lib/ledger';
import type { Client } from '../../lib/merchant';
import { OpsTable, PlanMark, ResponseModal } from './AdminFinance';
import { Stat } from './AdminCompanies';
import './merchant/merchant.css';

type Tab = 'overview' | 'subs' | 'ops' | 'payments' | 'bank' | 'storage' | 'staff';

/** Admin company page: overview + everything the company did in Gluon. */
export function AdminCompanyTabs({ c, overview }: { c: Client; overview: ReactNode }) {
  const ledgers = useLedgers();
  const l = ledgers.find((x) => x.c.id === c.id)?.l;
  const [tab, setTab] = useState<Tab>('overview');
  const [resp, setResp] = useState<ProviderPayment | null>(null);
  const [editBal, setEditBal] = useState(false);
  const pe = usePaging();
  const pb = usePaging();
  const pa = usePaging();
  const pp = usePaging();
  const ps = usePaging();
  const po = usePaging();
  if (!l) return <>{overview}</>;
  const cur = l.subs.find((s) => s.status === 'active');
  const pctUsed = Math.round((l.storage.usedGb / l.storage.totalGb) * 100);
  const tabs: [Tab, string, number?][] = [
    ['overview', 'Обзор'], ['subs', 'Подписка', l.planPayments.length], ['ops', 'Операции', l.ops.length], ['payments', 'Платежи', l.payments.length],
    ['bank', 'Банковские операции', l.bankOps.length], ['storage', 'Хранилище'], ['staff', 'Сотрудники', l.employees.length],
  ];

  return (
    <>
      <div className="p-stats">
        <div className="p-stat">
          <span className="p-stat-ic" style={{ background: 'linear-gradient(135deg,#2f4d4d,#5b8a8a)' }}><Wallet size={22} /></span>
          <div className="grow"><p><b>{sum(l.balance)}</b></p><p className="t-sm muted">Баланс Gluon</p></div>
          <button className="icon-btn sm" onClick={() => setEditBal(true)} aria-label="Изменить баланс" title="Изменить баланс"><Pencil size={14} /></button>
        </div>
        <Stat icon={<Repeat size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={cur?.plan ?? '—'} label="Тариф" />
        <Stat icon={<HardDrive size={22} />} color="linear-gradient(135deg,#7a5af8,#a48afb)" value={`${l.storage.usedGb} / ${l.storage.totalGb} GB`} label="Хранилище" />
        <Stat icon={<Users size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={l.employees.length} label="Сотрудники" />
      </div>

      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        {tabs.map(([k, label, n]) => <button key={k} className={clsx(tab === k && 'active')} onClick={() => setTab(k)}>{label}{n !== undefined && <span className="op-tabcount"> {n}</span>}</button>)}
      </div>

      {tab === 'overview' && overview}

      {tab === 'subs' && cur && (
        <>
          <section className="card db-card">
            <div className="row between wrap gap-12">
              <div className="col gap-4">
                <span className="t-xs muted">Текущая подписка</span>
                <span className="row gap-8"><PlanMark name={`Тариф «${cur.plan}»`} /><Badge kind="success">Активна</Badge></span>
              </div>
              <div className="cs-facts">
                <div><span className="t-xs muted">Цена</span><b>{cur.price ? `${sum(cur.price)} / мес` : 'Бесплатно'}</b></div>
                <div><span className="t-xs muted">С</span><b>{cur.since}</b></div>
                <div><span className="t-xs muted">Оплачено до</span><b>{cur.paidUntil}</b></div>
                <div><span className="t-xs muted">Автопродление</span><b>{cur.price ? (cur.autoRenew ? 'Включено' : 'Выключено') : '—'}</b></div>
                <div><span className="t-xs muted">Всего оплачено</span><b>{sum(l.subs.reduce((a, x) => a + x.totalPaid, 0))}</b></div>
              </div>
            </div>
          </section>

          {l.subs.length > 1 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px' }}><h3 className="medium">История тарифов</h3></div>
              <div className="table-wrap">
                <table className="table">
                  <thead><tr><th>Тариф</th><th>Период</th><th>Цена</th><th>Оплачено</th><th>Статус</th></tr></thead>
                  <tbody>
                    {ps.slice(l.subs).map((x) => (
                      <tr key={x.id}>
                        <td><PlanMark name={x.plan} /></td>
                        <td>с {x.since}{x.status === 'replaced' ? ` по ${x.until}` : ''}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{x.price ? `${sum(x.price)} / мес` : 'Бесплатно'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{sum(x.totalPaid)}<span className="t-xs muted"> · {x.months} мес.</span></td>
                        <td>{x.status === 'active' ? <Badge kind="success">Текущий</Badge> : <Badge kind="neutral">Сменён</Badge>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination {...ps.bar(l.subs.length)} />
            </div>
          )}

          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px' }}><h3 className="medium">Оплаты тарифа</h3></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Дата оплаты</th><th>Тариф</th><th>Период</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
                <tbody>
                  {pp.slice(l.planPayments).map((p) => (
                    <tr key={p.id}>
                      <td>{p.date}</td>
                      <td><PlanMark name={p.plan} /></td>
                      <td>с {p.from} по {p.to}</td>
                      <td className="strong" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{sum(p.amount)}</td>
                    </tr>
                  ))}
                  {!l.planPayments.length && <tr><td colSpan={4}><div className="empty-state">Компания на бесплатном тарифе — оплат не было</div></td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination {...pp.bar(l.planPayments.length)} />
          </div>
        </>
      )}

      {tab === 'ops' && <OpsTable rows={po.slice(l.ops).map((o) => ({ c, o }))} hideCompany footer={<Pagination {...po.bar(l.ops.length)} />} />}

      {tab === 'payments' && (
        <section className="card db-card">
          <div className="row between wrap gap-8"><h3 className="medium">Привязанные карты</h3><span className="t-sm muted">Карты, которые компания сохранила для пополнения</span></div>
          <div className="cc-list">
            {l.cards.map((k) => (
              <div key={k.number} className="cc-item">
                <CardBrand brand={k.brand} />
                <span className="col grow"><span className="row gap-6"><b className="t-sm medium">{k.number}</b>{k.main && <Badge kind="primary">Основная</Badge>}</span><span className="t-xs muted">{k.name} · с {k.added}</span></span>
              </div>
            ))}
            {!l.cards.length && <span className="t-sm muted">Компания не сохраняла карты</span>}
          </div>
        </section>
      )}

      {tab === 'payments' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Транзакция</th><th>Дата</th><th>Способ</th><th>Сумма</th><th>Комиссия</th><th>Статус</th><th /></tr></thead>
              <tbody>
                {pa.slice(l.payments).map((p) => (
                  <tr key={p.id + p.status}>
                    <td className="mono-ish strong" style={{ color: 'var(--text)' }}>{p.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{p.date} <span className="muted t-xs">{p.time}</span></td>
                    <td><span className="row gap-6"><CreditCard size={14} color="var(--text-3)" />{p.method} <span className="muted">{p.card}</span></span></td>
                    <td className="strong" style={{ whiteSpace: 'nowrap' }}>{sum(p.amount)}</td>
                    <td className="muted">{p.status === 'success' ? sum(p.fee) : '—'}</td>
                    <td>{p.status === 'failed' ? <span className="col gap-2"><Badge kind="error">Ошибка</Badge><span className="t-xs muted">{p.error}</span></span> : <Badge kind={PAY_LABEL[p.status].kind}>{PAY_LABEL[p.status].label}</Badge>}</td>
                    <td style={{ textAlign: 'right' }}><button className="btn btn-ghost btn-sm" onClick={() => setResp(p)}><FileJson size={14} /> Ответ</button></td>
                  </tr>
                ))}
                {!l.payments.length && <tr><td colSpan={6}><div className="empty-state">Платежей нет</div></td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination {...pa.bar(l.payments.length)} />
        </div>
      )}

      <ResponseModal data={resp ? { p: resp, c } : null} onClose={() => setResp(null)} />
      <Modal open={editBal} onClose={() => setEditBal(false)} title={`Баланс · ${c.company}`} width={460}>
        {editBal && <BalanceForm c={c} balance={l.balance} onClose={() => setEditBal(false)} />}
      </Modal>

      {tab === 'bank' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Дата</th><th>Контрагент</th><th>Назначение платежа</th><th>Счёт</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
              <tbody>
                {pb.slice(l.bankOps).map((b) => (
                  <tr key={b.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.date}</td>
                    <td className="strong" style={{ color: 'var(--text)' }}>{b.counterparty}</td>
                    <td className="t-sm muted" style={{ maxWidth: 360 }}>{b.purpose}</td>
                    <td className="mono-ish t-sm" style={{ whiteSpace: 'nowrap' }}>{/^\d{20}$/.test(b.account) ? maskAccount(b.account) : b.account}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap', color: b.amount > 0 ? 'var(--success)' : 'var(--text)' }} className="strong">
                      <span className="row gap-4" style={{ justifyContent: 'flex-end' }}>{b.amount > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}{fmtSum(b.amount)}</span>
                    </td>
                  </tr>
                ))}
                {!l.bankOps.length && <tr><td colSpan={5}><div className="empty-state">Компания ещё не загружала банковские выписки</div></td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination {...pb.bar(l.bankOps.length)} />
        </div>
      )}

      {tab === 'storage' && (
        <section className="card db-card">
          <div className="row between wrap gap-8">
            <h3 className="medium">Gluon Архив</h3>
            <span className="t-sm muted">Занято {l.storage.usedGb} GB из {l.storage.totalGb} GB · {pctUsed}%</span>
          </div>
          <div className="ac-stack">
            {l.storage.parts.map((p) => <span key={p.name} style={{ width: `${(p.gb / l.storage.totalGb) * 100}%`, background: p.color }} title={`${p.name}: ${p.gb} GB`} />)}
          </div>
          <div className="ac-parts">
            {l.storage.parts.map((p) => (
              <div key={p.name} className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: p.color }} />{p.name}</span><b>{p.gb} GB</b></div>
            ))}
            <div className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }} />Свободно</span><b>{l.storage.totalGb - l.storage.usedGb} GB</b></div>
          </div>
          {pctUsed >= 80 && <p className="t-sm" style={{ color: 'var(--warning)', marginTop: 12 }}>Место заканчивается — компании предложат докупить объём.</p>}
        </section>
      )}

      {tab === 'staff' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Сотрудник</th><th>Роль</th><th>Телефон</th><th>Последний вход</th></tr></thead>
              <tbody>
                {pe.slice(l.employees).map((e) => (
                  <tr key={e.name + e.phone}>
                    <td><span className="row gap-10"><span className="avatar sm">{e.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><span className="strong" style={{ color: 'var(--text)' }}>{e.name}</span></span></td>
                    <td>{e.role === 'Владелец' ? <Badge kind="primary">Владелец</Badge> : <Badge kind="neutral">{e.role}</Badge>}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{/^\d{9}$/.test(e.phone) ? formatPhone(e.phone) : e.phone}</td>
                    <td>{e.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pe.bar(l.employees.length)} />
        </div>
      )}
    </>
  );
}

const REASONS = ['Компенсация', 'Возврат средств', 'Ошибка списания', 'Бонус', 'Перенос оплаты', 'Другое'];
const digits = (v: string) => v.replace(/\D/g, '');

/** Gluon admin changes a company's balance by hand; every change goes to «Операции» and the audit log. */
function BalanceForm({ c, balance, onClose }: { c: Client; balance: number; onClose: () => void }) {
  const { toast } = useApp();
  const m = useMerchant();
  const b = useBilling();
  const [mode, setMode] = useState<'add' | 'sub'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<{ amount?: string; note?: string }>({});
  const n = Number(digits(amount));
  const delta = mode === 'add' ? n : -n;
  const submit = () => {
    const e: typeof err = {};
    if (!n) e.amount = 'Введите сумму';
    else if (mode === 'sub' && n > balance) e.amount = `На балансе только ${sum(balance)}`;
    if (reason === 'Другое' && note.trim().length < 3) e.note = 'Опишите причину';
    setErr(e);
    if (Object.keys(e).length) return;
    const by = currentActor(m.teamOf('gluon', 'admin'));
    b.adjustBalance(c.id, delta, reason, note.trim() || undefined, by, c.id === DEMO_CLIENT_ID);
    m.log('gluon', 'admin', { section: 'companies', action: delta > 0 ? 'Начислил на баланс' : 'Списал с баланса', target: c.company, details: `${sum(balance)} → ${sum(balance + delta)} · ${reason}${note.trim() ? `: ${note.trim()}` : ''}` });
    toast('success', 'Баланс изменён');
    onClose();
  };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <div className="row between" style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)' }}><span className="t-sm muted">Сейчас на балансе</span><b>{sum(balance)}</b></div>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        <button className={mode === 'add' ? 'active' : ''} onClick={() => setMode('add')}>Начислить</button>
        <button className={mode === 'sub' ? 'active' : ''} onClick={() => setMode('sub')}>Списать</button>
      </div>
      <Field label="Сумма" error={err.amount}><Input inputMode="numeric" placeholder="0" value={n ? n.toLocaleString('ru-RU') : ''} onChange={(e) => { setAmount(e.target.value); setErr({ ...err, amount: undefined }); }} suffixBox="сум" error={!!err.amount} /></Field>
      <Field label="Причина"><Select value={reason} onChange={setReason} options={REASONS.map((r) => ({ value: r, label: r }))} /></Field>
      <Field label={reason === 'Другое' ? 'Комментарий' : 'Комментарий (необязательно)'} error={err.note}><Input value={note} onChange={(e) => { setNote(e.target.value); setErr({ ...err, note: undefined }); }} placeholder="Например: двойное списание 10.11" maxLength={120} error={!!err.note} /></Field>
      {!!n && <div className="row between t-sm"><span className="muted">Баланс после</span><b style={{ color: delta > 0 ? 'var(--success)' : 'var(--text)' }}>{sum(balance + delta)}</b></div>}
      <p className="t-xs muted">Изменение попадёт в «Операции» компании и в журнал действий.</p>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>{mode === 'add' ? 'Начислить' : 'Списать'}</button>
      </div>
    </div>
  );
}
