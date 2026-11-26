import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { CalendarClock, Check, CreditCard, Database, Plus, Sparkles, Wallet, AlertTriangle } from 'lucide-react';
import { Badge, BrandMark, Modal } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { gbLabel, sum, useBilling, type SubStatus } from '../../lib/billing';
import { useApp } from '../../lib/store';
import { useShell } from '../../layouts/UserLayout';
import './billing.css';

type Checkout = { kind: 'plan' | 'service'; id: string; title: string; price: number };
const STATUS: Record<SubStatus, { label: string; kind: 'success' | 'error' | 'info' }> = {
  active: { label: 'Активна', kind: 'success' },
  unpaid: { label: 'Не оплачено', kind: 'error' },
  trial: { label: 'Пробный период', kind: 'info' },
};

export default function Billing() {
  const b = useBilling();
  const nav = useNavigate();
  const { openTopUp } = useShell();
  const [yearly, setYearly] = useState(false);
  const [checkout, setCheckout] = useState<Checkout | null>(null);

  const plan = b.plans.find((p) => p.id === b.currentPlan) ?? b.plans[0];
  const subs = SERVICES.filter((s) => b.subs[s.id]);
  const monthly = (plan?.price ?? 0) + subs.filter((s) => b.subs[s.id].status !== 'unpaid').reduce((a, s) => a + (b.prices[s.id]?.price ?? 0), 0);
  const unpaid = subs.filter((s) => b.subs[s.id].status === 'unpaid');
  const usedPct = Math.min(100, Math.round((b.usedGb / (plan?.gb || 1)) * 100));

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between wrap gap-12">
          <div>
            <h1 className="h4">Подписки и тарифы</h1>
            <p className="muted t-sm">Тариф Gluon Архива и оплата подключённых сервисов — всё с баланса Gluon.</p>
          </div>
          <button className="btn btn-primary" onClick={openTopUp}><Plus size={16} /> Пополнить баланс</button>
        </div>
        <div className="bl-summary">
          <div className="bl-card">
            <span className="bl-ic" style={{ background: 'var(--secondary-soft)', color: 'var(--secondary)' }}><Wallet size={20} /></span>
            <div><p className="t-sm muted">Баланс</p><p className="h5">{sum(b.balance)}</p></div>
          </div>
          <div className="bl-card">
            <span className="bl-ic"><Database size={20} /></span>
            <div className="grow">
              <p className="t-sm muted">Тариф «{plan?.name}»</p>
              <p className="h5">{b.usedGb} GB <span className="muted t-sm">из {gbLabel(plan?.gb ?? 0)}</span></p>
              <div className="progress mt-8"><span style={{ width: `${usedPct}%`, background: usedPct > 80 ? 'var(--error)' : 'var(--primary)' }} /></div>
            </div>
          </div>
          <div className="bl-card">
            <span className="bl-ic" style={{ background: 'var(--info-soft)', color: 'var(--info)' }}><CreditCard size={20} /></span>
            <div><p className="t-sm muted">Ежемесячные платежи</p><p className="h5">{sum(monthly)}</p></div>
          </div>
          <div className="bl-card">
            <span className="bl-ic" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><CalendarClock size={20} /></span>
            <div><p className="t-sm muted">Ближайшее списание</p><p className="h5">10.12.2026</p></div>
          </div>
        </div>
        {!!unpaid.length && (
          <div className="bl-alert">
            <AlertTriangle size={18} />
            <span className="grow">Не оплачено: <b>{unpaid.map((s) => s.name).join(', ')}</b>. Сервис может быть приостановлен.</span>
            <button className="btn btn-danger btn-sm" onClick={() => setCheckout({ kind: 'service', id: unpaid[0].id, title: `Подписка ${unpaid[0].name}`, price: b.prices[unpaid[0].id]?.price ?? 0 })}>Оплатить</button>
          </div>
        )}
      </section>

      <section className="section">
        <div className="row between wrap gap-12">
          <div>
            <h2 className="h5">Тарифы Gluon Архива</h2>
            <p className="t-sm muted">Объём хранилища для данных подключённых сервисов. Когда лимит заканчивается — перейдите на тариф выше.</p>
          </div>
          <div className="tabs-seg">
            <button className={clsx(!yearly && 'active')} onClick={() => setYearly(false)}>Ежемесячно</button>
            <button className={clsx(yearly && 'active')} onClick={() => setYearly(true)}>Ежегодно <span className="badge badge-success" style={{ marginLeft: 4 }}>−2 мес.</span></button>
          </div>
        </div>
        <div className="bl-plans">
          {b.plans.filter((p) => p.active).map((p) => {
            const current = p.id === b.currentPlan;
            const price = yearly ? p.price * 10 : p.price;
            return (
              <div key={p.id} className={clsx('bl-plan', p.popular && 'popular', current && 'current')}>
                {p.popular && <span className="bl-popular"><Sparkles size={12} /> Популярный</span>}
                <p className="medium" style={{ fontSize: 16 }}>{p.name}</p>
                <p className="bl-gb">{gbLabel(p.gb)}</p>
                <p className="bl-price">{p.price ? <>{price.toLocaleString('ru-RU')} <span>сум / {yearly ? 'год' : 'мес'}</span></> : 'Бесплатно'}</p>
                <ul className="bl-feat">{p.features.map((f) => <li key={f}><Check size={14} /> {f}</li>)}</ul>
                {current ? (
                  <button className="btn btn-secondary btn-block" disabled>Текущий тариф</button>
                ) : (
                  <button className={clsx('btn btn-block', p.popular ? 'btn-primary' : 'btn-soft')}
                    onClick={() => setCheckout({ kind: 'plan', id: p.id, title: `Тариф «${p.name}» · ${gbLabel(p.gb)}`, price: p.price })}>
                    {p.gb > (plan?.gb ?? 0) ? 'Перейти на тариф' : 'Выбрать'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="section" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between wrap gap-12" style={{ padding: '18px 20px' }}>
          <div>
            <h2 className="h5">Подписки на сервисы</h2>
            <p className="t-sm muted">Оплачивайте подключённые сервисы через Gluon — одним платежом с баланса.</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/app/store')}><Plus size={14} /> Подключить сервис</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Сервис</th><th>Стоимость</th><th>Статус</th><th>Оплачено до</th><th>Автопродление</th><th /></tr></thead>
            <tbody>
              {subs.map((s) => {
                const sub = b.subs[s.id];
                const price = b.prices[s.id];
                return (
                  <tr key={s.id}>
                    <td><span className="row gap-12"><BrandMark name={s.name} color={s.color} text={s.mark} size={32} /><span className="col"><b className="medium" style={{ color: 'var(--text)' }}>{s.name}</b><span className="t-xs muted">{s.type}</span></span></span></td>
                    <td className="strong">{price ? `${sum(price.price)} / мес` : '—'}</td>
                    <td><Badge kind={STATUS[sub.status].kind}>{STATUS[sub.status].label}</Badge></td>
                    <td>{sub.paidUntil}</td>
                    <td>
                      <label className="switch">
                        <input type="checkbox" checked={sub.autoRenew} onChange={(e) => b.setAutoRenew(s.id, e.target.checked)} />
                        <span />
                      </label>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {price?.active === false ? <span className="t-sm muted">Оплата недоступна</span> : (
                        <button className={clsx('btn btn-sm', sub.status === 'unpaid' ? 'btn-primary' : 'btn-soft')}
                          onClick={() => setCheckout({ kind: 'service', id: s.id, title: `Подписка ${s.name}`, price: price?.price ?? 0 })}>
                          {sub.status === 'unpaid' ? 'Оплатить' : 'Продлить'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section" style={{ padding: 0, overflow: 'hidden' }}>
        <h2 className="h5" style={{ padding: '18px 20px' }}>История платежей</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Дата</th><th>Описание</th><th>Тип</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
            <tbody>
              {b.payments.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td>{p.date}</td>
                  <td className="strong">{p.title}</td>
                  <td><Badge kind={p.kind === 'topup' ? 'success' : p.kind === 'plan' ? 'primary' : p.kind === 'adjust' ? 'warning' : 'neutral'}>{{ topup: 'Пополнение', plan: 'Тариф', service: 'Сервис', storage: 'Архив', adjust: 'Корректировка' }[p.kind]}</Badge></td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: p.amount > 0 ? 'var(--success)' : 'var(--text)' }}>{p.amount > 0 ? '+ ' : '− '}{sum(Math.abs(p.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <CheckoutModal checkout={checkout} yearly={yearly} onClose={() => setCheckout(null)} />
    </div>
  );
}

/** Confirm a payment from the Gluon balance (used by plans, service subscriptions and the store). */
export function CheckoutModal({ checkout, yearly = false, onClose, onPaid }: { checkout: Checkout | null; yearly?: boolean; onClose: () => void; onPaid?: () => void }) {
  const b = useBilling();
  const { toast } = useApp();
  const { openTopUp } = useShell();
  const [months, setMonths] = useState(1);
  const m = checkout?.kind === 'plan' && yearly ? 12 : months;
  const total = checkout ? (checkout.kind === 'plan' && yearly ? checkout.price * 10 : checkout.price * m) : 0;
  const enough = b.balance >= total;

  const confirm = () => {
    if (!checkout) return;
    const r = checkout.kind === 'plan' ? b.buyPlan(checkout.id, m) : b.payService(checkout.id, m);
    if (r === 'insufficient') { toast('error', 'Недостаточно средств на балансе'); return; }
    toast('success', checkout.kind === 'plan' ? 'Тариф подключён' : 'Подписка оплачена');
    onPaid?.();
    onClose();
    setMonths(1);
  };

  return (
    <Modal open={!!checkout} onClose={onClose} title="Оплата с баланса Gluon" width={460}>
      {checkout && (
        <div className="col gap-16" style={{ padding: 24 }}>
          <div className="bl-line"><span className="muted">Покупка</span><b>{checkout.title}</b></div>
          {!(checkout.kind === 'plan' && yearly) && checkout.price > 0 && (
            <div className="field">
              <span className="label">Период</span>
              <div className="tabs-seg block">
                {[1, 3, 6, 12].map((n) => <button key={n} className={clsx(months === n && 'active')} onClick={() => setMonths(n)}>{n} мес.</button>)}
              </div>
            </div>
          )}
          <div className="bl-total">
            <div className="bl-line"><span className="muted">Цена</span><span>{checkout.price ? `${sum(checkout.price)} / мес` : 'Бесплатно'}</span></div>
            <div className="bl-line"><span className="muted">Баланс</span><span>{sum(b.balance)}</span></div>
            <div className="bl-line big"><span>Итого к оплате</span><b>{sum(total)}</b></div>
          </div>
          {!enough && (
            <div className="bl-alert" style={{ margin: 0 }}>
              <AlertTriangle size={18} /><span className="grow">Не хватает {sum(total - b.balance)}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => { onClose(); openTopUp(); }}>Пополнить</button>
            </div>
          )}
          <div className="row gap-12">
            <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary grow" disabled={!enough} onClick={confirm}>Оплатить {sum(total)}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
