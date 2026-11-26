import { useState } from 'react';
import clsx from 'clsx';
import { Blocks, Building2, Download, Handshake, Image, Landmark, Link2, MessagesSquare, Search, UserCog, Users } from 'lucide-react';
import { Pagination, Select } from '../../../components/ui';
import { AUDIT_SECTION, orgOf, parseDate, useMerchant, type AuditSection } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import { downloadXlsx } from '../../../lib/excel';
import { PeriodFilter, inRange, rangeOf, type Period } from './period';
import './merchant.css';

const PER = 15;
const ICON: Record<AuditSection, React.ReactNode> = {
  team: <UserCog size={14} />, chat: <MessagesSquare size={14} />, requests: <Link2 size={14} />, clients: <Users size={14} />, accounts: <Landmark size={14} />, companies: <Building2 size={14} />, partners: <Handshake size={14} />, banners: <Image size={14} />, services: <Blocks size={14} />,
};

/** Journal of employee actions: team & roles, chat, requests. */
export default function AuditLog() {
  const { session, toast } = useApp();
  const m = useMerchant();
  const { kind, org } = orgOf(session);
  const all = m.auditOf(org, kind);
  const labels = AUDIT_SECTION[kind];
  const [period, setPeriod] = useState<Period>({ key: 'all' });
  const [section, setSection] = useState<'all' | AuditSection>('all');
  const [actor, setActor] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const r = rangeOf(period);
  const base = all.filter((e) => inRange(parseDate(e.at.slice(0, 10)), r) && (actor === 'all' || e.actor === actor)
    && `${e.action} ${e.target} ${e.details ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const rows = base.filter((e) => section === 'all' || e.section === section);
  const total = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);
  const actors = [...new Set(all.map((e) => e.actor))];
  const reset = () => setPage(1);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Журнал действий</h1>
        <div className="row gap-12 wrap">
          <PeriodFilter value={period} onChange={(p) => { setPeriod(p); reset(); }} />
          <button className="btn btn-secondary" onClick={() => {
            downloadXlsx(`${org}-audit.xlsx`, 'Журнал действий', ['Дата и время', 'Сотрудник', 'Раздел', 'Действие', 'Объект', 'Подробности'], rows.map((e) => [e.at, e.actor, labels[e.section] ?? '', e.action, e.target, e.details ?? '']));
            toast('success', `Выгружено записей: ${rows.length}`);
          }}><Download size={16} /> Экспорт в Excel</button>
        </div>
      </div>

      <div className="mc-filters">
        <div className="tabs-seg">
          {(['all', ...Object.keys(labels)] as ('all' | AuditSection)[]).map((s) => (
            <button key={s} className={clsx(section === s && 'active')} onClick={() => { setSection(s); reset(); }}>
              {s === 'all' ? 'Все' : labels[s]} <span className="op-tabcount">{s === 'all' ? base.length : base.filter((e) => e.section === s).length}</span>
            </button>
          ))}
        </div>
        <div style={{ width: 220 }}><Select value={actor} onChange={(v) => { setActor(v); reset(); }} options={[{ value: 'all', label: 'Все сотрудники' }, ...actors.map((a) => ({ value: a, label: a }))]} /></div>
        <label className="u-search" style={{ display: 'flex', width: 240 }}><Search size={16} /><input placeholder="Действие или объект" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} /></label>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Дата и время</th><th>Сотрудник</th><th>Раздел</th><th>Действие</th><th>Подробности</th></tr></thead>
            <tbody>
              {view.map((e) => (
                <tr key={e.id}>
                  <td className="t-sm" style={{ whiteSpace: 'nowrap' }}>{e.at}</td>
                  <td><span className="row gap-8"><span className="avatar sm">{e.actor.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><span className="strong" style={{ color: 'var(--text)' }}>{e.actor}</span></span></td>
                  <td><span className={`al-sec ${e.section}`}>{ICON[e.section]} {labels[e.section]}</span></td>
                  <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{e.action}</span><span className="t-xs muted">{e.target}</span></span></td>
                  <td className="t-sm muted al-details">{e.details ?? '—'}</td>
                </tr>
              ))}
              {!view.length && <tr><td colSpan={5}><div className="empty-state">Записей нет</div></td></tr>}
            </tbody>
          </table>
        </div>
        {total > 1 && <Pagination page={page} total={total} onPage={setPage} />}
      </div>
    </div>
  );
}
