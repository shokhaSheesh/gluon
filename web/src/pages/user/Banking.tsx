import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { ShieldCheck } from 'lucide-react';
import { Field, Input, Modal, PhoneInput, Select } from '../../components/ui';
import { BankCardLogo, BankCardView } from '../../components/BankCardView';
import { useApp } from '../../lib/store';
import { DEMO_CLIENT_ID, useMerchant, type BankCard } from '../../lib/merchant';
import './banking.css';

type Lead = { bank: BankCard; product: string };
const isFree = (b: BankCard) => b.terms.some((t) => /бесплат/i.test(t.value) && /обслуж/i.test(t.label));

/** «Предложения банков»: everything here (cards, terms, products and their parameters) is managed by Gluon admin. */
export default function Banking() {
  const { banks: all } = useMerchant();
  const [lead, setLead] = useState<Lead | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'free'>('all');
  const banks = all.filter((b) => b.active);
  const shown = banks.filter((b) => filter === 'all' || (filter === 'online' ? b.online : isFree(b)));
  // one comparison table per product; columns = every parameter the admin typed for that product
  const productNames = [...new Set(banks.flatMap((b) => b.products.map((p) => p.name)))];

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between wrap gap-12">
          <div>
            <h1 className="h4">Предложения банков</h1>
            <p className="muted t-sm">Сравните условия и откройте счёт в удобном банке</p>
          </div>
          <div className="tabs-seg">
            {([['all', 'Все банки'], ['online', 'Открытие онлайн'], ['free', 'Бесплатное обслуживание']] as const).map(([k, l]) => (
              <button key={k} className={clsx(filter === k && 'active')} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="bk-grid">
          {shown.map((b) => (
            <BankCardView key={b.id} b={b} action={<button className="btn btn-primary btn-block" onClick={() => setLead({ bank: b, product: b.products[0]?.name ?? 'Расчётный счёт' })}>Открыть счёт</button>} />
          ))}
        </div>
      </section>

      {productNames.map((name) => {
        const rows = banks.map((b) => ({ b, p: b.products.find((x) => x.name === name) })).filter((x): x is { b: BankCard; p: BankCard['products'][number] } => !!x.p);
        const cols = [...new Set(rows.flatMap(({ p }) => p.params.map((x) => x.label)))];
        return (
          <section key={name} className="section" style={{ padding: 0, overflow: 'hidden' }}>
            <h3 className="medium" style={{ padding: '14px 20px', fontSize: 16 }}>{name}</h3>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Банк</th>{cols.map((c) => <th key={c}>{c}</th>)}<th /></tr></thead>
                <tbody>
                  {rows.map(({ b, p }) => (
                    <tr key={b.id}>
                      <td><BankCardLogo b={b} height={16} /></td>
                      {cols.map((c) => {
                        const v = p.params.find((x) => x.label === c)?.value ?? '—';
                        return <td key={c}>{v === 'Нет' ? <span className="error-text">Нет</span> : v}</td>;
                      })}
                      <td style={{ textAlign: 'right' }}><button className="btn btn-soft btn-sm" onClick={() => setLead({ bank: b, product: name })}>Подать заявку</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <LeadModal lead={lead} onClose={() => setLead(null)} />
    </div>
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
            <span style={{ width: 120, display: 'inline-flex' }}><BankCardLogo b={lead.bank} height={22} /></span>
            <div><b>{lead.bank.name}</b><p className="t-sm muted">Данные компании будут переданы банку для открытия счёта</p></div>
          </div>
          <Field label="Продукт"><Select value={f.product} onChange={(v) => setF({ ...f, product: v })} options={(lead.bank.products.length ? lead.bank.products.map((p) => p.name) : ['Расчётный счёт']).map((p) => ({ value: p, label: p }))} /></Field>
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
