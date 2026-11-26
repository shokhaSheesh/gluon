/* eslint-disable @typescript-eslint/no-explicit-any */
import './chart-tip.css';

/**
 * Tooltip card for recharts: title + coloured rows (+ total for stacked bars).
 * Usage: <Tooltip content={<ChartTip />} /> · names = series labels, total = show the sum row.
 */
export function ChartTip({ active, payload, label, names, total, unit }: {
  active?: boolean; payload?: any[]; label?: string | number; names?: Record<string, string>; total?: string; unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const pie = label === undefined || label === '';
  const rows = payload.filter((p) => p.value !== undefined);
  const sum = rows.reduce((a, p) => a + (Number(p.value) || 0), 0);
  return (
    <div className="ct">
      {!pie && label !== undefined && <p className="ct-title">{label}</p>}
      {rows.map((p) => (
        <div key={p.dataKey ?? p.name} className="ct-row">
          <span className="ct-dot" style={{ background: p.payload?.color ?? p.color ?? p.fill }} />
          <span className="ct-name">{names?.[p.dataKey] ?? p.name}</span>
          <b>{p.value}{unit ? ` ${unit}` : ''}</b>
        </div>
      ))}
      {total && rows.length > 1 && <div className="ct-row ct-total"><span className="ct-name">{total}</span><b>{sum}</b></div>}
    </div>
  );
}
