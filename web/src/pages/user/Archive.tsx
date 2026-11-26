import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { ArrowDown, Database } from 'lucide-react';
import { BrandMark, Select } from '../../components/ui';
import { ARCHIVE_ITEMS, SERVICES } from '../../data/mock';
import { ARCHIVE_ICONS } from '../../assets';
import { useNavigate } from 'react-router-dom';
import { gbLabel, useBilling } from '../../lib/billing';
import { ANIM } from '../../lib/chart';

const USAGE = [
  { id: 'free', name: 'Свободное место', pct: 59, size: '302,08 GB', color: 'var(--secondary)', type: '', last: '' },
  { id: 'robosell', name: 'Robosell', pct: 20, size: '102,4 GB', color: 'var(--primary)', type: 'Онлайн-продажи', last: '2 часа назад' },
  { id: 'robohub', name: 'RoboHub', pct: 13, size: '66,56 GB', color: '#6aa9a9', type: 'Агрегатор доставки', last: '1 неделю назад' },
  { id: 'billz', name: 'Billz', pct: 8, size: '40,96 GB', color: '#b6f0f0', type: 'POS-система', last: '31.01.2026' },
];


export default function Archive() {
  const [filter, setFilter] = useState('all');
  const nav = useNavigate();
  const b = useBilling();
  const plan = b.plans.find((p) => p.id === b.currentPlan) ?? b.plans[0];
  const usedPct = Math.round((b.usedGb / plan.gb) * 100);
  const pie = USAGE.filter((u) => u.id !== 'free').map((u) => ({ name: u.name, value: u.pct, color: u.color })).concat([{ name: 'free', value: 59, color: 'var(--secondary)' }]);

  return (
    <div className="col gap-16">
      <div className="row gap-16" style={{ alignItems: 'stretch', flexWrap: 'wrap' }}>
        <div className="section col ar-usage" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 280, height: 280, position: 'relative' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie isAnimationActive={ANIM} data={pie} dataKey="value" innerRadius={88} outerRadius={136} paddingAngle={3} cornerRadius={8} startAngle={110} endAngle={-250} stroke="none">
                  {pie.map((p) => <Cell key={p.name} fill={p.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="d-donut-c" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <b style={{ fontSize: 26, fontWeight: 500 }}>{b.usedGb} GB</b>
              <span className="muted">из {gbLabel(plan.gb)}</span>
            </div>
          </div>
          <h2 className="h3 mt-16">Использование памяти</h2>
          <p className="muted">Тариф «{plan.name}» · используется {usedPct}% памяти</p>
          <button className="btn btn-primary btn-block mt-16" onClick={() => nav('/app/billing')}>Увеличить хранилище</button>
        </div>

        <div className="section grow" style={{ padding: 0, minWidth: 320 }}>
          <div className="row between" style={{ padding: '18px 20px' }}>
            <div className="row gap-8"><h3 className="h5">Архив интеграции</h3><span className="badge badge-success">{USAGE.length - 1} интеграции</span></div>
            <Select className="" value={filter} onChange={setFilter} options={[{ value: 'all', label: 'Все' }, { value: 'pos', label: 'POS-системы' }, { value: 'sales', label: 'Онлайн-продажи' }]} />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th><span className="row gap-4">Название интеграции <ArrowDown size={12} /></span></th><th style={{ width: '40%' }} /><th>Тип интеграции</th><th>Последняя активность</th></tr></thead>
              <tbody>
                {USAGE.map((u) => {
                  const s = SERVICES.find((x) => x.id === u.id);
                  return (
                    <tr key={u.id}>
                      <td className="strong"><span className="row gap-12">{s ? <BrandMark name={s.name} color={s.color} text={s.mark} size={28} /> : <Database size={22} color="var(--text-3)" />}{u.name}</span></td>
                      <td>
                        <span className="row gap-12">
                          <span className="progress grow"><span style={{ width: `${u.pct}%`, background: u.color }} /></span>
                          <span className="t-sm">{u.pct}%</span>
                          <span className={`badge ${u.id === 'free' ? 'badge-error' : 'badge-success'}`}>{u.size}</span>
                        </span>
                      </td>
                      <td>{u.type}</td>
                      <td>{u.last}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="section">
        <h3 className="medium" style={{ fontSize: 17 }}>Подробная информация об архиве</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginTop: 16 }}>
          {ARCHIVE_ITEMS.map((a) => (
            <div key={a.name} className="row between" style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid color-mix(in srgb, ${a.tone} 25%, transparent)`, background: `color-mix(in srgb, ${a.tone} 7%, var(--surface))` }}>
              <div className="row gap-12">
                <img src={ARCHIVE_ICONS[a.icon as keyof typeof ARCHIVE_ICONS]} alt="" style={{ width: 36, height: 36 }} />
                <div><p className="medium">{a.name}</p><p className="t-sm muted">{a.files}</p></div>
              </div>
              <span className="medium" style={{ color: a.tone, alignSelf: 'flex-start' }}>{a.size}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
