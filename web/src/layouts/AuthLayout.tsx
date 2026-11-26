import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { LangSelect, Logo, ThemeToggle } from '../components/ui';
import { IMAGES } from '../assets';
const hero = IMAGES.authHero;
import './auth.css';

const SLIDES = [
  { quote: 'Все сервисы бизнеса — в одном окне. Продажи, склад и банки под контролем.', name: 'Komoldinov Iskandar', role: 'Product Owner', company: 'Ibrat Farzandlari' },
  { quote: 'С Gluon мы видим выручку всех филиалов в реальном времени.', name: 'Saidova Malika', role: 'CEO', company: 'Malika Textile' },
  { quote: 'Подключили Billz и Robosell за один день — без программистов.', name: 'Rustamov Jasur', role: 'Founder', company: 'Jasur Market' },
  { quote: 'Удобно открывать счета и сравнивать предложения банков.', name: 'Karimov Aziz', role: 'CFO', company: 'Aziz Group' },
];

export function AuthLayout({ children, progress }: { children: ReactNode; progress?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % SLIDES.length), 6000);
    return () => clearInterval(id);
  }, []);
  const s = SLIDES[i];
  return (
    <div className="auth">
      <div className="auth-left">
        <header className="auth-top">
          <Logo />
          <div className="row gap-12">
            <ThemeToggle />
            <LangSelect />
          </div>
        </header>
        <main className="auth-main">
          <div className="auth-form">
            {progress !== undefined && (
              <div className="auth-progress"><span style={{ width: `${progress * 100}%` }} /></div>
            )}
            {children}
          </div>
        </main>
      </div>
      <aside className="auth-right" style={{ backgroundImage: `url(${hero})` }}>
        <div className="auth-bars">
          {SLIDES.map((_, k) => (
            <button key={k} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`slide ${k + 1}`} />
          ))}
        </div>
        <div className="auth-quote">
          <p className="q">{s.quote}</p>
          <p className="n">{s.name}</p>
          <div className="row between" style={{ alignItems: 'flex-end' }}>
            <div>
              <p className="r">{s.role}</p>
              <p className="c">{s.company}</p>
            </div>
            <div className="row gap-12">
              <button className="auth-arrow" onClick={() => setI((x) => (x - 1 + SLIDES.length) % SLIDES.length)} aria-label="prev"><ArrowLeft size={20} /></button>
              <button className="auth-arrow" onClick={() => setI((x) => (x + 1) % SLIDES.length)} aria-label="next"><ArrowRight size={20} /></button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function AuthHead({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="col gap-8" style={{ textAlign: 'center', marginBottom: 28 }}>
      <h1 className="h2" style={{ fontSize: 30 }}>{title}</h1>
      {sub && <p className="muted" style={{ fontSize: 15 }}>{sub}</p>}
    </div>
  );
}
