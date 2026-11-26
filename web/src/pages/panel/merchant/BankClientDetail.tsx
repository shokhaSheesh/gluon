import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, KeyRound, MessageSquare, Pencil, Phone, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { Badge, BrandMark, ConfirmModal, Field, Input, Modal, PhoneInput, Select, formatPhone } from '../../../components/ui';
import { SERVICES } from '../../../data/mock';
import { CATEGORIES, genAccountNumber, initials, paidUntilOf, useMerchant, type Client, type ClientAccount } from '../../../lib/merchant';
import { maskAccount } from '../../../data/operations';
import { useApp } from '../../../lib/store';
import { CredentialsModal, JOINED_LABEL } from './BankClients';
import { genPassword } from './Team';
import './merchant.css';

/** Bank cabinet: one client — company data, connected services and access to Gluon. */
export default function BankClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { session, toast } = useApp();
  const m = useMerchant();
  const bank = session?.orgId ?? '';
  const c = m.clients.find((x) => x.id === id && x.channel === bank);
  const [edit, setEdit] = useState(false);
  const [block, setBlock] = useState(false);
  const [issued, setIssued] = useState<{ company: string; login: string; password: string } | null>(null);
  const [openAcc, setOpenAcc] = useState(false);
  const [closeAcc, setCloseAcc] = useState<ClientAccount | null>(null);
  const log = (action: string, details?: string) => c && m.log(bank, 'bank', { section: 'clients', action, target: c.company, details });

  if (!c) {
    return (
      <div className="card empty-state">
        Клиент не найден
        <button className="btn btn-secondary btn-sm" onClick={() => nav('/merchant/clients')}>К списку клиентов</button>
      </div>
    );
  }
  const services = Object.entries(c.services).map(([sid, s]) => ({ svc: SERVICES.find((x) => x.id === sid), sid, ...s }));

  return (
    <div className="col gap-20">
      <button className="btn-link t-sm row gap-4" style={{ alignSelf: 'flex-start' }} onClick={() => nav('/merchant/clients')}><ArrowLeft size={14} /> Все клиенты</button>

      <div className="card cd-head">
        <span className="cd-avatar">{initials(c.company)}</span>
        <div className="grow col gap-6" style={{ minWidth: 0 }}>
          <div className="row gap-8 wrap">
            <h1 className="h4">{c.company}</h1>
            {c.blocked ? <Badge kind="error">Заблокирована</Badge> : <Badge kind="success">Активна</Badge>}
            {c.joined === 'bank' ? <Badge kind="primary">{JOINED_LABEL.bank}</Badge> : <Badge kind="neutral">{JOINED_LABEL.self}</Badge>}
          </div>
          <p className="muted t-sm row gap-6 wrap">{c.owner} · <a className="mc-phone" href={`tel:+998${c.phone}`}><Phone size={13} /> {formatPhone(c.phone)}</a></p>
        </div>
        <div className="row gap-8 wrap">
          <button className="btn btn-secondary" onClick={() => nav('/merchant/chat')}><MessageSquare size={16} /> Написать в чат</button>
          <button className="btn btn-secondary" onClick={() => setEdit(true)}><Pencil size={16} /> Изменить</button>
          {c.blocked
            ? <button className="btn btn-secondary" onClick={() => { m.updateClient(c.id, { blocked: false }); log('Разблокировал компанию'); toast('success', 'Компания разблокирована'); }}><ShieldCheck size={16} /> Разблокировать</button>
            : <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={() => setBlock(true)}><Ban size={16} /> Заблокировать</button>}
        </div>
      </div>
      {c.blocked && (
        <div className="bl-alert" style={{ marginTop: 0, background: 'var(--error-soft)', borderColor: 'var(--error-border, var(--error))', color: 'var(--error)' }}>
          <Ban size={18} /><span className="grow">Компания заблокирована: владелец и сотрудники не могут войти в Gluon.</span>
        </div>
      )}

      <div className="bc-grid">
        <section className="card db-card">
          <h3 className="medium">Данные компании</h3>
          <dl className="kv mt-12">
            <dt>ИНН</dt><dd>{c.inn}</dd>
            <dt>Владелец</dt><dd>{c.owner}</dd>
            <dt>Телефон</dt><dd>{formatPhone(c.phone)}</dd>
            <dt>Категория</dt><dd>{c.category}</dd>
            <dt>Адрес</dt><dd>{c.address}</dd>
            <dt>Регистрация</dt><dd>{c.registered}</dd>
          </dl>
        </section>

        <section className="card db-card">
          <h3 className="medium">Вход владельца</h3>
          <dl className="kv mt-12">
            <dt>Логин</dt><dd>{formatPhone(c.credentials?.login ?? c.phone)}</dd>
            <dt>Пароль</dt><dd>••••••••</dd>
          </dl>
          <div className="row gap-8 wrap mt-16">
            <button className="btn btn-secondary btn-sm" onClick={() => {
              const password = genPassword();
              m.updateClient(c.id, { credentials: { login: c.phone, password } });
              log('Сбросил пароль клиента');
              setIssued({ company: c.company, login: c.phone, password });
            }}><KeyRound size={14} /> Сбросить пароль</button>
          </div>
        </section>
      </div>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div className="row between" style={{ padding: '14px 18px' }}>
          <h3 className="medium">Расчётные счета <span className="muted t-sm">{(c.accounts ?? []).filter((a) => a.status === 'active').length}</span></h3>
          <button className="btn btn-primary btn-sm" onClick={() => setOpenAcc(true)} disabled={c.blocked}><Plus size={14} /> Открыть счёт</button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Счёт</th><th>Номер</th><th>Валюта</th><th>Открыт</th><th>Статус</th><th /></tr></thead>
            <tbody>
              {(c.accounts ?? []).map((a) => (
                <tr key={a.id}>
                  <td className="strong" style={{ color: 'var(--text)' }}>{a.name}</td>
                  <td className="mono-ish" style={{ fontFamily: 'ui-monospace, Menlo, monospace', whiteSpace: 'nowrap' }}>{a.number.replace(/(\d{4})(?=\d)/g, '$1 ')}</td>
                  <td>{a.currency}</td>
                  <td>{a.opened}</td>
                  <td>{a.status === 'active' ? <Badge kind="success">Активен</Badge> : <span className="row gap-6"><Badge kind="neutral">Закрыт</Badge><span className="t-xs muted">{a.closed}</span></span>}</td>
                  <td style={{ textAlign: 'right' }}>{a.status === 'active' && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setCloseAcc(a)}>Закрыть</button>}</td>
                </tr>
              ))}
              {!(c.accounts ?? []).length && <tr><td colSpan={6}><div className="empty-state">Счетов пока нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px' }}><h3 className="medium">Подключённые сервисы <span className="muted t-sm">{services.length}</span></h3></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Сервис</th><th>Подключён</th><th>Подписка</th></tr></thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.sid}>
                  <td><span className="row gap-10">{s.svc && <BrandMark name={s.svc.name} color={s.svc.color} text={s.svc.mark} size={28} />}<span className="strong" style={{ color: 'var(--text)' }}>{s.svc?.name ?? s.sid}</span></span></td>
                  <td>{s.since}</td>
                  <td>{s.status === 'active' ? <Badge kind="success">Оплачена до {paidUntilOf(c, s.sid)}</Badge> : <Badge kind="error">Не оплачена</Badge>}</td>
                </tr>
              ))}
              {!services.length && <tr><td colSpan={3}><div className="empty-state">Клиент ещё не подключил сервисы</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={edit} onClose={() => setEdit(false)} title="Изменить клиента" width={520}>
        {edit && <EditClientForm client={c} onClose={() => setEdit(false)} onSave={(patch, changed) => {
          m.updateClient(c.id, { ...patch, credentials: { login: patch.phone ?? c.phone, password: c.credentials?.password ?? '' } });
          if (changed.length) log('Изменил данные клиента', changed.join(', '));
          toast('success', 'Данные клиента сохранены');
          setEdit(false);
        }} />}
      </Modal>
      <ConfirmModal open={block} onClose={() => setBlock(false)} confirmText="Заблокировать" text={`Заблокировать ${c.company}? Владелец и сотрудники компании не смогут войти в Gluon.`}
        onConfirm={() => { m.updateClient(c.id, { blocked: true }); log('Заблокировал компанию'); setBlock(false); toast('success', 'Компания заблокирована'); }} />
      <CredentialsModal data={issued} onClose={() => setIssued(null)} />
      <Modal open={openAcc} onClose={() => setOpenAcc(false)} title="Открыть расчётный счёт" width={460}>
        {openAcc && <OpenAccountForm bank={bank} taken={m.clients.flatMap((x) => (x.accounts ?? []).map((a) => a.number))} onClose={() => setOpenAcc(false)} onSave={(a) => {
          m.updateClient(c.id, { accounts: [...(c.accounts ?? []), a] });
          m.log(bank, 'bank', { section: 'accounts', action: 'Открыл расчётный счёт', target: c.company, details: `${a.currency} · ${maskAccount(a.number)}` });
          toast('success', 'Счёт открыт');
          setOpenAcc(false);
        }} />}
      </Modal>
      <ConfirmModal open={!!closeAcc} onClose={() => setCloseAcc(null)} confirmText="Закрыть счёт" text={closeAcc ? `Закрыть счёт ${maskAccount(closeAcc.number)} (${closeAcc.currency})?` : ''}
        onConfirm={() => {
          if (!closeAcc) return;
          const today = new Date().toLocaleDateString('ru-RU');
          m.updateClient(c.id, { accounts: (c.accounts ?? []).map((a) => (a.id === closeAcc.id ? { ...a, status: 'closed', closed: today } : a)) });
          m.log(bank, 'bank', { section: 'accounts', action: 'Закрыл расчётный счёт', target: c.company, details: `${closeAcc.currency} · ${maskAccount(closeAcc.number)}` });
          toast('success', 'Счёт закрыт');
          setCloseAcc(null);
        }} />
    </div>
  );
}

function OpenAccountForm({ bank, taken, onClose, onSave }: { bank: string; taken: string[]; onClose: () => void; onSave: (a: ClientAccount) => void }) {
  const gen = (cur: 'UZS' | 'USD') => { let n = genAccountNumber(bank, cur); while (taken.includes(n)) n = genAccountNumber(bank, cur); return n; };
  const [f, setF] = useState({ name: 'Расчётный счёт', currency: 'UZS' as 'UZS' | 'USD', number: gen('UZS') });
  const [err, setErr] = useState('');
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Название счёта" error={err}><Input value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErr(''); }} error={!!err} /></Field>
      <Field label="Валюта"><Select value={f.currency} onChange={(v) => { const cur = v as 'UZS' | 'USD'; setF({ ...f, currency: cur, number: gen(cur) }); }} options={[{ value: 'UZS', label: 'UZS — сум' }, { value: 'USD', label: 'USD — доллар США' }]} /></Field>
      <Field label="Номер счёта">
        <div className="row gap-8">
          <Input className="grow" value={f.number.replace(/(\d{4})(?=\d)/g, '$1 ')} disabled />
          <button type="button" className="icon-btn" onClick={() => setF({ ...f, number: gen(f.currency) })} aria-label="Другой номер" title="Другой номер"><RefreshCw size={16} /></button>
        </div>
      </Field>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={() => {
          if (!f.name.trim()) { setErr('Введите название'); return; }
          onSave({ id: `acc-${Date.now()}`, number: f.number, currency: f.currency, name: f.name.trim(), opened: new Date().toLocaleDateString('ru-RU'), status: 'active' });
        }}>Открыть счёт</button>
      </div>
    </div>
  );
}

function EditClientForm({ client, onClose, onSave }: { client: Client; onClose: () => void; onSave: (p: Partial<Client>, changed: string[]) => void }) {
  const m = useMerchant();
  const [f, setF] = useState({ company: client.company, owner: client.owner, phone: client.phone, address: client.address, category: client.category });
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.company.trim().length < 3) e.company = 'Введите название компании';
    if (f.owner.trim().split(/\s+/).length < 2) e.owner = 'Введите имя и фамилию';
    if (f.phone.length < 9) e.phone = 'Введите номер телефона';
    else if (m.clients.some((c) => c.id !== client.id && c.phone === f.phone)) e.phone = 'Этот номер уже зарегистрирован';
    if (f.address.trim().length < 5) e.address = 'Введите адрес';
    setErr(e);
    if (Object.keys(e).length) return;
    const names: Record<string, string> = { company: 'название', owner: 'владелец', phone: 'телефон (логин)', address: 'адрес', category: 'категория' };
    const changed = (Object.keys(f) as (keyof typeof f)[]).filter((k) => f[k] !== client[k]).map((k) => names[k]);
    onSave(f, changed);
  };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Компания" error={err.company}><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} error={!!err.company} /></Field>
      <Field label="ИНН" hint="ИНН изменить нельзя"><Input value={client.inn} disabled /></Field>
      <Field label="Владелец (ФИО)" error={err.owner}><Input value={f.owner} onChange={(e) => setF({ ...f, owner: e.target.value })} error={!!err.owner} /></Field>
      <Field label="Телефон (логин)" error={err.phone}><PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} error={!!err.phone} /></Field>
      <div className="row gap-12 tm-two">
        <Field label="Категория"><Select value={f.category} onChange={(v) => setF({ ...f, category: v })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Адрес" error={err.address}><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} error={!!err.address} /></Field>
      </div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>Сохранить</button>
      </div>
    </div>
  );
}
