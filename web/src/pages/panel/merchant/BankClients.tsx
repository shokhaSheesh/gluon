import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Copy, Download, Eye, EyeOff, Search, UserPlus, Wand2 } from 'lucide-react';
import { Badge, Field, Input, Modal, Pagination, PhoneInput, Select, formatPhone } from '../../../components/ui';
import { CATEGORIES, CHANNEL_LABEL, useMerchant, type Channel, type Client } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { downloadCsv } from './ServiceClients';
import { genPassword } from './Team';
import './merchant.css';

const PER = 12;
export const JOINED_LABEL: Record<Client['joined'], string> = { self: 'По ссылке банка', bank: 'Создан банком' };

/** Bank cabinet: companies that use Gluon through this bank. */
export default function BankClients() {
  const { session, toast } = useApp();
  const m = useMerchant();
  const nav = useNavigate();
  const bank = (session?.orgId ?? '') as Channel;
  const [q, setQ] = useState('');
  const [joined, setJoined] = useState('all');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const [create, setCreate] = useState(false);
  const [issued, setIssued] = useState<{ company: string; login: string; password: string } | null>(null);

  const mine = useMemo(() => m.clients.filter((c) => c.channel === bank), [m.clients, bank]);
  const digits = q.replace(/\D/g, '');
  const rows = mine.filter((c) => (joined === 'all' || c.joined === joined) && (cat === 'all' || c.category === cat)
    && ((c.company + c.owner).toLowerCase().includes(q.toLowerCase()) || (digits.length >= 3 && (c.phone.includes(digits.replace(/^998/, '')) || c.inn.includes(digits)))));
  const total = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);
  const reset = () => setPage(1);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Клиенты</h1><p className="t-sm muted">Всего: {mine.length}</p></div>
        <div className="row gap-12">
          <button className="btn btn-secondary" onClick={() => {
            downloadCsv(`${bank}-clients.csv`, ['Компания', 'ИНН', 'Владелец', 'Телефон', 'Категория', 'Адрес', 'Как пришёл', 'Сервисов', 'Дата регистрации', 'Статус'],
              rows.map((c) => [c.company, c.inn, c.owner, formatPhone(c.phone), c.category, c.address, JOINED_LABEL[c.joined], Object.keys(c.services).length, c.registered, c.blocked ? 'Заблокирован' : 'Активен']));
            toast('success', `Выгружено клиентов: ${rows.length}`);
          }}><Download size={16} /> Экспорт</button>
          <button className="btn btn-primary" onClick={() => setCreate(true)}><UserPlus size={16} /> Создать клиента</button>
        </div>
      </div>

      <div className="mc-filters">
        <label className="u-search" style={{ display: 'flex', width: 300 }}><Search size={16} /><input placeholder="Компания, владелец, ИНН, телефон" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} /></label>
        <div style={{ width: 200 }}><Select value={joined} onChange={(v) => { setJoined(v); reset(); }} options={[{ value: 'all', label: 'Все клиенты' }, { value: 'self', label: JOINED_LABEL.self }, { value: 'bank', label: JOINED_LABEL.bank }]} /></div>
        <div style={{ width: 210 }}><Select value={cat} onChange={(v) => { setCat(v); reset(); }} options={[{ value: 'all', label: 'Все категории' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>ИНН</th><th>Телефон</th><th>Категория</th><th>Как пришёл</th><th>Сервисы</th><th>Регистрация</th></tr></thead>
            <tbody>
              {view.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => nav(c.id)}>
                  <td>
                    <span className="col">
                      <span className="row gap-6"><span className="strong" style={{ color: 'var(--text)' }}>{c.company}</span>{c.blocked && <Badge kind="error">Заблокирован</Badge>}</span>
                      <span className="t-xs muted">{c.owner}</span>
                    </span>
                  </td>
                  <td>{c.inn}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatPhone(c.phone)}</td>
                  <td>{c.category}</td>
                  <td>{c.joined === 'bank' ? <Badge kind="primary">{JOINED_LABEL.bank}</Badge> : <Badge kind="neutral">{JOINED_LABEL.self}</Badge>}</td>
                  <td>{Object.keys(c.services).length}</td>
                  <td>{c.registered}</td>
                </tr>
              ))}
              {!view.length && <tr><td colSpan={7}><div className="empty-state">Клиенты не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
        {total > 1 && <Pagination page={page} total={total} onPage={setPage} />}
      </div>

      <Modal open={create} onClose={() => setCreate(false)} title="Новый клиент" width={560}>
        {create && <CreateClientForm bank={bank} onClose={() => setCreate(false)} onCreated={(c, password) => {
          setCreate(false);
          setIssued({ company: c.company, login: c.phone, password });
          m.log(bank, 'bank', { section: 'clients', action: 'Создал клиента', target: c.company, details: `Логин: ${formatPhone(c.phone)}` });
        }} />}
      </Modal>
      <CredentialsModal data={issued} onClose={() => setIssued(null)} />
    </div>
  );
}

function CreateClientForm({ bank, onClose, onCreated }: { bank: Channel; onClose: () => void; onCreated: (c: Client, password: string) => void }) {
  const m = useMerchant();
  const [f, setF] = useState({ company: '', inn: '', owner: '', phone: '', address: '', category: CATEGORIES[0] });
  const [pw, setPw] = useState(genPassword);
  const [show, setShow] = useState(true);
  const [err, setErr] = useState<Record<string, string>>({});
  const set = (k: keyof typeof f, v: string) => setF({ ...f, [k]: v });

  const submit = () => {
    const e: Record<string, string> = {};
    if (f.company.trim().length < 3) e.company = 'Введите название компании';
    if (!/^\d{9}$/.test(f.inn)) e.inn = 'ИНН — 9 цифр';
    else if (m.clients.some((c) => c.inn === f.inn)) e.inn = 'Компания с таким ИНН уже есть в Gluon';
    if (f.owner.trim().split(/\s+/).length < 2) e.owner = 'Введите имя и фамилию';
    if (f.phone.length < 9) e.phone = 'Введите номер телефона';
    else if (m.clients.some((c) => c.phone === f.phone)) e.phone = 'Этот номер уже зарегистрирован';
    if (f.address.trim().length < 5) e.address = 'Введите адрес';
    if (pw.length < 8) e.pw = 'Минимум 8 символов';
    setErr(e);
    if (Object.keys(e).length) return;
    const c = m.addClient({
      company: f.company.trim(), inn: f.inn, owner: f.owner.trim(), phone: f.phone, address: f.address.trim(), category: f.category,
      channel: bank, joined: 'bank', plan: 'base', services: {}, credentials: { login: f.phone, password: pw },
    });
    onCreated(c, pw);
  };

  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <div className="row gap-12 tm-two">
        <Field label="Компания" error={err.company}><Input value={f.company} onChange={(e) => set('company', e.target.value)} placeholder="ООО “Название”" error={!!err.company} /></Field>
        <Field label="ИНН" error={err.inn}><Input value={f.inn} onChange={(e) => set('inn', e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="9 цифр" error={!!err.inn} /></Field>
      </div>
      <Field label="Владелец (ФИО)" error={err.owner}><Input value={f.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Имя и фамилия" error={!!err.owner} /></Field>
      <div className="row gap-12 tm-two">
        <Field label="Категория"><Select value={f.category} onChange={(v) => set('category', v)} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Адрес" error={err.address}><Input value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Город, улица, дом" error={!!err.address} /></Field>
      </div>
      <div className="bc-access">
        <b className="t-sm">Доступ в Gluon</b>
        <Field label="Телефон (логин)" error={err.phone}><PhoneInput value={f.phone} onChange={(v) => set('phone', v)} error={!!err.phone} /></Field>
        <Field label="Пароль" error={err.pw}>
          <div className="row gap-8">
            <Input className="grow" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} error={!!err.pw} autoComplete="new-password"
              right={<button type="button" className="tm-eye" onClick={() => setShow((v) => !v)} aria-label="show">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
            <button type="button" className="btn btn-secondary" onClick={() => { setPw(genPassword()); setShow(true); }}><Wand2 size={16} /> Сгенерировать</button>
          </div>
        </Field>
      </div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>Создать клиента</button>
      </div>
    </div>
  );
}

/** Shown once after creating a client or resetting a password. */
export function CredentialsModal({ data, onClose }: { data: { company: string; login: string; password: string } | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = data ? `Gluon\nЛогин: ${formatPhone(data.login)}\nПароль: ${data.password}` : '';
  return (
    <Modal open={!!data} onClose={onClose} title="Данные для входа" width={440}>
      {data && (
        <div className="col gap-16" style={{ padding: 24 }}>
          <p className="t-sm muted">{data.company}. Пароль больше не будет показан — передайте его клиенту.</p>
          <div className="bc-cred">
            <div><span className="t-xs muted">Логин</span><b>{formatPhone(data.login)}</b></div>
            <div><span className="t-xs muted">Пароль</span><b className="mono-ish">{data.password}</b></div>
          </div>
          <div className="row gap-12">
            <button className="btn btn-secondary grow" onClick={() => { navigator.clipboard?.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Скопировано' : 'Скопировать'}
            </button>
            <button className="btn btn-primary grow" onClick={onClose}>Готово</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export const bankName = (bank: string) => CHANNEL_LABEL[bank as Channel] ?? bank;
