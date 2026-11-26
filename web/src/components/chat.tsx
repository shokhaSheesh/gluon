import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronLeft, Copy, Paperclip, Phone, Reply, Smile, X } from 'lucide-react';
import { CHAT_MESSAGES, type ChatMsg } from '../data/mock';
import './chat.css';

export interface Contact { id: string; name: string; avatar: ReactNode; sub: string; time: string; unread?: number; phone?: string }

type Msg = ChatMsg & { replyTo?: number; by?: string };
/** Merchant cabinet: our messages are signed with the employee's name (the client never sees it). */
export interface ChatStaff { me: string; team: string[] }

/** Chat thread with reply-to-message: hover a message → «Ответить», the quote is shown above the reply. */
export function ChatWindow({ contact, seed = CHAT_MESSAGES, header, onBack, staff, onSend }: {
  contact: Contact; seed?: ChatMsg[]; header?: ReactNode; onBack?: () => void; staff?: ChatStaff; onSend?: (text: string, isReply: boolean) => void;
}) {
  const autoReply = staff ? 'Спасибо, понял!' : 'Спасибо! Ваше сообщение получено, специалист ответит в ближайшее время.';
  const initial = (): Msg[] => seed.map((m, i) => ({
    ...m,
    replyTo: m.id === 4 ? (staff ? 3 : 2) : undefined, // demo: one reply in the history
    by: m.me && staff ? staff.team[(i + contact.id.length) % staff.team.length] : undefined,
  }));
  const who = (m: Msg) => (m.me ? (staff ? m.by ?? staff.me : 'Вы') : contact.name);
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState('');
  const [reply, setReply] = useState<Msg | null>(null);
  const [flash, setFlash] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const refs = useRef<Record<number, HTMLDivElement | null>>({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setMsgs(initial()); setReply(null); }, [contact.id, seed]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [msgs]);

  const byId = (id?: number) => msgs.find((m) => m.id === id);
  const startReply = (m: Msg) => { setReply(m); input.current?.focus(); };
  const jumpTo = (id: number) => {
    refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(id);
    setTimeout(() => setFlash(null), 1200);
  };

  const send = () => {
    if (!text.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const id = Date.now();
    setMsgs((m) => [...m, { id, me: true, text: text.trim(), time, replyTo: reply?.id, by: staff?.me }]);
    onSend?.(text.trim(), !!reply);
    setText('');
    setReply(null);
    setTimeout(() => setMsgs((m) => [...m, { id: id + 1, me: false, text: autoReply, time, replyTo: id }]), 900);
  };

  return (
    <div className="cw">
      {header ?? (
        <div className="cw-head">
          <div className="row gap-12">
            {onBack && <button className="icon-btn sm cw-back" onClick={onBack} aria-label="back"><ChevronLeft size={16} /></button>}
            <span className="avatar">{contact.avatar}</span>
            <div><p className="medium">{contact.name}</p>{contact.sub && <p className="t-xs muted">{contact.sub}</p>}</div>
          </div>
          {contact.phone && <span className="cw-phone"><Phone size={14} /> {contact.phone}</span>}
        </div>
      )}
      <div className="cw-body">
        <span className="cw-date">Сегодня, 12 февраль</span>
        {msgs.map((m, i) => {
          const lastOfGroup = msgs[i + 1]?.me !== m.me || msgs[i + 1]?.time !== m.time;
          const quoted = byId(m.replyTo);
          const firstOfGroup = msgs[i - 1]?.me !== m.me || msgs[i - 1]?.by !== m.by;
          return (
            <div key={m.id} ref={(el) => { refs.current[m.id] = el; }} className={`cw-msg ${m.me ? 'me' : ''} ${flash === m.id ? 'flash' : ''}`} onDoubleClick={() => startReply(m)}>
              {staff && m.me && firstOfGroup && <span className="cw-by">{m.by ?? staff.me}</span>}
              <div className="cw-row">
                <div className="cw-bubble">
                  {quoted && (
                    <button className="cw-quote" onClick={() => jumpTo(quoted.id)}>
                      <b>{who(quoted)}</b>
                      <span>{quoted.text}</span>
                    </button>
                  )}
                  {m.text}
                </div>
                <div className="cw-actions">
                  <button title="Ответить" onClick={() => startReply(m)}><Reply size={14} /></button>
                  <button title="Копировать" onClick={() => { navigator.clipboard?.writeText(m.text).catch(() => {}); setCopied(m.id); setTimeout(() => setCopied(null), 1200); }}>
                    {copied === m.id ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              {lastOfGroup && <span className="cw-time">{m.time}</span>}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {reply && (
        <div className="cw-replybar">
          <Reply size={16} color="var(--primary)" />
          <div className="grow" style={{ minWidth: 0 }}>
            <b className="t-xs" style={{ color: 'var(--primary)' }}>В ответ: {who(reply)}</b>
            <p className="t-sm cw-ellipsis">{reply.text}</p>
          </div>
          <button className="icon-btn sm" onClick={() => setReply(null)} aria-label="cancel reply"><X size={14} /></button>
        </div>
      )}
      <div className="cw-input">
        <input ref={input} placeholder="Напишите сообщение..." value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); if (e.key === 'Escape') setReply(null); }} />
        <button className="cw-ic" aria-label="emoji"><Smile size={18} /></button>
        <button className="cw-ic" aria-label="attach"><Paperclip size={18} /></button>
        <button className="btn btn-secondary btn-sm" onClick={send}>Отправить</button>
      </div>
    </div>
  );
}

export function ChatList({
  contacts, active, onSelect, tabs, tab, onTab,
}: { contacts: Contact[]; active: string | null; onSelect: (id: string) => void; tabs?: string[]; tab?: number; onTab?: (i: number) => void }) {
  const [q, setQ] = useState('');
  const list = contacts.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <aside className="cl">
      <h2 className="h4" style={{ padding: '20px 16px 12px' }}>Все чаты</h2>
      <div style={{ padding: '0 16px 12px' }}>
        <div className="input-wrap" style={{ height: 40 }}><input placeholder="Поиск" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {tabs && (
        <div className="cl-tabs">
          {tabs.map((t, i) => <button key={t} className={i === tab ? 'active' : ''} onClick={() => onTab?.(i)}>{t}</button>)}
        </div>
      )}
      <div className="col">
        {list.map((c) => (
          <button key={c.id} className={`cl-item ${active === c.id ? 'active' : ''}`} onClick={() => onSelect(c.id)}>
            <span className="avatar">{c.avatar}</span>
            <span className="grow" style={{ textAlign: 'left' }}><b className="t-sm medium" style={{ display: 'block' }}>{c.name}</b>{c.sub && <span className="t-xs muted">{c.sub}</span>}</span>
            <span className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
              <span className="t-xs muted">{c.time}</span>
              {!!c.unread && <span className="cl-badge">{c.unread}</span>}
            </span>
          </button>
        ))}
        {!list.length && <p className="empty-state t-sm">Ничего не найдено</p>}
      </div>
    </aside>
  );
}
