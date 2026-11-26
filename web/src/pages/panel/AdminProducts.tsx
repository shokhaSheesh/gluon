import { useState } from 'react';
import { GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { ConfirmModal, Field, Input, Modal } from '../../components/ui';
import { moveItem, useDragList } from '../../components/useDragList';
import { slug, useMerchant, type ProductDef } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import './merchant/merchant.css';

/**
 * Gluon admin: directory of bank products («Кредит», «Рассрочка», …) and their parameters.
 * Parameters are the columns of the product's comparison table; each bank only fills in the values.
 */
export default function AdminProducts() {
  const { toast } = useApp();
  const m = useMerchant();
  const [edit, setEdit] = useState<ProductDef | 'new' | null>(null);
  const [del, setDel] = useState<ProductDef | null>(null);
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'partners', action, target, details });
  const usedBy = (id: string) => m.banks.filter((b) => b.products.some((p) => p.productId === id));
  const { rowProps } = useDragList((from, to) => {
    m.setProductDefs(moveItem(m.bankProducts, from, to));
    log('Изменил порядок продуктов', m.bankProducts[from].name, `→ ${to + 1} место`);
  });

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Продукты банков</h1><p className="t-sm muted">Порядок строк — порядок таблиц сравнения у пользователей</p></div>
        <button className="btn btn-primary" onClick={() => setEdit('new')}><Plus size={16} /> Добавить продукт</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table dnd-table">
            <thead><tr><th style={{ width: 64 }} /><th>Продукт</th><th>Параметры</th><th>Банков</th><th /></tr></thead>
            <tbody>
              {m.bankProducts.map((d, i) => (
                <tr key={d.id} {...rowProps(i)}>
                  <td><span className="row gap-6"><GripVertical size={16} className="bn-grip" /><span className="bn-num">{i + 1}</span></span></td>
                  <td className="strong" style={{ color: 'var(--text)' }}>{d.name}</td>
                  <td><div className="tm-chips">{d.params.map((p) => <span key={p.id} className="badge badge-neutral">{p.label}</span>)}{!d.params.length && <span className="t-xs muted">нет параметров</span>}</div></td>
                  <td>{usedBy(d.id).length}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn sm" onClick={() => setEdit(d)} aria-label="Изменить" title="Изменить"><Pencil size={14} /></button>
                      <button className="icon-btn sm" onClick={() => setDel(d)} aria-label="Удалить" title="Удалить"><Trash2 size={14} color="var(--error)" /></button>
                    </span>
                  </td>
                </tr>
              ))}
              {!m.bankProducts.length && <tr><td colSpan={5}><div className="empty-state">Продуктов нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Новый продукт' : edit ? edit.name : ''} width={520}>
        {edit && <ProductForm key={edit === 'new' ? 'new' : edit.id} def={edit === 'new' ? undefined : edit} taken={m.bankProducts.map((d) => d.id)} onClose={() => setEdit(null)} onSave={(d) => {
          const exists = m.bankProducts.some((x) => x.id === d.id);
          m.setProductDefs(exists ? m.bankProducts.map((x) => (x.id === d.id ? d : x)) : [...m.bankProducts, d]);
          log(exists ? 'Изменил продукт' : 'Добавил продукт', d.name, d.params.map((p) => p.label).join(', '));
          toast('success', 'Продукт сохранён');
          setEdit(null);
        }} />}
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить"
        text={del ? (usedBy(del.id).length ? `«${del.name}» есть у ${usedBy(del.id).length} банков — продукт пропадёт у них и из таблиц сравнения. Удалить?` : `Удалить продукт «${del.name}»?`) : ''}
        onConfirm={() => {
          if (del) {
            m.setProductDefs(m.bankProducts.filter((x) => x.id !== del.id));
            m.setBanks(m.banks.map((b) => ({ ...b, products: b.products.filter((p) => p.productId !== del.id) })));
            log('Удалил продукт', del.name);
          }
          setDel(null);
        }} />
    </div>
  );
}

function ProductForm({ def, taken, onClose, onSave }: { def?: ProductDef; taken: string[]; onClose: () => void; onSave: (d: ProductDef) => void }) {
  const [name, setName] = useState(def?.name ?? '');
  const [params, setParams] = useState(def?.params.length ? def.params : [{ id: '', label: '' }]);
  const [err, setErr] = useState('');
  const { rowProps } = useDragList((from, to) => setParams((p) => moveItem(p, from, to)));
  const submit = () => {
    const id = def?.id ?? slug(name);
    if (name.trim().length < 2) { setErr('Введите название'); return; }
    if (!def && taken.includes(id)) { setErr('Такой продукт уже есть'); return; }
    const clean = params.filter((p) => p.label.trim()).map((p, i) => ({ id: p.id || `p${Date.now().toString(36)}${i}`, label: p.label.trim() }));
    onSave({ id, name: name.trim(), params: clean });
  };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Название продукта" error={err}><Input value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="Например: Кредит" error={!!err} /></Field>
      <Field label="Параметры (колонки таблицы)">
        <div className="col gap-8">
          {params.map((p, i) => (
            <div key={i} className="pd-row" {...rowProps(i)}>
              <GripVertical size={16} className="bn-grip" />
              <Input className="grow" value={p.label} onChange={(e) => setParams(params.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Например: Годовой процент" />
              <button type="button" className="icon-btn sm" onClick={() => setParams(params.filter((_, j) => j !== i))} aria-label="Удалить"><X size={14} /></button>
            </div>
          ))}
          <button type="button" className="btn-link t-sm row gap-4" style={{ alignSelf: 'flex-start' }} onClick={() => setParams([...params, { id: '', label: '' }])}><Plus size={14} /> Добавить параметр</button>
        </div>
      </Field>
      {def && <p className="t-xs muted">Значения, которые банки уже заполнили, сохранятся. Удалённый параметр исчезнет из таблицы.</p>}
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>Сохранить</button>
      </div>
    </div>
  );
}
