import { useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, Globe, Home, ImageUp, LayoutGrid, RotateCcw, ArrowLeftRight, Archive, ShoppingBag } from 'lucide-react';
import { Field, Input } from '../../components/ui';
import { BRAND_PRESETS, useBranding, type Brand } from '../../lib/branding';
import { useApp } from '../../lib/store';
import './branding.css';

/** Bank cabinet: white-label settings for the bank's clients (logo, name, main colour). */
export default function Branding() {
  const { session, toast } = useApp();
  const { brands, save, reset, logoOf } = useBranding();
  const bankId = session?.orgId ?? 'kapital';
  const [f, setF] = useState<Brand>(brands[bankId]);
  const file = useRef<HTMLInputElement>(null);
  const valid = /^#[0-9a-f]{6}$/i.test(f.primary);
  const changed = JSON.stringify(f) !== JSON.stringify(brands[bankId]);

  const upload = (fl?: File) => {
    if (!fl) return;
    if (fl.size > 1024 * 1024) { toast('error', 'Логотип должен быть меньше 1 МБ'); return; }
    const r = new FileReader();
    r.onload = () => setF((x) => ({ ...x, logo: String(r.result) }));
    r.readAsDataURL(fl);
  };

  return (
    <div className="col gap-20">
      <div className="row between wrap gap-12">
        <div>
          <h1 className="h4">Брендинг</h1>
          <p className="t-sm muted">Ваши клиенты увидят Gluon под вашим логотипом и в ваших цветах.</p>
        </div>
        <div className="row gap-12">
          <button className="btn btn-ghost btn-sm" onClick={() => { reset(bankId); setF(brands[bankId]); toast('info', 'Настройки сброшены'); }}><RotateCcw size={14} /> Сбросить</button>
          <button className="btn btn-primary" disabled={!changed || !valid} onClick={() => { save(f); toast('success', 'Брендинг сохранён — клиенты увидят его при следующем входе'); }}>Сохранить</button>
        </div>
      </div>

      <div className="br-grid">
        <div className="card col gap-20" style={{ padding: 20 }}>
          <Field label="Название платформы для клиентов">
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Например: Kapitalbank Business" />
          </Field>

          <div className="field">
            <span className="label">Логотип</span>
            <div className="br-logo">
              <span className="br-logo-box"><img src={logoOf(f)} alt="" /></span>
              <div className="col gap-6">
                <div className="row gap-8">
                  <button className="btn btn-secondary btn-sm" onClick={() => file.current?.click()}><ImageUp size={14} /> Загрузить</button>
                  {f.logo && <button className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, logo: undefined })}>Убрать</button>}
                </div>
                <span className="t-xs muted">PNG или SVG, горизонтальный, до 1 МБ</span>
              </div>
              <input ref={file} type="file" hidden accept="image/png,image/svg+xml,image/jpeg" onChange={(e) => upload(e.target.files?.[0])} />
            </div>
          </div>

          <div className="field">
            <span className="label">Основной цвет</span>
            <div className="row gap-8 wrap">
              {BRAND_PRESETS.map((c) => (
                <button key={c} className={clsx('br-swatch', f.primary.toLowerCase() === c.toLowerCase() && 'on')} style={{ background: c }} onClick={() => setF({ ...f, primary: c })} aria-label={c}>
                  {f.primary.toLowerCase() === c.toLowerCase() && <Check size={14} color="#fff" />}
                </button>
              ))}
            </div>
            <div className="row gap-8 mt-8">
              <input type="color" className="br-picker" value={valid ? f.primary : '#000000'} onChange={(e) => setF({ ...f, primary: e.target.value })} />
              <div style={{ width: 140 }}><Input value={f.primary} onChange={(e) => setF({ ...f, primary: e.target.value })} error={!valid} /></div>
            </div>
            <span className="hint">Используется для кнопок, активных вкладок, графиков и акцентов.</span>
          </div>

          <div className="field">
            <span className="label">Адрес для клиентов</span>
            <div className="br-domain"><Globe size={16} /> https://{f.subdomain}</div>
            <span className="hint">Клиенты, вошедшие с любого адреса, автоматически перенаправляются сюда. Свой домен (например business.kapitalbank.uz) подключается через CNAME.</span>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <p className="medium" style={{ marginBottom: 12 }}>Предпросмотр</p>
          <Preview brand={f} logo={logoOf(f)} />
        </div>
      </div>
    </div>
  );
}

function Preview({ brand, logo }: { brand: Brand; logo?: string }) {
  const c = /^#[0-9a-f]{6}$/i.test(brand.primary) ? brand.primary : '#385D5D';
  return (
    <div className="br-prev" style={{ ['--c' as string]: c }}>
      <div className="br-prev-top">
        <img src={logo} alt="" className="br-prev-logo" />
        <div className="br-prev-nav">
          <span className="on"><Home size={12} /> Главная</span>
          <span><LayoutGrid size={12} /> Сервисы</span>
          <span><ArrowLeftRight size={12} /> Операции</span>
          <span><Archive size={12} /> Архив</span>
          <span><ShoppingBag size={12} /> Магазин</span>
        </div>
      </div>
      <div className="br-prev-body">
        <div className="br-prev-kpis">
          {['48 789 500 сум', '172 500 сум', '5 000'].map((v) => <div key={v}><span>Показатель</span><b>{v}</b></div>)}
        </div>
        <div className="br-prev-chart">
          <svg viewBox="0 0 300 90" preserveAspectRatio="none">
            <path d="M0 60 C 30 20, 60 70, 90 50 S 150 10, 180 40 S 240 70, 300 30 L300 90 L0 90Z" fill="var(--c)" opacity=".12" />
            <path d="M0 60 C 30 20, 60 70, 90 50 S 150 10, 180 40 S 240 70, 300 30" fill="none" stroke="var(--c)" strokeWidth="2" />
          </svg>
        </div>
        <div className="row gap-8">
          <span className="br-prev-btn">Оплатить</span>
          <span className="br-prev-btn ghost">Подробнее</span>
        </div>
        <p className="br-prev-foot">{brand.name} · работает на платформе Gluon</p>
      </div>
    </div>
  );
}
