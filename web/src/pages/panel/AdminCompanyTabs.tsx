import { useState, type ReactNode } from 'react';
import clsx from 'clsx';
import { ArrowDownLeft, ArrowUpRight, CreditCard, FileJson, HardDrive, Repeat, Users, Wallet } from 'lucide-react';
import { Badge, formatPhone } from '../../components/ui';
import { maskAccount } from '../../data/operations';
import { sum } from '../../lib/billing';
import { PAY_LABEL, fmtSum, useLedgers, type ProviderPayment } from '../../lib/ledger';
import type { Client } from '../../lib/merchant';
import { ItemMark, OpsTable, ResponseModal } from './AdminFinance';
import { Stat } from './AdminCompanies';
import './merchant/merchant.css';

type Tab = 'overview' | 'subs' | 'ops' | 'payments' | 'bank' | 'storage' | 'staff';

/** Admin company page: overview + everything the company did in Gluon. */
export function AdminCompanyTabs({ c, overview }: { c: Client; overview: ReactNode }) {
  const ledgers = useLedgers();
  const l = ledgers.find((x) => x.c.id === c.id)?.l;
  const [tab, setTab] = useState<Tab>('overview');
  const [resp, setResp] = useState<ProviderPayment | null>(null);
  if (!l) return <>{overview}</>;
  const activeSubs = l.subs.filter((s) => s.status === 'active' && (s.kind === 'service' || s.price > 0));
  const pctUsed = Math.round((l.storage.usedGb / l.storage.totalGb) * 100);
  const tabs: [Tab, string, number?][] = [
    ['overview', 'Обзор'], ['subs', 'Подписки', l.subs.length], ['ops', 'Операции', l.ops.length], ['payments', 'Платежи', l.payments.length],
    ['bank', 'Банковские операции', l.bankOps.length], ['storage', 'Хранилище'], ['staff', 'Сотрудники', l.employees.length],
  ];

  return (
    <>
      <div className="p-stats">
        <Stat icon={<Wallet size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={sum(l.balance)} label="Баланс Gluon" />
        <Stat icon={<Repeat size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={activeSubs.length} label="Активные подписки" />
        <Stat icon={<HardDrive size={22} />} color="linear-gradient(135deg,#7a5af8,#a48afb)" value={`${l.storage.usedGb} / ${l.storage.totalGb} GB`} label="Хранилище" />
        <Stat icon={<Users size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={l.employees.length} label="Сотрудники" />
      </div>

      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        {tabs.map(([k, label, n]) => <button key={k} className={clsx(tab === k && 'active')} onClick={() => setTab(k)}>{label}{n !== undefined && <span className="op-tabcount"> {n}</span>}</button>)}
      </div>

      {tab === 'overview' && overview}

      {tab === 'subs' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Подписка</th><th>С</th><th>Оплачено до</th><th>Цена</th><th>Всего оплачено</th><th>Автопродление</th><th>Статус</th></tr></thead>
              <tbody>
                {l.subs.map((s) => (
                  <tr key={s.id}>
                    <td><ItemMark kind={s.kind} id={s.itemId} name={s.item} /></td>
                    <td>{s.since}</td>
                    <td>{s.paidUntil}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{s.price ? `${sum(s.price)} / мес` : 'Бесплатно'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{sum(s.totalPaid)}<span className="t-xs muted"> · {s.months} мес.</span></td>
                    <td>{s.price ? (s.autoRenew ? 'Включено' : 'Выключено') : '—'}</td>
                    <td>{s.status === 'active' ? <Badge kind="success">Активна</Badge> : <Badge kind="error">Не продлена</Badge>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'ops' && <OpsTable rows={l.ops.map((o) => ({ c, o }))} hideCompany />}

      {tab === 'payments' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Транзакция</th><th>Дата</th><th>Способ</th><th>Сумма</th><th>Комиссия</th><th>Статус</th><th /></tr></thead>
              <tbody>
                {l.payments.map((p) => (
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
        </div>
      )}

      <ResponseModal data={resp ? { p: resp, c } : null} onClose={() => setResp(null)} />

      {tab === 'bank' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Дата</th><th>Контрагент</th><th>Назначение платежа</th><th>Счёт</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
              <tbody>
                {l.bankOps.map((b) => (
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
                {l.employees.map((e) => (
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
        </div>
      )}
    </>
  );
}
