import { useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, GripVertical, ImageUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Badge, BrandMark, ConfirmModal, Field, Input, Modal, Select } from '../../components/ui';
import { DateField } from '../../components/calendar';
import { SERVICES } from '../../data/mock';
import { SERVICE_IDS, bannerState, parseDate, useMerchant, type Banner, type BannerState } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import { Switch } from './AdminServices';
import './merchant/merchant.css';

const svc = (id: string) => SERVICES.find((s) => s.id === id)!;
const STATE: Record<BannerState, { label: string; kind: 'success' | 'warning' | 'neutral' | 'info' }> = {
  live: { label: 'Показывается', kind: 'success' }, scheduled: { label: 'Запланирован', kind: 'info' }, ended: { label: 'Завершён', kind: 'neutral' }, off: { label: 'Выключен', kind: 'neutral' },
};
export const periodText = (b: Pick<Banner, 'from' | 'to'>) => (b.from && b.to ? `${b.from} — ${b.to}` : b.from ? `с ${b.from}` : b.to ? `до ${b.to}` : 'Без срока');
/** Banner background: uploaded picture, or the service colour with the title. */
export const bannerBg = (b: Pick<Banner, 'image'>, color: string) => (b.image ? `url(${b.image}) center/cover` : `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 45%, #0b1414))`);

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
        <div><h1 className="h4">Баннеры</h1><p className="t-sm muted">Перетащите, чтобы изменить порядок в магазине. Баннер показывается, пока включён и идёт его период.</p></div>
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
              <div className="bn-preview" style={{ background: bannerBg(bn, s.color) }}>
                {!bn.image && <span>{bn.title}</span>}
              </div>
              <div className="grow col gap-2" style={{ minWidth: 0 }}>
                <b className="t-sm">{bn.title}</b>
                <span className="row gap-6 t-xs muted"><BrandMark name={s.name} color={s.color} text={s.mark} size={16} /> {s.name}</span>
              </div>
              <div className="col gap-4 bn-period">
                <Badge kind={STATE[bannerState(bn)].kind}>{STATE[bannerState(bn)].label}</Badge>
                <span className="row gap-4 t-xs muted"><CalendarDays size={12} />{periodText(bn)}</span>
              </div>
              <Switch label="Показывать" on={bn.active} onChange={(v) => { m.setBanners(list.map((x) => (x.id === bn.id ? { ...x, active: v } : x))); log(v ? 'Включил баннер' : 'Отключил баннер', s.name); }} />
              <button className="icon-btn sm" onClick={() => setEdit(bn)} aria-label="edit"><Pencil size={14} /></button>
              <button className="icon-btn sm" onClick={() => setDel(bn)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
            </div>
          );
        })}
        {!list.length && <div className="card empty-state">Баннеров нет</div>}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Изменить баннер' : 'Новый баннер'} width={520}>
        {edit && <BannerForm banner={edit} onClose={() => setEdit(null)} onSave={(bn) => {
          const exists = list.some((x) => x.id === bn.id);
          m.setBanners(exists ? list.map((x) => (x.id === bn.id ? bn : x)) : [...list, { ...bn, id: `bn-${Date.now()}` }]);
          log(exists ? 'Изменил баннер' : 'Добавил баннер', svc(bn.service).name, `${bn.title} · ${periodText(bn)}${bn.image ? ' · с картинкой' : ''}`);
          toast('success', 'Баннер сохранён');
          setEdit(null);
        }} />}
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} confirmText="Удалить" text={`Удалить баннер «${del?.title}»?`}
        onConfirm={() => { if (del) { m.setBanners(list.filter((x) => x.id !== del.id)); log('Удалил баннер', svc(del.service).name, del.title); } setDel(null); }} />
    </div>
  );
}

/** Banner picture: downscaled in the browser so it fits the demo storage. */
function BannerImage({ value, onChange }: { value?: string; onChange: (v?: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState('');
  const load = (f: File) => {
    if (!/^image\/(png|jpeg|webp)$/.test(f.type)) { setErr('Нужен PNG, JPG или WEBP'); return; }
    if (f.size > 5_000_000) { setErr('Файл больше 5 МБ'); return; }
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const w = Math.min(1200, img.width), h = Math.round((img.height * w) / img.width);
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      setErr(''); onChange(cv.toDataURL('image/jpeg', 0.82));
    };
    img.src = url;
  };
  return (
    <div className="col gap-6">
      <div className="row gap-8 wrap">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}><ImageUp size={14} /> {value ? 'Заменить картинку' : 'Загрузить картинку'}</button>
        {value && <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(undefined)}><X size={14} /> Убрать</button>}
      </div>
      <span className="t-xs muted">{err ? <span style={{ color: 'var(--error)' }}>{err}</span> : 'PNG, JPG или WEBP до 5 МБ, лучше 16:9. Без картинки баннер будет цвета сервиса с заголовком.'}</span>
      <input ref={file} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) load(f); }} />
    </div>
  );
}

function BannerForm({ banner, onClose, onSave }: { banner: Banner; onClose: () => void; onSave: (b: Banner) => void }) {
  const [f, setF] = useState(banner);
  const [err, setErr] = useState<{ title?: string; to?: string }>({});
  const s = svc(f.service);
  const submit = () => {
    const e: typeof err = {};
    if (f.title.trim().length < 5) e.title = 'Введите заголовок';
    if (f.from && f.to && parseDate(f.to) < parseDate(f.from)) e.to = 'Дата окончания раньше начала';
    setErr(e);
    if (!Object.keys(e).length) onSave({ ...f, title: f.title.trim() });
  };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="Сервис"><Select value={f.service} onChange={(v) => setF({ ...f, service: v })} options={SERVICE_IDS.map((id) => ({ value: id, label: svc(id).name, icon: <BrandMark name={svc(id).name} color={svc(id).color} text={svc(id).mark} size={20} /> }))} /></Field>
      <Field label="Заголовок" error={err.title}><Input value={f.title} onChange={(e) => { setF({ ...f, title: e.target.value }); setErr({ ...err, title: undefined }); }} placeholder={`Например: Суперсила для бизнеса с ${s.name}`} error={!!err.title} maxLength={60} /></Field>
      <Field label="Картинка"><BannerImage value={f.image} onChange={(image) => setF({ ...f, image })} /></Field>
      <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
        <div className="grow"><Field label="Показывать с"><DateField value={f.from} onChange={(from) => setF({ ...f, from })} placeholder="Сразу" /></Field></div>
        <div className="grow"><Field label="по" error={err.to}><DateField value={f.to} onChange={(to) => { setF({ ...f, to }); setErr({ ...err, to: undefined }); }} placeholder="Без срока" min={f.from ? parseDate(f.from) : undefined} align="right" /></Field></div>
      </div>
      <div className="bn-preview lg" style={{ background: bannerBg(f, s.color) }}>{!f.image && <span>{f.title || 'Заголовок баннера'}</span>}</div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>Сохранить</button>
      </div>
    </div>
  );
}
