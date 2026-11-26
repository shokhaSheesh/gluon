import { useState } from 'react';
import clsx from 'clsx';
import { GripVertical, Pencil, Plus } from 'lucide-react';
import { BrandMark, Modal } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { LOGO_BY_NAME } from '../../assets';
import { SERVICE_IDS, orderedServices, useMerchant, type CatalogService } from '../../lib/merchant';
import { moveItem, useDragList } from '../../components/useDragList';
import { sum, useBilling } from '../../lib/billing';
import { useApp } from '../../lib/store';
import { ServiceForm, type ServiceDraft } from './AdminForms';
import './merchant/merchant.css';

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} title={label} className={clsx('bs-switch', on && 'on')} onClick={() => onChange(!on)}><span /></button>;
}

const today = () => new Date().toLocaleDateString('ru-RU');

/** Creating a service = catalog entry + price + partner cabinet. Used by «Сервисы» and «Партнёры». */
export function useCreateService() {
  const m = useMerchant();
  const b = useBilling();
  return (d: ServiceDraft) => {
    m.addService(d.svc);
    b.setPrice(d.svc.id, { price: d.price, active: true });
    m.savePartner({ id: d.svc.id, name: d.svc.name, aggregator: false, login: d.login!, password: d.password!, status: 'active', created: today(), logo: d.svc.logo });
    m.log('gluon', 'admin', { section: 'services', action: 'Добавил сервис', target: d.svc.name, details: `${sum(d.price)} / мес · логин ${d.login}` });
  };
}

/** Gluon admin: the service catalog — price, store visibility, recommended. */
export default function AdminServices() {
  const { toast } = useApp();
  const m = useMerchant();
  const b = useBilling();
  const create = useCreateService();
  const [edit, setEdit] = useState<CatalogService | 'new' | null>(null);
  const rec = m.recommended.gluon ?? [];
  const ids = orderedServices(m.serviceOrder);
  const { rowProps } = useDragList((from, to) => {
    m.setServiceOrder(moveItem(ids, from, to));
    log('Изменил порядок сервисов', SERVICES.find((x) => x.id === ids[from])?.name ?? ids[from], `→ ${to + 1} место`);
  });
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'services', action, target, details });
  const asCatalog = (id: string): CatalogService => {
    const s = SERVICES.find((x) => x.id === id)!;
    const own = (m.catalog ?? []).find((x) => x.id === id);
    return own ?? { id, name: s.name, type: s.type, description: s.description, color: s.color, logo: LOGO_BY_NAME[s.name] };
  };

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Сервисы</h1><p className="t-sm muted">Перетащите строку, чтобы изменить порядок в магазине</p></div>
        <button className="btn btn-primary" onClick={() => setEdit('new')}><Plus size={16} /> Добавить сервис</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table dnd-table">
            <thead><tr><th style={{ width: 64 }} /><th>Сервис</th><th>Цена</th><th>Клиентов</th><th>В магазине</th><th>Рекомендуемый</th><th /></tr></thead>
            <tbody>
              {ids.map((id, i) => {
                const s = SERVICES.find((x) => x.id === id)!;
                const p = b.prices[id] ?? { price: 0, active: false };
                const users = m.clients.filter((c) => c.services[id]).length;
                return (
                  <tr key={id} {...rowProps(i)} className={clsx(!p.active && 'row-off')}>
                    <td><span className="row gap-6"><GripVertical size={16} className="bn-grip" /><span className="bn-num">{i + 1}</span></span></td>
                    <td><span className="row gap-10"><BrandMark name={s.name} color={s.color} text={s.mark} size={32} /><span className="col"><b className="medium" style={{ color: 'var(--text)' }}>{s.name}</b><span className="t-xs muted">{s.type}</span></span></span></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="col"><b className="medium">{sum(p.price)} / мес</b>
                        {p.legacy !== undefined && <span className="t-xs muted">текущим клиентам — {sum(p.legacy)}</span>}
                        {p.changed?.mode === 'all' && <span className="t-xs muted">для всех со след. оплаты (было {sum(p.changed.from)})</span>}
                      </span>
                    </td>
                    <td>{users}</td>
                    <td><Switch label="В магазине" on={p.active} onChange={(v) => { b.setPrice(id, { active: v }); log(v ? 'Показал сервис в магазине' : 'Скрыл сервис из магазина', s.name); toast('success', v ? `${s.name} в магазине` : `${s.name} скрыт из магазина`); }} /></td>
                    <td><Switch label="Рекомендуемый" on={rec.includes(id)} onChange={(v) => { m.setRecommended('gluon', v ? [...rec, id] : rec.filter((x) => x !== id)); log(v ? 'Отметил сервис рекомендуемым' : 'Убрал из рекомендуемых', s.name); }} /></td>
                    <td style={{ textAlign: 'right' }}><button className="icon-btn sm" onClick={() => setEdit(asCatalog(id))} aria-label="Изменить" title="Изменить"><Pencil size={14} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Новый сервис' : edit ? `Сервис ${edit.name}` : ''} width={560}>
        {edit && (
          <ServiceForm key={edit === 'new' ? 'new' : edit.id} initial={edit === 'new' ? undefined : edit} price={edit === 'new' ? undefined : b.prices[edit.id]?.price}
            takenIds={SERVICE_IDS} takenLogins={m.partners.map((p) => p.login)} onClose={() => setEdit(null)}
            onSave={(d) => {
              if (edit === 'new') { create(d); toast('success', `${d.svc.name} добавлен`); }
              else {
                const old = b.prices[d.svc.id]?.price ?? 0;
                m.addService(d.svc);
                if (d.mode) {
                  b.setPrice(d.svc.id, { price: d.price, legacy: d.mode === 'new' ? (b.prices[d.svc.id]?.legacy ?? old) : undefined, changed: { at: today(), mode: d.mode, from: old } });
                  log('Изменил цену сервиса', d.svc.name, `${sum(old)} → ${sum(d.price)} · ${d.mode === 'all' ? 'для всех со следующей оплаты' : 'только для новых клиентов'}`);
                } else log('Изменил сервис', d.svc.name);
                toast('success', 'Сервис сохранён');
              }
              setEdit(null);
            }} />
        )}
      </Modal>
    </div>
  );
}
