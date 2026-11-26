import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import './calendar.css';

/**
 * One calendar for the whole app. Three levels — days → months → years (click the title to go up).
 * mode decides what a click selects: a day, a week, a month, a year or a from–to range.
 */
export type CalMode = 'day' | 'week' | 'month' | 'year' | 'range';
export interface DateRange { from: Date; to?: Date }

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
export const MONTHS_SHORT = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const YEARS_PER_PAGE = 9;
const YEAR_BASE = 2018;

export const sameDay = (a?: Date, b?: Date) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
/** Weeks (Mon–Sun) that touch the month. */
export function weeksOfMonth(year: number, month: number) {
  const out: Date[] = [];
  const last = new Date(year, month + 1, 0);
  for (let w = weekStart(new Date(year, month, 1)); w <= last; w = addDays(w, 7)) out.push(w);
  return out;
}

type View = 'days' | 'months' | 'years';

export function Calendar({ mode, value, range, onChange, onRange, max, min }: {
  mode: CalMode;
  value?: Date;                        // day: the day · week: its Monday · month: 1st · year: Jan 1
  range?: DateRange;
  onChange?: (d: Date) => void;
  onRange?: (r: DateRange) => void;
  max?: Date; min?: Date;
}) {
  const anchor = (mode === 'range' ? range?.from : value) ?? max ?? new Date();
  const [view, setView] = useState<View>(mode === 'month' ? 'months' : mode === 'year' ? 'years' : 'days');
  const [cur, setCur] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  const [hover, setHover] = useState<Date | null>(null);
  const y = cur.getFullYear(), mo = cur.getMonth();
  const pageStart = YEAR_BASE + Math.floor((y - YEAR_BASE) / YEARS_PER_PAGE) * YEARS_PER_PAGE;

  const tooLate = (d: Date) => !!max && d > max;
  const tooEarly = (d: Date) => !!min && d < min;

  const step = (dir: number) => {
    if (view === 'days') setCur(new Date(y, mo + dir, 1));
    else if (view === 'months') setCur(new Date(y + dir, mo, 1));
    else setCur(new Date(y + dir * YEARS_PER_PAGE, mo, 1));
  };
  const title = view === 'days' ? `${MONTHS[mo]} ${y}` : view === 'months' ? String(y) : `${pageStart} – ${pageStart + YEARS_PER_PAGE - 1}`;
  const up = () => setView(view === 'days' ? 'months' : 'years');

  const pickDay = (d: Date) => {
    if (mode === 'day') onChange?.(d);
    else if (mode === 'range') {
      if (!range || range.to || d < range.from) onRange?.({ from: d });
      else onRange?.({ from: range.from, to: d });
    }
  };

  /* ---- days grid ---- */
  const days = () => {
    const start = weekStart(new Date(y, mo, 1));
    const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));
    const rTo = range?.to ?? (range && hover && hover > range.from ? hover : undefined);
    return (
      <>
        <div className="cal-wd">{WD.map((w) => <span key={w}>{w}</span>)}</div>
        <div className="cal-days" onMouseLeave={() => setHover(null)}>
          {cells.map((d) => {
            const dis = tooLate(d) || tooEarly(d);
            const inR = mode === 'range' && range && rTo && d > range.from && d < rTo;
            const edge = mode === 'range' && (sameDay(d, range?.from) || sameDay(d, rTo));
            return (
              <button key={d.toISOString()} disabled={dis} onMouseEnter={() => setHover(d)} onClick={() => pickDay(d)}
                className={clsx('cal-day', d.getMonth() !== mo && 'out', sameDay(d, max ?? new Date()) && 'today',
                  ((mode === 'day' && sameDay(d, value)) || edge) && 'sel', inR && 'in')}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  /* ---- week list ---- */
  const weeks = () => (
    <div className="cal-weeks">
      {weeksOfMonth(y, mo).map((w, i) => {
        const e = addDays(w, 6);
        return (
          <button key={w.toISOString()} disabled={tooLate(w)} className={clsx('cal-week', sameDay(w, value) && 'sel')} onClick={() => onChange?.(w)}>
            <b>Неделя {i + 1}</b>
            <span>{w.getDate()} {MONTHS_SHORT[w.getMonth()]} – {e.getDate()} {MONTHS_SHORT[e.getMonth()]}</span>
          </button>
        );
      })}
    </div>
  );

  /* ---- months grid ---- */
  const months = () => (
    <div className="cal-grid">
      {MONTHS.map((m, i) => {
        const d = new Date(y, i, 1);
        const sel = value && value.getFullYear() === y && value.getMonth() === i && (mode === 'month');
        return (
          <button key={m} disabled={tooLate(d)} className={clsx('cal-cell', sel && 'sel', max && max.getFullYear() === y && max.getMonth() === i && 'today')}
            onClick={() => { if (mode === 'month') onChange?.(d); else { setCur(d); setView('days'); } }}>
            {m}
          </button>
        );
      })}
    </div>
  );

  /* ---- years grid ---- */
  const years = () => (
    <div className="cal-grid">
      {Array.from({ length: YEARS_PER_PAGE }, (_, i) => pageStart + i).map((yr) => {
        const d = new Date(yr, 0, 1);
        return (
          <button key={yr} disabled={tooLate(d)} className={clsx('cal-cell', mode === 'year' && value?.getFullYear() === yr && 'sel', max?.getFullYear() === yr && 'today')}
            onClick={() => { if (mode === 'year') onChange?.(d); else { setCur(new Date(yr, mo, 1)); setView('months'); } }}>
            {yr}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => step(-1)} aria-label="Назад"><ChevronLeft size={16} /></button>
        <button className="cal-title" onClick={up} disabled={view === 'years'}>{title}</button>
        <button className="cal-nav" onClick={() => step(1)} aria-label="Вперёд"><ChevronRight size={16} /></button>
      </div>
      {view === 'days' ? (mode === 'week' ? weeks() : days()) : view === 'months' ? months() : years()}
    </div>
  );
}

const pad2 = (n: number) => String(n).padStart(2, '0');
const toStr = (d: Date) => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
const toDate = (s: string) => { const [dd, mm, yy] = s.split('.').map(Number); return new Date(yy, mm - 1, dd); };

/** Single date input («дд.мм.гггг») with the app calendar in a popover. Empty = not set. */
export function DateField({ value, onChange, placeholder = 'Не выбрано', min, max, align = 'left' }: {
  value?: string; onChange: (v?: string) => void; placeholder?: string; min?: Date; max?: Date; align?: 'left' | 'right';
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const open = !!pos;
  const ref = useRef<HTMLDivElement>(null);
  // the popover is fixed to the screen so modals with overflow don't cut it off
  const toggle = () => {
    if (pos) { setPos(null); return; }
    const r = ref.current!.getBoundingClientRect();
    const W = 300, H = 340;
    const left = Math.max(8, Math.min(align === 'right' ? r.right - W : r.left, window.innerWidth - W - 8));
    const top = r.bottom + 6 + H > window.innerHeight && r.top - 6 - H > 0 ? r.top - 6 - H : r.bottom + 6;
    setPos({ top, left });
  };
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setPos(null); };
    const close = () => setPos(null);
    document.addEventListener('mousedown', h);
    window.addEventListener('resize', close);
    return () => { document.removeEventListener('mousedown', h); window.removeEventListener('resize', close); };
  }, [open]);
  return (
    <div className="df" ref={ref}>
      <button type="button" className={clsx('input-wrap df-btn', open && 'open')} onClick={toggle}>
        <CalendarDays size={16} />
        <span className={clsx('grow', !value && 'muted')}>{value || placeholder}</span>
        {value && <span role="button" tabIndex={0} className="df-clear" aria-label="Очистить" onClick={(e) => { e.stopPropagation(); onChange(undefined); }}><X size={14} /></span>}
      </button>
      {pos && (
        <div className="cal-pop df-pop" style={{ top: pos.top, left: pos.left }}>
          <Calendar mode="day" value={value ? toDate(value) : min ?? new Date()} min={min} max={max} onChange={(d) => { onChange(toStr(d)); setPos(null); }} />
        </div>
      )}
    </div>
  );
}
