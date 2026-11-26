import { useState } from 'react';
import clsx from 'clsx';
import { CreditCard, Globe, KeyRound, Landmark, LogOut, Pencil, Plus, Trash2, User, Users, UserCog, Wallet, X, Check, Upload } from 'lucide-react';
import { BrandMark, ConfirmModal, Field, Input, Modal, PasswordInput, PhoneInput, Select, Pagination, usePaging } from '../../components/ui';
import { BANKS, BUSINESS_CATEGORIES, EMPLOYEES, PERMISSIONS, ROLES } from '../../data/mock';
import { LANGS } from '../../lib/i18n';
import { useApp } from '../../lib/store';
import { OtpBlock } from '../auth/OtpStep';
import { cardBrand, useBilling } from '../../lib/billing';
import { ACCOUNTS, maskAccount } from '../../data/operations';
import { ACC_LABEL, DEMO_CLIENT_ID, KAPITAL_CLIENT_ID, useMerchant } from '../../lib/merchant';
import './profile.css';

export type ProfileSection = 'profile' | 'balance' | 'password' | 'bank' | 'cards' | 'employees' | 'roles' | 'language';

const MENU: { id: ProfileSection; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Профиль', icon: <User size={18} /> },
  { id: 'balance', label: 'Баланс', icon: <Wallet size={18} /> },
  { id: 'password', label: 'Изменить пароль', icon: <KeyRound size={18} /> },
  { id: 'bank', label: 'Банк аккаунт', icon: <Landmark size={18} /> },
  { id: 'cards', label: 'Карты', icon: <CreditCard size={18} /> },
  { id: 'employees', label: 'Сотрудники', icon: <Users size={18} /> },
  { id: 'roles', label: 'Роли', icon: <UserCog size={18} /> },
  { id: 'language', label: 'Язык', icon: <Globe size={18} /> },
];

export function CardBrand({ brand }: { brand: string }) {
  if (brand === 'mastercard') return <span className="cb"><i style={{ background: '#EB001B' }} /><i style={{ background: '#F79E1B', marginLeft: -6 }} /></span>;
  if (brand === 'visa') return <span className="cb" style={{ color: '#1A1F71', fontWeight: 800, fontStyle: 'italic', fontSize: 12 }}>VISA</span>;
  if (brand === 'uzcard') return <span className="cb" style={{ color: '#1A3D8F', fontWeight: 800, fontSize: 15 }}>U</span>;
  return <span className="cb" style={{ background: '#2B2B2B', color: '#3FD0C9', borderRadius: 4, fontSize: 8, fontWeight: 800, padding: '2px 3px' }}>HUMO</span>;
}

export default function ProfileModal({
  section, onSection, onClose, onLogout, onTopUp, balance,
}: {
  section: ProfileSection | null; onSection: (s: ProfileSection) => void; onClose: () => void;
  onLogout: () => void; onTopUp: () => void; balance: number;
}) {
  return (
    <Modal open={!!section} onClose={onClose} width={960}>
      {section && <Body section={section} onSection={onSection} onClose={onClose} onLogout={onLogout} onTopUp={onTopUp} balance={balance} />}
    </Modal>
  );
}

function Body({ section, onSection, onClose, onLogout, onTopUp, balance }: {
  section: ProfileSection; onSection: (s: ProfileSection) => void; onClose: () => void; onLogout: () => void; onTopUp: () => void; balance: number;
}) {
  return (
    <div className="pm">
      <aside className="pm-side">
        <button className="icon-btn sm" style={{ border: 'none', background: 'transparent', marginBottom: 8 }} onClick={onClose} aria-label="close"><X size={18} /></button>
        {MENU.map((m) => (
          <button key={m.id} className={clsx('pm-link', section === m.id && 'active')} onClick={() => onSection(m.id)}>
            {m.icon} {m.label}
          </button>
        ))}
        <button className="pm-link danger" style={{ marginTop: 'auto' }} onClick={onLogout}><LogOut size={18} /> Выйти с аккаунта</button>
      </aside>
      <section className="pm-body">
        {section === 'profile' && <ProfileForm onClose={onClose} />}
        {section === 'balance' && <Balance balance={balance} onTopUp={onTopUp} />}
        {section === 'password' && <PasswordForm onClose={onClose} />}
        {section === 'bank' && <BankAccounts />}
        {section === 'cards' && <Cards />}
        {section === 'employees' && <Employees />}
        {section === 'roles' && <Roles />}
        {section === 'language' && <Language />}
      </section>
    </div>
  );
}

function Footer({ onBack, onSave, saveText = 'Сохранить' }: { onBack: () => void; onSave: () => void; saveText?: string }) {
  return (
    <div className="pm-foot">
      <button className="btn btn-secondary" onClick={onBack}>Назад</button>
      <button className="btn btn-primary" onClick={onSave}>{saveText}</button>
    </div>
  );
}

function ProfileForm({ onClose }: { onClose: () => void }) {
  const { toast, session } = useApp();
  const [f, setF] = useState({ fio: session?.name ?? '', biz: 'ООО “Прометей”', inn: '123456789', address: 'пр. Амира Темура 129Б', category: 'Аксессуары' });
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <>
      <h2 className="h4">Профиль</h2>
      <div className="col gap-16 pm-form">
        <Field label="ФИО" error={err.fio}><Input placeholder="Введите ФИО" value={f.fio} onChange={(e) => setF({ ...f, fio: e.target.value })} error={!!err.fio} /></Field>
        <Field label="Название бизнеса"><Input placeholder="Введите название компании" value={f.biz} onChange={(e) => setF({ ...f, biz: e.target.value })} /></Field>
        <Field label="ИНН" error={err.inn}><Input placeholder="Введите ИНН компании" value={f.inn} onChange={(e) => setF({ ...f, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={!!err.inn} /></Field>
        <Field label="Адрес"><Input placeholder="Введите адрес компании" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <Field label="Категория бизнеса"><Select value={f.category} onChange={(v) => setF({ ...f, category: v })} options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
      </div>
      <Footer onBack={onClose} onSave={() => {
        const e: Record<string, string> = {};
        if (!f.fio.trim()) e.fio = 'Обязательное поле';
        if (f.inn.length !== 9) e.inn = 'ИНН должен содержать 9 цифр';
        setErr(e);
        if (Object.keys(e).length) toast('error', 'Не удалось сохранить.');
        else toast('success', 'Изменения успешно сохранены.');
      }} />
    </>
  );
}

function Balance({ balance, onTopUp }: { balance: number; onTopUp: () => void }) {
  const ph = usePaging();
  const { payments } = useBilling();
  return (
    <>
      <h2 className="h4">Баланс</h2>
      <div className="pm-balance">
        <div>
          <p className="muted t-sm">Текущий баланс</p>
          <p className="h3">{balance.toLocaleString('ru-RU')} сум</p>
        </div>
        <div className="row gap-8">
          <a className="btn btn-secondary" href="/app/billing">Подписки и тарифы</a>
          <button className="btn btn-primary" onClick={onTopUp}><Plus size={16} /> Пополнить баланс</button>
        </div>
      </div>
      <p className="medium" style={{ margin: '20px 0 8px' }}>История операций</p>
      <div className="col">
        {ph.slice(payments).map((h) => {
          const plus = h.amount > 0;
          return (
            <div key={h.id} className="row between pm-row">
              <div className="row gap-12">
                <span className="avatar sm" style={{ background: plus ? 'var(--success-soft)' : 'var(--surface-3)', color: plus ? 'var(--success)' : 'var(--text-3)' }}>{plus ? '+' : '−'}</span>
                <div><p className="medium t-sm">{h.title}</p><p className="t-xs muted">{h.date}</p></div>
              </div>
              <b className="t-sm" style={{ color: plus ? 'var(--success)' : 'var(--error)' }}>{plus ? '+ ' : '− '}{Math.abs(h.amount).toLocaleString('ru-RU')} сум</b>
            </div>
          );
        })}
      </div>
      <Pagination {...ph.bar(payments.length)} />
    </>
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const { toast, session } = useApp();
  const [f, setF] = useState({ cur: '', p1: '', p2: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState(false);
  if (otp) {
    return (
      <div style={{ maxWidth: 420, margin: '24px auto' }}>
        <OtpBlock compact phone={session?.login ?? '901234567'} onBack={() => setOtp(false)} onDone={() => { toast('success', 'Пароль успешно обновлён.'); setOtp(false); setF({ cur: '', p1: '', p2: '' }); }} />
      </div>
    );
  }
  return (
    <>
      <h2 className="h4">Изменение пароля</h2>
      <div className="col gap-16 pm-form">
        <Field label="Текущий пароль" error={err.cur}><PasswordInput placeholder="Введите текущий пароль" value={f.cur} onChange={(e) => setF({ ...f, cur: e.target.value })} error={!!err.cur} /></Field>
        <Field label="Новый пароль" error={err.p1}><PasswordInput placeholder="Введите новый пароль" value={f.p1} onChange={(e) => setF({ ...f, p1: e.target.value })} error={!!err.p1} /></Field>
        <Field label="Подтвердите новый пароль" error={err.p2}><PasswordInput placeholder="Подтвердите новый пароль" value={f.p2} onChange={(e) => setF({ ...f, p2: e.target.value })} error={!!err.p2} /></Field>
      </div>
      <Footer onBack={onClose} saveText="Изменить" onSave={() => {
        const e: Record<string, string> = {};
        if (f.cur.length < 4) e.cur = 'Неверный текущий пароль';
        if (f.p1.length < 8) e.p1 = 'Не соответствует требованиям';
        if (f.p1 !== f.p2) e.p2 = 'Пароли не совпадают';
        setErr(e);
        if (Object.keys(e).length) toast('error', 'Не удалось изменить пароль.');
        else setOtp(true);
      }} />
    </>
  );
}

function BankAccounts() {
  const pr = usePaging();
  const pa = usePaging();
  const { toast, session } = useApp();
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ bank: '', number: '', name: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [del, setDel] = useState<string | null>(null);
  const { accountRequests, clients, updateClient } = useMerchant();
  const myId = session?.kind === 'bank' ? KAPITAL_CLIENT_ID : DEMO_CLIENT_ID;
  const me = clients.find((c) => c.id === myId);
  // one list shared with admin and the bank cabinet; accounts opened by the bank / added by Gluon can't be removed here
  const list = (me?.accounts ?? []).filter((a) => a.status === 'active').map((a) => {
    const known = ACCOUNTS.find((x) => x.number === a.number);
    return { id: a.id, bank: a.bank ?? me?.channel ?? 'hayot', number: a.number, name: `${a.name}${a.currency === 'USD' ? ' · USD' : ''}`, lastStatement: known?.lastStatement ?? '—', ops: known?.ops ?? 0, source: a.source ?? 'bank' };
  });
  const setAccounts = (fn: (l: NonNullable<typeof me>['accounts'] & object) => NonNullable<typeof me>['accounts']) => { if (me) updateClient(me.id, { accounts: fn(me.accounts ?? []) }); };
  const requests = accountRequests.filter((r) => r.clientId === myId);
  const bank = (id: string) => BANKS.find((b) => b.id === id)!;

  if (adding) {
    return (
      <>
        <h2 className="h4">Добавить расчётный счёт</h2>
        <p className="t-sm muted mt-4">Счёт нужен, чтобы привязывать к нему загруженные выписки. Доступ к интернет-банку не требуется.</p>
        <div className="col gap-16 pm-form">
          <Field label="Банк" error={err.bank}>
            <Select value={f.bank} onChange={(v) => setF({ ...f, bank: v })} placeholder="Выберите банк" error={!!err.bank}
              options={BANKS.map((b) => ({ value: b.id, label: b.name, icon: <BrandMark name={b.name} color={b.color} text={b.mark} size={20} /> }))} />
          </Field>
          <Field label="Номер расчётного счёта" error={err.number} hint="20 цифр">
            <Input placeholder="2020 8000 0000 0000 0000" inputMode="numeric" value={f.number.replace(/(\d{4})(?=\d)/g, '$1 ')}
              onChange={(e) => setF({ ...f, number: e.target.value.replace(/\D/g, '').slice(0, 20) })} error={!!err.number} />
          </Field>
          <Field label="Название (необязательно)"><Input placeholder="Например: Основной счёт" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        </div>
        <Footer onBack={() => { setAdding(false); setErr({}); }} saveText="Добавить" onSave={() => {
          const e: Record<string, string> = {};
          if (!f.bank) e.bank = 'Выберите банк';
          if (f.number.length !== 20) e.number = 'Номер счёта должен содержать 20 цифр';
          setErr(e);
          if (Object.keys(e).length) return;
          if ((me?.accounts ?? []).some((a) => a.number === f.number && a.status === 'active')) { setErr({ number: 'Этот счёт уже добавлен' }); return; }
          setAccounts((l) => [...l, { id: `acc-${Date.now()}`, bank: f.bank, source: 'user', number: f.number, currency: f.number.slice(5, 8) === '840' ? 'USD' : 'UZS', name: f.name || 'Расчётный счёт', opened: new Date().toLocaleDateString('ru-RU'), status: 'active' }]);
          setAdding(false); setF({ bank: '', number: '', name: '' });
          toast('success', 'Счёт добавлен');
        }} />
      </>
    );
  }

  return (
    <>
      <div className="row between">
        <h2 className="h4">Расчётные счета</h2>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Plus size={16} /> Добавить счёт</button>
      </div>
      <p className="t-sm muted mt-4">Операции по счетам появляются после загрузки выписки в разделе «Операции».</p>
      <div className="col gap-12 mt-16">
        {pa.slice(list).map((a) => {
          const b = bank(a.bank);
          return (
            <div key={a.id} className="pm-acc">
              <BrandMark name={b.name} color={b.color} text={b.mark} size={40} />
              <div className="grow">
                <p className="medium">{a.name} <span className="muted t-sm">· {b.name}</span>{a.source === 'bank' && <span className="badge badge-primary" style={{ marginLeft: 8 }}>Открыт банком</span>}{a.source === 'admin' && <span className="badge badge-neutral" style={{ marginLeft: 8 }}>Добавлен Gluon</span>}</p>
                <p className="t-sm" style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{maskAccount(a.number)}</p>
                <p className="t-xs muted">{a.ops ? `Последняя выписка: ${a.lastStatement} · ${a.ops} операций` : 'Выписки ещё не загружались'}</p>
              </div>
              <a className="btn btn-soft btn-sm" href="/app/operations"><Upload size={14} /> Загрузить выписку</a>
              {a.source === 'user' && <button className="icon-btn sm" onClick={() => setDel(a.id)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>}
            </div>
          );
        })}
      </div>
      <Pagination {...pa.bar(list.length)} />

      <p className="medium" style={{ margin: '24px 0 8px' }}>Заявки на открытие счёта</p>
      <div className="col gap-8">
        {pr.slice(requests).map((r) => (
          <div key={r.id} className="row between pm-row">
            <span className="row gap-12"><BrandMark name={bank(r.bank).name} color={bank(r.bank).color} text={bank(r.bank).mark} size={28} /><span><b className="t-sm medium">{bank(r.bank).name} · {r.product}</b><br /><span className="t-xs muted">Отправлена {r.date}</span></span></span>
            <span className={`badge badge-${ACC_LABEL[r.status].kind}`}>{ACC_LABEL[r.status].label}</span>
          </div>
        ))}
        {!requests.length && <p className="t-sm muted">Заявок пока нет</p>}
        {session?.kind !== 'bank' && <a className="btn-link t-sm" href="/app/banking" style={{ marginTop: 6 }}>Открыть счёт в другом банке →</a>}
      </div>
      <Pagination {...pr.bar(requests.length)} />

      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text="Удалить счёт? Загруженные операции останутся в истории."
        onConfirm={() => { setAccounts((l) => l.filter((x) => x.id !== del)); setDel(null); toast('success', 'Счёт удалён'); }} />
    </>
  );
}

function Cards() {
  const pc = usePaging();
  const { toast } = useApp();
  const b = useBilling();
  const [del, setDel] = useState<string | null>(null);
  const [edit, setEdit] = useState<string | 'new' | null>(null);
  const [f, setF] = useState({ number: '', exp: '', name: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const digits = (v: string) => v.replace(/\D/g, '');
  const editing = b.cards.find((c) => c.id === edit);
  const open = (id: string | 'new') => { const c = b.cards.find((x) => x.id === id); setF(c ? { number: c.number, exp: c.exp, name: c.name } : { number: '', exp: '', name: '' }); setErr({}); setEdit(id); };
  if (edit) {
    const n = digits(f.number);
    const save = () => {
      const e: Record<string, string> = {};
      if (!editing && n.length !== 16) e.number = 'Карта неправильно введена';
      if (!/^\d{2}\/\d{2}$/.test(f.exp) || Number(f.exp.slice(0, 2)) > 12) e.exp = 'Формат ММ/ГГ';
      if (!editing && b.cards.some((c) => digits(c.number) === n)) e.number = 'Эта карта уже добавлена';
      setErr(e);
      if (Object.keys(e).length) return;
      if (editing) { b.updateCard(editing.id, { exp: f.exp, name: f.name.trim() || editing.name }); toast('success', 'Карта обновлена'); }
      else { b.addCard({ number: n.replace(/(\d{4})(?=\d)/g, '$1 '), exp: f.exp, brand: cardBrand(n), name: f.name.trim() || 'Карта' }); toast('success', 'Карта добавлена'); }
      setEdit(null);
    };
    return (
      <>
        <h2 className="h4">{editing ? 'Карта' : 'Новая карта'}</h2>
        <div className="col gap-16 pm-form">
          <Field label="Номер карты" error={err.number}><Input value={editing ? editing.number : n.slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')} onChange={(e) => setF({ ...f, number: e.target.value })} placeholder="0000 0000 0000 0000" inputMode="numeric" readOnly={!!editing} error={!!err.number}
            left={editing ? <CardBrand brand={editing.brand} /> : n.length >= 4 ? <CardBrand brand={cardBrand(n)} /> : undefined} /></Field>
          <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
            <div className="grow"><Field label="Срок" error={err.exp}><Input value={f.exp} placeholder="ММ/ГГ" onChange={(e) => { const d = digits(e.target.value).slice(0, 4); setF({ ...f, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} error={!!err.exp} /></Field></div>
            <div className="grow"><Field label="Название"><Input value={f.name} placeholder="Например: Основная карта" onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></div>
          </div>
        </div>
        <Footer onBack={() => setEdit(null)} onSave={save} />
      </>
    );
  }
  return (
    <>
      <div className="row between"><h2 className="h4">Карты</h2><button className="btn btn-primary btn-sm" onClick={() => open('new')}><Plus size={16} /> Добавить карту</button></div>
      <div className="col mt-16">
        {pc.slice(b.cards).map((c) => (
          <div key={c.id} className="row between pm-row">
            <label className="row gap-12" style={{ cursor: 'pointer' }}>
              <input type="radio" checked={b.mainCard === c.id} onChange={() => b.setMainCard(c.id)} style={{ accentColor: 'var(--primary)' }} />
              <CardBrand brand={c.brand} />
              <div><p className="medium t-sm">{c.number}</p><p className="t-xs muted">{c.exp} · {c.name}</p></div>
            </label>
            <div className="row gap-8">
              {b.mainCard === c.id && <span className="badge badge-primary">Основная</span>}
              <button className="icon-btn sm" onClick={() => open(c.id)} aria-label="edit"><Pencil size={14} /></button>
              <button className="icon-btn sm" onClick={() => setDel(c.id)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
            </div>
          </div>
        ))}
        {!b.cards.length && <p className="empty-state t-sm">Карт нет</p>}
      </div>
      <Pagination {...pc.bar(b.cards.length)} />
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text="Вы уверены, что хотите удалить карту?"
        onConfirm={() => { if (del) b.removeCard(del); setDel(null); toast('success', 'Карта удалена'); }} />
    </>
  );
}

function Employees() {
  const pe = usePaging();
  const { toast } = useApp();
  const [list, setList] = useState(EMPLOYEES);
  const [form, setForm] = useState<null | { id?: string; name: string; phone: string; role: string }>(null);
  const [del, setDel] = useState<string | null>(null);
  if (form) {
    return (
      <>
        <h2 className="h4">{form.id ? 'Редактировать' : 'Добавить сотрудника'}</h2>
        <div className="col gap-16 pm-form">
          <Field label="ФИО"><Input placeholder="Введите ФИО" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
            <div className="grow"><Field label="Телефон номер"><PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} /></Field></div>
            <div className="grow"><Field label="Роль"><Select value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={ROLES.map((r) => ({ value: r, label: r }))} /></Field></div>
          </div>
        </div>
        <Footer onBack={() => setForm(null)} onSave={() => {
          if (!form.name) { toast('error', 'Введите ФИО'); return; }
          setList((l) => form.id ? l.map((x) => (x.id === form.id ? { ...x, name: form.name, role: form.role } : x)) : [...l, { id: String(Date.now()), name: form.name, role: form.role, phone: '+998 ' + form.phone }]);
          setForm(null);
          toast('success', 'Сотрудник сохранён');
        }} />
      </>
    );
  }
  return (
    <>
      <div className="row between"><h2 className="h4">Сотрудники</h2><button className="btn btn-primary btn-sm" onClick={() => setForm({ name: '', phone: '', role: 'Менеджер' })}><Plus size={16} /> Добавить сотрудника</button></div>
      <div className="col mt-16">
        {pe.slice(list).map((e) => (
          <div key={e.id} className="row between pm-row">
            <div className="row gap-12">
              <span className="avatar sm">{e.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}</span>
              <div><p className="medium t-sm">{e.name}</p><p className="t-xs muted">{e.role} · {e.phone}</p></div>
            </div>
            <div className="row gap-8">
              <button className="icon-btn sm" onClick={() => setForm({ id: e.id, name: e.name, phone: '', role: e.role })} aria-label="edit"><Pencil size={14} /></button>
              <button className="icon-btn sm" onClick={() => setDel(e.id)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
            </div>
          </div>
        ))}
      </div>
      <Pagination {...pe.bar(list.length)} />
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text="Удалить сотрудника?"
        onConfirm={() => { setList((l) => l.filter((x) => x.id !== del)); setDel(null); toast('success', 'Сотрудник удалён'); }} />
    </>
  );
}

function Roles() {
  const { toast } = useApp();
  const [roles, setRoles] = useState(ROLES);
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [perms, setPerms] = useState<Record<string, [boolean, boolean, boolean]>>({});
  if (edit !== null) {
    return (
      <>
        <h2 className="h4">{edit ? 'Роль: ' + edit : 'Новая роль'}</h2>
        <div className="col gap-16 mt-16">
          <div className="pm-form" style={{ marginTop: 0 }}><Field label="Название роли"><Input placeholder="Например: Менеджер" value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
          <div className="table-wrap card">
            <table className="table">
              <thead><tr><th>Раздел</th><th>Просмотр</th><th>Изменение</th><th>Удаление</th></tr></thead>
              <tbody>
                {PERMISSIONS.map((p) => {
                  const v = perms[p] ?? [true, edit === 'Владелец', edit === 'Владелец'];
                  return (
                    <tr key={p}>
                      <td className="strong">{p}</td>
                      {[0, 1, 2].map((k) => (
                        <td key={k}><input type="checkbox" checked={v[k]} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                          onChange={() => { const n = [...v] as [boolean, boolean, boolean]; n[k] = !n[k]; setPerms({ ...perms, [p]: n }); }} /></td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <Footer onBack={() => setEdit(null)} onSave={() => {
          if (!name) { toast('error', 'Введите название роли'); return; }
          if (!edit) setRoles((r) => [...r, name]);
          setEdit(null);
          toast('success', 'Роль сохранена');
        }} />
      </>
    );
  }
  return (
    <>
      <div className="row between"><h2 className="h4">Роли</h2><button className="btn btn-primary btn-sm" onClick={() => { setEdit(''); setName(''); setPerms({}); }}><Plus size={16} /> Добавить роль</button></div>
      <div className="col mt-16">
        {roles.map((r) => (
          <div key={r} className="row between pm-row">
            <div><p className="medium t-sm">{r}</p><p className="t-xs muted">{EMPLOYEES.filter((e) => e.role === r).length} сотрудник(ов)</p></div>
            <div className="row gap-8">
              <button className="icon-btn sm" onClick={() => { setEdit(r); setName(r); setPerms({}); }} aria-label="edit"><Pencil size={14} /></button>
              <button className="icon-btn sm" onClick={() => { setRoles((x) => x.filter((y) => y !== r)); toast('success', 'Роль удалена'); }} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Language() {
  const { lang, setLang } = useApp();
  return (
    <>
      <h2 className="h4">Язык</h2>
      <div className="col gap-8 pm-form">
        {LANGS.map((l) => (
          <button key={l.code} className={clsx('pm-lang', l.code === lang && 'active')} onClick={() => setLang(l.code)}>
            <span style={{ fontSize: 20 }}>{l.flag}</span> {l.label}
            {l.code === lang && <Check size={18} style={{ marginLeft: 'auto', color: 'var(--primary)' }} />}
          </button>
        ))}
      </div>
    </>
  );
}
