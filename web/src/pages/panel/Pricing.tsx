import { useState } from 'react';
import { GripVertical, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { moveItem, useDragList } from '../../components/useDragList';
import { ConfirmModal, Field, Input, Modal, Pagination, usePaging } from '../../components/ui';
import { gbLabel, sum, useBilling, type Plan } from '../../lib/billing';
import { useApp } from '../../lib/store';
import '../user/billing.css';
import './merchant/merchant.css';

/** Gluon admin: Gluon plans (archive size, features, price). Service prices live on the services. */
export default function Pricing() {
  const b = useBilling();
  const pg = usePaging();
  const { toast } = useApp();
  const tab: string = 'plans';
  const [edit, setEdit] = useState<Plan | null>(null);
  const [del, setDel] = useState<Plan | null>(null);

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <h1 className="h4">Тарифы</h1>
        <div className="row gap-12">
        </div>
      </div>

      {tab === 'plans' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="row between" style={{ padding: '14px 18px' }}>
            <b className="medium">Тарифы ({b.plans.length})</b>
            <button className="btn btn-primary btn-sm" onClick={() => setEdit({ id: `plan-${Date.now()}`, name: '', gb: 1024, price: 0, features: [], active: true })}><Plus size={14} /> Добавить тариф</button>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Тариф</th><th>Хранилище</th><th>Цена / мес</th><th>Возможности</th><th>Пользователей</th><th>Показывать</th><th /></tr></thead>
              <tbody>
                {pg.sliceIdx(b.plans).map(([p, i]) => (
                  <tr key={p.id}>
                    <td className="strong"><span className="row gap-8">{p.name}{p.popular && <span className="badge badge-primary"><Sparkles size={11} /> Популярный</span>}</span></td>
                    <td>{gbLabel(p.gb)}</td>
                    <td className="strong">{p.price ? sum(p.price) : 'Бесплатно'}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: 320 }} className="t-sm">{p.features.join(' · ')}</td>
                    <td>{[4120, 1650, 540, 175][i] ?? 0}</td>
                    <td><label className="switch"><input type="checkbox" checked={p.active} onChange={(e) => { b.savePlan({ ...p, active: e.target.checked }); toast('success', e.target.checked ? 'Тариф показан пользователям' : 'Тариф скрыт'); }} /><span /></label></td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                        <button className="icon-btn sm" onClick={() => setEdit(p)} aria-label="edit"><Pencil size={14} /></button>
                        <button className="icon-btn sm" onClick={() => setDel(p)} aria-label="delete" disabled={p.id === 'base'}><Trash2 size={14} color="var(--error)" /></button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pg.bar(b.plans.length)} />
        </div>
      ) : null}

      <PlanModal plan={edit} onClose={() => setEdit(null)} onSave={(p) => { b.savePlan(p); setEdit(null); toast('success', 'Тариф сохранён'); }} />
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text={`Удалить тариф «${del?.name}»?`}
        onConfirm={() => { if (del) b.deletePlan(del.id); setDel(null); toast('success', 'Тариф удалён'); }} />
    </div>
  );
}

function PlanModal({ plan, onClose, onSave }: { plan: Plan | null; onClose: () => void; onSave: (p: Plan) => void }) {
  return (
    <Modal open={!!plan} onClose={onClose} title={plan?.name ? `Тариф «${plan.name}»` : 'Новый тариф'} width={520}>
      {plan && <PlanForm key={plan.id} plan={plan} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function PlanForm({ plan, onClose, onSave }: { plan: Plan; onClose: () => void; onSave: (p: Plan) => void }) {
  const [f, setF] = useState(plan);
  const [feature, setFeature] = useState('');
  const [err, setErr] = useState('');
  const { rowProps } = useDragList((from, to) => setF((x) => ({ ...x, features: moveItem(x.features, from, to) })));
  const add = () => { const v = feature.trim(); if (!v || f.features.includes(v)) return; setF({ ...f, features: [...f.features, v] }); setFeature(''); };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Название" error={err}><Input value={f.name} placeholder="Например: Бизнес" onChange={(e) => setF({ ...f, name: e.target.value })} error={!!err} /></Field>
      <div className="row gap-12">
        <div className="grow"><Field label="Хранилище"><Input value={String(f.gb)} inputMode="numeric" onChange={(e) => setF({ ...f, gb: Number(e.target.value.replace(/\D/g, '')) })} suffixBox="GB" /></Field></div>
        <div className="grow"><Field label="Цена в месяц"><Input value={f.price.toLocaleString('ru-RU')} inputMode="numeric" onChange={(e) => setF({ ...f, price: Number(e.target.value.replace(/\D/g, '')) })} suffixBox="сум" /></Field></div>
      </div>
      <Field label="Возможности">
        <div className="col gap-8">
          {f.features.length > 0 && (
            <ul className="pf-features">
              {f.features.map((x, i) => (
                <li key={x} {...rowProps(i)}>
                  <GripVertical size={14} className="bn-grip" />
                  <span className="pf-dot" />
                  <span className="grow">{x}</span>
                  <button type="button" className="icon-btn sm" onClick={() => setF({ ...f, features: f.features.filter((_, j) => j !== i) })} aria-label="Удалить"><X size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          <div className="row gap-8">
            <Input className="grow" value={feature} onChange={(e) => setFeature(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="Например: 1 TB в Gluon Архиве" />
            <button type="button" className="btn btn-secondary" onClick={add} disabled={!feature.trim()}><Plus size={16} /> Добавить</button>
          </div>
        </div>
      </Field>
      <div className="row gap-20">
        <label className="checkbox"><input type="checkbox" checked={!!f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} /> Отметить как «Популярный»</label>
        <label className="checkbox"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Показывать пользователям</label>
      </div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={() => {
          if (!f.name.trim()) { setErr('Введите название'); return; }
          onSave({ ...f, name: f.name.trim() });
        }}>Сохранить</button>
      </div>
    </div>
  );
}
