import { useState } from 'react';
import { BrandMark } from '../../components/ui';
import { ChatList, ChatWindow, type Contact } from '../../components/chat';
import { BANKS, SERVICES } from '../../data/mock';

const GROUPS: Contact[][] = [
  [{ id: 'gluon', name: 'Gluon Админ', avatar: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>G</span>, sub: '17 минут назад', time: '09:53', unread: 4, phone: '+998(50) 074 20 00' }],
  SERVICES.slice(0, 4).map((s, i) => ({ id: s.id, name: `${s.name} Админ`, avatar: <BrandMark name={s.name} color={s.color} text={s.mark} size={28} />, sub: '17 минут назад', time: '09:53', unread: i === 0 ? 4 : 0, phone: '+998(71) 200 00 0' + i })),
  BANKS.slice(0, 5).map((b, i) => ({ id: b.id, name: b.name, avatar: <BrandMark name={b.name} color={b.color} text={b.mark} size={28} />, sub: '17 минут назад', time: '09:53', unread: i === 0 ? 4 : 0, phone: '+998(78) 150 00 0' + i })),
];

export default function Chat() {
  const [tab, setTab] = useState(0);
  const [active, setActive] = useState<string | null>('gluon');
  const contact = GROUPS.flat().find((c) => c.id === active);
  return (
    <div className={`chat-shell ${contact ? 'has-active' : ''}`}>
      <ChatList contacts={GROUPS[tab]} active={active} onSelect={setActive} tabs={['Gluon', 'Сервисы', 'Банки']} tab={tab} onTab={(i) => { setTab(i); setActive(null); }} />
      {contact ? <ChatWindow contact={contact} onBack={() => setActive(null)} /> : <div className="cw-empty">Выберите чат</div>}
    </div>
  );
}
