import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AlertTriangle, Bell, CalendarClock, CheckCheck, FileCheck2, Landmark, Link2, MessageCircle, RefreshCw } from 'lucide-react';
import { useClickOutside } from '../components/ui';
import { SERVICES } from '../data/mock';
import { useBilling } from '../lib/billing';

interface Note { id: string; icon: React.ReactNode; tone: string; title: string; text: string; time: string; to?: string; action?: () => void }
const KEY = 'gluon.notes.read';

export function Notifications({ onOpenBank, bankClient }: { onOpenBank: () => void; bankClient: boolean }) {
  const nav = useNavigate();
  const b = useBilling();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [read, setRead] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const persist = (ids: string[]) => { setRead(ids); try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* storage unavailable */ } };

  const notes = useMemo<Note[]>(() => {
    const list: Note[] = [];
    SERVICES.filter((s) => b.subs[s.id]?.status === 'unpaid').forEach((s) => list.push({
      id: `unpaid-${s.id}`, icon: <AlertTriangle size={16} />, tone: 'err', title: `Подписка ${s.name} не оплачена`,
      text: 'Сервис может быть приостановлен. Оплатите с баланса Gluon.', time: 'Сегодня', to: '/app/billing',
    }));
    SERVICES.filter((s) => b.linked[s.id] === 'link').forEach((s) => list.push({
      id: `link-${s.id}`, icon: <Link2 size={16} />, tone: 'warn', title: `Завершите подключение ${s.name}`,
      text: 'Подписка оплачена — осталось связать аккаунт.', time: 'Сегодня', to: '/app/store',
    }));
    list.push(
      { id: 'import-1', icon: <FileCheck2 size={16} />, tone: 'ok', title: 'Выписка распознана', text: 'vypiska_hayot_24-11.pdf · 24 операции добавлены', time: '2 часа назад', to: '/app/operations' },
      { id: 'chat-1', icon: <MessageCircle size={16} />, tone: 'info', title: 'Новое сообщение от Gluon Админ', text: 'Хорошо. Сравнивая все варианты через Gluon, я проведу вас…', time: '3 часа назад', to: '/app/chat' },
      { id: 'sync-billz', icon: <RefreshCw size={16} />, tone: 'info', title: 'Billz: данные синхронизированы', text: 'Обновлено 1 248 товаров и 312 продаж', time: 'Вчера', to: '/app/service/billz' },
      { id: 'charge-1', icon: <CalendarClock size={16} />, tone: 'muted', title: 'Скоро списание', text: `10.12.2026 — продление Robosell и Billz`, time: 'Вчера', to: '/app/billing' },
    );
    if (!bankClient) list.push({ id: 'bankreq-1', icon: <Landmark size={16} />, tone: 'warn', title: 'Anorbank: заявка на рассмотрении', text: 'Банк свяжется с вами в течение 1 рабочего дня', time: '22.11.2026', action: onOpenBank });
    return list;
  }, [b.subs, b.linked, bankClient, onOpenBank]);

  const unread = notes.filter((n) => !read.includes(n.id));
  const shown = tab === 'all' ? notes : unread;

  return (
    <div className="select" ref={ref}>
      <button className="icon-btn" aria-label="notifications" onClick={() => setOpen((o) => !o)}>
        <Bell size={18} />
        {unread.length > 0 && <span className="nt-count">{unread.length}</span>}
      </button>
      {open && (
        <div className="nt-pop">
          <div className="row between" style={{ padding: '14px 16px 10px' }}>
            <b style={{ fontSize: 16 }}>Уведомления</b>
            <button className="btn-link t-sm row gap-4" onClick={() => persist(notes.map((n) => n.id))} disabled={!unread.length}><CheckCheck size={14} /> Прочитать все</button>
          </div>
          <div className="tabs-line" style={{ padding: '0 12px' }}>
            <button className={clsx(tab === 'all' && 'active')} onClick={() => setTab('all')}>Все</button>
            <button className={clsx(tab === 'unread' && 'active')} onClick={() => setTab('unread')}>Непрочитанные {unread.length > 0 && <span className="nt-mini">{unread.length}</span>}</button>
          </div>
          <div className="nt-list">
            {shown.map((n) => (
              <button key={n.id} className={clsx('nt-item', !read.includes(n.id) && 'unread')} onClick={() => {
                persist(Array.from(new Set([...read, n.id])));
                setOpen(false);
                if (n.to) nav(n.to); else n.action?.();
              }}>
                <span className={`nt-ic ${n.tone}`}>{n.icon}</span>
                <span className="grow" style={{ textAlign: 'left', minWidth: 0 }}>
                  <b className="t-sm medium" style={{ display: 'block' }}>{n.title}</b>
                  <span className="t-xs muted nt-text">{n.text}</span>
                  <span className="t-xs muted-2">{n.time}</span>
                </span>
                {!read.includes(n.id) && <span className="nt-dot" />}
              </button>
            ))}
            {!shown.length && <div className="empty-state t-sm"><CheckCheck size={22} /> Все уведомления прочитаны</div>}
          </div>
        </div>
      )}
    </div>
  );
}
