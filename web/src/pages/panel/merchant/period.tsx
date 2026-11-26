import { useCallback, useState } from 'react';
import clsx from 'clsx';
import { CalendarDays, ChevronDown } from 'lucide-react';
import { useClickOutside } from '../../../components/ui';
import { Calendar, MONTHS, MONTHS_GEN, MONTHS_SHORT, addDays, weekStart, weeksOfMonth } from '../../../components/calendar';
import { TODAY, fmtDate } from '../../../lib/merchant';

export type PeriodKey = 'day' | 'week' | 'month' | 'year' | 'all' | 'range';
/** `date` — the picked day / week (its Monday) / month (1st) / year (Jan 1); `from`/`to` — for 'range'. */
export interface Period { key: PeriodKey; date?: Date; from?: Date; to?: Date }
export interface Range { from: Date; to: Date }

const LABEL: Record<PeriodKey, string> = { day: 'День', week: 'Неделя', month: 'Месяц', year: 'Год', all: 'Всё время', range: 'Период' };
export const START = new Date(2025, 5, 1);
const DAY = 86_400_000;
const min = (a: Date, b: Date) => (a < b ? a : b);

const defaultDate = (k: PeriodKey) =>
  k === 'week' ? weekStart(TODAY) : k === 'month' ? new Date(TODAY.getFullYear(), TODAY.getMonth(), 1) : k === 'year' ? new Date(TODAY.getFullYear(), 0, 1) : TODAY;

/** Inclusive date range of the picked period (never past today). */
export function rangeOf(p: Period): Range {
  const d = p.date ?? defaultDate(p.key);
  switch (p.key) {
    case 'day': return { from: d, to: d };
    case 'week': return { from: d, to: min(addDays(d, 6), TODAY) };
    case 'month': return { from: d, to: min(new Date(d.getFullYear(), d.getMonth() + 1, 0), TODAY) };
    case 'year': return { from: d, to: min(new Date(d.getFullYear(), 11, 31), TODAY) };
    case 'range': {
      const from = p.from ?? addDays(TODAY, -29);
      return { from, to: p.to ?? from };
    }
    default: return { from: START, to: TODAY };
  }
}

export const inRange = (d: Date, r: { from: Date; to: Date }) => d >= r.from && d <= r.to;

/** Time buckets for charts: days up to a month, weeks up to a quarter, months beyond. */
export function bucketsOf(r: Range) {
  const len = Math.round((r.to.getTime() - r.from.getTime()) / DAY) + 1;
  const out: { label: string; from: Date; to: Date }[] = [];
  if (len <= 31) {
    for (let i = 0; i < len; i++) { const d = addDays(r.from, i); out.push({ label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`, from: d, to: d }); }
  } else if (len <= 92) {
    for (let d = r.from; d <= r.to; d = addDays(d, 7)) { const e = min(addDays(d, 6), r.to); out.push({ label: `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`, from: d, to: e }); }
  } else {
    for (let d = new Date(r.from.getFullYear(), r.from.getMonth(), 1); d <= r.to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      out.push({ label: `${MONTHS_SHORT[d.getMonth()]}${d.getMonth() === 0 || out.length === 0 ? ` ${String(d.getFullYear()).slice(2)}` : ''}`, from: d < r.from ? r.from : d, to: min(e, r.to) });
    }
  }
  return out;
}

export const rangeLabel = (r: Range) => (r.from.getTime() === r.to.getTime() ? fmtDate(r.to) : `${fmtDate(r.from)} — ${fmtDate(r.to)}`);

/** Text on the picker button. */
export function periodLabel(p: Period) {
  const d = p.date ?? defaultDate(p.key);
  switch (p.key) {
    case 'day': return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
    case 'week': {
      const n = weeksOfMonth(d.getFullYear(), d.getMonth()).findIndex((w) => w.getTime() === d.getTime()) + 1;
      const e = addDays(d, 6);
      return `Неделя ${n} · ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`;
    }
    case 'month': return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    case 'year': return String(d.getFullYear());
    case 'range': { const r = rangeOf(p); return p.to ? `${fmtDate(r.from)} – ${fmtDate(r.to)}` : `${fmtDate(r.from)} – …`; }
    default: return '';
  }
}

export function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useClickOutside<HTMLDivElement>(close);
  const pick = (k: PeriodKey) => {
    if (k === value.key) return;
    // switching keeps the current day / week / month / year selected; the picker opens only from its button
    onChange(k === 'range' ? { key: k, from: addDays(TODAY, -29), to: TODAY } : { key: k });
    setOpen(false);
  };

  return (
    <div className="pf" ref={ref}>
      <div className="tabs-seg">
        {(Object.keys(LABEL) as PeriodKey[]).map((k) => (
          <button key={k} className={clsx(value.key === k && 'active')} onClick={() => pick(k)}>{LABEL[k]}</button>
        ))}
      </div>
      {value.key !== 'all' && (
        <div style={{ position: 'relative' }}>
          <button className={clsx('pf-btn', open && 'open')} onClick={() => setOpen((o) => !o)}>
            <CalendarDays size={16} /><span>{periodLabel(value)}</span><ChevronDown size={14} />
          </button>
          {open && (
            <div className="cal-pop">
              {value.key === 'range' ? (
                <>
                  <Calendar key="range" mode="range" max={TODAY} range={value.from ? { from: value.from, to: value.to } : undefined}
                    onRange={(r) => { onChange({ key: 'range', from: r.from, to: r.to }); if (r.to) setOpen(false); }} />
                  {!value.to && <div className="cal-foot">Выберите дату окончания</div>}
                </>
              ) : (
                <Calendar key={value.key} mode={value.key} max={TODAY} value={value.date ?? defaultDate(value.key)}
                  onChange={(d) => { onChange({ key: value.key, date: d }); setOpen(false); }} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
