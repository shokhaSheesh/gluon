import { useState } from 'react';
import { AuthHead } from '../../layouts/AuthLayout';
import { OtpInput, formatPhone, useCountdown } from '../../components/ui';
import { useApp } from '../../lib/store';

export const DEMO_OTP = '12345';

/** Shared OTP verification block (registration, password reset, top-up). */
export function OtpBlock({
  phone, onBack, onDone, title, compact = false,
}: { phone: string; onBack: () => void; onDone: () => void; title?: string; compact?: boolean }) {
  const { t, toast } = useApp();
  const [code, setCode] = useState('');
  const [state, setState] = useState<'error' | 'success' | undefined>();
  const timer = useCountdown(119);

  const confirm = () => {
    if (code.length < 5) return;
    if (code === DEMO_OTP) {
      setState('success');
      setTimeout(onDone, 450);
    } else {
      setState('error');
      toast('error', 'Неверный код подтверждения');
    }
  };

  return (
    <div className="col">
      {compact ? (
        <div className="col gap-6" style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 className="h3">{title ?? 'Код подтверждения'}</h2>
          <p className="muted">{t('verifySub')} <b style={{ color: 'var(--text)' }}>{formatPhone(phone)}</b></p>
        </div>
      ) : (
        <AuthHead title={title ?? t('verifyTitle')} sub={<>{t('verifySub')} <b style={{ color: 'var(--text)' }}>{formatPhone(phone)}</b></>} />
      )}
      <OtpInput value={code} onChange={(v) => { setCode(v); setState(undefined); }} state={state} />
      <div style={{ textAlign: 'center', margin: '40px 0 16px' }} className="t-sm muted">
        {timer.left > 0 ? (
          <>{t('resendIn')} <b style={{ color: 'var(--text)' }}>{timer.label}</b></>
        ) : (
          <button className="btn-link" onClick={() => { timer.reset(); toast('info', 'Код отправлен повторно'); }}>{t('resend')}</button>
        )}
      </div>
      <div className="col gap-12">
        <button className="btn btn-primary btn-lg btn-block" disabled={code.length < 5} onClick={confirm}>{t('confirm')}</button>
        <button className="btn btn-secondary btn-lg btn-block" onClick={onBack}>{t('back')}</button>
      </div>
      <p className="kbd-hint mt-12">Демо-код: {DEMO_OTP}</p>
    </div>
  );
}
