import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Database, Download, HardDrive, Search } from 'lucide-react';
import { Pagination, Select } from '../../components/ui';
import { CHANNEL_LABEL } from '../../lib/merchant';
import { gbLabel } from '../../lib/billing';
import { useApp } from '../../lib/store';
import { downloadXlsx } from '../../lib/excel';
import { useLedgers } from '../../lib/ledger';
import { Stat } from './AdminCompanies';
import { pct } from './merchant/serviceStats';
import './merchant/merchant.css';

const CAPACITY_GB = 50 * 1024; // Gluon Archive cluster
const PER = 15;

/** Gluon admin: how full the Gluon Archive is and which companies take the space. */
export default function AdminStorage() {
  const { toast } = useApp();
  const nav = useNavigate();
  const ledgers = useLedgers();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const used = ledgers.reduce((a, { l }) => a + l.storage.usedGb, 0);
  const quota = ledgers.reduce((a, { l }) => a + l.storage.totalGb, 0);
  const types = ledgers.flatMap(({ l }) => l.storage.parts).reduce<Record<string, { gb: number; color: string }>>((a, p) => ({ ...a, [p.name]: { gb: (a[p.name]?.gb ?? 0) + p.gb, color: p.color } }), {});
  const typeList = Object.entries(types).sort((a, b) => b[1].gb - a[1].gb);
  const nearFull = ledgers.filter(({ l }) => l.storage.usedGb / l.storage.totalGb >= 0.8);
  const rows = [...ledgers]
    .filter(({ c, l }) => c.company.toLowerCase().includes(q.toLowerCase()) && (filter === 'all' || (filter === 'near' ? l.storage.usedGb / l.storage.totalGb >= 0.8 : true)))
    .sort((a, b) => b.l.storage.usedGb - a.l.storage.usedGb);
  const view = rows.slice((page - 1) * PER, page * PER);
  const usedPct = pct(used, CAPACITY_GB);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Хранилище</h1>
        <button className="btn btn-secondary" onClick={() => {
          downloadXlsx('gluon-storage.xlsx', 'Хранилище', ['Компания', 'ИНН', 'Канал', 'Занято, GB', 'Квота, GB', 'Заполнено, %', ...typeList.map(([n]) => `${n}, GB`)],
            rows.map(({ c, l }) => [c.company, c.inn, CHANNEL_LABEL[c.channel] ?? c.channel, l.storage.usedGb, l.storage.totalGb, pct(l.storage.usedGb, l.storage.totalGb), ...typeList.map(([n]) => l.storage.parts.find((p) => p.name === n)?.gb ?? 0)]));
          toast('success', 'Выгружено в Excel');
        }}><Download size={16} /> Экспорт в Excel</button>
      </div>

      <div className="p-stats">
        <Stat icon={<Database size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={gbLabel(CAPACITY_GB)} label="Ёмкость Gluon Архива" />
        <Stat icon={<HardDrive size={22} />} color="linear-gradient(135deg,#7a5af8,#a48afb)" value={`${gbLabel(used)} · ${usedPct}%`} label="Занято" />
        <Stat icon={<HardDrive size={22} />} color="linear-gradient(135deg,#1570ef,#53b1fd)" value={gbLabel(quota)} label="Выделено по тарифам" />
        <Stat icon={<AlertTriangle size={22} />} color="linear-gradient(135deg,#b54708,#f79009)" value={nearFull.length} label="Компаний заполнили 80%+" />
      </div>

      <section className="card db-card">
        <div className="row between wrap gap-8">
          <h3 className="medium">Заполненность</h3>
          <span className="t-sm muted">Занято {gbLabel(used)} из {gbLabel(CAPACITY_GB)} · свободно {gbLabel(CAPACITY_GB - used)}</span>
        </div>
        <div className="ac-stack">
          {typeList.map(([name, t]) => <span key={name} style={{ width: `${(t.gb / CAPACITY_GB) * 100}%`, background: t.color }} title={`${name}: ${gbLabel(t.gb)}`} />)}
        </div>
        <div className="ac-parts">
          {typeList.map(([name, t]) => (
            <div key={name} className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: t.color }} />{name}</span><b>{gbLabel(t.gb)}</b></div>
          ))}
          <div className="row between t-sm"><span className="row gap-8"><span className="dot" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)' }} />Свободно</span><b>{gbLabel(CAPACITY_GB - used)}</b></div>
        </div>
      </section>

      <div className="mc-filters">
        <label className="u-search" style={{ display: 'flex', width: 280 }}><Search size={16} /><input placeholder="Компания" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></label>
        <div style={{ width: 220 }}><Select value={filter} onChange={(v) => { setFilter(v); setPage(1); }} options={[{ value: 'all', label: 'Все компании' }, { value: 'near', label: 'Заполнили 80%+' }]} /></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>#</th><th>Компания</th><th>Занято</th><th style={{ width: '30%' }}>Квота</th><th>По типам</th></tr></thead>
            <tbody>
              {view.map(({ c, l }, i) => {
                const p = pct(l.storage.usedGb, l.storage.totalGb);
                return (
                  <tr key={c.id} className="clickable" onClick={() => nav(`/admin/companies/${c.id}`)}>
                    <td className="muted">{(page - 1) * PER + i + 1}</td>
                    <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{c.company}</span><span className="t-xs muted">{CHANNEL_LABEL[c.channel] ?? c.channel}</span></span></td>
                    <td className="strong" style={{ whiteSpace: 'nowrap' }}>{gbLabel(l.storage.usedGb)}<span className="t-xs muted"> · {pct(l.storage.usedGb, used)}% от всех</span></td>
                    <td>
                      <div className="col gap-4">
                        <span className="t-xs muted">{p}% из {gbLabel(l.storage.totalGb)}</span>
                        <div className="db-bar"><span style={{ width: `${p}%`, background: p >= 80 ? 'var(--warning)' : 'var(--primary)' }} /></div>
                      </div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div className="st-mini" title={l.storage.parts.map((x) => `${x.name}: ${x.gb} GB`).join(' · ')}>
                        {l.storage.parts.map((x) => <span key={x.name} style={{ flex: x.gb, background: x.color }} />)}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!view.length && <tr><td colSpan={5}><div className="empty-state">Компании не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
        {rows.length > PER && <Pagination page={page} total={Math.ceil(rows.length / PER)} onPage={setPage} />}
      </div>
    </div>
  );
}
