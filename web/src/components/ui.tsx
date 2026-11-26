import { useEffect, useRef, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, CircleCheck, CircleAlert, Eye, EyeOff, HelpCircle, Info, X, Moon, Sun } from 'lucide-react';
import { useApp } from '../lib/store';
import { LANGS } from '../lib/i18n';
import { BANK_LOGOS, LOGO_BY_NAME } from '../assets';

/* ---------- Logo (vector from Figma, follows currentColor) ---------- */
const GLUON_PATHS = [
  'M64.192 4.20166C59.5168 4.20166 55.7266 7.99066 55.7266 12.6658C55.7266 17.341 59.5168 21.1313 64.192 21.1313C68.8671 21.1313 72.6562 17.341 72.6562 12.6658C72.6562 7.99066 68.8671 4.20166 64.192 4.20166ZM64.192 16.7587C61.931 16.7587 60.1005 14.9281 60.1005 12.6671C60.1005 10.4061 61.931 8.57554 64.192 8.57554C66.453 8.57554 68.2836 10.4086 68.2836 12.6671C68.2836 14.9256 66.4504 16.7587 64.192 16.7587Z',
  'M51.3469 4.26855V12.6986C51.3469 17.3547 47.5718 21.1311 42.9144 21.1311C38.2569 21.1311 34.4844 17.3547 34.4844 12.6986V4.26855H38.8393V12.6669C38.8393 14.9178 40.6647 16.7434 42.9157 16.7434C45.1666 16.7434 46.992 14.9178 46.992 12.6669V4.26855H51.3482H51.3469Z',
  'M93.9629 12.6985V21.1639H89.5903V12.7315C89.5903 10.4717 87.7571 8.6399 85.4987 8.6399C83.2403 8.6399 81.4071 10.473 81.4071 12.7315V21.1639H77.0332V12.6985C77.0332 8.02338 80.8235 4.23438 85.4987 4.23438C90.1739 4.23438 93.9629 8.02338 93.9629 12.6985Z',
  'M10.5593 16.7423C7.14505 16.7423 4.37641 13.9736 4.37641 10.5593C4.37641 7.14505 7.14505 4.37641 10.5593 4.37641H18.6463V0H10.5593C4.72707 0 0 4.72707 0 10.5593C0 16.3916 4.72707 21.1186 10.5593 21.1186H11.5569V16.7499L10.5593 16.7423Z',
  'M18.6472 11.4595H14.2695V21.1314H18.6472V11.4595Z',
  'M30.1063 0.0126953H25.7285V21.1314H30.1063V0.0126953Z',
];
export function Logo({ size = 26, light = false }: { size?: number; light?: boolean }) {
  const h = size * 0.82;
  return (
    <svg viewBox="0 0 94 21.25" height={h} width={(h * 94) / 21.25} role="img" aria-label="Gluon" style={{ color: light ? '#fff' : 'var(--primary)', display: 'block' }}>
      {GLUON_PATHS.map((d, i) => <path key={i} d={d} fill="currentColor" />)}
    </svg>
  );
}

/* ---------- Brand marks for services / banks (real logo when exported from Figma) ---------- */
export function BrandMark({ name, color, size = 32, text }: { name: string; color: string; size?: number; text?: string }) {
  const src = LOGO_BY_NAME[name];
  if (src) {
    return (
      <span className="brand-mark img" style={{ width: size, height: size }} title={name}>
        <img src={src} alt={name} />
      </span>
    );
  }
  return (
    <span className="brand-mark" style={{ width: size, height: size, background: color, fontSize: size * 0.42 }} title={name}>
      {text ?? name.charAt(0).toUpperCase()}
    </span>
  );
}

/** Bank wordmark logo (falls back to mark + name). */
export function BankLogo({ id, name, height = 18 }: { id: string; name: string; height?: number }) {
  const l = BANK_LOGOS[id];
  if (!l) return <b>{name}</b>;
  return <span className="wordmark"><img src={l.word} alt={name} style={{ height }} /></span>;
}

/* ---------- Click outside ---------- */
export function useClickOutside<T extends HTMLElement>(onOut: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOut();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [onOut]);
  return ref;
}

/* ---------- Field ---------- */
export function Field({ label, error, hint, children }: { label?: ReactNode; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      {label && <span className="label">{label}</span>}
      {children}
      {error && <span className="err-msg">{error}</span>}
      {hint && !error && <span className="hint">{hint}</span>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean; right?: ReactNode; left?: ReactNode; suffixBox?: ReactNode };
export function Input({ error, right, left, suffixBox, className, ...rest }: InputProps) {
  return (
    <div className={clsx('input-wrap', error && 'error', className)}>
      {left && <span className="prefix">{left}</span>}
      <input {...rest} />
      {error && !right && <span className="adorn" style={{ color: 'var(--error)' }}><CircleAlert size={16} /></span>}
      {right && <span className="adorn">{right}</span>}
      {suffixBox && <span className="suffix-box">{suffixBox}</span>}
    </div>
  );
}

export function PasswordInput(props: Omit<InputProps, 'type' | 'right'>) {
  const [show, setShow] = useState(false);
  return (
    <Input
      {...props}
      type={show ? 'text' : 'password'}
      right={
        <button type="button" onClick={() => setShow((s) => !s)} aria-label="toggle password">
          {props.error ? <CircleAlert size={16} color="var(--error)" /> : show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
}

/** Uzbek phone input with mask +998(XX) XXX-XX-XX */
export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  let out = '+998';
  if (d.length > 0) out += '(' + d.slice(0, 2);
  if (d.length >= 2) out += ')';
  if (d.length > 2) out += ' ' + d.slice(2, 5);
  if (d.length > 5) out += '-' + d.slice(5, 7);
  if (d.length > 7) out += '-' + d.slice(7, 9);
  return out;
}
export function PhoneInput({ value, onChange, error }: { value: string; onChange: (digits: string) => void; error?: boolean }) {
  return (
    <Input
      error={error}
      left={<span className="row gap-4">UZ <ChevronDown size={14} /></span>}
      placeholder="+998(90) 123-45-67"
      value={value ? formatPhone(value) : ''}
      onChange={(e) => {
        let d = e.target.value.replace(/\D/g, '');
        if (d.startsWith('998')) d = d.slice(3);
        onChange(d.slice(0, 9));
      }}
      right={error ? undefined : <HelpCircle size={16} />}
      inputMode="tel"
    />
  );
}

/* ---------- Select ---------- */
export interface Option { value: string; label: ReactNode; icon?: ReactNode }
export function Select({
  value, onChange, options, placeholder = 'Выберите', error, className,
}: { value: string; onChange: (v: string) => void; options: Option[]; placeholder?: string; error?: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const cur = options.find((o) => o.value === value);
  return (
    <div className={clsx('select', className)} ref={ref}>
      <button type="button" className={clsx('input-wrap select-trigger', error && 'error')} onClick={() => setOpen((o) => !o)}>
        {cur?.icon}
        <span className={clsx('value', !cur && 'placeholder')}>{cur ? cur.label : placeholder}</span>
        <ChevronDown size={16} color="var(--text-4)" style={{ transform: open ? 'rotate(180deg)' : undefined, transition: '.15s' }} />
      </button>
      {open && (
        <div className="menu">
          {options.map((o) => (
            <button
              type="button" key={o.value} className={clsx('menu-item', o.value === value && 'active')}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              {o.icon}
              {o.label}
              {o.value === value && <Check size={16} className="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- OTP ---------- */
export function OtpInput({ value, onChange, state }: { value: string; onChange: (v: string) => void; state?: 'error' | 'success' }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = Array.from({ length: 5 }, (_, i) => value[i] ?? '');
  useEffect(() => { refs.current[0]?.focus(); }, []);
  return (
    <div className={clsx('otp', state)}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={c}
          placeholder="–"
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(-1);
            const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, 5);
            onChange(next.padEnd(0));
            if (d && i < 4) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !c && i > 0) refs.current[i - 1]?.focus();
          }}
          onPaste={(e) => {
            const d = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
            if (d) { e.preventDefault(); onChange(d); refs.current[Math.min(d.length, 4)]?.focus(); }
          }}
        />
      ))}
    </div>
  );
}

export function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return { left, label: `${mm}:${ss}`, reset: () => setLeft(seconds) };
}

/* ---------- Modal ---------- */
export function Modal({
  open, onClose, children, width = 480, title,
}: { open: boolean; onClose: () => void; children: ReactNode; width?: number; title?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }} role="dialog">
        {title && (
          <div className="modal-head">
            <span className="title">{title}</span>
            <button className="icon-btn sm" onClick={onClose} aria-label="close"><X size={16} /></button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open, onClose, onConfirm, text, confirmText,
}: { open: boolean; onClose: () => void; onConfirm: () => void; text: string; confirmText: string }) {
  const { t } = useApp();
  return (
    <Modal open={open} onClose={onClose} width={360}>
      <div className="col gap-16" style={{ padding: 24, alignItems: 'center', textAlign: 'center' }}>
        <span style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--error-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--error)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} /></span>
        </span>
        <p className="medium" style={{ fontSize: 16 }}>{text}</p>
        <div className="row gap-12" style={{ width: '100%' }}>
          <button className="btn btn-secondary grow" onClick={onClose}>{t('back')}</button>
          <button className="btn btn-danger grow" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Toasts ---------- */
export function Toasts() {
  const { toasts, dismiss } = useApp();
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className={clsx('toast', t.kind)}>
          {t.kind === 'success' ? <CircleCheck size={18} /> : t.kind === 'error' ? <CircleAlert size={18} /> : <Info size={18} />}
          <span>{t.text}</span>
          <button className="x" onClick={() => dismiss(t.id)} aria-label="close"><X size={16} /></button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Theme & language controls ---------- */
export function ThemeToggle() {
  const { theme, setTheme } = useApp();
  return (
    <div className="tabs-seg" style={{ padding: 3 }}>
      <button className={clsx(theme === 'light' && 'active')} onClick={() => setTheme('light')} aria-label="light" style={{ padding: '5px 8px', display: 'flex' }}>
        <Sun size={18} />
      </button>
      <button className={clsx(theme === 'dark' && 'active')} onClick={() => setTheme('dark')} aria-label="dark" style={{ padding: '5px 8px', display: 'flex' }}>
        <Moon size={18} />
      </button>
    </div>
  );
}

export function LangSelect({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  const cur = LANGS.find((l) => l.code === lang)!;
  return (
    <div className="select" ref={ref}>
      <button className="btn btn-secondary" style={{ height: 40, gap: 8, padding: compact ? '0 10px' : '0 12px' }} onClick={() => setOpen((o) => !o)}>
        <span style={{ fontSize: 16 }}>{cur.flag}</span>
        {!compact && <span className="medium">{cur.label}</span>}
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="menu right" style={{ width: 190 }}>
          {LANGS.map((l) => (
            <button key={l.code} className={clsx('menu-item', l.code === lang && 'active')} onClick={() => { setLang(l.code); setOpen(false); }}>
              <span style={{ fontSize: 16 }}>{l.flag}</span>
              {l.label}
              {l.code === lang && <Check size={16} className="check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Pagination ---------- */
export function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  const items: (number | '…')[] = total <= 7 ? Array.from({ length: total }, (_, i) => i + 1) : [1, 2, 3, '…', total - 2, total - 1, total];
  return (
    <div className="pagination">
      <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => onPage(page - 1)}>← Предыдущий</button>
      <div className="pages">
        {items.map((p, i) =>
          p === '…' ? <button key={i} disabled>…</button> : (
            <button key={i} className={clsx(p === page && 'active')} onClick={() => onPage(p)}>{p}</button>
          ),
        )}
      </div>
      <button className="btn btn-secondary btn-sm" disabled={page === total} onClick={() => onPage(page + 1)}>Следующий →</button>
    </div>
  );
}

export function Badge({ kind = 'neutral', children }: { kind?: 'success' | 'error' | 'warning' | 'info' | 'neutral' | 'primary'; children: ReactNode }) {
  return <span className={`badge badge-${kind}`}>{children}</span>;
}

export function Trend({ value, suffix = 'за прошлый месяц', invert }: { value: number; suffix?: string; invert?: boolean }) {
  const up = value >= 0;
  const good = invert ? value <= 0 : up;
  return (
    <span className="row gap-6 t-xs" style={{ color: 'var(--text-2)' }}>
      <span className="row gap-4 medium" style={{ color: good ? 'var(--success)' : 'var(--error)' }}>
        {up ? '↗' : '↘'} {up ? '+' : ''}{value}%
      </span>
      {suffix}
    </span>
  );
}
