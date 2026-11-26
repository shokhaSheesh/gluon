import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Ban, Building2, Download, Landmark, Search } from 'lucide-react';
import { Badge, Pagination, Select, formatPhone } from '../../components/ui';
import { CATEGORIES, CHANNEL_LABEL, TODAY, parseDate, useMerchant, type Channel } from '../../lib/merchant';
import { useApp } from '../../lib/store';
import { downloadXlsx } from '../../lib/excel';
import './merchant/merchant.css';

const PER = 12;
const PLAN_NAME: Record<string, string> = { base: 'Базовый', business: 'Бизнес', pro: 'Про', corp: 'Корпоративный' };
const recent = (d?: string, days = 30) => !!d && (TODAY.getTime() - parseDate(d).getTime()) / 86_400_000 <= days;

/** Gluon admin: every company on the platform (direct and through partner banks). */
export default function AdminCompanies() {
  const { toast } = useApp();
  const { clients } = useMerchant();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [channel, setChannel] = useState('all');
  const [status, setStatus] = useState('all');
  const [cat, setCat] = useState('all');
  const [page, setPage] = useState(1);
  const reset = () => setPage(1);

  const digits = q.replace(/\D/g, '');
  const rows = clients.filter((c) => (channel === 'all' || c.channel === channel)
    && (status === 'all' || (status === 'blocked' ? c.blocked : status === 'active30' ? !c.blocked && recent(c.lastActive) : !c.blocked))
    && (cat === 'all' || c.category === cat)
    && ((c.company + c.owner).toLowerCase().includes(q.toLowerCase()) || (digits.length >= 3 && (c.inn.includes(digits) || c.phone.includes(digits.replace(/^998/, ''))))));
  const total = Math.max(1, Math.ceil(rows.length / PER));
  const view = rows.slice((page - 1) * PER, page * PER);

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Компании</h1>
        <button className="btn btn-secondary" onClick={() => {
          downloadXlsx('gluon-companies.xlsx', 'Компании', ['Компания', 'ИНН', 'Владелец', 'Телефон', 'Категория', 'Канал', 'Тариф', 'Сервисов', 'Счетов', 'Регистрация', 'Последний вход', 'Статус', 'Причина блокировки'],
            rows.map((c) => [c.company, c.inn, c.owner, formatPhone(c.phone), c.category, CHANNEL_LABEL[c.channel], PLAN_NAME[c.plan] ?? c.plan, Object.keys(c.services).length,
              (c.accounts ?? []).filter((a) => a.status === 'active').length, c.registered, c.lastActive ?? 'Не входил', c.blocked ? 'Заблокирована' : 'Активна', c.block ? `${c.block.reason}${c.block.note ? `: ${c.block.note}` : ''}` : '']));
          toast('success', `Выгружено компаний: ${rows.length}`);
        }}><Download size={16} /> Экспорт в Excel</button>
      </div>

      <div className="p-stats">
        <Stat icon={<Building2 size={22} />} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" value={clients.length} label="Всего компаний" />
        <Stat icon={<Activity size={22} />} color="linear-gradient(135deg,#079455,#47cd89)" value={clients.filter((c) => !c.blocked && recent(c.lastActive)).length} label="Активные за 30 дней" />
        <Stat icon={<Landmark size={22} />} color="linear-gradient(135deg,#b54708,#f79009)" value={clients.filter((c) => c.channel !== 'gluon').length} label="Через банки" />
        <Stat icon={<Ban size={22} />} color="linear-gradient(135deg,#d92d20,#f97066)" value={clients.filter((c) => c.blocked).length} label="Заблокированы" />
      </div>

      <div className="mc-filters">
        <label className="u-search" style={{ display: 'flex', width: 300 }}><Search size={16} /><input placeholder="Компания, владелец, ИНН, телефон" value={q} onChange={(e) => { setQ(e.target.value); reset(); }} /></label>
        <div style={{ width: 190 }}><Select value={channel} onChange={(v) => { setChannel(v); reset(); }} options={[{ value: 'all', label: 'Все каналы' }, ...(Object.keys(CHANNEL_LABEL) as Channel[]).map((c) => ({ value: c, label: CHANNEL_LABEL[c] }))]} /></div>
        <div style={{ width: 200 }}><Select value={status} onChange={(v) => { setStatus(v); reset(); }} options={[{ value: 'all', label: 'Любой статус' }, { value: 'active', label: 'Активные' }, { value: 'active30', label: 'Входили за 30 дней' }, { value: 'blocked', label: 'Заблокированы' }]} /></div>
        <div style={{ width: 200 }}><Select value={cat} onChange={(v) => { setCat(v); reset(); }} options={[{ value: 'all', label: 'Все категории' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} /></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Компания</th><th>ИНН</th><th>Канал</th><th>Тариф</th><th>Сервисы</th><th>Счета</th><th>Последний вход</th></tr></thead>
            <tbody>
              {view.map((c) => (
                <tr key={c.id} className="clickable" onClick={() => nav(c.id)}>
                  <td>
                    <span className="col">
                      <span className="row gap-6"><span className="strong" style={{ color: 'var(--text)' }}>{c.company}</span>{c.blocked && <Badge kind="error">Заблокирована</Badge>}</span>
                      <span className="t-xs muted">{c.owner} · {formatPhone(c.phone)}</span>
                    </span>
                  </td>
                  <td>{c.inn}</td>
                  <td>{c.channel === 'gluon' ? <Badge kind="primary">Gluon</Badge> : <Badge kind="neutral">{CHANNEL_LABEL[c.channel]}</Badge>}</td>
                  <td>{PLAN_NAME[c.plan] ?? c.plan}</td>
                  <td>{Object.keys(c.services).length}</td>
                  <td>{(c.accounts ?? []).filter((a) => a.status === 'active').length}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{c.lastActive ?? <span className="muted">Не входил</span>}</td>
                </tr>
              ))}
              {!view.length && <tr><td colSpan={7}><div className="empty-state">Компании не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
        {total > 1 && <Pagination page={page} total={total} onPage={setPage} />}
      </div>
    </div>
  );
}

export function Stat({ icon, color, value, label }: { icon: React.ReactNode; color: string; value: number | string; label: string }) {
  return (
    <div className="p-stat">
      <span className="p-stat-ic" style={{ background: color }}>{icon}</span>
      <div><p><b>{value}</b></p><p className="t-sm muted">{label}</p></div>
    </div>
  );
}
