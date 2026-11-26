import { useState } from 'react';
import clsx from 'clsx';
import { BrandMark, ConfirmModal } from '../../../components/ui';
import { SERVICES } from '../../../data/mock';
import { SERVICE_IDS, recommendedFor, useMerchant } from '../../../lib/merchant';
import { Switch } from '../AdminServices';
import { useApp } from '../../../lib/store';
import { useBilling } from '../../../lib/billing';
import './merchant.css';

/** Bank cabinet: which partner services the bank's clients see in the Gluon store. */
export default function BankServices() {
  const { session, toast } = useApp();
  const m = useMerchant();
  const bank = session?.orgId ?? '';
  const on = m.bankServices[bank] ?? SERVICE_IDS;
  const mine = m.clients.filter((c) => c.channel === bank);
  const [off, setOff] = useState<string | null>(null);
  const rec = recommendedFor(m.recommended, bank);
  const { prices } = useBilling();
  // a service Gluon removed from the store can't be offered by the bank either
  const list = SERVICE_IDS.map((id) => {
    const byGluon = !(prices[id]?.active ?? true);
    return { s: SERVICES.find((x) => x.id === id)!, users: mine.filter((c) => c.services[id]).length, enabled: !byGluon && on.includes(id), byGluon };
  });

  const toggle = (id: string, enable: boolean) => {
    const name = SERVICES.find((x) => x.id === id)?.name ?? id;
    m.setBankServices(bank, enable ? [...on, id] : on.filter((x) => x !== id));
    m.log(bank, 'bank', { section: 'services', action: enable ? 'Включил сервис' : 'Отключил сервис', target: name, details: enable ? undefined : 'Скрыт для новых подключений' });
    toast('success', enable ? `${name} снова доступен клиентам` : `${name} скрыт из магазина`);
  };

  return (
    <div className="col gap-16">
      <div><h1 className="h4">Сервисы для клиентов</h1><p className="t-sm muted">Включено {on.length} из {SERVICE_IDS.length}</p></div>
      <div className="bs-grid">
        {list.map(({ s, users, enabled, byGluon }) => (
          <div key={s.id} className={clsx('bs-card', !enabled && 'off')}>
            <div className="row between gap-12">
              <span className="row gap-12" style={{ minWidth: 0 }}>
                <BrandMark name={s.name} color={s.color} text={s.mark} size={44} />
                <span className="col" style={{ minWidth: 0 }}><b>{s.name}</b><span className="t-sm muted">{s.type}</span></span>
              </span>
              {byGluon ? <span className="badge badge-neutral">Скрыт Gluon</span> : <button role="switch" aria-checked={enabled} aria-label={s.name} className={clsx('bs-switch', enabled && 'on')}
                onClick={() => (enabled ? (users ? setOff(s.id) : toggle(s.id, false)) : toggle(s.id, true))}><span /></button>}
            </div>
            <p className="t-sm muted bs-desc">{s.description}</p>
            <div className="row between t-sm">
              <span className="muted">Пользуются клиенты банка</span>
              <b>{users}</b>
            </div>
            <label className="row between as-rec">
              <span className="t-sm">Рекомендуемый</span>
              <Switch label="Рекомендуемый" on={enabled && rec.includes(s.id)} onChange={(v) => {
                if (!enabled) return;
                m.setRecommended(bank, v ? [...rec, s.id] : rec.filter((x) => x !== s.id));
                m.log(bank, 'bank', { section: 'services', action: v ? 'Отметил сервис рекомендуемым' : 'Убрал из рекомендуемых', target: s.name });
              }} />
            </label>
          </div>
        ))}
      </div>
      <ConfirmModal open={!!off} onClose={() => setOff(null)} confirmText="Отключить"
        text={off ? `${list.find((x) => x.s.id === off)?.users} клиентов уже пользуются ${SERVICES.find((x) => x.id === off)?.name}. У них сервис останется, а остальные клиенты не увидят его в магазине.` : ''}
        onConfirm={() => { if (off) toggle(off, false); setOff(null); }} />
    </div>
  );
}
