import { useState } from 'react';
import { ChatList, ChatWindow, type Contact } from '../../components/chat';
import type { ChatMsg } from '../../data/mock';

/** Merchant side of a conversation with a client (our messages are signed with the employee's name). */
const CLIENT_THREAD: ChatMsg[] = [
  { id: 1, me: false, text: 'Здравствуйте! Подключили ваш сервис через Gluon, но данные пока не появились.', time: '10:00' },
  { id: 2, me: true, text: 'Здравствуйте! Сейчас проверим. Подскажите, вы уже связали аккаунт в разделе «Интеграции»?', time: '10:03' },
  { id: 3, me: false, text: 'Да, связали вчера вечером.', time: '10:05' },
  { id: 4, me: true, text: 'Видим подключение. Первая загрузка данных занимает до 2 часов — всё придёт автоматически.', time: '10:11' },
  { id: 5, me: false, text: 'Отлично, спасибо!', time: '10:13' },
];
/** Gluon admin ↔ partner (bank / service) — our side is Gluon staff. */
const PARTNER_THREAD: ChatMsg[] = [
  { id: 1, me: false, text: 'Добрый день! Клиент не видит наш сервис в магазине Gluon.', time: '09:20' },
  { id: 2, me: true, text: 'Здравствуйте! Уточните, пожалуйста, название компании клиента.', time: '09:28' },
  { id: 3, me: false, text: 'ООО “TEXNO GROUP”.', time: '09:31' },
  { id: 4, me: true, text: 'Проверили: сервис скрыт банком клиента. Мы связались с банком, скоро появится.', time: '09:40' },
  { id: 5, me: false, text: 'Спасибо!', time: '09:41' },
];
const SUPPORT_THREAD: ChatMsg[] = [
  { id: 1, me: true, text: 'Добрый день! Клиент не видит наш сервис в магазине Gluon.', time: '09:20' },
  { id: 2, me: false, text: 'Здравствуйте! Уточните, пожалуйста, название компании клиента.', time: '09:28' },
  { id: 3, me: true, text: 'ООО “TEXNO GROUP”.', time: '09:31' },
  { id: 4, me: false, text: 'Проверили: сервис скрыт банком клиента. Мы связались с банком, скоро появится.', time: '09:40' },
  { id: 5, me: true, text: 'Спасибо!', time: '09:41' },
];
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { adminChatGroups, chatContactIds, currentActor, initials, orgOf, useMerchant, type ChatGroup } from '../../lib/merchant';
import { formatPhone } from '../../components/ui';
import { useApp } from '../../lib/store';

const GROUPS: { id: ChatGroup; label: string }[] = [{ id: 'users', label: 'Пользователи' }, { id: 'services', label: 'Сервисы' }, { id: 'banks', label: 'Банки' }];
const STATUSES = ['Новые', 'В работе', 'Закрытые'] as const;
const clock = (i: number) => `${String(9 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`;

/** Panel chat: Gluon support + only the clients that belong to this cabinet. Gluon admin gets its own layout. */
export default function PanelChat() {
  const { session } = useApp();
  return session?.platform === 'admin' ? <AdminChat /> : <MerchantChat />;
}

/**
 * Gluon admin: chats split like the platforms (company owners · services · banks), each by status:
 * new (unread) → in progress (opened) → closed (staff closed it; a new message from Gluon reopens it).
 */
function AdminChat() {
  const m = useMerchant();
  const team = m.teamOf('gluon', 'admin');
  const staff = { me: currentActor(team), team: team.employees.filter((e) => e.status === 'active').map((e) => e.name) };
  const [group, setGroup] = useState(0);
  const [status, setStatus] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const groups = adminChatGroups(m.clients, m.partners);
  const ORG = 'admin';
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'chat', action, target, details });

  const stateOf = (g: ChatGroup) => {
    const ids = groups[g];
    const unread = new Set(m.unreadChats(ORG, ids));
    return ids.map((id, i) => ({ id, i, st: m.isChatClosed(ORG, id, i) ? 2 : unread.has(id) ? 0 : 1 }));
  };
  const g = GROUPS[group].id;
  const rows = stateOf(g);
  const contactOf = (id: string, i: number) => {
    if (id.startsWith('p-')) {
      const p = m.partners.find((x) => `p-${x.id}` === id)!;
      return { id, name: p.name, avatar: initials(p.name), sub: p.aggregator ? 'Банк-партнёр' : 'Сервис-партнёр', time: clock(i + 3) };
    }
    const c = m.clients.find((x) => x.id === id)!;
    return { id, name: c.company, avatar: initials(c.company), sub: c.owner, time: clock(i), phone: formatPhone(c.phone) };
  };
  const contacts = rows.filter((r) => r.st === status).map((r) => ({ ...contactOf(r.id, r.i), unread: r.st === 0 ? 2 - (r.i % 2) : 0 }));
  const all = rows.map((r) => contactOf(r.id, r.i));
  const contact = all.find((c) => c.id === active);
  const activeRow = rows.find((r) => r.id === active);
  const closed = activeRow?.st === 2;

  const open = (id: string) => { setActive(id); m.markChatRead(ORG, id); };
  const setClosed = (v: boolean) => {
    if (!contact) return;
    m.setChatStatus(ORG, contact.id, v ? 'closed' : 'open');
    log(v ? 'Закрыл чат' : 'Возобновил чат', contact.name);
    setStatus(v ? 2 : 1);
  };

  return (
    <div className={`chat-shell ${contact ? 'has-active' : ''}`} style={{ height: 'calc(100vh - 120px)' }}>
      <ChatList contacts={contacts} active={active} onSelect={open}
        segments={GROUPS.map((x) => ({ label: x.label, count: stateOf(x.id).filter((r) => r.st === 0).length }))} segment={group} onSegment={(i) => { setGroup(i); setStatus(0); setActive(null); }}
        tabs={[...STATUSES]} tab={status} onTab={setStatus} tabCounts={[0, 1, 2].map((k) => rows.filter((r) => r.st === k).length)} />
      {contact ? (
        <ChatWindow contact={contact} onBack={() => setActive(null)} staff={staff}
          seed={contact.id.startsWith('p-') ? PARTNER_THREAD : CLIENT_THREAD}
          actions={closed
            ? <button className="btn btn-secondary btn-sm" onClick={() => setClosed(false)}><RotateCcw size={14} /> Возобновить</button>
            : <button className="btn btn-secondary btn-sm" onClick={() => setClosed(true)}><CheckCircle2 size={14} /> Закрыть чат</button>}
          banner={closed ? <div className="cw-closed">Чат закрыт. Новое сообщение от Gluon откроет его снова.</div> : undefined}
          onSend={(text, isReply) => {
            if (closed) { m.setChatStatus(ORG, contact.id, 'open'); setStatus(1); }
            log(isReply ? 'Ответил на сообщение' : 'Отправил сообщение', contact.name, text.length > 60 ? `${text.slice(0, 60)}…` : text);
          }} />
      ) : <div className="cw-empty">Выберите чат</div>}
    </div>
  );
}

function MerchantChat() {
  const { session } = useApp();
  const m = useMerchant();
  const { clients } = m;
  const { kind, org } = orgOf(session);
  const team = m.teamOf(org, kind);
  const staff = team ? { me: currentActor(team), team: team.employees.filter((e) => e.status === 'active').map((e) => e.name) } : undefined;
  const [active, setActive] = useState<string | null>(null);

  const { mine, ids } = chatContactIds(clients, session?.platform, session?.kind, session?.orgId);
  const chatOrg = session?.orgId ?? 'admin';
  const unread = new Set(m.unreadChats(chatOrg, ids));
  const open = (id: string) => { setActive(id); m.markChatRead(chatOrg, id); };

  const contacts: Contact[] = [
    { id: 'support', name: 'Gluon поддержка', avatar: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>G</span>, sub: '', time: '09:40', unread: unread.has('support') ? 1 : 0 },
    ...mine.map((c, i) => ({
      id: c.id,
      name: c.company,
      avatar: initials(c.company),
      sub: c.owner,
      time: clock(i),
      unread: unread.has(c.id) ? 2 - (i % 2) : 0,
    })),
  ];
  const contact = contacts.find((c) => c.id === active);

  return (
    <div className={`chat-shell ${contact ? 'has-active' : ''}`} style={{ height: 'calc(100vh - 120px)' }}>
      <ChatList contacts={contacts} active={active} onSelect={open} />
      {contact ? <ChatWindow contact={contact} onBack={() => setActive(null)} staff={staff}
        seed={contact.id === 'support' ? SUPPORT_THREAD : CLIENT_THREAD}
        onSend={team ? (text, isReply) => m.log(org, kind, { section: 'chat', action: isReply ? 'Ответил на сообщение' : 'Отправил сообщение', target: contact.name, details: text.length > 60 ? `${text.slice(0, 60)}…` : text }) : undefined} /> : <div className="cw-empty">Выберите чат</div>}
    </div>
  );
}
