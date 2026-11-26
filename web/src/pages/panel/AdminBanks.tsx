import { useState } from 'react';
import clsx from 'clsx';
import { GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { BankLogo, Badge, ConfirmModal, Field, Input, Modal, Select, formatPhone } from '../../components/ui';
import { BankCardLogo, BankCardView } from '../../components/BankCardView';
import { moveItem, useDragList } from '../../components/useDragList';
import { BANKS } from '../../data/mock';
import { BANK_LOGOS } from '../../assets';
import { ACC_LABEL, slug, useMerchant, type AccStatus, type BankCard, type BankTerm, type ProductDef } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import { LogoUpload } from './AdminForms';
import { Switch } from './AdminServices';
import '../user/banking.css';
import './merchant/merchant.css';

const bankOf = (id: string) => BANKS.find((b) => b.id === id);

/** Gluon admin: banks in «Предложения банков» — order (drag), terms, products and their parameters. */
export default function AdminBanks() {
  const { toast } = useApp();
  const m = useMerchant();
  const [edit, setEdit] = useState<BankCard | 'new' | null>(null);
  const [del, setDel] = useState<BankCard | null>(null);
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'partners', action, target, details });
  const { rowProps } = useDragList((from, to) => {
    m.setBanks(moveItem(m.banks, from, to));
    log('Изменил порядок банков', m.banks[from].name, `→ ${to + 1} место`);
  });

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Банки</h1><p className="t-sm muted">Перетащите строку, чтобы изменить порядок для пользователей</p></div>
        <button className="btn btn-primary" onClick={() => setEdit('new')}><Plus size={16} /> Добавить банк</button>
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table dnd-table">
            <thead><tr><th style={{ width: 64 }} /><th>Банк</th><th>Условия</th><th>Продукты</th><th>Рейтинг</th><th>Онлайн</th><th>Показывать</th><th /></tr></thead>
            <tbody>
              {m.banks.map((b, i) => (
                <tr key={b.id} {...rowProps(i)} className={clsx(!b.active && 'row-off')}>
                  <td><span className="row gap-6"><GripVertical size={16} className="bn-grip" /><span className="bn-num">{i + 1}</span></span></td>
                  <td><BankCardLogo b={b} height={18} /></td>
                  <td className="t-sm">{b.terms.slice(0, 2).map((t, j) => <div key={j}><span className="muted">{t.label}:</span> <b className="medium">{t.value}</b></div>)}{b.terms.length > 2 && <span className="t-xs muted">ещё {b.terms.length - 2}</span>}</td>
                  <td><div className="tm-chips">{b.products.map((p) => <span key={p.productId} className="badge badge-neutral">{m.bankProducts.find((d) => d.id === p.productId)?.name ?? '—'}</span>)}</div></td>
                  <td>★ {b.rating}</td>
                  <td>{b.online ? 'Да' : 'Нет'}</td>
                  <td><Switch label="Показывать" on={b.active} onChange={(v) => { m.saveBank({ ...b, active: v }); log(v ? 'Показал банк' : 'Скрыл банк', b.name); }} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                      <button className="icon-btn sm" onClick={() => setEdit(b)} aria-label="Изменить" title="Изменить"><Pencil size={14} /></button>
                      <button className="icon-btn sm" onClick={() => setDel(b)} aria-label="Удалить" title="Удалить"><Trash2 size={14} color="var(--error)" /></button>
                    </span>
                  </td>
                </tr>
              ))}
              {!m.banks.length && <tr><td colSpan={8}><div className="empty-state">Банков нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'Новый банк' : edit ? edit.name : ''} width={980}>
        {edit && <BankEditor key={edit === 'new' ? 'new' : edit.id} bank={edit === 'new' ? undefined : edit} all={m.banks} defs={m.bankProducts} onClose={() => setEdit(null)} onSave={(b) => {
          const exists = m.banks.some((x) => x.id === b.id);
          m.saveBank(b);
          log(exists ? 'Изменил банк' : 'Добавил банк', b.name, b.products.map((p) => m.bankProducts.find((d) => d.id === p.productId)?.name).join(', ') || 'без продуктов');
          toast('success', exists ? 'Банк сохранён' : `${b.name} добавлен`);
          setEdit(null);
        }} />}
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text={`Удалить ${del?.name} из «Предложения банков»?`}
        onConfirm={() => { if (del) { m.setBanks(m.banks.filter((x) => x.id !== del.id)); log('Удалил банк', del.name); } setDel(null); }} />
    </div>
  );
}

/** Rows of «label — value» typed by the admin. */
function RowsEditor({ rows, onChange, labelPh, valuePh, addText }: { rows: BankTerm[]; onChange: (r: BankTerm[]) => void; labelPh: string; valuePh: string; addText: string }) {
  const set = (i: number, patch: Partial<BankTerm>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div className="col gap-8">
      {rows.map((r, i) => (
        <div key={i} className="be-row">
          <Input value={r.label} onChange={(e) => set(i, { label: e.target.value })} placeholder={labelPh} />
          <Input value={r.value} onChange={(e) => set(i, { value: e.target.value })} placeholder={valuePh} />
          <button type="button" className="icon-btn sm" onClick={() => onChange(rows.filter((_, j) => j !== i))} aria-label="Удалить"><X size={14} /></button>
        </div>
      ))}
      <button type="button" className="btn-link t-sm row gap-4" style={{ alignSelf: 'flex-start' }} onClick={() => onChange([...rows, { label: '', value: '' }])}><Plus size={14} /> {addText}</button>
    </div>
  );
}

function BankEditor({ bank, all, defs, onClose, onSave }: { bank?: BankCard; all: BankCard[]; defs: ProductDef[]; onClose: () => void; onSave: (b: BankCard) => void }) {
  const [f, setF] = useState<BankCard>(bank ? { ...bank, logo: bank.logo ?? BANK_LOGOS[bank.id]?.word } : { id: '', name: '', rating: 4.5, online: true, perk: '', terms: [{ label: 'Обслуживание', value: '' }, { label: 'Открытие счёта', value: '' }], products: [], active: true });
  const [err, setErr] = useState('');
  const setValue = (pid: string, key: string, value: string) => setF({ ...f, products: f.products.map((p) => (p.productId === pid ? { ...p, values: { ...p.values, [key]: value } } : p)) });
  const free = defs.filter((d) => !f.products.some((p) => p.productId === d.id));
  const clean = (rows: BankTerm[]) => rows.filter((r) => r.label.trim()).map((r) => ({ label: r.label.trim(), value: r.value.trim() }));
  const submit = () => {
    if (f.name.trim().length < 2) { setErr('Введите название банка'); return; }
    const id = bank?.id ?? slug(f.name);
    if (!bank && all.some((b) => b.id === id)) { setErr('Такой банк уже есть'); return; }
    onSave({ ...f, id, name: f.name.trim(), perk: f.perk.trim(), terms: clean(f.terms), products: f.products.filter((p) => defs.some((d) => d.id === p.productId)) });
  };
  const preview: BankCard = { ...f, terms: f.terms.filter((t) => t.label || t.value) };

  return (
    <div className="be">
      <div className="col gap-16 be-form">
        <div className="row gap-12 tm-two">
          <Field label="Название банка" error={err}><Input value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErr(''); }} placeholder="Например: Ipak Yuli Bank" error={!!err} /></Field>
          <Field label="Логотип"><LogoUpload value={f.logo} onChange={(logo) => setF({ ...f, logo })} wide /></Field>
        </div>
        <div className="row gap-12 tm-two">
          <Field label="Рейтинг Gluon"><Input type="number" min={1} max={5} step={0.1} value={f.rating} onChange={(e) => setF({ ...f, rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })} /></Field>
          <Field label="Открытие онлайн"><Select value={f.online ? 'yes' : 'no'} onChange={(v) => setF({ ...f, online: v === 'yes' })} options={[{ value: 'yes', label: 'Да' }, { value: 'no', label: 'Нет' }]} /></Field>
        </div>
        <Field label="Главное преимущество"><Input value={f.perk} onChange={(e) => setF({ ...f, perk: e.target.value })} placeholder="Например: 0% за переводы первые 3 месяца" /></Field>

        <div className="be-block">
          <b className="t-sm">Условия на карточке</b>
          <RowsEditor rows={f.terms} onChange={(terms) => setF({ ...f, terms })} labelPh="Название, напр. Обслуживание" valuePh="Значение, напр. Бесплатно" addText="Добавить условие" />
        </div>

        <div className="be-block">
          <b className="t-sm">Продукты</b>
          {f.products.map((p) => {
            const def = defs.find((d) => d.id === p.productId);
            if (!def) return null;
            return (
              <div key={p.productId} className="be-product">
                <div className="row between gap-8">
                  <b className="t-sm">{def.name}</b>
                  <button type="button" className="icon-btn sm" onClick={() => setF({ ...f, products: f.products.filter((x) => x.productId !== p.productId) })} aria-label="Убрать продукт" title="Убрать продукт"><Trash2 size={14} color="var(--error)" /></button>
                </div>
                {def.params.map((prm) => (
                  <div key={prm.id} className="be-val">
                    <span className="t-sm muted">{prm.label}</span>
                    <Input value={p.values[prm.id] ?? ''} onChange={(e) => setValue(p.productId, prm.id, e.target.value)} placeholder="Значение" />
                  </div>
                ))}
                {!def.params.length && <p className="t-xs muted">У продукта нет параметров — добавьте их в «Продукты банков».</p>}
              </div>
            );
          })}
          {free.length > 0
            ? <Select value="" placeholder="Добавить продукт" onChange={(id) => setF({ ...f, products: [...f.products, { productId: id, values: {} }] })} options={free.map((d) => ({ value: d.id, label: d.name }))} />
            : <p className="t-xs muted">{defs.length ? 'Все продукты из справочника добавлены' : 'Справочник продуктов пуст — создайте продукты в «Продукты банков»'}</p>}
        </div>

        <div className="row gap-12">
          <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary grow" onClick={submit}>{bank ? 'Сохранить' : 'Добавить банк'}</button>
        </div>
      </div>
      <div className="be-preview">
        <span className="t-xs muted">Карточка у пользователя</span>
        <BankCardView b={{ ...preview, name: preview.name || 'Название банка', id: preview.id || 'new' }} />
        <p className="t-xs muted">Параметры продуктов попадают в таблицы сравнения под карточками.</p>
      </div>
    </div>
  );
}

/** Gluon admin: users' requests to open an account («Предложения банков» → «Открыть счёт»). */
export function AdminAccountRequests() {
  const { toast } = useApp();
  const m = useMerchant();
  const [status, setStatus] = useState<'all' | AccStatus>('all');
  const reqs = m.accountRequests.filter((r) => status === 'all' || r.status === status);
  return (
    <div className="col gap-16">
      <h1 className="h4">Заявки на счёт</h1>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        {(['all', ...Object.keys(ACC_LABEL)] as ('all' | AccStatus)[]).map((k) => (
          <button key={k} className={clsx(status === k && 'active')} onClick={() => setStatus(k)}>
            {k === 'all' ? 'Все' : ACC_LABEL[k].label} <span className="op-tabcount">{k === 'all' ? m.accountRequests.length : m.accountRequests.filter((r) => r.status === k).length}</span>
          </button>
        ))}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>Контакт</th><th>Банк</th><th>Продукт</th><th>Дата</th><th>Статус</th></tr></thead>
            <tbody>
              {reqs.map((r) => {
                const c = m.clients.find((x) => x.id === r.clientId);
                return (
                  <tr key={r.id}>
                    <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{c?.company ?? '—'}</span><span className="t-xs muted">ИНН {c?.inn}</span></span></td>
                    <td><span className="col"><span>{r.contact}</span><span className="t-xs muted">{formatPhone(r.phone)}</span></span></td>
                    <td><BankLogo id={r.bank} name={bankOf(r.bank)?.name ?? r.bank} height={16} /></td>
                    <td>{r.product}</td>
                    <td>{r.date}</td>
                    <td style={{ width: 190 }}>
                      <Select value={r.status} onChange={(v) => { m.setAccountStatus(r.id, v as AccStatus); toast('success', `Статус: ${ACC_LABEL[v as AccStatus].label}`); }}
                        options={(Object.keys(ACC_LABEL) as AccStatus[]).map((x) => ({ value: x, label: <Badge kind={ACC_LABEL[x].kind}>{ACC_LABEL[x].label}</Badge> }))} />
                    </td>
                  </tr>
                );
              })}
              {!reqs.length && <tr><td colSpan={6}><div className="empty-state">Заявок нет</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

