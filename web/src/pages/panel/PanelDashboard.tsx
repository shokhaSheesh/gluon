import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Building2, CalendarDays, CircleHelp, Filter, Users, Wallet } from 'lucide-react';
import { REVENUE_SERIES, fmt } from '../../data/mock';
import { useApp } from '../../lib/store';
import { CompaniesTable } from './CompaniesTable';
import { ANIM } from '../../lib/chart';

export function StatCard({ icon, value, unit, label, color }: { icon: React.ReactNode; value: string; unit?: string; label: string; color: string }) {
  return (
    <div className="p-stat">
      <span className="p-stat-ic" style={{ background: color }}>{icon}</span>
      <div><p><b>{value}</b>{unit && <span className="muted"> {unit}</span>}</p><p className="t-sm muted">{label}</p></div>
    </div>
  );
}

export default function PanelDashboard() {
  const { session } = useApp();
  const nav = useNavigate();
  const isAdmin = session?.platform === 'admin';
  const isService = session?.kind === 'service';
  return (
    <div className="col gap-20">
      <div className="p-stats">
        <StatCard icon={<Wallet size={24} />} value="100 000 000" unit="сум" label={isAdmin ? 'Общий доход' : isService ? `Подписки ${session?.org} через Gluon` : 'Оборот клиентов банка'} color="linear-gradient(135deg,#2f4d4d,#5b8a8a)" />
        <StatCard icon={<Building2 size={24} />} value="6 485" label={isService ? `Клиентов ${session?.org}` : isAdmin ? "Компаний" : "Клиентов банка"} color="linear-gradient(135deg,#1570ef,#53b1fd)" />
        <StatCard icon={<Users size={24} />} value="6 485" label="Активных юзеров" color="linear-gradient(135deg,#f79009,#fdb022)" />
        <StatCard icon={<CircleHelp size={24} />} value="154" label="Новых заявок" color="linear-gradient(135deg,#0e9384,#2ed3b7)" />
      </div>

      <section className="card" style={{ padding: '16px 18px' }}>
        <div className="row between">
          <h3 className="medium" style={{ fontSize: 16 }}>{isAdmin ? 'Общий доход от подписок' : isService ? `Доход ${session?.org} через Gluon` : 'Оборот клиентов банка через Gluon'}</h3>
          <button className="btn btn-secondary btn-sm">01.01.2026 <CalendarDays size={14} /></button>
        </div>
        <div style={{ height: 280, marginTop: 12 }}>
          <ResponsiveContainer>
            <AreaChart data={REVENUE_SERIES} margin={{ left: 20 }}>
              <defs><linearGradient id="pr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--logo)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--logo)" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => fmt(v)} />
              <Tooltip formatter={(v) => [`${fmt(Number(v))} сум`, 'Доход']} />
              <Area isAnimationActive={ANIM} type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={1.5} fill="url(#pr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="row between">
        <h2 className="h5">Список компании</h2>
        <button className="btn btn-secondary btn-sm" onClick={() => nav('companies')}><Filter size={14} /> Все компании</button>
      </div>
      <div style={{ marginTop: -16 }}><CompaniesTable limit={8} showFilters={false} /></div>
    </div>
  );
}
