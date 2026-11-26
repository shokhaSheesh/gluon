import { useState } from 'react';
import { Ban, Eye, EyeOff, KeyRound, Plus, ShieldCheck, Wand2 } from 'lucide-react';
import { Badge, BankLogo, BrandMark, ConfirmModal, Field, Input, Modal, Select } from '../../components/ui';
import { BANKS, SERVICES } from '../../data/mock';
import { SERVICE_IDS, useMerchant, type Partner } from '../../lib/merchant';
import { brandFor, useBranding } from '../../lib/branding';
import { useApp } from '../../lib/store';
import { genPassword } from './merchant/Team';
import './merchant/merchant.css';

const logoOf = (p: Partner) => {
  if (p.aggregator) return <BankLogo id={p.id} name={p.name} height={18} />;
  const s = SERVICES.find((x) => x.id === p.id);
  return <span className="row gap-8">{s && <BrandMark name={s.name} color={s.color} text={s.mark} size={28} />}<b>{p.name}</b></span>;
};

/**
 * Gluon admin: partner cabinets.
 * «Агрегатор» on → bank-type cabinet (white-label, services for its clients, creates clients); off → service cabinet (sees only its clients).
 */
export default function AdminPartners() {
  const { toast } = useApp();
  const m = useMerchant();
  const branding = useBranding();
  const [create, setCreate] = useState(false);
  const [block, setBlock] = useState<Partner | null>(null);
  const [issued, setIssued] = useState<{ name: string; login: string; password: string } | null>(null);
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'partners', action, target, details });
  const clientsOf = (p: Partner) => m.clients.filter((c) => (p.aggregator ? c.channel === p.id : !!c.services[p.id])).length;

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Партнёры</h1>
        <button className="btn btn-primary" onClick={() => setCreate(true)}><Plus size={16} /> Создать партнёра</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Партнёр</th><th>Тип</th><th>Логин</th><th>Домен</th><th>Клиенты</th><th>Создан</th><th>Статус</th><th /></tr></thead>
            <tbody>
              {m.partners.map((p) => (
                <tr key={p.id}>
                  <td>{logoOf(p)}</td>
                  <td>{p.aggregator ? <Badge kind="primary">Агрегатор</Badge> : <Badge kind="neutral">Сервис</Badge>}</td>
                  <td className="mono-ish">{p.login}</td>
                  <td className="t-sm">{p.subdomain ?? <span className="muted">—</span>}</td>
                  <td>{clientsOf(p)}</td>
                  <td>{p.created}</td>
                  <td>{p.status === 'active' ? <Badge kind="success">Активен</Badge> : <Badge kind="error">Заблокирован</Badge>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn sm" title="Сбросить пароль" aria-label="Сбросить пароль" onClick={() => {
                        const password = genPassword();
                        m.savePartner({ ...p, password });
                        log('Сбросил пароль партнёра', p.name);
                        setIssued({ name: p.name, login: p.login, password });
                      }}><KeyRound size={14} /></button>
                      {p.status === 'active'
                        ? <button className="icon-btn sm" title="Заблокировать" aria-label="Заблокировать" onClick={() => setBlock(p)}><Ban size={14} color="var(--error)" /></button>
                        : <button className="icon-btn sm" title="Разблокировать" aria-label="Разблокировать" onClick={() => { m.savePartner({ ...p, status: 'active' }); log('Разблокировал партнёра', p.name); toast('success', `${p.name} разблокирован`); }}><ShieldCheck size={14} /></button>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={create} onClose={() => setCreate(false)} title="Новый партнёр" width={500}>
        {create && <PartnerForm taken={m.partners.map((p) => p.id)} logins={m.partners.map((p) => p.login)} onClose={() => setCreate(false)} onSave={(p) => {
          m.savePartner(p);
          if (p.aggregator) branding.save(brandFor(branding.brands, p.id, p.name));
          log('Создал партнёра', p.name, p.aggregator ? `Агрегатор · ${p.subdomain}` : `Сервис · логин ${p.login}`);
          setCreate(false);
          setIssued({ name: p.name, login: p.login, password: p.password });
        }} />}
      </Modal>
      <ConfirmModal open={!!block} onClose={() => setBlock(null)} confirmText="Заблокировать" text={block ? `Заблокировать ${block.name}? Сотрудники партнёра не смогут войти в кабинет.` : ''}
        onConfirm={() => { if (block) { m.savePartner({ ...block, status: 'blocked' }); log('Заблокировал партнёра', block.name); toast('success', `${block.name} заблокирован`); } setBlock(null); }} />
      <Modal open={!!issued} onClose={() => setIssued(null)} title="Доступ в кабинет" width={420}>
        {issued && (
          <div className="col gap-16" style={{ padding: 24 }}>
            <p className="t-sm muted">{issued.name}. Пароль больше не будет показан.</p>
            <div className="bc-cred"><div><span className="t-xs muted">Логин</span><b>{issued.login}</b></div><div><span className="t-xs muted">Пароль</span><b className="mono-ish">{issued.password}</b></div></div>
            <button className="btn btn-primary" onClick={() => setIssued(null)}>Готово</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PartnerForm({ taken, logins, onClose, onSave }: { taken: string[]; logins: string[]; onClose: () => void; onSave: (p: Partner) => void }) {
  const [aggregator, setAggregator] = useState(true);
  const banks = BANKS.filter((b) => !taken.includes(b.id));
  const services = SERVICES.filter((s) => SERVICE_IDS.includes(s.id) && !taken.includes(s.id));
  const options = aggregator ? banks.map((b) => ({ value: b.id, label: b.name })) : services.map((s) => ({ value: s.id, label: s.name }));
  const [org, setOrg] = useState(options[0]?.value ?? '');
  const [login, setLogin] = useState('');
  const [pw, setPw] = useState(genPassword);
  const [show, setShow] = useState(true);
  const [err, setErr] = useState('');
  const name = (aggregator ? banks.find((b) => b.id === org)?.name : services.find((s) => s.id === org)?.name) ?? '';

  const switchType = (v: boolean) => {
    setAggregator(v);
    const first = v ? banks[0]?.id : services[0]?.id;
    setOrg(first ?? '');
    setErr('');
  };

  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <label className="ap-check">
        <input type="checkbox" checked={aggregator} onChange={(e) => switchType(e.target.checked)} />
        <span><b>Агрегатор</b><br /><span className="t-sm muted">Свой брендинг и домен, выбирает сервисы для клиентов, создаёт клиентов</span></span>
      </label>
      <Field label={aggregator ? 'Банк' : 'Сервис'}>
        {options.length
          ? <Select value={org} onChange={(v) => { setOrg(v); setErr(''); }} options={options} />
          : <p className="t-sm muted">Все {aggregator ? 'банки' : 'сервисы'} уже подключены</p>}
      </Field>
      {aggregator && org && <Field label="Домен"><Input value={`${org}.gluon.uz`} disabled /></Field>}
      <Field label="Логин администратора" error={err}><Input value={login} onChange={(e) => { setLogin(e.target.value.trim().toLowerCase()); setErr(''); }} placeholder={org || 'login'} error={!!err} /></Field>
      <Field label="Пароль">
        <div className="row gap-8">
          <Input className="grow" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)}
            right={<button type="button" className="tm-eye" onClick={() => setShow((v) => !v)} aria-label="show">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
          <button type="button" className="btn btn-secondary" onClick={() => { setPw(genPassword()); setShow(true); }}><Wand2 size={16} /> Сгенерировать</button>
        </div>
      </Field>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" disabled={!org} onClick={() => {
          const l = login || org;
          if (!/^[a-z0-9._-]{3,}$/.test(l)) { setErr('Минимум 3 символа: латиница, цифры, . _ -'); return; }
          if (logins.includes(l)) { setErr('Такой логин уже есть'); return; }
          if (pw.length < 8) { setErr('Пароль — минимум 8 символов'); return; }
          onSave({ id: org, name, aggregator, login: l, password: pw, status: 'active', created: new Date().toLocaleDateString('ru-RU'), subdomain: aggregator ? `${org}.gluon.uz` : undefined });
        }}>Создать</button>
      </div>
    </div>
  );
}
