import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { CircleCheck, ExternalLink, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { BrandMark, Field, Input, Modal } from '../../components/ui';
import type { Service } from '../../data/mock';
import { useBilling } from '../../lib/billing';
import { useApp } from '../../lib/store';

type Method = 'oauth' | 'key';
type Phase = 'choose' | 'redirect' | 'verify' | 'done';

/**
 * After payment the user links their existing account in the service so Gluon can pull its data.
 * Two ways: sign in through the service (OAuth-style) or paste an API key from the service's settings.
 */
export function LinkServiceModal({ service, onClose, onDone }: { service: Service | null; onClose: () => void; onDone?: () => void }) {
  const { toast } = useApp();
  const { setLink } = useBilling();
  const [method, setMethod] = useState<Method>('oauth');
  const [phase, setPhase] = useState<Phase>('choose');
  const [key, setKey] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { if (service) { setPhase('choose'); setKey(''); setErr(''); setMethod('oauth'); } }, [service]);
  useEffect(() => {
    if (phase === 'redirect') { const t = setTimeout(() => setPhase('verify'), 1400); return () => clearTimeout(t); }
    if (phase === 'verify') { const t = setTimeout(() => setPhase('done'), 1200); return () => clearTimeout(t); }
  }, [phase]);
  useEffect(() => {
    if (phase === 'done' && service) { setLink(service.id, 'connected'); toast('success', `${service.name} подключён`); }
  }, [phase, service, setLink, toast]);

  const close = () => {
    if (service && phase !== 'done') { setLink(service.id, 'link'); }
    onClose();
  };

  if (!service) return null;
  return (
    <Modal open onClose={close} title={`Подключение ${service.name}`} width={500}>
      <div className="col gap-16" style={{ padding: 24 }}>
        <div className="row gap-12" style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
          <BrandMark name={service.name} color={service.color} text={service.mark} size={44} />
          <div><b>{service.name}</b><p className="t-sm muted">Оплачено. Осталось связать ваш аккаунт {service.name} с Gluon.</p></div>
        </div>

        {phase === 'choose' && (
          <>
            <div className="col gap-8">
              <button className={clsx('ls-opt', method === 'oauth' && 'on')} onClick={() => setMethod('oauth')}>
                <ExternalLink size={18} />
                <span className="grow" style={{ textAlign: 'left' }}><b className="medium">Войти через {service.name}</b><br /><span className="t-xs muted">Откроется страница {service.name}, подтвердите доступ для Gluon</span></span>
              </button>
              <button className={clsx('ls-opt', method === 'key' && 'on')} onClick={() => setMethod('key')}>
                <KeyRound size={18} />
                <span className="grow" style={{ textAlign: 'left' }}><b className="medium">Ввести API-ключ</b><br /><span className="t-xs muted">Ключ находится в настройках {service.name} → Интеграции</span></span>
              </button>
            </div>
            {method === 'key' && (
              <Field label="API-ключ" error={err}>
                <Input placeholder="sk_live_••••••••••••" value={key} onChange={(e) => { setKey(e.target.value); setErr(''); }} error={!!err} />
              </Field>
            )}
            <p className="row gap-6 t-xs muted"><ShieldCheck size={14} /> Gluon получит доступ только на чтение: продажи, товары, клиенты.</p>
            <div className="row gap-12">
              <button className="btn btn-secondary grow" onClick={close}>Позже</button>
              <button className="btn btn-primary grow" onClick={() => {
                if (method === 'key' && key.trim().length < 8) { setErr('Неверный ключ — проверьте и вставьте ещё раз'); return; }
                setPhase(method === 'oauth' ? 'redirect' : 'verify');
              }}>{method === 'oauth' ? `Перейти в ${service.name}` : 'Подключить'}</button>
            </div>
            <p className="t-xs muted" style={{ textAlign: 'center' }}>Нет аккаунта в {service.name}? <a className="btn-link" href="#" onClick={(e) => e.preventDefault()}>Создать аккаунт</a></p>
          </>
        )}

        {(phase === 'redirect' || phase === 'verify') && (
          <div className="col gap-12" style={{ alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
            <Loader2 size={36} className="spin" color="var(--primary)" />
            <b>{phase === 'redirect' ? `Ожидаем подтверждение в ${service.name}…` : 'Проверяем доступ и загружаем данные…'}</b>
            <p className="t-sm muted">Это займёт несколько секунд</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="col gap-12" style={{ alignItems: 'center', padding: '12px 0', textAlign: 'center' }}>
            <CircleCheck size={44} color="var(--success)" />
            <h3 className="h4">{service.name} подключён</h3>
            <p className="t-sm muted">Данные начнут появляться в дашборде и Gluon Архиве в течение нескольких минут. Сервис доступен в меню «Сервисы».</p>
            <button className="btn btn-primary btn-block mt-8" onClick={() => { onClose(); onDone?.(); }}>Открыть {service.name}</button>
          </div>
        )}
      </div>
    </Modal>
  );
}
