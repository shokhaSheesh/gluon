import { useState } from 'react';
import clsx from 'clsx';
import { Pencil, Plus, Sparkles, Trash2, RotateCcw } from 'lucide-react';
import { BrandMark, ConfirmModal, Field, Input, Modal } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { gbLabel, sum, useBilling, type Plan } from '../../lib/billing';
import { useApp } from '../../lib/store';
import '../user/billing.css';

/** Gluon admin: manages archive plans and the prices users pay for services through Gluon. */
export default function Pricing() {
  const b = useBilling();
  const { toast } = useApp();
  const [tab, setTab] = useState<'plans' | 'services'>('plans');
  const [edit, setEdit] = useState<Plan | null>(null);
  const [del, setDel] = useState<Plan | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <div>
          <h1 className="h4">Тарифы и цены</h1>
          <p className="t-sm muted">Изменения сразу видны пользователям в разделе «Подписки и тарифы» и в Магазине Gluon.</p>
        </div>
        <div className="row gap-12">
          <div className="tabs-seg">
            <button className={clsx(tab === 'plans' && 'active')} onClick={() => setTab('plans')}>Тарифы Gluon Архива</button>
            <button className={clsx(tab === 'services' && 'active')} onClick={() => setTab('services')}>Цены сервисов</button>
          </div>
          <button className="btn btn-ghost btn-sm" title="Сбросить демо-данные" onClick={() => { b.reset(); toast('info', 'Демо-данные сброшены'); }}><RotateCcw size={14} /></button>
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
                {b.plans.map((p, i) => (
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
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px' }}>
            <b className="medium">Подписки на сервисы через Gluon</b>
            <p className="t-sm muted">Цена, которую пользователь платит с баланса Gluon за месяц использования сервиса.</p>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Сервис</th><th>Тип</th><th>Цена для пользователя / мес</th><th>Активных подписок</th><th>Доход за месяц</th><th>Оплата через Gluon</th></tr></thead>
              <tbody>
                {SERVICES.map((s, i) => {
                  const p = b.prices[s.id] ?? { price: 0, active: false };
                  const val = draft[s.id] ?? String(p.price);
                  const changed = Number(val.replace(/\D/g, '')) !== p.price;
                  const subs = [820, 640, 1210, 310, 270][i];
                  return (
                    <tr key={s.id}>
                      <td><span className="row gap-12"><BrandMark name={s.name} color={s.color} text={s.mark} size={30} /><b className="medium" style={{ color: 'var(--text)' }}>{s.name}</b></span></td>
                      <td>{s.type}</td>
                      <td>
                        <span className="row gap-8">
                          <div style={{ width: 170 }}>
                            <Input value={Number(val.replace(/\D/g, '') || 0).toLocaleString('ru-RU')} onChange={(e) => setDraft({ ...draft, [s.id]: e.target.value })} suffixBox="сум" inputMode="numeric" />
                          </div>
                          {changed && (
                            <button className="btn btn-primary btn-sm" onClick={() => {
                              b.setPrice(s.id, { price: Number(val.replace(/\D/g, '')) });
                              setDraft(({ [s.id]: _omit, ...rest }) => rest);
                              toast('success', `Цена ${s.name} обновлена`);
                            }}>Сохранить</button>
                          )}
                        </span>
                      </td>
                      <td>{subs}</td>
                      <td className="strong">{sum(subs * p.price)}</td>
                      <td><label className="switch"><input type="checkbox" checked={p.active} onChange={(e) => { b.setPrice(s.id, { active: e.target.checked }); toast('success', e.target.checked ? `${s.name}: оплата включена` : `${s.name}: оплата отключена`); }} /><span /></label></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
  const [f, setF] = useState({ ...plan, featuresText: plan.features.join('\n') });
  const [err, setErr] = useState('');
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Название" error={err}><Input value={f.name} placeholder="Например: Бизнес" onChange={(e) => setF({ ...f, name: e.target.value })} error={!!err} /></Field>
      <div className="row gap-12">
        <div className="grow"><Field label="Хранилище"><Input value={String(f.gb)} inputMode="numeric" onChange={(e) => setF({ ...f, gb: Number(e.target.value.replace(/\D/g, '')) })} suffixBox="GB" /></Field></div>
        <div className="grow"><Field label="Цена в месяц"><Input value={f.price.toLocaleString('ru-RU')} inputMode="numeric" onChange={(e) => setF({ ...f, price: Number(e.target.value.replace(/\D/g, '')) })} suffixBox="сум" /></Field></div>
      </div>
      <Field label="Возможности" hint="Каждая с новой строки">
        <textarea className="textarea" value={f.featuresText} onChange={(e) => setF({ ...f, featuresText: e.target.value })} placeholder={'1 TB в Gluon Архиве\nДо 10 сервисов'} />
      </Field>
      <div className="row gap-20">
        <label className="checkbox"><input type="checkbox" checked={!!f.popular} onChange={(e) => setF({ ...f, popular: e.target.checked })} /> Отметить как «Популярный»</label>
        <label className="checkbox"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Показывать пользователям</label>
      </div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={() => {
          if (!f.name.trim()) { setErr('Введите название'); return; }
          const { featuresText, ...rest } = f;
          onSave({ ...rest, features: featuresText.split('\n').map((x) => x.trim()).filter(Boolean) });
        }}>Сохранить</button>
      </div>
    </div>
  );
}
