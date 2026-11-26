import { useState } from 'react';
import clsx from 'clsx';
import { Ban, KeyRound, Plus, ShieldCheck } from 'lucide-react';
import { Badge, BankLogo, BrandMark, ConfirmModal, Modal } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { SERVICE_IDS, registerPartner, useMerchant, type Partner } from '../../lib/merchant';
import { brandFor, useBranding } from '../../lib/branding';
import { useApp } from '../../lib/store';
import { genPassword } from './merchant/Team';
import { BankForm, ServiceForm } from './AdminForms';
import { useCreateService } from './AdminServices';
import './merchant/merchant.css';

type Kind = 'bank' | 'service';
const logoOf = (p: Partner) => {
  if (p.aggregator) return <BankLogo id={p.id} name={p.name} height={18} />;
  const s = SERVICES.find((x) => x.id === p.id);
  return <span className="row gap-8">{s && <BrandMark name={s.name} color={s.color} text={s.mark} size={28} />}<b>{p.name}</b></span>;
};

/** Gluon admin: partner cabinets — banks (white-label, own domain, create clients) and services (see only their clients). */
export default function AdminPartners() {
  const { toast } = useApp();
  const m = useMerchant();
  const branding = useBranding();
  const createService = useCreateService();
  const [tab, setTab] = useState<Kind>('bank');
  const [create, setCreate] = useState<Kind | null>(null);
  const [block, setBlock] = useState<Partner | null>(null);
  const [issued, setIssued] = useState<{ name: string; login: string; password: string } | null>(null);
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'partners', action, target, details });
  const clientsOf = (p: Partner) => m.clients.filter((c) => (p.aggregator ? c.channel === p.id : !!c.services[p.id])).length;
  const list = m.partners.filter((p) => (tab === 'bank' ? p.aggregator : !p.aggregator));
  const ids = [...m.partners.map((p) => p.id), ...SERVICE_IDS];
  const logins = m.partners.map((p) => p.login);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Партнёры</h1>
        <button className="btn btn-primary" onClick={() => setCreate(tab)}><Plus size={16} /> {tab === 'bank' ? 'Добавить банк' : 'Добавить сервис'}</button>
      </div>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        <button className={clsx(tab === 'bank' && 'active')} onClick={() => setTab('bank')}>Банки <span className="op-tabcount">{m.partners.filter((p) => p.aggregator).length}</span></button>
        <button className={clsx(tab === 'service' && 'active')} onClick={() => setTab('service')}>Сервисы <span className="op-tabcount">{m.partners.filter((p) => !p.aggregator).length}</span></button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{tab === 'bank' ? 'Банк' : 'Сервис'}</th><th>Логин</th>{tab === 'bank' && <th>Домен</th>}<th>Клиенты</th><th>Создан</th><th>Статус</th><th /></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{logoOf(p)}</td>
                  <td className="mono-ish">{p.login}</td>
                  {tab === 'bank' && <td className="t-sm">{p.subdomain}</td>}
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
              {!list.length && <tr><td colSpan={7}><div className="empty-state">Партнёров нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!create} onClose={() => setCreate(null)} title="Новый партнёр" width={560}>
        {create && (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <div className="tabs-seg block">
                <button className={clsx(create === 'bank' && 'active')} onClick={() => setCreate('bank')}>Банк</button>
                <button className={clsx(create === 'service' && 'active')} onClick={() => setCreate('service')}>Сервис</button>
              </div>
            </div>
            {create === 'bank'
              ? <BankForm takenIds={ids} takenLogins={logins} onClose={() => setCreate(null)} onSave={(d) => {
                  const p: Partner = { id: d.id, name: d.name, aggregator: true, login: d.login, password: d.password, status: 'active', created: new Date().toLocaleDateString('ru-RU'), subdomain: d.subdomain, logo: d.logo };
                  registerPartner(p);
                  m.savePartner(p);
                  branding.save({ ...brandFor(branding.brands, d.id, d.name), subdomain: d.subdomain, logo: d.logo });
                  log('Добавил банк', d.name, d.subdomain);
                  setCreate(null); setTab('bank');
                  setIssued({ name: d.name, login: d.login, password: d.password });
                }} />
              : <ServiceForm takenIds={ids} takenLogins={logins} onClose={() => setCreate(null)} onSave={(d) => {
                  createService(d);
                  setCreate(null); setTab('service');
                  setIssued({ name: d.svc.name, login: d.login!, password: d.password! });
                }} />}
          </>
        )}
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
