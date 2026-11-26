import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Archive, ArrowLeftRight, CreditCard, Home, Landmark, MessageCircle, MoreHorizontal, ShoppingBag, User } from 'lucide-react';
import { ServiceSwitcher } from './ServiceSwitcher';

/** Phone navigation (Figma mobile frames use a bottom navbar). */
export function MobileTabBar({ bankClient, onProfile }: { bankClient: boolean; onProfile: () => void }) {
  const nav = useNavigate();
  const [more, setMore] = useState(false);
  const go = (to: string) => { setMore(false); nav(to); };
  return (
    <>
      <nav className="u-tabbar">
        <NavLink to="/app" end className={({ isActive }) => clsx('u-tab', isActive && 'active')}><Home size={22} /><span>Главная</span></NavLink>
        <ServiceSwitcher tab />
        <NavLink to="/app/operations" className={({ isActive }) => clsx('u-tab', isActive && 'active')}><ArrowLeftRight size={22} /><span>Операции</span></NavLink>
        <NavLink to="/app/archive" className={({ isActive }) => clsx('u-tab', isActive && 'active')}><Archive size={22} /><span>Архив</span></NavLink>
        <button className={clsx('u-tab', more && 'active')} onClick={() => setMore((m) => !m)}><MoreHorizontal size={22} /><span>Ещё</span></button>
      </nav>
      {more && (
        <>
          <div className="sheet-backdrop" onClick={() => setMore(false)} />
          <div className="svc-pop sheet">
            <p className="svc-label">Разделы</p>
            <div className="col">
              <button className="menu-item" onClick={() => go('/app/store')}><ShoppingBag size={18} /> Магазин Gluon</button>
              {!bankClient && <button className="menu-item" onClick={() => go('/app/banking')}><Landmark size={18} /> Предложения банков</button>}
              <button className="menu-item" onClick={() => go('/app/billing')}><CreditCard size={18} /> Подписки и тарифы</button>
              <button className="menu-item" onClick={() => go('/app/chat')}><MessageCircle size={18} /> Чат поддержки</button>
              <button className="menu-item" onClick={() => { setMore(false); onProfile(); }}><User size={18} /> Профиль и настройки</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
