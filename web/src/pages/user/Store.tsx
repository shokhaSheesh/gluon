import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { BrandMark, ConfirmModal, Modal } from '../../components/ui';
import { SERVICES, STORE_EXTRA, type Service } from '../../data/mock';
import { useApp } from '../../lib/store';
import { SERVICE_IDS, useMerchant } from '../../lib/merchant';
import { IMAGES } from '../../assets';
import { sum, useBilling } from '../../lib/billing';
import { useShell } from '../../layouts/UserLayout';
import { LinkServiceModal } from './LinkService';
import './store.css';

type St = 'connected' | 'review' | 'link' | 'available';
const STATUS: Record<St, { label: string; cls: string }> = {
  connected: { label: 'Подключен', cls: 'badge-info' },
  review: { label: 'В рассмотрении', cls: 'badge-success' },
  link: { label: 'Требует подключения', cls: 'badge-warning' },
  available: { label: 'Не подключен', cls: 'badge-neutral' },
};
type Item = Service & { st: St };

export default function Store() {
  const { toast, session } = useApp();
  const nav = useNavigate();
  const { bankServices } = useMerchant();
  // a partner bank can hide services from its clients (already connected ones stay)
  const allowed = session?.kind === 'bank' && session.orgId ? (bankServices[session.orgId] ?? SERVICE_IDS) : null;
  const { prices, payService, balance, linked, setLink } = useBilling();
  const { openTopUp } = useShell();
  const [extras, setExtras] = useState(STORE_EXTRA);
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [linking, setLinking] = useState<Service | null>(null);
  const [off, setOff] = useState<Item | null>(null);
  const [slide, setSlide] = useState(0);

  // Integrated services take their state from billing (shared with the «Сервисы» switcher); extras are demo-only.
  const items: Item[] = [
    ...SERVICES.map((s) => ({ ...s, st: (linked[s.id] ?? 'available') as St })).filter((s) => !allowed || s.st !== 'available' || allowed.includes(s.id)),
    ...extras.map((s) => ({ ...s, st: s.status as St })),
  ];
  const isIntegrated = (id: string) => SERVICES.some((s) => s.id === id);
  const priceOf = (s: Service) => (prices[s.id] ? `${sum(prices[s.id].price)}` : s.price);

  const act = (s: Item) => {
    if (s.st === 'available') setConfirm(s);
    else if (s.st === 'link') setLinking(s);
    else if (s.st === 'connected') setOff(s);
  };
  const disconnect = (s: Item) => {
    if (isIntegrated(s.id)) setLink(s.id, null);
    else setExtras((l) => l.map((x) => (x.id === s.id ? { ...x, status: 'available' } : x)));
    toast('info', `${s.name} отключён`);
  };

  const mine = items.filter((s) => s.st !== 'available');
  const recommended = items.filter((s) => s.st === 'available');

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between">
          <h2 className="h5">Специальные предложения</h2>
          <div className="row gap-8">
            <button className="icon-btn sm" onClick={() => setSlide((x) => Math.max(0, x - 1))} aria-label="prev"><ChevronLeft size={16} /></button>
            <button className="icon-btn sm" onClick={() => setSlide((x) => Math.min(2, x + 1))} aria-label="next"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="st-offers">
          <div className="st-track" style={{ transform: `translateX(calc(${-slide} * (25% + 4px)))` }}>
            {items.filter((s) => isIntegrated(s.id)).map((s) => (
              <div key={s.id} className="st-offer" style={{ background: s.id === 'billz' ? `linear-gradient(180deg, rgba(0,0,0,.05) 30%, rgba(0,0,0,.65)), url(${IMAGES.billzOffer}) center/cover` : `linear-gradient(135deg, ${s.color}, color-mix(in srgb, ${s.color} 45%, #0b1414))` }}>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Специальное предложение</span>
                {s.id === 'billz' ? <span /> : <p className="st-offer-title">Суперсила для бизнеса<br />с {s.name}</p>}
                <div className="row between">
                  <span className="row gap-8"><BrandMark name={s.name} color="#ffffff33" text={s.mark} size={30} /><span><b>{s.name}</b><br /><span className="t-xs">{priceOf(s)}</span></span></span>
                  <button className="btn btn-secondary btn-sm" onClick={() => (s.st === 'available' ? setConfirm(s) : s.st === 'link' ? setLinking(s) : toast('info', `${s.name} уже подключён`))}>
                    {s.st === 'connected' ? 'Подключён' : 'Подключить'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ServiceGrid title="Мои сервисы" items={mine} onAct={act} />
      <ServiceGrid title="Рекомендованные сервисы" items={recommended} onAct={act} priceOf={priceOf} extraLocked />

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Подключение сервиса" width={440}>
        {confirm && (
          <div className="col gap-16" style={{ padding: 24 }}>
            <div className="row gap-12"><BrandMark name={confirm.name} color={confirm.color} text={confirm.mark} size={44} /><div><b style={{ fontSize: 18 }}>{confirm.name}</b><p className="t-sm muted">{confirm.type}</p></div></div>
            <p className="t-sm">{confirm.description}</p>
            <ol className="st-steps">
              <li className="on">Оплата подписки с баланса Gluon</li>
              <li>Связать аккаунт {confirm.name} с Gluon</li>
              <li>Данные появятся в дашборде и архиве</li>
            </ol>
            <div className="row between" style={{ padding: 12, borderRadius: 10, background: 'var(--surface-2)' }}>
              <span className="muted t-sm">Стоимость подписки</span><b>{priceOf(confirm)}{prices[confirm.id] ? ' / мес' : ''}</b>
            </div>
            <p className="t-xs muted">Первый месяц списывается с баланса Gluon (сейчас {sum(balance)}). Дальше — автопродление в разделе «Подписки и тарифы».</p>
            <div className="row gap-12">
              <button className="btn btn-secondary grow" onClick={() => setConfirm(null)}>Отмена</button>
              <button className="btn btn-primary grow" onClick={() => {
                if (isIntegrated(confirm.id)) {
                  if (payService(confirm.id, 1) === 'insufficient') { toast('error', 'Недостаточно средств на балансе'); setConfirm(null); openTopUp(); return; }
                  setLink(confirm.id, 'link');
                  toast('success', `${confirm.name}: подписка оплачена`);
                  setLinking(confirm);
                } else {
                  setExtras((l) => l.map((x) => (x.id === confirm.id ? { ...x, status: 'review' } : x)));
                  toast('success', `Заявка на подключение ${confirm.name} отправлена`);
                }
                setConfirm(null);
              }}>{prices[confirm.id] ? 'Оплатить и подключить' : 'Подключить'}</button>
            </div>
          </div>
        )}
      </Modal>

      <LinkServiceModal service={linking} onClose={() => setLinking(null)} onDone={() => linking && nav(`/app/service/${linking.id}`)} />
      <ConfirmModal open={!!off} onClose={() => setOff(null)} confirmText="Отключить" text={`Отключить ${off?.name}? Данные останутся в Gluon Архиве.`}
        onConfirm={() => { if (off) disconnect(off); setOff(null); }} />
    </div>
  );
}

function ServiceGrid({ title, items, onAct, priceOf, extraLocked }: { title: string; items: Item[]; onAct: (s: Item) => void; priceOf?: (s: Service) => string; extraLocked?: boolean }) {
  return (
    <section className="section">
      <h2 className="h5">{title}</h2>
      <div className="st-grid">
        {items.map((s) => {
          const st = STATUS[s.st];
          return (
            <div key={s.id} className="st-card">
              <div className="row between">
                <BrandMark name={s.name} color={s.color} text={s.mark} size={34} />
                <span className={`badge ${st.cls}`}>{st.label}</span>
              </div>
              <p className="medium mt-8">{s.name}</p>
              <p className="t-xs muted st-desc">{s.description}</p>
              {priceOf && <p className="t-sm semibold">{priceOf(s)}{s.price !== 'Бесплатно' && s.price !== '—' ? ' / мес' : ''}</p>}
              <button className={`btn btn-sm btn-block st-btn ${s.st} ${s.st === 'link' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onAct(s)} disabled={s.st === 'review'}>
                {{ connected: 'Отключить', review: 'Ожидает подтверждения', link: 'Завершить подключение', available: 'Подключить' }[s.st]}
              </button>
            </div>
          );
        })}
        {extraLocked && (
          <div className="st-card st-locked">
            <div className="st-lock"><Lock size={22} /></div>
            <p className="medium" style={{ textAlign: 'center' }}>ИНН не подтверждён</p>
            <p className="t-xs muted" style={{ textAlign: 'center' }}>Пожалуйста, обновите ИНН в вашем профиле.</p>
            <button className="btn btn-secondary btn-sm btn-block st-btn">Исправить</button>
          </div>
        )}
      </div>
    </section>
  );
}
