import { useState } from 'react';
import clsx from 'clsx';
import { BadgeCheck, Globe, Pencil } from 'lucide-react';
import { BankLogo, Badge, Field, Input, Modal, Select, formatPhone } from '../../components/ui';
import { BANKS } from '../../data/mock';
import { ACC_LABEL, useMerchant, type AccStatus, type BankOffer } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import '../user/banking.css';
import './merchant/merchant.css';

const PRODUCTS = ['Расчётный счёт', 'Кредит', 'Рассрочка', 'Бизнес-карта', 'Эквайринг'];
const bankOf = (id: string) => BANKS.find((b) => b.id === id)!;

/** Gluon admin: bank cards in «Предложения банков». */
export default function AdminBanks() {
  const { toast } = useApp();
  const m = useMerchant();
  const [edit, setEdit] = useState<string | null>(null);
  return (
    <div className="col gap-16">
      <h1 className="h4">Банки</h1>
      <div className="bk-grid">
        {Object.entries(m.bankOffers).map(([id, t]) => (
          <div key={id} className="col gap-8">
            <OfferCard id={id} t={t} />
            <button className="btn btn-secondary btn-sm" onClick={() => setEdit(id)}><Pencil size={14} /> Изменить</button>
          </div>
        ))}
      </div>
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Предложение: ${bankOf(edit)?.name}` : ''} width={820}>
        {edit && <OfferForm id={edit} offer={m.bankOffers[edit]} onClose={() => setEdit(null)} onSave={(o) => { m.setBankOffer(edit, o); toast('success', 'Предложение обновлено'); setEdit(null); }} />}
      </Modal>
    </div>
  );
}

/** Gluon admin: users' requests to open an account («Предложения банков» → «Открыть счёт»). */
export function AdminAccountRequests() {
  const { toast } = useApp();
  const m = useMerchant();
  const [status, setStatus] = useState<'all' | AccStatus>('all');
  const reqs = m.accountRequests.filter((r) => status === 'all' || r.status === status);
  return (
    <div className="col gap-16">
      <h1 className="h4">Заявки на счёт</h1>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        {(['all', ...Object.keys(ACC_LABEL)] as ('all' | AccStatus)[]).map((k) => (
          <button key={k} className={clsx(status === k && 'active')} onClick={() => setStatus(k)}>
            {k === 'all' ? 'Все' : ACC_LABEL[k].label} <span className="op-tabcount">{k === 'all' ? m.accountRequests.length : m.accountRequests.filter((r) => r.status === k).length}</span>
          </button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>Контакт</th><th>Банк</th><th>Продукт</th><th>Дата</th><th>Статус</th></tr></thead>
            <tbody>
              {reqs.map((r) => {
                const c = m.clients.find((x) => x.id === r.clientId);
                return (
                  <tr key={r.id}>
                    <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{c?.company ?? '—'}</span><span className="t-xs muted">ИНН {c?.inn}</span></span></td>
                    <td><span className="col"><span>{r.contact}</span><span className="t-xs muted">{formatPhone(r.phone)}</span></span></td>
                    <td><BankLogo id={r.bank} name={bankOf(r.bank)?.name ?? r.bank} height={16} /></td>
                    <td>{r.product}</td>
                    <td>{r.date}</td>
                    <td style={{ width: 190 }}>
                      <Select value={r.status} onChange={(v) => { m.setAccountStatus(r.id, v as AccStatus); toast('success', `Статус: ${ACC_LABEL[v as AccStatus].label}`); }}
                        options={(Object.keys(ACC_LABEL) as AccStatus[]).map((x) => ({ value: x, label: <Badge kind={ACC_LABEL[x].kind}>{ACC_LABEL[x].label}</Badge> }))} />
                    </td>
                  </tr>
                );
              })}
              {!reqs.length && <tr><td colSpan={6}><div className="empty-state">Заявок нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Same card users see in «Предложения банков». */
function OfferCard({ id, t }: { id: string; t: BankOffer }) {
  const b = bankOf(id);
  return (
    <div className="bk-card">
      <div className="col gap-8">
        <span className="bk-logo"><BankLogo id={b.id} name={b.name} height={20} /></span>
        <span className="row gap-8"><span className="t-xs muted">★ {t.rating} · рейтинг Gluon</span>{t.online && <span className="badge badge-success"><Globe size={12} /> Онлайн</span>}</span>
      </div>
      <dl className="bk-terms">
        <dt>Обслуживание</dt><dd>{t.fee || '—'}</dd>
        <dt>Открытие счёта</dt><dd>{t.open || '—'}</dd>
      </dl>
      <p className="bk-perk"><BadgeCheck size={14} /> {t.perk || '—'}</p>
      <div className="tm-chips">{t.products.map((p) => <span key={p} className="badge badge-neutral">{p}</span>)}</div>
      <button className="btn btn-primary btn-block" tabIndex={-1}>Открыть счёт</button>
    </div>
  );
}

function OfferForm({ id, offer, onClose, onSave }: { id: string; offer: BankOffer; onClose: () => void; onSave: (o: BankOffer) => void }) {
  const [f, setF] = useState<BankOffer>(offer);
  const [err, setErr] = useState('');
  return (
    <div className="ab-form">
      <div className="col gap-16">
        <Field label="Обслуживание"><Input value={f.fee} onChange={(e) => setF({ ...f, fee: e.target.value })} placeholder="Например: Бесплатно" /></Field>
        <Field label="Открытие счёта"><Input value={f.open} onChange={(e) => setF({ ...f, open: e.target.value })} placeholder="Например: 1 день" /></Field>
        <Field label="Главное преимущество"><Input value={f.perk} onChange={(e) => setF({ ...f, perk: e.target.value })} /></Field>
        <div className="row gap-12 tm-two">
          <Field label="Рейтинг Gluon"><Input type="number" min={1} max={5} step={0.1} value={f.rating} onChange={(e) => setF({ ...f, rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
          <Field label="Открытие онлайн"><Select value={f.online ? 'yes' : 'no'} onChange={(v) => setF({ ...f, online: v === 'yes' })} options={[{ value: 'yes', label: 'Да' }, { value: 'no', label: 'Нет' }]} /></Field>
        </div>
        <Field label="Продукты" error={err}>
          <div className="tm-chips">
            {PRODUCTS.map((p) => {
              const on = f.products.includes(p);
              return <button key={p} type="button" className={clsx('ab-chip', on && 'on')} onClick={() => { setErr(''); setF({ ...f, products: on ? f.products.filter((x) => x !== p) : [...f.products, p] }); }}>{p}</button>;
            })}
          </div>
        </Field>
        <div className="row gap-12">
          <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary grow" onClick={() => {
            if (!f.fee.trim() || !f.open.trim() || !f.perk.trim()) { setErr('Заполните все поля'); return; }
            if (!f.products.length) { setErr('Выберите хотя бы один продукт'); return; }
            onSave(f);
          }}>Сохранить</button>
        </div>
      </div>
      <div className="col gap-8">
        <span className="t-xs muted">Так увидят пользователи</span>
        <OfferCard id={id} t={f} />
      </div>
    </div>
  );
}
