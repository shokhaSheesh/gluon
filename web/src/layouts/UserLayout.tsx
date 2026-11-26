import { createContext, useCallback, useContext, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Home, KeyRound, Landmark, LogOut, MessageCircle, Plus, Search, Archive, ShoppingBag, User, Wallet, Send, Camera, Moon, Sun, ArrowLeftRight, CreditCard } from 'lucide-react';
import { ConfirmModal, LangSelect, Logo, useClickOutside } from '../components/ui';
import { BANKS } from '../data/mock';
import { ServiceSwitcher } from './ServiceSwitcher';
import { Notifications } from './Notifications';
import { MobileTabBar } from './MobileTabBar';
import { useBilling } from '../lib/billing';
import { brandFor, useApplyBrand, useBranding } from '../lib/branding';
import { useApp } from '../lib/store';
import ProfileModal, { type ProfileSection } from '../pages/user/ProfileModal';
import TopUpModal from '../pages/user/TopUpModal';
import './user.css';

interface ShellCtx {
  openProfile: (s?: ProfileSection) => void;
  openTopUp: () => void;
  balance: number;
}
const Ctx = createContext<ShellCtx>({ openProfile: () => {}, openTopUp: () => {}, balance: 0 });
export const useShell = () => useContext(Ctx);

export default function UserLayout() {
  const { t, session, logout, theme, setTheme } = useApp();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [profile, setProfile] = useState<ProfileSection | null>(null);
  const [topUp, setTopUp] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmOut, setConfirmOut] = useState(false);
  const billing = useBilling();
  const balance = billing.balance;
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenu(false));
  const isBankClient = session?.kind === 'bank';
  const bank = BANKS.find((b) => b.id === session?.orgId);
  const { brands, logoOf } = useBranding();
  const brand = isBankClient && session?.orgId ? brandFor(brands, session.orgId, session.org) : undefined;
  useApplyBrand(brand);

  const doLogout = () => { logout(); nav('/login'); };
  const openBank = useCallback(() => setProfile('bank'), []);

  return (
    <Ctx.Provider value={{ openProfile: (s = 'profile') => setProfile(s), openTopUp: () => setTopUp(true), balance }}>
      <div className="u-shell">
        <header className="u-header">
          <div className="u-header-in">
            <NavLink to="/app" className="row gap-12">
              {brand ? (
                <span className="brand-logo" title={brand.name}><img src={logoOf(brand)} alt={brand.name} /></span>
              ) : <Logo size={28} />}
            </NavLink>
            <nav className="u-nav">
              <NavLink to="/app" end className={({ isActive }) => clsx('u-pill', isActive && 'active')}>
                <Home size={16} /> {t('home')}
              </NavLink>
              <ServiceSwitcher />
              <NavLink to="/app/operations" className={({ isActive }) => clsx('u-pill', isActive && 'active')}>
                <ArrowLeftRight size={16} /> Операции
              </NavLink>
              {!isBankClient && (
                <NavLink to="/app/banking" className={({ isActive }) => clsx('u-pill', isActive && 'active')}>
                  <Landmark size={16} /> Предложения банков
                </NavLink>
              )}
              <NavLink to="/app/archive" className={({ isActive }) => clsx('u-pill', isActive && 'active')}>
                <Archive size={16} /> {t('archive')}
              </NavLink>
              <NavLink to="/app/store" className={({ isActive }) => clsx('u-pill', isActive && 'active')}>
                <ShoppingBag size={16} /> {t('store')}
              </NavLink>
            </nav>

            <div className="u-right">
              <label className="u-search">
                <Search size={16} />
                <input placeholder={t('search')} />
              </label>
              <button className="u-balance" onClick={() => setTopUp(true)} title="Пополнить баланс">
                <Wallet size={18} color="var(--secondary)" />
                <span className="col" style={{ alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span className="t-xs muted">Баланс</span>
                  <b className="t-sm">{balance.toLocaleString('ru-RU')} сум</b>
                </span>
                <span className="u-balance-plus"><Plus size={14} /></span>
              </button>
              <LangSelect compact />
              <Notifications bankClient={isBankClient} onOpenBank={openBank} />
              <div className="select" ref={menuRef}>
                <button className="avatar" style={{ border: 'none' }} onClick={() => setMenu((m) => !m)} aria-label="profile menu">
                  {session?.name.split(' ').map((x) => x[0]).slice(0, 2).join('')}
                </button>
                {menu && (
                  <div className="menu right" style={{ width: 230 }}>
                    <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <b className="t-sm">{session?.name}</b>
                      <p className="t-xs muted">Company Owner{isBankClient && bank ? ` · клиент ${bank.name}` : ""}</p>
                    </div>
                    <button className="menu-item" onClick={() => { setProfile('profile'); setMenu(false); }}><User size={16} /> {t('profile')}</button>
                    <button className="menu-item" onClick={() => { nav('/app/billing'); setMenu(false); }}><CreditCard size={16} /> Подписки и тарифы</button>
                    <button className="menu-item" onClick={() => { setProfile('password'); setMenu(false); }}><KeyRound size={16} /> Изменить пароль</button>
                    <button className="menu-item" onClick={() => { setProfile('bank'); setMenu(false); }}><Landmark size={16} /> Банк аккаунт</button>
                    <button className="menu-item" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
                    </button>
                    <button className="menu-item danger" onClick={() => { setConfirmOut(true); setMenu(false); }}><LogOut size={16} /> {t('logout')}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="u-main">
          <Outlet />
        </main>

        <footer className="u-footer">
          <div className="u-footer-in">
            <div className="col gap-12">
              {brand ? <span className="brand-logo"><img src={logoOf(brand)} alt={brand.name} style={{ height: 32 }} /></span> : <Logo size={32} />}
              {brand && <p className="t-xs muted">{brand.name} · работает на платформе Gluon</p>}
              <p className="t-sm medium">пр. Амира Темура 129Б</p>
              <div className="row gap-12">
                {[<Camera size={18} key="ig" />, <b key="fb" style={{ fontSize: 17 }}>f</b>, <Send size={17} key="tg" />, <b key="in" style={{ fontSize: 14 }}>in</b>].map((icon, i) => (
                  <a key={i} className="u-social" href="#" onClick={(e) => e.preventDefault()}>{icon}</a>
                ))}
              </div>
              <p className="t-sm">{t('rights')} © 2026 Gluon</p>
            </div>
            <div className="col gap-12 t-sm">
              <a href="#">О нас</a>
              <a href="#">Контакты</a>
              <a href="#">Условия оплаты и доставки</a>
              <a href="#">Политика конфиденциальности</a>
            </div>
          </div>
        </footer>

        <MobileTabBar bankClient={isBankClient} onProfile={() => setProfile('profile')} />
        {pathname !== '/app/chat' && (
          <button className="fab" onClick={() => nav('/app/chat')} aria-label="support chat"><MessageCircle size={32} /></button>
        )}
      </div>

      <ProfileModal
        section={profile}
        onSection={setProfile}
        onClose={() => setProfile(null)}
        onLogout={() => { setProfile(null); setConfirmOut(true); }}
        onTopUp={() => setTopUp(true)}
        balance={balance}
      />
      <TopUpModal open={topUp} onClose={() => setTopUp(false)} onSuccess={(amt) => billing.topUp(amt)} />
      <ConfirmModal open={confirmOut} onClose={() => setConfirmOut(false)} onConfirm={doLogout} text={t('logoutAsk')} confirmText={t('exit')} />
    </Ctx.Provider>
  );
}
