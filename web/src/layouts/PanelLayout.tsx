import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeftRight, HardDrive, ListTree, FileText, GalleryHorizontal, CalendarCheck, Handshake, Landmark, Repeat, Tags, History, PanelLeftClose, PanelLeftOpen, CreditCard, Palette, LayoutGrid, LogOut, Building2, MessagesSquare, Users, Blocks, Link2, UserCog, KeyRound, User, X } from 'lucide-react';
import { Badge, ConfirmModal, Field, Input, LangSelect, Logo, Modal, PasswordInput, PhoneInput, ThemeToggle } from '../components/ui';
import { useApp, type Platform } from '../lib/store';
import { chatContactIds, currentActor, orgOf, useMerchant, type Employee } from '../lib/merchant';
import './panel.css';

export default function PanelLayout({ platform }: { platform: Exclude<Platform, 'user'> }) {
  const { t, session, logout } = useApp();
  const nav = useNavigate();
  const [confirmOut, setConfirmOut] = useState(false);
  const [profile, setProfile] = useState<null | 'profile' | 'password'>(null);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('gluon.panel.collapsed') === '1'; } catch { return false; } });
  const toggleSide = () => setCollapsed((c) => { try { localStorage.setItem('gluon.panel.collapsed', c ? '0' : '1'); } catch { /* storage unavailable */ } return !c; });
  const base = platform === 'admin' ? '/admin' : '/merchant';
  const mer = useMerchant();
  const pendingConn = mer.connRequests.filter((r) => r.status === 'pending' && r.service === session?.orgId).length;
  const { kind: mKind, org: mOrg } = orgOf(session);
  const team = mer.teamOf(mOrg, mKind);
  const me = team?.employees.find((e) => e.name === currentActor(team)) ?? null;
  const newAccReq = platform === 'admin' ? mer.accountRequests.filter((r) => r.status === 'new').length : 0;
  const unreadChats = mer.unreadChats(session?.orgId ?? 'admin', chatContactIds(mer.clients, session?.platform, session?.kind, session?.orgId).ids).length;

  type Link = { to: string; label: string; icon: React.ReactNode; end?: boolean; badge?: number };
  const m = '/merchant';
  // Each cabinet gets only the sections that match its data (see task list).
  // grouped by importance; section titles are hidden when the sidebar is collapsed
  type Section = { title?: string; links: Link[] };
  const L = {
    dash: (to: string): Link => ({ to, end: true, label: t('dashboard'), icon: <LayoutGrid size={20} /> }),
    chat: (to: string): Link => ({ to: `${to}/chat`, label: t('chat'), icon: <MessagesSquare size={20} />, badge: unreadChats }),
    team: (to: string): Link => ({ to: `${to}/team`, label: 'Сотрудники и роли', icon: <UserCog size={20} /> }),
    audit: (to: string): Link => ({ to: `${to}/audit`, label: 'Журнал действий', icon: <History size={20} /> }),
  };
  const sections: Section[] = platform === 'admin' ? [
    { links: [L.dash(base)] },
    { title: 'Клиенты', links: [
      { to: `${base}/companies`, label: t('companies'), icon: <Building2 size={20} /> },
      { to: `${base}/subscriptions`, label: 'Подписки', icon: <Repeat size={20} /> },
      { to: `${base}/account-requests`, label: 'Заявки на счёт', icon: <FileText size={20} />, badge: newAccReq },
      { to: `${base}/storage`, label: 'Хранилище', icon: <HardDrive size={20} /> },
    ] },
    { title: 'Финансы', links: [
      { to: `${base}/payments`, label: 'Платежи', icon: <CreditCard size={20} /> },
      { to: `${base}/operations`, label: 'Операции', icon: <ArrowLeftRight size={20} /> },
      { to: `${base}/pricing`, label: 'Тарифы', icon: <Tags size={20} /> },
    ] },
    { title: 'Партнёры', links: [
      { to: `${base}/partners`, label: 'Партнёры', icon: <Handshake size={20} /> },
      { to: `${base}/services`, label: 'Сервисы', icon: <Blocks size={20} /> },
      { to: `${base}/banks`, label: 'Банки', icon: <Landmark size={20} /> },
      { to: `${base}/bank-products`, label: 'Продукты банков', icon: <ListTree size={20} /> },
    ] },
    { title: 'Магазин', links: [
      { to: `${base}/banners`, label: 'Баннеры', icon: <GalleryHorizontal size={20} /> },
    ] },
    { title: 'Поддержка', links: [L.chat(base)] },
    { title: 'Настройки', links: [L.team(base), L.audit(base)] },
  ] : session?.kind === 'bank' ? [
    { links: [L.dash(m)] },
    { title: 'Клиенты', links: [
      { to: `${m}/clients`, label: 'Клиенты', icon: <Users size={20} /> },
      { to: `${m}/services`, label: 'Сервисы для клиентов', icon: <Blocks size={20} /> },
    ] },
    { title: 'Поддержка', links: [L.chat(m)] },
    { title: 'Настройки', links: [{ to: `${m}/branding`, label: 'Брендинг', icon: <Palette size={20} /> }, L.team(m), L.audit(m)] },
  ] : [
    { links: [L.dash(m)] },
    { title: 'Клиенты', links: [
      { to: `${m}/clients`, label: 'Клиенты', icon: <Users size={20} /> },
      { to: `${m}/subscriptions`, label: 'Подписки', icon: <CalendarCheck size={20} /> },
      { to: `${m}/requests`, label: 'Заявки на подключение', icon: <Link2 size={20} />, badge: pendingConn },
    ] },
    { title: 'Поддержка', links: [L.chat(m)] },
    { title: 'Настройки', links: [L.team(m), L.audit(m)] },
  ];

  return (
    <div className={clsx('p-shell', collapsed && 'collapsed')}>
      <aside className="p-side">
        <div className="p-logo">{collapsed ? <LogoMark /> : <Logo light size={30} />}</div>
        <p className="p-role">{platform === 'admin' ? 'Gluon Админ' : session?.kind === 'bank' ? 'Кабинет банка' : 'Кабинет сервиса'}</p>
        <nav className="p-nav">
          {sections.map((sec, i) => (
            <div key={sec.title ?? i} className="p-sec">
              {sec.title && <p className="p-sec-title">{sec.title}</p>}
              {sec.links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end} title={collapsed ? l.label : undefined} className={({ isActive }) => clsx('p-link', isActive && 'active')}>
                  {l.icon}<span className="grow p-label">{l.label}</span>
                  {!!l.badge && <span className="p-badge">{l.badge}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button className="p-link" style={{ marginTop: 'auto' }} title={collapsed ? t('exit') : undefined} onClick={() => setConfirmOut(true)}><LogOut size={20} /> <span className="p-label">{t('exit')}</span></button>
      </aside>
      <div className="p-main">
        <header className="p-top">
          <div className="row gap-12">
            <button className="icon-btn p-collapse" onClick={toggleSide} aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'} title={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>
              {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          <div className="row gap-12">
            <ThemeToggle />
            <LangSelect compact />
            <button className="row gap-8" style={{ background: 'none', border: 'none', color: 'var(--text)' }} onClick={() => setProfile('profile')}>
              <span className="avatar sm">{me ? me.name.split(' ').map((x) => x[0]).join('').slice(0, 2) : <User size={16} />}</span>
              <span className="col" style={{ alignItems: 'flex-start', lineHeight: 1.2 }}>
                <b className="t-sm medium">{me ? me.name : 'Даулетмуратов Ахмет'}</b>
                {me && <span className="t-xs muted">{session?.name}</span>}
              </span>
            </button>
          </div>
        </header>
        <main className="p-content"><Outlet /></main>
      </div>

      <Modal open={!!profile} onClose={() => setProfile(null)} width={760}>
        {profile && <PanelProfile me={me} roleName={team?.roles.find((r) => r.id === me?.roleId)?.name} org={session?.name}
          onSaveMe={(e) => { if (team) mer.setTeam(mOrg, { ...team, employees: team.employees.map((x) => (x.id === e.id ? e : x)) }); }}
          section={profile} onSection={setProfile} onClose={() => setProfile(null)} onLogout={() => { setProfile(null); setConfirmOut(true); }} />}
      </Modal>
      <ConfirmModal open={confirmOut} onClose={() => setConfirmOut(false)} onConfirm={() => { logout(); nav('/login'); }} text={t('logoutAsk')} confirmText={t('exit')} />
    </div>
  );
}

/** Profile of the signed-in person: an employee of the merchant (from «Сотрудники и роли») or the Gluon admin. */
function PanelProfile({ me, roleName, org, onSaveMe, section, onSection, onClose, onLogout }: {
  me: Employee | null; roleName?: string; org?: string; onSaveMe: (e: Employee) => void;
  section: 'profile' | 'password'; onSection: (s: 'profile' | 'password') => void; onClose: () => void; onLogout: () => void;
}) {
  const { toast } = useApp();
  const [f, setF] = useState({ fio: me?.name ?? 'Даулетмуратов Ахмет Кубейсинович', login: me?.login ?? 'admin', phone: me?.phone ?? '907025329' });
  const [pw, setPw] = useState({ cur: '', p1: '', p2: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  return (
    <div className="pm" style={{ minHeight: 420 }}>
      <aside className="pm-side">
        <button className="icon-btn sm" style={{ border: 'none', background: 'transparent', marginBottom: 8 }} onClick={onClose} aria-label="close"><X size={18} /></button>
        <button className={clsx('pm-link', section === 'profile' && 'active')} onClick={() => onSection('profile')}><User size={18} /> Профиль</button>
        <button className={clsx('pm-link', section === 'password' && 'active')} onClick={() => onSection('password')}><KeyRound size={18} /> Изменить пароль</button>
        <button className="pm-link danger" style={{ marginTop: 'auto' }} onClick={onLogout}><LogOut size={18} /> Выйти с аккаунта</button>
      </aside>
      <section className="pm-body">
        {section === 'profile' ? (
          <>
            <h2 className="h4">Профиль</h2>
            <div className="col gap-16 pm-form">
              {me && (
                <div className="pp-head">
                  <span className="pp-avatar">{f.fio.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>
                  <div className="col gap-4"><b>{org}</b><span className="row gap-6">{roleName && <Badge kind={me.roleId === 'owner' ? 'primary' : 'neutral'}>{roleName}</Badge>}</span></div>
                </div>
              )}
              <Field label="ФИО"><Input placeholder="Введите ФИО" value={f.fio} onChange={(e) => setF({ ...f, fio: e.target.value })} /></Field>
              <Field label="Логин"><Input value={f.login} disabled /></Field>
              <Field label="Телефон номер"><PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} /></Field>
            </div>
            <div className="pm-foot">
              <button className="btn btn-secondary" onClick={onClose}>Назад</button>
              <button className="btn btn-primary" onClick={() => {
                if (f.fio.trim().split(/\s+/).length < 2 || f.phone.length < 9) { toast('error', 'Не удалось сохранить.'); return; }
                if (me) onSaveMe({ ...me, name: f.fio.trim(), phone: f.phone });
                toast('success', 'Изменения успешно сохранены.');
              }}>Сохранить</button>
            </div>
          </>
        ) : (
          <>
            <h2 className="h4">Изменение пароля</h2>
            <div className="col gap-16 pm-form">
              <Field label="Текущий пароль" error={err.cur}><PasswordInput placeholder="Введите текущий пароль" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} error={!!err.cur} /></Field>
              <Field label="Новый пароль" error={err.p1}><PasswordInput placeholder="Введите новый пароль" value={pw.p1} onChange={(e) => setPw({ ...pw, p1: e.target.value })} error={!!err.p1} /></Field>
              <Field label="Подтвердить новый пароль" error={err.p2}><PasswordInput placeholder="Подтвердите новый пароль" value={pw.p2} onChange={(e) => setPw({ ...pw, p2: e.target.value })} error={!!err.p2} /></Field>
            </div>
            <div className="pm-foot">
              <button className="btn btn-secondary" onClick={onClose}>Назад</button>
              <button className="btn btn-primary" onClick={() => {
                const e: Record<string, string> = {};
                if (pw.cur.length < 4) e.cur = 'Неверный текущий пароль';
                if (pw.p1.length < 8) e.p1 = 'Не соответствует требованиям';
                if (pw.p1 !== pw.p2) e.p2 = 'Пароли не совпадают';
                setErr(e);
                if (Object.keys(e).length) toast('error', 'Не удалось изменить пароль.');
                else { toast('success', 'Пароль успешно обновлён.'); setPw({ cur: '', p1: '', p2: '' }); }
              }}>Изменить</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/** The «G» of the wordmark — shown when the sidebar is collapsed. */
function LogoMark() {
  return <span className="p-logomark">G</span>;
}
