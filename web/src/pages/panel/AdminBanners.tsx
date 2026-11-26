import { useState } from 'react';
import clsx from 'clsx';
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { BrandMark, ConfirmModal, Field, Input, Modal, Select } from '../../components/ui';
import { SERVICES } from '../../data/mock';
import { SERVICE_IDS, useMerchant, type Banner } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import { Switch } from './AdminServices';
import './merchant/merchant.css';

const svc = (id: string) => SERVICES.find((s) => s.id === id)!;

/** Gluon admin: store banners («Специальные предложения»), drag to reorder. */
export default function AdminBanners() {
  const { toast } = useApp();
  const m = useMerchant();
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [edit, setEdit] = useState<Banner | null>(null);
  const [del, setDel] = useState<Banner | null>(null);
  const log = (action: string, target: string, details?: string) => m.log('gluon', 'admin', { section: 'banners', action, target, details });
  const list = m.banners;

  const drop = (to: number) => {
    if (drag === null || drag === to) { setDrag(null); setOver(null); return; }
    const next = [...list];
    const [moved] = next.splice(drag, 1);
    next.splice(to, 0, moved);
    m.setBanners(next);
    log('Изменил порядок баннеров', 'Специальные предложения', `${svc(moved.service).name} → ${to + 1} место`);
    setDrag(null); setOver(null);
  };

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <div><h1 className="h4">Баннеры</h1><p className="t-sm muted">Перетащите, чтобы изменить порядок в магазине</p></div>
        <button className="btn btn-primary" onClick={() => setEdit({ id: '', service: SERVICE_IDS[0], title: '', active: true })}><Plus size={16} /> Добавить баннер</button>
      </div>
      <div className="col gap-8">
        {list.map((bn, i) => {
          const s = svc(bn.service);
          return (
            <div key={bn.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver((o) => (o === i ? null : o))} onDrop={() => drop(i)} onDragEnd={() => { setDrag(null); setOver(null); }}
              className={clsx('bn-row', drag === i && 'dragging', over === i && drag !== i && 'over', !bn.active && 'off')}>
              <GripVertical size={18} className="bn-grip" />
              <span className="bn-num">{i + 1}</span>
              <div className="bn-preview" style={{ background: `linear-gradient(135deg, ${s.color}, color-mix(in srgb, ${s.color} 45%, #0b1414))` }}>
                <span>{bn.title}</span>
              </div>
              <div className="grow col" style={{ minWidth: 0 }}>
                <b className="t-sm">{bn.title}</b>
                <span className="row gap-6 t-xs muted"><BrandMark name={s.name} color={s.color} text={s.mark} size={16} /> {s.name}</span>
              </div>
              <Switch label="Показывать" on={bn.active} onChange={(v) => { m.setBanners(list.map((x) => (x.id === bn.id ? { ...x, active: v } : x))); log(v ? 'Включил баннер' : 'Отключил баннер', s.name); }} />
              <button className="icon-btn sm" onClick={() => setEdit(bn)} aria-label="edit"><Pencil size={14} /></button>
              <button className="icon-btn sm" onClick={() => setDel(bn)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
            </div>
          );
        })}
        {!list.length && <div className="card empty-state">Баннеров нет</div>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Изменить баннер' : 'Новый баннер'} width={460}>
        {edit && <BannerForm banner={edit} onClose={() => setEdit(null)} onSave={(bn) => {
          const exists = list.some((x) => x.id === bn.id);
          m.setBanners(exists ? list.map((x) => (x.id === bn.id ? bn : x)) : [...list, { ...bn, id: `bn-${Date.now()}` }]);
          log(exists ? 'Изменил баннер' : 'Добавил баннер', svc(bn.service).name, bn.title);
          toast('success', 'Баннер сохранён');
          setEdit(null);
        }} />}
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text={`Удалить баннер «${del?.title}»?`}
        onConfirm={() => { if (del) { m.setBanners(list.filter((x) => x.id !== del.id)); log('Удалил баннер', svc(del.service).name, del.title); } setDel(null); }} />
    </div>
  );
}

function BannerForm({ banner, onClose, onSave }: { banner: Banner; onClose: () => void; onSave: (b: Banner) => void }) {
  const [f, setF] = useState(banner);
  const [err, setErr] = useState('');
  const s = svc(f.service);
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Сервис"><Select value={f.service} onChange={(v) => setF({ ...f, service: v })} options={SERVICE_IDS.map((id) => ({ value: id, label: svc(id).name, icon: <BrandMark name={svc(id).name} color={svc(id).color} text={svc(id).mark} size={20} /> }))} /></Field>
      <Field label="Заголовок" error={err}><Input value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr(''); }} placeholder={`Например: Суперсила для бизнеса с ${s.name}`} error={!!err} maxLength={60} /></Field>
      <div className="bn-preview lg" style={{ background: `linear-gradient(135deg, ${s.color}, color-mix(in srgb, ${s.color} 45%, #0b1414))` }}><span>{f.title || 'Заголовок баннера'}</span></div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={() => { if (f.title.trim().length < 5) { setErr('Введите заголовок'); return; } onSave({ ...f, title: f.title.trim() }); }}>Сохранить</button>
      </div>
    </div>
  );
}
