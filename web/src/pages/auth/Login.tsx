import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Building2, KeyRound, ShieldCheck, Store, UserRound } from 'lucide-react';
import { AuthHead, AuthLayout } from '../../layouts/AuthLayout';
import { Field, Input, PasswordInput, PhoneInput, formatPhone } from '../../components/ui';
import { PLATFORM_HOME, sessionFrom, useApp, type Platform, type Session } from '../../lib/store';
import { CHANNEL_LABEL, useMerchant } from '../../lib/merchant';
import { DEMO_ACCOUNTS, type DemoAccount } from '../../data/accounts';

export default function Login() {
  const { t, login, toast } = useApp();
  const { clients, updateClient, partners } = useMerchant();
  const nav = useNavigate();
  const [platform, setPlatform] = useState<Platform>('user');
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ login?: string; password?: string }>({});
  const isUser = platform === 'user';

  const switchPlatform = (p: Platform) => {
    setPlatform(p);
    setLoginValue('');
    setPassword('');
    setErrors({});
  };

  const fill = (a: DemoAccount) => {
    setLoginValue(a.login);
    setPassword(a.password);
    setErrors({});
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof errors = {};
    const demo = DEMO_ACCOUNTS.find((a) => a.platform === platform && a.login === loginValue.trim().toLowerCase());
    // company owners: any Gluon client, incl. the ones a bank created in its cabinet (login = phone)
    const client = isUser ? clients.find((c) => c.credentials?.login === loginValue) : undefined;
    // partner cabinets created by Gluon admin (banks / services)
    const partner = platform === 'merchant' ? partners.find((p) => p.login === loginValue.trim().toLowerCase() || p.id === demo?.orgId) : undefined;
    const secret = partner?.password ?? demo?.password ?? client?.credentials?.password;
    if (!loginValue) er.login = isUser ? 'Введите номер телефона' : 'Введите логин';
    else if (!demo && !client && !partner) er.login = isUser ? 'Пользователь с таким номером не существует' : 'Пользователь с таким логином не существует';
    else if (partner?.status === 'blocked') er.login = 'Кабинет заблокирован. Обратитесь в Gluon';
    else if (client?.blocked) er.login = `Компания заблокирована. Обратитесь в ${CHANNEL_LABEL[client.channel]}`;
    if (!password) er.password = 'Введите пароль';
    else if (secret && secret !== password) er.password = 'Пароль введён неправильно';
    setErrors(er);
    if (Object.keys(er).length || (!demo && !client && !partner)) {
      toast('error', 'Не удалось выполнить вход в систему');
      return;
    }
    const s: Session = demo ? sessionFrom(demo) : partner ? {
      platform: 'merchant', kind: partner.aggregator ? 'bank' : 'service', name: partner.name, login: partner.login, org: partner.name, orgId: partner.id,
    } : {
      platform: 'user', kind: client!.channel === 'gluon' ? 'gluon' : 'bank', name: client!.owner, login: client!.phone,
      org: client!.channel === 'gluon' ? undefined : CHANNEL_LABEL[client!.channel], orgId: client!.channel === 'gluon' ? undefined : client!.channel,
    };
    if (client) updateClient(client.id, { lastActive: new Date().toLocaleDateString('ru-RU') });
    login(s);
    // one user base for every domain: a bank's client who signs in on gluon.uz is sent to the bank's platform
    if (s.platform === 'user' && s.kind === 'bank' && s.orgId) {
      const host = partners.find((p) => p.id === s.orgId)?.subdomain ?? `${s.orgId}.gluon.uz`;
      toast('success', `Вы клиент ${s.org}: открываем ${host}`);
    } else toast('success', 'С возвращением!');
    nav(PLATFORM_HOME[platform]);
  };

  const options: { id: Platform; label: string; icon: React.ReactNode }[] = [
    { id: 'user', label: t('pfUser'), icon: <Store size={18} /> },
    { id: 'merchant', label: t('pfMerchant'), icon: <Building2 size={18} /> },
    { id: 'admin', label: t('pfAdmin'), icon: <ShieldCheck size={18} /> },
  ];
  const demo = DEMO_ACCOUNTS.filter((a) => a.platform === platform);

  return (
    <AuthLayout>
      <AuthHead title={t('loginTitle')} sub={t('loginSub')} />
      <form className="col gap-16" onSubmit={submit}>
        <Field label={t('platform')}>
          <div className="platform-switch" role="tablist">
            {options.map((o) => (
              <button type="button" key={o.id} className={clsx(platform === o.id && 'active')} onClick={() => switchPlatform(o.id)}>
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        {isUser ? (
          <Field label={t('phone')} error={errors.login}>
            <PhoneInput value={loginValue} onChange={setLoginValue} error={!!errors.login} />
          </Field>
        ) : (
          <Field label="Логин" error={errors.login}>
            <Input
              placeholder="Введите логин"
              autoComplete="username"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              error={!!errors.login}
              right={errors.login ? undefined : <UserRound size={16} />}
            />
          </Field>
        )}
        <Field label={t('password')} error={errors.password}>
          <PasswordInput placeholder={t('enterPassword')} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} />
        </Field>
        {isUser && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: -6 }}>
            <Link to="/forgot" className="btn-link t-sm">{t('forgot')}</Link>
          </div>
        )}
        <button className="btn btn-primary btn-lg btn-block mt-8" type="submit">{t('signIn')}</button>
        {isUser ? (
          <button type="button" className="btn btn-secondary btn-lg btn-block" onClick={() => nav('/register')}>{t('register')}</button>
        ) : (
          <p className="hint" style={{ justifyContent: 'center' }}>Доступ выдаёт администратор Gluon</p>
        )}
      </form>

      <div className="demo-creds">
        <p className="demo-creds-title"><KeyRound size={14} /> Демо-доступы — нажмите, чтобы заполнить</p>
        {demo.map((a) => {
          const active = a.login === loginValue && a.password === password;
          return (
            <button type="button" key={a.id} className={clsx('demo-cred', active && 'active')} onClick={() => fill(a)}>
              <span className="medium t-sm">{a.title}</span>
              <span className="demo-cred-vals">
                <code>{isUser ? formatPhone(a.login) : a.login}</code>
                <code>{a.password}</code>
              </span>
            </button>
          );
        })}
      </div>
    </AuthLayout>
  );
}
