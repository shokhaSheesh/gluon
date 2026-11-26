export type Lang = 'ru' | 'uz' | 'en';

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

const dict = {
  // auth
  loginTitle: { ru: 'Вход в аккаунт', uz: 'Hisobga kirish', en: 'Sign in' },
  loginSub: {
    ru: 'Управление бизнесом через единую панель: контроль, автоматизация.',
    uz: 'Biznesni yagona panel orqali boshqaring: nazorat, avtomatlashtirish.',
    en: 'Run your business from one panel: control and automation.',
  },
  platform: { ru: 'Платформа', uz: 'Platforma', en: 'Platform' },
  pfUser: { ru: 'Gluon User', uz: 'Gluon User', en: 'Gluon User' },
  pfMerchant: { ru: 'Кабинет мерчанта', uz: 'Merchant kabineti', en: 'Merchant cabinet' },
  pfAdmin: { ru: 'Gluon Админ', uz: 'Gluon Admin', en: 'Gluon Admin' },
  phone: { ru: 'Телефон номер', uz: 'Telefon raqam', en: 'Phone number' },
  password: { ru: 'Пароль', uz: 'Parol', en: 'Password' },
  enterPassword: { ru: 'Введите пароль', uz: 'Parolni kiriting', en: 'Enter password' },
  forgot: { ru: 'Забыли пароль?', uz: 'Parolni unutdingizmi?', en: 'Forgot password?' },
  signIn: { ru: 'Войти', uz: 'Kirish', en: 'Sign in' },
  register: { ru: 'Регистрация', uz: "Ro'yxatdan o'tish", en: 'Sign up' },
  back: { ru: 'Назад', uz: 'Orqaga', en: 'Back' },
  continue: { ru: 'Продолжить', uz: 'Davom etish', en: 'Continue' },
  confirm: { ru: 'Подтвердить', uz: 'Tasdiqlash', en: 'Confirm' },
  save: { ru: 'Сохранить', uz: 'Saqlash', en: 'Save' },
  getCode: { ru: 'Получить код', uz: 'Kod olish', en: 'Get code' },
  forgotTitle: { ru: 'Забыли пароль', uz: 'Parolni unutdingiz', en: 'Forgot password' },
  forgotSub: {
    ru: 'Введите номер телефона для восстановления пароля',
    uz: 'Parolni tiklash uchun telefon raqamingizni kiriting',
    en: 'Enter your phone number to restore the password',
  },
  verifyTitle: { ru: 'Верификация аккаунта', uz: 'Hisobni tasdiqlash', en: 'Account verification' },
  verifySub: { ru: 'Мы отправили код OTP на номер', uz: 'OTP kodi yuborildi:', en: 'We sent an OTP code to' },
  resendIn: { ru: 'Отправить код заново через', uz: 'Kodni qayta yuborish', en: 'Resend code in' },
  resend: { ru: 'Отправить код заново', uz: 'Kodni qayta yuborish', en: 'Resend code' },
  newPassTitle: { ru: 'Создайте новый пароль', uz: 'Yangi parol yarating', en: 'Create a new password' },
  newPassSub: {
    ru: 'Создайте надёжный, но запоминающийся пароль для защиты учётной записи',
    uz: 'Hisobingizni himoya qilish uchun ishonchli parol yarating',
    en: 'Create a strong but memorable password to protect your account',
  },
  newPassword: { ru: 'Новый пароль', uz: 'Yangi parol', en: 'New password' },
  repeatPassword: { ru: 'Повторите пароль', uz: 'Parolni takrorlang', en: 'Repeat password' },
  // shell
  home: { ru: 'Главная страница', uz: 'Bosh sahifa', en: 'Home' },
  archive: { ru: 'Gluon Архив', uz: 'Gluon Arxiv', en: 'Gluon Archive' },
  store: { ru: 'Магазин Gluon', uz: "Gluon do'koni", en: 'Gluon Store' },
  banking: { ru: 'Онлайн банкинг', uz: 'Onlayn banking', en: 'Online banking' },
  search: { ru: 'Поиск', uz: 'Qidiruv', en: 'Search' },
  profile: { ru: 'Профиль', uz: 'Profil', en: 'Profile' },
  logout: { ru: 'Выйти с аккаунта', uz: 'Hisobdan chiqish', en: 'Log out' },
  logoutAsk: { ru: 'Вы уверены, что хотите выйти из системы?', uz: 'Tizimdan chiqmoqchimisiz?', en: 'Are you sure you want to log out?' },
  exit: { ru: 'Выйти', uz: 'Chiqish', en: 'Log out' },
  dashboard: { ru: 'Дашборд', uz: 'Dashbord', en: 'Dashboard' },
  companies: { ru: 'Компании', uz: 'Kompaniyalar', en: 'Companies' },
  analytics: { ru: 'Аналитика', uz: 'Analitika', en: 'Analytics' },
  tickets: { ru: 'Тикеты', uz: 'Tiketlar', en: 'Tickets' },
  chat: { ru: 'Чат', uz: 'Chat', en: 'Chat' },
  services: { ru: 'Сервисы', uz: 'Servislar', en: 'Services' },
  settings: { ru: 'Настройки', uz: 'Sozlamalar', en: 'Settings' },
  rights: { ru: 'Все права защищены.', uz: 'Barcha huquqlar himoyalangan.', en: 'All rights reserved.' },
} as const;

export type DictKey = keyof typeof dict;

export function translate(lang: Lang, key: DictKey): string {
  return dict[key][lang];
}
