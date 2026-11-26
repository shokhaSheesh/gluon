import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHead, AuthLayout } from '../../layouts/AuthLayout';
import { Field, PasswordInput, PhoneInput } from '../../components/ui';
import { useApp } from '../../lib/store';
import { OtpBlock } from './OtpStep';

export default function Forgot() {
  const { t, toast } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [errs, setErrs] = useState<{ p1?: string; p2?: string }>({});

  if (step === 'otp') {
    return (
      <AuthLayout>
        <OtpBlock phone={phone} onBack={() => setStep('phone')} onDone={() => setStep('password')} />
      </AuthLayout>
    );
  }

  if (step === 'password') {
    const save = () => {
      const e: typeof errs = {};
      if (p1.length < 8) e.p1 = 'Минимум 8 символов';
      if (p1 !== p2) e.p2 = 'Пароли не совпадают';
      setErrs(e);
      if (Object.keys(e).length) { toast('error', 'Не удалось изменить пароль.'); return; }
      toast('success', 'Пароль успешно обновлён.');
      nav('/login');
    };
    return (
      <AuthLayout>
        <AuthHead title={t('newPassTitle')} sub={t('newPassSub')} />
        <div className="col gap-16">
          <Field label={t('newPassword')} error={errs.p1}>
            <PasswordInput placeholder="Введите новый пароль" value={p1} onChange={(e) => setP1(e.target.value)} error={!!errs.p1} />
          </Field>
          <Field label={t('repeatPassword')} error={errs.p2}>
            <PasswordInput placeholder="Подтвердите пароль" value={p2} onChange={(e) => setP2(e.target.value)} error={!!errs.p2} />
          </Field>
          <button className="btn btn-primary btn-lg btn-block mt-16" onClick={save}>{t('save')}</button>
          <button className="btn btn-secondary btn-lg btn-block" onClick={() => setStep('otp')}>{t('back')}</button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthHead title={t('forgotTitle')} sub={t('forgotSub')} />
      <div className="col gap-16">
        <Field label={t('phone')} error={phoneErr}>
          <PhoneInput value={phone} onChange={(v) => { setPhone(v); setPhoneErr(''); }} error={!!phoneErr} />
        </Field>
        <button
          className="btn btn-primary btn-lg btn-block mt-24"
          onClick={() => {
            if (phone.length < 9) { setPhoneErr('Пользователь с таким номером не существует'); return; }
            setStep('otp');
          }}
        >
          {t('getCode')}
        </button>
        <button className="btn btn-secondary btn-lg btn-block" onClick={() => nav('/login')}>{t('back')}</button>
      </div>
    </AuthLayout>
  );
}
