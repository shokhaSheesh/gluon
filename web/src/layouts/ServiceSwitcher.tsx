import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Check, ChevronDown, LayoutGrid, Plus, Search } from 'lucide-react';
import { BrandMark, useClickOutside } from '../components/ui';
import { SERVICES } from '../data/mock';
import { useBilling } from '../lib/billing';

/**
 * One nav pill for all connected services: scales to any number of integrations.
 * Shows the current service when one is open; the popover has search and quick switching.
 */
export function ServiceSwitcher({ tab = false }: { tab?: boolean }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const input = useRef<HTMLInputElement>(null);

  const { linked } = useBilling();
  const connected = SERVICES.filter((s) => linked[s.id] === 'connected');
  const pending = SERVICES.filter((s) => linked[s.id] === 'review' || linked[s.id] === 'link');
  const currentId = pathname.startsWith('/app/service/') ? pathname.split('/')[3] : null;
  const current = connected.find((s) => s.id === currentId);
  const list = connected.filter((s) => (s.name + s.type).toLowerCase().includes(q.toLowerCase()));

  useEffect(() => { if (open) { setQ(''); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  const go = (id: string) => { nav(`/app/service/${id}`); setOpen(false); };

  return (
    <div className="svc" ref={ref}>
      {tab ? (
        <button className={clsx('u-tab', (current || open) && 'active')} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {current ? <BrandMark name={current.name} color={current.color} text={current.mark} size={22} /> : <LayoutGrid size={22} />}
          <span>{current ? current.name : 'Сервисы'}</span>
        </button>
      ) : (
        <button className={clsx('u-pill', current && 'active', open && !current && 'open')} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {current ? <BrandMark name={current.name} color={current.color} text={current.mark} size={18} /> : <LayoutGrid size={16} />}
          {current ? current.name : 'Сервисы'}
          {!current && <span className="svc-count">{connected.length}</span>}
          <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: '.15s' }} />
        </button>
      )}
      {open && tab && <div className="sheet-backdrop" onClick={() => setOpen(false)} />}

      {open && (
        <div className={clsx('svc-pop', tab && 'sheet')}>
          <div className="svc-search">
            <Search size={16} />
            <input
              ref={input}
              placeholder="Найти сервис"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && list[0]) go(list[0].id); if (e.key === 'Escape') setOpen(false); }}
            />
          </div>
          <p className="svc-label">Подключённые · {connected.length}</p>
          <div className="svc-grid">
            {list.map((s) => (
              <button key={s.id} className={clsx('svc-item', s.id === currentId && 'active')} onClick={() => go(s.id)}>
                <BrandMark name={s.name} color={s.color} text={s.mark} size={34} />
                <span className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                  <b className="t-sm medium" style={{ display: 'block' }}>{s.name}</b>
                  <span className="t-xs muted">{s.type}</span>
                </span>
                {s.id === currentId && <Check size={16} color="var(--primary)" />}
              </button>
            ))}
            {!list.length && <p className="t-sm muted" style={{ padding: 12 }}>Ничего не найдено</p>}
          </div>
          {!!pending.length && !q && (
            <>
              <p className="svc-label">Ожидают подключения</p>
              <div className="svc-grid">
                {pending.map((s) => (
                  <div key={s.id} className="svc-item disabled">
                    <BrandMark name={s.name} color={s.color} text={s.mark} size={34} />
                    <span className="grow"><b className="t-sm medium" style={{ display: 'block' }}>{s.name}</b><span className="t-xs muted">{linked[s.id] === 'link' ? 'Завершите подключение в Магазине' : 'Ожидает подтверждения сервиса'}</span></span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button className="svc-add" onClick={() => { nav('/app/store'); setOpen(false); }}><Plus size={16} /> Подключить новый сервис</button>
        </div>
      )}
    </div>
  );
}
