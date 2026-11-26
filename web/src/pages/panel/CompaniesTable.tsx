import { useMemo, useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Badge, BrandMark, Pagination, Select } from '../../components/ui';
import { BANKS, BUSINESS_CATEGORIES, COMPANIES, SERVICES, fmt, type Company } from '../../data/mock';

export type Mode = 'companies' | 'finance';

export function CompaniesTable({ mode = 'companies', limit, showFilters = true, title }: { mode?: Mode; limit?: number; showFilters?: boolean; title?: string }) {
  const [status, setStatus] = useState('');
  const [cat, setCat] = useState('');
  const [applied, setApplied] = useState({ status: '', cat: '' });
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<Company | null>(null);
  const per = limit ?? 15;

  const rows = useMemo(() => COMPANIES.filter((c) =>
    (!applied.status || (applied.status === 'active') === c.active) && (!applied.cat || c.category === applied.cat),
  ), [applied]);
  const total = Math.max(1, Math.ceil(rows.length / per));
  const view = rows.slice((page - 1) * per, page * per);

  return (
    <>
      {showFilters && (
        <div className="row gap-12 wrap">
          {title && <h1 className="h4" style={{ marginRight: 'auto' }}>{title}</h1>}
          <div style={{ width: 170, marginLeft: title ? undefined : 'auto' }}>
            <Select value={status} onChange={setStatus} placeholder="Статус" options={[
              { value: 'stopped', label: <Badge kind="error">Остановлен</Badge> },
              { value: 'active', label: <Badge kind="success">Активный</Badge> },
            ]} />
          </div>
          <div style={{ width: 210 }}>
            <Select value={cat} onChange={setCat} placeholder="Категория бизнеса" options={BUSINESS_CATEGORIES.map((c) => ({ value: c, label: c }))} />
          </div>
          <button className="btn btn-primary" onClick={() => { setApplied({ status, cat }); setPage(1); }}>Применить</button>
          <button className="btn btn-secondary" onClick={() => { setStatus(''); setCat(''); setApplied({ status: '', cat: '' }); }}><Filter size={16} /> {applied.status || applied.cat ? 'Сбросить' : 'Фильтры'}</button>
        </div>
      )}
      <div className="card mt-16" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              {mode === 'companies' ? (
                <tr><th>#</th><th>ИНН Компании</th><th>Название компании</th><th>Статус</th><th>Адрес</th><th>Владелец</th><th>Категория бизнеса</th></tr>
              ) : (
                <tr><th>#</th><th>ИНН</th><th>Название компании</th><th>Статус</th><th>Банк</th><th>Подключённые сервисы</th><th>Оборот за месяц</th><th>Пользователи</th></tr>
              )}
            </thead>
            <tbody>
              {view.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => setOpen(c)}>
                  <td>{c.id}</td>
                  <td>{c.inn}</td>
                  <td className="strong">{c.name}</td>
                  <td>{c.active ? <Badge kind="success">Активный</Badge> : <Badge kind="error">Остановлен</Badge>}</td>
                  {mode === 'companies' ? (
                    <><td>{c.address}</td><td>{c.owner}</td><td>{c.category}</td></>
                  ) : (
                    <>
                      <td>{BANKS.find((b) => b.id === c.bank)?.name}</td>
                      <td><span className="row gap-4">{c.services.map((s) => { const x = SERVICES.find((y) => y.id === s)!; return <BrandMark key={s} name={x.name} color={x.color} text={x.mark} size={22} />; })}</span></td>
                      <td className="strong">{fmt(c.revenue)} сум</td>
                      <td>{c.users}</td>
                    </>
                  )}
                </tr>
              ))}
              {!view.length && <tr><td colSpan={8}><div className="empty-state">Компании не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
        {!limit && <Pagination page={page} total={total} onPage={setPage} />}
      </div>

      {open && (
        <>
          <div className="overlay" style={{ background: 'var(--overlay)', backdropFilter: 'none' }} onClick={() => setOpen(null)} />
          <aside className="p-drawer">
            <div className="row between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <div><p className="h5">{open.name}</p><p className="t-sm muted">ИНН {open.inn}</p></div>
              <button className="icon-btn sm" onClick={() => setOpen(null)} aria-label="close"><X size={16} /></button>
            </div>
            <div className="col gap-20" style={{ padding: 20, overflow: 'auto' }}>
              <dl className="kv">
                <dt>Статус</dt><dd>{open.active ? <Badge kind="success">Активный</Badge> : <Badge kind="error">Остановлен</Badge>}</dd>
                <dt>Владелец</dt><dd>{open.owner}</dd>
                <dt>Адрес</dt><dd>{open.address}</dd>
                <dt>Категория</dt><dd>{open.category}</dd>
                <dt>Банк</dt><dd>{BANKS.find((b) => b.id === open.bank)?.name}</dd>
                <dt>Оборот за месяц</dt><dd>{fmt(open.revenue)} сум</dd>
                <dt>Пользователи</dt><dd>{open.users}</dd>
              </dl>
              <div>
                <p className="medium" style={{ marginBottom: 8 }}>Подключённые сервисы</p>
                <div className="col gap-8">
                  {open.services.map((s) => { const x = SERVICES.find((y) => y.id === s)!; return (
                    <div key={s} className="row between" style={{ padding: 10, border: '1px solid var(--border)', borderRadius: 10 }}>
                      <span className="row gap-8"><BrandMark name={x.name} color={x.color} text={x.mark} size={26} /><b className="t-sm medium">{x.name}</b></span>
                      <span className="t-sm muted">{x.type}</span>
                    </div>
                  ); })}
                </div>
              </div>
              <button className="btn btn-secondary">{open.active ? 'Остановить компанию' : 'Активировать компанию'}</button>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
