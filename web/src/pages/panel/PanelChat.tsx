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
import { chatContactIds, currentActor, initials, orgOf, useMerchant } from '../../lib/merchant';
import { useApp } from '../../lib/store';

/** Panel chat: Gluon support + only the clients that belong to this cabinet. */
export default function PanelChat() {
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

  const isAdmin = session?.platform === 'admin';
  const contacts: Contact[] = [
    ...(isAdmin ? m.partners.map((p) => ({ id: `p-${p.id}`, name: p.name, avatar: initials(p.name), sub: p.aggregator ? 'Банк-партнёр' : 'Сервис-партнёр', time: '08:30' })) : []),
    ...(session?.platform === 'admin' ? [] : [{ id: 'support', name: 'Gluon поддержка', avatar: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>G</span>, sub: '', time: '09:40', unread: unread.has('support') ? 1 : 0 }]),
    ...mine.map((c, i) => ({
      id: c.id,
      name: c.company,
      avatar: initials(c.company),
      sub: c.owner,
      time: `${String(9 + (i % 9)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}`,
      unread: unread.has(c.id) ? 2 - (i % 2) : 0,
    })),
  ];
  const contact = contacts.find((c) => c.id === active);

  return (
    <div className={`chat-shell ${contact ? 'has-active' : ''}`} style={{ height: 'calc(100vh - 120px)' }}>
      <ChatList contacts={contacts} active={active} onSelect={open} />
      {contact ? <ChatWindow contact={contact} onBack={() => setActive(null)} staff={staff}
        seed={contact.id === 'support' ? SUPPORT_THREAD : contact.id.startsWith('p-') ? PARTNER_THREAD : CLIENT_THREAD}
        onSend={team ? (text, isReply) => m.log(org, kind, { section: 'chat', action: isReply ? 'Ответил на сообщение' : 'Отправил сообщение', target: contact.name, details: text.length > 60 ? `${text.slice(0, 60)}…` : text }) : undefined} /> : <div className="cw-empty">Выберите чат</div>}
    </div>
  );
}
