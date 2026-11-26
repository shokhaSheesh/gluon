import type { ReactNode } from 'react';
import { BadgeCheck, Globe } from 'lucide-react';
import { BankLogo } from './ui';
import type { BankCard } from '../lib/merchant';

export function BankCardLogo({ b, height = 20 }: { b: Pick<BankCard, 'id' | 'name' | 'logo'>; height?: number }) {
  return b.logo ? <img src={b.logo} alt={b.name} style={{ height, maxWidth: 160, objectFit: 'contain' }} /> : <BankLogo id={b.id} name={b.name} height={height} />;
}

/** The bank card users see in «Предложения банков» (also the live preview in admin). */
export function BankCardView({ b, action }: { b: BankCard; action?: ReactNode }) {
  return (
    <div className="bk-card">
      <div className="col gap-8">
        <span className="bk-logo"><BankCardLogo b={b} /></span>
        <span className="row gap-8"><span className="t-xs muted">★ {b.rating} · рейтинг Gluon</span>{b.online && <span className="badge badge-success"><Globe size={12} /> Онлайн</span>}</span>
      </div>
      {b.terms.length > 0 && (
        <dl className="bk-terms">
          {b.terms.map((t, i) => <span key={i} style={{ display: 'contents' }}><dt>{t.label || '—'}</dt><dd>{t.value || '—'}</dd></span>)}
        </dl>
      )}
      {b.perk && <p className="bk-perk"><BadgeCheck size={14} /> {b.perk}</p>}
      {b.products.length > 0 && <div className="tm-chips">{b.products.map((p, i) => <span key={i} className="badge badge-neutral">{p.name || '—'}</span>)}</div>}
      {action}
    </div>
  );
}
