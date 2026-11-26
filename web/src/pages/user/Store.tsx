import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { BrandMark, ConfirmModal, Modal } from '../../components/ui';
import { SERVICES, type Service } from '../../data/mock';
import { useApp } from '../../lib/store';
import { SERVICE_IDS, bannerState, orderedServices, recommendedFor, useMerchant } from '../../lib/merchant';
import { bannerBg } from '../panel/AdminBanners';
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
type Item = Service & { st: St; rec?: boolean };

export default function Store() {
  const { toast, session } = useApp();
  const nav = useNavigate();
  const { bankServices, banners, recommended, serviceOrder } = useMerchant();
  const order = orderedServices(serviceOrder);
  // a partner bank can hide services from its clients (already connected ones stay)
  const allowed = session?.kind === 'bank' && session.orgId ? (bankServices[session.orgId] ?? SERVICE_IDS) : null;
  const { prices, payService, balance, linked, setLink } = useBilling();
  const { openTopUp } = useShell();
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [linking, setLinking] = useState<Service | null>(null);
  const [off, setOff] = useState<Item | null>(null);
  const [slide, setSlide] = useState(0);

  // Services take their state from billing (shared with the «Сервисы» switcher).
  const items: Item[] = [
    // hidden by Gluon admin («В магазине» off) or by the client's bank → not offered; already connected ones stay
    ...[...SERVICES].sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99)).map((s) => ({ ...s, st: (linked[s.id] ?? 'available') as St }))
      .filter((s) => s.st !== 'available' || ((prices[s.id]?.active ?? true) && (!allowed || allowed.includes(s.id)))),
  ];
  const priceOf = (s: Service) => (prices[s.id] ? `${sum(prices[s.id].price)}` : s.price);

  const act = (s: Item) => {
    if (s.st === 'available') setConfirm(s);
    else if (s.st === 'link') setLinking(s);
    else if (s.st === 'connected') setOff(s);
  };
  const disconnect = (s: Item) => {
    setLink(s.id, null);
    toast('info', `${s.name} отключён`);
  };

  const mine = items.filter((s) => s.st !== 'available');
  const recIds = recommendedFor(recommended, session?.kind === 'bank' ? session.orgId : undefined);
  const recList = items.filter((s) => s.st === 'available').map((s) => ({ ...s, rec: recIds.includes(s.id) })).sort((a, b) => Number(!!b.rec) - Number(!!a.rec));
  // banners: admin's order, only the ones on air today (switched on + inside their period) for services this client can see
  const offers = banners.filter((bn) => bannerState(bn) === 'live').map((bn) => ({ bn, s: items.find((x) => x.id === bn.service) })).filter((x): x is { bn: typeof x.bn; s: Item } => !!x.s);

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between">
          <h2 className="h5">Специальные предложения</h2>
          <div className="row gap-8">
            <button className="icon-btn sm" onClick={() => setSlide((x) => Math.max(0, x - 1))} aria-label="prev"><ChevronLeft size={16} /></button>
            <button className="icon-btn sm" onClick={() => setSlide((x) => Math.min(Math.max(0, offers.length - 4), x + 1))} aria-label="next"><ChevronRight size={16} /></button>
          </div>
        </div>
        <div className="st-offers">
          <div className="st-track" style={{ transform: `translateX(calc(${-slide} * (25% + 4px)))` }}>
            {offers.map(({ bn, s }) => (
              <div key={bn.id} className="st-offer" style={{ background: bn.image ? `linear-gradient(180deg, rgba(0,0,0,.05) 30%, rgba(0,0,0,.65)), ${bannerBg(bn, s.color)}` : bannerBg(bn, s.color) }}>
                <span className="badge badge-success" style={{ alignSelf: 'flex-start' }}>Специальное предложение</span>
                {bn.image ? <span /> : <p className="st-offer-title">{bn.title}</p>}
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
      <ServiceGrid title="Рекомендованные сервисы" items={recList} onAct={act} priceOf={priceOf} extraLocked />

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
                if (payService(confirm.id, 1) === 'insufficient') { toast('error', 'Недостаточно средств на балансе'); setConfirm(null); openTopUp(); return; }
                setLink(confirm.id, 'link');
                toast('success', `${confirm.name}: подписка оплачена`);
                setLinking(confirm);
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
                <span className="row gap-6">{s.rec && <span className="badge badge-primary">Рекомендуем</span>}<span className={`badge ${st.cls}`}>{st.label}</span></span>
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
