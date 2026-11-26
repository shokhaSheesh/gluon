import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { BadgeCheck, Globe, ShieldCheck } from 'lucide-react';
import { BankLogo, BrandMark, Field, Input, Modal, PhoneInput, Select } from '../../components/ui';
import { BANKS, CREDIT_ROWS, INSTALLMENT_ROWS, type Bank } from '../../data/mock';
import { useApp } from '../../lib/store';
import { DEMO_CLIENT_ID, useMerchant } from '../../lib/merchant';
import './banking.css';

const bank = (id: string) => BANKS.find((b) => b.id === id)!;
const LIST = BANKS.filter((b) => b.id !== 'ipak');

const PRODUCTS = ['Расчётный счёт', 'Кредит', 'Рассрочка', 'Бизнес-карта', 'Эквайринг'];
type Lead = { bank: Bank; product: string };

export default function Banking() {
  const { bankOffers: ACCOUNT_TERMS } = useMerchant();
  const [lead, setLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'free'>('all');
  const banks = LIST.filter((b) => filter === 'all' || (filter === 'online' ? ACCOUNT_TERMS[b.id].online : ACCOUNT_TERMS[b.id].fee === 'Бесплатно'));

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between wrap gap-12">
          <div>
            <h1 className="h4">Предложения банков</h1>
            <p className="muted t-sm">Сравните условия и откройте расчётный счёт в удобном для вас банке — заявка уйдёт в банк напрямую.</p>
          </div>
          <div className="tabs-seg">
            {([['all', 'Все банки'], ['online', 'Открытие онлайн'], ['free', 'Бесплатное обслуживание']] as const).map(([k, l]) => (
              <button key={k} className={clsx(filter === k && 'active')} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="bk-grid">
          {banks.map((b) => {
            const t = ACCOUNT_TERMS[b.id];
            return (
              <div key={b.id} className="bk-card">
                <div className="col gap-8">
                  <span className="bk-logo"><BankLogo id={b.id} name={b.name} height={20} /></span>
                  <span className="row gap-8"><span className="t-xs muted">★ {t.rating} · рейтинг Gluon</span>{t.online && <span className="badge badge-success"><Globe size={12} /> Онлайн</span>}</span>
                </div>
                <dl className="bk-terms">
                  <dt>Обслуживание</dt><dd>{t.fee}</dd>
                  <dt>Открытие счёта</dt><dd>{t.open}</dd>
                </dl>
                <p className="bk-perk"><BadgeCheck size={14} /> {t.perk}</p>
                <button className="btn btn-primary btn-block" onClick={() => setLead({ bank: b, product: 'Расчётный счёт' })}>Открыть счёт</button>
              </div>
            );
          })}
        </div>
      </section>

      <ProductTable title="Кредиты" head={['Банк', 'Годовой процент', 'Макс. сумма', 'Срок', 'Подтверждение', 'Ежедневный штраф', 'Онлайн']}
        rows={CREDIT_ROWS.map((r) => ({ bank: r.bank, cells: [r.rate, r.max, r.term, r.approve, r.fine, r.online ? 'Да' : <span className="error-text">Нет</span>] }))}
        onApply={(b) => setLead({ bank: bank(b), product: 'Кредит' })} />
      {[['Рассрочка', 'Рассрочка'], ['Банковские карты', 'Бизнес-карта'], ['Мобильный банкинг', 'Расчётный счёт']].map(([t, product]) => (
        <ProductTable key={t} title={t} head={['Банк', 'Без процента', 'Макс. срок', 'Первоначальный взнос', 'Магазин-партнер', 'Документ', 'Подтверждение']}
          rows={INSTALLMENT_ROWS.map((r) => ({ bank: r.bank, cells: [r.free ? 'Да' : <span className="error-text">Нет</span>, r.term, r.first, r.partners, r.doc, r.approve] }))}
          onApply={(b) => setLead({ bank: bank(b), product })} />
      ))}

      <LeadModal lead={lead} onClose={() => setLead(null)} />
    </div>
  );
}

function ProductTable({ title, head, rows, onApply }: { title: string; head: string[]; rows: { bank: string; cells: React.ReactNode[] }[]; onApply: (bank: string) => void }) {
  return (
    <section className="section" style={{ padding: 0, overflow: 'hidden' }}>
      <h3 className="medium" style={{ padding: '14px 20px', fontSize: 16 }}>{title}</h3>
      <div className="table-wrap">
        <table className="table">
          <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}<th /></tr></thead>
          <tbody>
            {rows.map((r) => {
              const b = bank(r.bank);
              return (
                <tr key={r.bank}>
                  <td><BankLogo id={b.id} name={b.name} height={16} /></td>
                  {r.cells.map((c, j) => <td key={j}>{c}</td>)}
                  <td style={{ textAlign: 'right' }}><button className="btn btn-soft btn-sm" onClick={() => onApply(r.bank)}>Подключить</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function LeadModal({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const { session, toast } = useApp();
  const { addAccountRequest } = useMerchant();
  const [f, setF] = useState({ fio: '', phone: '', company: 'ООО “Прометей”', inn: '123456789', product: '' });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (lead) {
      setSent(false);
      setF((x) => ({ ...x, fio: session?.name ?? '', phone: session?.login ?? '', product: lead.product }));
    }
  }, [lead, session]);

  return (
    <Modal open={!!lead} onClose={onClose} title="Заявка в банк" width={480}>
      {lead && (sent ? (
        <div className="col gap-12" style={{ padding: 28, alignItems: 'center', textAlign: 'center' }}>
          <span className="bk-done"><ShieldCheck size={28} /></span>
          <h3 className="h4">Заявка отправлена</h3>
          <p className="muted t-sm">{lead.bank.name} свяжется с вами в течение 1 рабочего дня. Статус заявки появится в разделе «Банк аккаунт» профиля.</p>
          <button className="btn btn-primary btn-block mt-8" onClick={onClose}>Понятно</button>
        </div>
      ) : (
        <div className="col gap-16" style={{ padding: 24 }}>
          <div className="row gap-12" style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
            <BrandMark name={lead.bank.name} color={lead.bank.color} text={lead.bank.mark} size={40} />
            <div><b>{lead.bank.name}</b><p className="t-sm muted">Данные компании будут переданы банку для открытия счёта</p></div>
          </div>
          <Field label="Продукт"><Select value={f.product} onChange={(v) => setF({ ...f, product: v })} options={PRODUCTS.map((p) => ({ value: p, label: p }))} /></Field>
          <Field label="ФИО"><Input value={f.fio} onChange={(e) => setF({ ...f, fio: e.target.value })} placeholder="Введите ФИО" /></Field>
          <Field label="Телефон номер"><PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} /></Field>
          <div className="row gap-12">
            <div className="grow"><Field label="Компания"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field></div>
            <div style={{ width: 150 }}><Field label="ИНН"><Input value={f.inn} onChange={(e) => setF({ ...f, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })} /></Field></div>
          </div>
          <label className="checkbox t-sm"><input type="checkbox" defaultChecked /> Согласен на передачу данных в {lead.bank.name}</label>
          <div className="row gap-12">
            <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
            <button className="btn btn-primary grow" onClick={() => {
              if (!f.fio || f.phone.length < 9) { toast('error', 'Заполните ФИО и телефон'); return; }
              addAccountRequest({ clientId: DEMO_CLIENT_ID, bank: lead.bank.id, product: f.product, contact: f.fio, phone: f.phone });
              setSent(true);
              toast('success', `Заявка в ${lead.bank.name} отправлена`);
            }}>Отправить заявку</button>
          </div>
        </div>
      ))}
    </Modal>
  );
}
