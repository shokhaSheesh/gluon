import { useEffect, useState } from 'react';
import { Info, Plus } from 'lucide-react';
import { Field, Input, Modal } from '../../components/ui';
import { cardBrand, useBilling } from '../../lib/billing';
import { useApp } from '../../lib/store';
import { OtpBlock } from '../auth/OtpStep';
import { CardBrand } from './ProfileModal';

const MIN = 10_000;
const MAX = 1_000_000_000;
const digits = (s: string) => s.replace(/\D/g, '');
const money = (s: string) => (digits(s) ? Number(digits(s)).toLocaleString('ru-RU') : '');
const cardFmt = (s: string) => digits(s).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const expFmt = (s: string) => { const d = digits(s).slice(0, 4); return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d; };

export default function TopUpModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: (amount: number, card: { id?: string; masked?: string }) => void }) {
  const { toast, session } = useApp();
  const b = useBilling();
  const [step, setStep] = useState<'choose' | 'new' | 'otp'>('choose');
  const [card, setCard] = useState(b.mainCard);
  const [payWith, setPayWith] = useState<{ id?: string; masked?: string }>({});
  const [amount, setAmount] = useState('');
  const [nc, setNc] = useState({ number: '', exp: '', cvv: '', save: true });
  const [err, setErr] = useState<Record<string, string>>({});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setStep('choose'); setAmount(''); setErr({}); setCard(b.mainCard); setNc({ number: '', exp: '', cvv: '', save: true }); } }, [open]);

  const validateAmount = (e: Record<string, string>) => {
    const n = Number(digits(amount));
    if (!n || n < MIN) e.amount = `Минимальная сумма пополнения ${MIN.toLocaleString('ru-RU')} сум`;
    if (n > MAX) e.amount = `Максимальная сумма пополнения ${MAX.toLocaleString('ru-RU')} сум`;
  };

  const AmountField = (
    <Field label="Сумма пополнения" error={err.amount} hint={<><Info size={14} /> Минимальная сумма: <b style={{ color: 'var(--text)' }}>10 000 сум</b></>}>
      <Input placeholder="Введите сумму" inputMode="numeric" value={money(amount)} onChange={(e) => setAmount(e.target.value)} error={!!err.amount} suffixBox="сум" />
    </Field>
  );

  return (
    <Modal open={open} onClose={onClose} width={480} title={step === 'otp' ? undefined : 'Пополнить баланс'}>
      <div style={{ padding: 24 }}>
        {step === 'choose' && (
          <div className="col gap-16">
            <div style={{ textAlign: 'center' }}>
              <h3 className="h4">Пополнение баланса</h3>
              <p className="muted t-sm">Выберите карту для пополнения баланса</p>
            </div>
            <div className="col gap-4">
              {b.cards.map((c) => (
                <label key={c.id} className="row gap-12" style={{ padding: '10px 4px', cursor: 'pointer' }}>
                  <input type="radio" checked={card === c.id} onChange={() => setCard(c.id)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                  <CardBrand brand={c.brand} />
                  <span><b className="t-sm medium">{c.number}</b><br /><span className="t-xs muted">{c.exp}</span></span>
                </label>
              ))}
            </div>
            {AmountField}
            <button className="btn btn-primary btn-lg btn-block mt-8" onClick={() => {
              const e: Record<string, string> = {}; validateAmount(e); setErr(e);
              if (!Object.keys(e).length) { setPayWith({ id: card }); setStep('otp'); }
            }}>Пополнить баланс</button>
            <button className="btn btn-secondary btn-block" onClick={() => { setErr({}); setStep('new'); }}><Plus size={16} /> Добавить новую карту</button>
          </div>
        )}

        {step === 'new' && (
          <div className="col gap-16">
            <div style={{ textAlign: 'center' }}>
              <h3 className="h4">Добавление новой карты</h3>
              <p className="muted t-sm">Заполните все поля и пополните свой баланс</p>
            </div>
            <Field label="Номер карты" error={err.number}>
              <Input placeholder="Введите номер карты" inputMode="numeric" value={cardFmt(nc.number)} onChange={(e) => setNc({ ...nc, number: digits(e.target.value) })}
                left={nc.number.length >= 4 ? <CardBrand brand={nc.number.startsWith('4') ? 'visa' : nc.number.startsWith('5') ? 'mastercard' : nc.number.startsWith('9') ? 'humo' : 'uzcard'} /> : undefined}
                error={!!err.number} />
            </Field>
            <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
              <div className="grow"><Field label="Срок" error={err.exp}><Input placeholder="MM / YY" value={expFmt(nc.exp)} onChange={(e) => setNc({ ...nc, exp: digits(e.target.value) })} error={!!err.exp} /></Field></div>
              <div className="grow"><Field label="CVV" error={err.cvv}><Input placeholder="•••" value={nc.cvv} onChange={(e) => setNc({ ...nc, cvv: digits(e.target.value).slice(0, 3) })} error={!!err.cvv} /></Field></div>
            </div>
            <label className="checkbox"><input type="checkbox" checked={nc.save} onChange={(e) => setNc({ ...nc, save: e.target.checked })} /> Сохранить карту для следующих платежей</label>
            {AmountField}
            <button className="btn btn-primary btn-lg btn-block mt-8" onClick={() => {
              const e: Record<string, string> = {};
              if (nc.number.length !== 16) e.number = 'Карта неправильно введена';
              if (nc.exp.length !== 4 || Number(nc.exp.slice(0, 2)) > 12) e.exp = 'Срок неправильно введён';
              if (nc.cvv.length !== 3) e.cvv = 'CVV неправильно введён';
              validateAmount(e); setErr(e);
              if (Object.keys(e).length) return;
              // a saved card shows up in the profile and in Gluon admin; an unsaved one is used once
              const id = nc.save ? b.addCard({ number: nc.number.replace(/(\d{4})(?=\d)/g, '$1 '), exp: `${nc.exp.slice(0, 2)}/${nc.exp.slice(2)}`, brand: cardBrand(nc.number), name: 'Карта' }) : undefined;
              setPayWith(id ? { id } : { masked: `${nc.number.slice(0, 4)} •••• ${nc.number.slice(-4)}` }); setStep('otp');
            }}>Пополнить баланс</button>
            <button className="btn btn-ghost btn-block" onClick={() => { setErr({}); setStep('choose'); }}>Назад</button>
          </div>
        )}

        {step === 'otp' && (
          <OtpBlock compact phone={session?.login ?? '501234567'} onBack={() => setStep('choose')}
            onDone={() => { onSuccess(Number(digits(amount)), payWith); toast('success', 'Ваш баланс пополнен!'); onClose(); }} />
        )}
      </div>
    </Modal>
  );
}
