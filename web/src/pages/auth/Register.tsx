import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthHead, AuthLayout } from '../../layouts/AuthLayout';
import { Field, Input, PasswordInput, PhoneInput, Select } from '../../components/ui';
import { BUSINESS_CATEGORIES } from '../../data/mock';
import { useApp } from '../../lib/store';
import { OtpBlock } from './OtpStep';

type Step = 'contact' | 'otp' | 'company' | 'password';
const ORDER: Step[] = ['contact', 'otp', 'company', 'password'];

export default function Register() {
  const { t, toast, login } = useApp();
  const nav = useNavigate();
  const [step, setStep] = useState<Step>('contact');
  const [fio, setFio] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState({ name: '', inn: '', address: '', category: '', custom: '' });
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState<Record<string, string>>({});

  const progress = (ORDER.indexOf(step) + 1) / ORDER.length;
  const go = (s: Step) => { setErr({}); setStep(s); };

  const finish = () => {
    login({ platform: 'user', kind: 'gluon', name: fio || 'Даулетмуратов Ахмет', login: phone });
    nav('/app');
  };

  return (
    <AuthLayout progress={progress}>
      {step === 'contact' && (
        <>
          <AuthHead title="Контактные данные" sub="Управление персоналом через единую панель: контроль, автоматизация." />
          <div className="col gap-16">
            <Field label="ФИО" error={err.fio}>
              <Input placeholder="Введите ваше ФИО" value={fio} onChange={(e) => setFio(e.target.value)} error={!!err.fio} />
            </Field>
            <Field label={t('phone')} error={err.phone}>
              <PhoneInput value={phone} onChange={setPhone} error={!!err.phone} />
            </Field>
            <button className="btn btn-primary btn-lg btn-block mt-16" onClick={() => {
              const e: Record<string, string> = {};
              if (fio.trim().split(/\s+/).length < 2) e.fio = 'Введите фамилию и имя полностью';
              if (phone.length < 9) e.phone = 'Номер телефона введён неправильно';
              setErr(e);
              if (!Object.keys(e).length) go('otp');
            }}>{t('continue')}</button>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => nav('/login')}>{t('back')}</button>
          </div>
        </>
      )}

      {step === 'otp' && <OtpBlock phone={phone} onBack={() => go('contact')} onDone={() => go('company')} />}

      {step === 'company' && (
        <>
          <AuthHead title="Данные компании" sub="Управление персоналом через единую панель: контроль, автоматизация." />
          <div className="col gap-16">
            <Field label="Название компании" error={err.name}>
              <Input placeholder="Введите название компании" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} error={!!err.name} />
            </Field>
            <Field label="ИНН" error={err.inn}>
              <Input placeholder="Введите ИНН компании" inputMode="numeric" value={company.inn} onChange={(e) => setCompany({ ...company, inn: e.target.value.replace(/\D/g, '').slice(0, 9) })} error={!!err.inn} />
            </Field>
            <Field label="Адрес">
              <Input placeholder="Введите адрес компании" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
            </Field>
            <Field label="Категория бизнеса" error={err.category}>
              <Select value={company.category} onChange={(v) => setCompany({ ...company, category: v })} error={!!err.category}
                options={[...BUSINESS_CATEGORIES, 'Другое'].map((c) => ({ value: c, label: c }))} />
            </Field>
            {company.category === 'Другое' && (
              <Field label="Напишите категорию бизнеса">
                <Input placeholder="Например: Аксессуары" value={company.custom} onChange={(e) => setCompany({ ...company, custom: e.target.value })} />
              </Field>
            )}
            <button className="btn btn-primary btn-lg btn-block mt-16" onClick={() => {
              const e: Record<string, string> = {};
              if (!company.name) e.name = 'Обязательное поле';
              if (company.inn.length !== 9) e.inn = 'ИНН должен содержать 9 цифр';
              if (!company.category) e.category = 'Выберите категорию';
              setErr(e);
              if (!Object.keys(e).length) go('password');
            }}>{t('continue')}</button>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => go('contact')}>{t('back')}</button>
          </div>
        </>
      )}

      {step === 'password' && (
        <>
          <AuthHead title="Создайте пароль" sub="Создайте надёжный, но запоминающийся пароль для защиты учётной записи" />
          <div className="col gap-16">
            <Field label={t('password')} error={err.p1} hint="Минимум 8 символов, буквы и цифры">
              <PasswordInput placeholder="Введите пароль" value={p1} onChange={(e) => setP1(e.target.value)} error={!!err.p1} />
            </Field>
            <Field label={t('repeatPassword')} error={err.p2}>
              <PasswordInput placeholder="Подтвердите пароль" value={p2} onChange={(e) => setP2(e.target.value)} error={!!err.p2} />
            </Field>
            <button className="btn btn-primary btn-lg btn-block mt-16" onClick={() => {
              const e: Record<string, string> = {};
              if (p1.length < 8) e.p1 = 'Пароль не соответствует требованиям';
              if (p1 !== p2) e.p2 = 'Пароли не совпадают';
              setErr(e);
              if (!Object.keys(e).length) { toast('success', 'Регистрация завершена. Добро пожаловать в Gluon!'); finish(); }
            }}>Завершить регистрацию</button>
            <button className="btn btn-secondary btn-lg btn-block" onClick={() => go('company')}>{t('back')}</button>
          </div>
        </>
      )}

    </AuthLayout>
  );
}
