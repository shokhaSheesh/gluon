import { useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, Lock, Pencil, Plus, ShieldCheck, Trash2, UserPlus, Wand2 } from 'lucide-react';
import { Badge, ConfirmModal, Field, Input, Modal, PhoneInput, Select, formatPhone, Pagination, usePaging } from '../../../components/ui';
import { PAGES, orgOf, useMerchant, type Employee, type Perm, type Role, type Team as TeamT } from '../../../lib/merchant';
import { useApp } from '../../../lib/store';
import './merchant.css';

const ACTIONS = ['Создание', 'Просмотр', 'Изменение', 'Удаление'];
const STATUS: Record<Employee['status'], { label: string; kind: 'success' | 'error' }> = {
  active: { label: 'Активен', kind: 'success' },
  blocked: { label: 'Заблокирован', kind: 'error' },
};
const permSummary = (r: Role, pages: { id: string; label: string }[]) =>
  pages.filter((p) => r.perms[p.id]?.some(Boolean)).map((p) => `${p.label}: ${r.perms[p.id].map((v, i) => (v ? 'CRUD'[i] : '')).join('')}`).join(' · ');

/** Merchant cabinet: employees of the organisation and roles with CRUD permissions per page. */
export default function Team() {
  const { session, toast } = useApp();
  const m = useMerchant();
  const { kind, org } = orgOf(session);
  const team = m.teamOf(org, kind);
  const pages = PAGES[kind];
  const save = (t: TeamT) => m.setTeam(org, t);
  const log = (section: 'team', action: string, target: string, details?: string) => m.log(org, kind, { section, action, target, details });

  const [tab, setTab] = useState<'employees' | 'roles'>('employees');
  const [emp, setEmp] = useState<Employee | null>(null);
  const [delEmp, setDelEmp] = useState<Employee | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const pg = usePaging();
  const [delRole, setDelRole] = useState<Role | null>(null);
  const roleName = (id: string) => team.roles.find((r) => r.id === id)?.name ?? '—';

  return (
    <div className="col gap-16">
      <div className="row between wrap gap-12">
        <h1 className="h4">Сотрудники и роли</h1>
        {tab === 'employees'
          ? <button className="btn btn-primary" onClick={() => setEmp({ id: '', name: '', phone: '', login: '', roleId: team.roles[1]?.id ?? 'owner', status: 'active', lastActive: '—' })}><UserPlus size={16} /> Добавить сотрудника</button>
          : <button className="btn btn-primary" onClick={() => setRole({ id: '', name: '', perms: Object.fromEntries(pages.map((p) => [p.id, [false, true, false, false] as Perm])) })}><Plus size={16} /> Новая роль</button>}
      </div>
      <div className="tabs-seg" style={{ alignSelf: 'flex-start' }}>
        <button className={clsx(tab === 'employees' && 'active')} onClick={() => setTab('employees')}>Сотрудники <span className="op-tabcount">{team.employees.length}</span></button>
        <button className={clsx(tab === 'roles' && 'active')} onClick={() => setTab('roles')}>Роли <span className="op-tabcount">{team.roles.length}</span></button>
      </div>

      {tab === 'employees' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Сотрудник</th><th>Логин</th><th>Телефон</th><th>Роль</th><th>Статус</th><th>Последняя активность</th><th /></tr></thead>
              <tbody>
                {pg.slice(team.employees).map((e) => (
                  <tr key={e.id}>
                    <td><span className="row gap-10"><span className="avatar sm">{e.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span><span className="strong" style={{ color: 'var(--text)' }}>{e.name}</span></span></td>
                    <td className="mono-ish">{e.login}</td>
                    <td>{formatPhone(e.phone)}</td>
                    <td>{e.roleId === 'owner' ? <Badge kind="primary"><ShieldCheck size={12} /> Владелец</Badge> : <Badge kind="neutral">{roleName(e.roleId)}</Badge>}</td>
                    <td><Badge kind={STATUS[e.status].kind}>{STATUS[e.status].label}</Badge></td>
                    <td className="t-sm muted">{e.lastActive}</td>
                    <td style={{ textAlign: 'right' }}>
                      {e.roleId !== 'owner' && (
                        <span className="row gap-8" style={{ justifyContent: 'flex-end' }}>
                          <button className="icon-btn sm" onClick={() => setEmp(e)} aria-label="edit"><Pencil size={14} /></button>
                          <button className="icon-btn sm" onClick={() => setDelEmp(e)} aria-label="delete"><Trash2 size={14} color="var(--error)" /></button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination {...pg.bar(team.employees.length)} />
        </div>
      ) : (
        <div className="tm-roles">
          {team.roles.map((r) => {
            const count = team.employees.filter((e) => e.roleId === r.id).length;
            const allowed = pages.filter((p) => r.perms[p.id]?.some(Boolean)).length;
            return (
              <div key={r.id} className="tm-role">
                <div className="row between">
                  <b className="row gap-6">{r.system && <Lock size={14} color="var(--text-3)" />}{r.name}</b>
                  <span className="t-xs muted">{count} сотр.</span>
                </div>
                <p className="t-sm muted">Доступ к {allowed} из {pages.length} разделов</p>
                <div className="tm-chips">
                  {pages.filter((p) => r.perms[p.id]?.some(Boolean)).map((p) => (
                    <span key={p.id} className="badge badge-neutral">{p.label}: {r.perms[p.id].map((v, i) => (v ? 'CRUD'[i] : '')).join('')}</span>
                  ))}
                </div>
                <div className="row gap-8 mt-8">
                  <button className="btn btn-secondary btn-sm grow" onClick={() => setRole(r)}>{r.system ? 'Просмотр' : 'Изменить права'}</button>
                  {!r.system && <button className="icon-btn sm" onClick={() => setDelRole(r)} aria-label="delete" disabled={count > 0} title={count ? 'Сначала смените роль сотрудникам' : 'Удалить'}><Trash2 size={14} color="var(--error)" /></button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmployeeModal emp={emp} team={team} onClose={() => setEmp(null)} onSave={(e, password) => {
        const old = team.employees.find((x) => x.id === e.id);
        save({ ...team, employees: old ? team.employees.map((x) => (x.id === e.id ? e : x)) : [...team.employees, { ...e, id: `e-${Date.now()}` }] });
        if (!old) log('team', 'Добавил сотрудника', e.name, `Логин: ${e.login} · Роль: ${roleName(e.roleId)}`);
        else {
          const changed = [old.name !== e.name && 'ФИО', old.login !== e.login && `логин: ${e.login}`, old.phone !== e.phone && 'телефон', old.roleId !== e.roleId && `роль: ${roleName(e.roleId)}`].filter(Boolean);
          if (changed.length) log('team', 'Изменил данные сотрудника', e.name, changed.join(', '));
          if (old.status !== e.status) log('team', e.status === 'blocked' ? 'Заблокировал сотрудника' : 'Разблокировал сотрудника', e.name);
          if (password) log('team', 'Сменил пароль сотрудника', e.name);
        }
        toast('success', old ? 'Сотрудник обновлён' : 'Сотрудник добавлен');
        setEmp(null);
      }} />
      <RoleModal role={role} pages={pages} onClose={() => setRole(null)} onSave={(r) => {
        const exists = team.roles.some((x) => x.id === r.id);
        save({ ...team, roles: exists ? team.roles.map((x) => (x.id === r.id ? r : x)) : [...team.roles, { ...r, id: `role-${Date.now()}` }] });
        log('team', exists ? 'Изменил права роли' : 'Создал роль', r.name, permSummary(r, pages) || 'Без доступа');
        toast('success', 'Роль сохранена');
        setRole(null);
      }} />
      <ConfirmModal open={!!delEmp} onClose={() => setDelEmp(null)} confirmText="Удалить" text={`Удалить сотрудника ${delEmp?.name}? Он потеряет доступ к кабинету.`}
        onConfirm={() => { save({ ...team, employees: team.employees.filter((x) => x.id !== delEmp?.id) }); log('team', 'Удалил сотрудника', delEmp?.name ?? ''); setDelEmp(null); toast('success', 'Сотрудник удалён'); }} />
      <ConfirmModal open={!!delRole} onClose={() => setDelRole(null)} confirmText="Удалить" text={`Удалить роль «${delRole?.name}»?`}
        onConfirm={() => { save({ ...team, roles: team.roles.filter((x) => x.id !== delRole?.id) }); log('team', 'Удалил роль', delRole?.name ?? ''); setDelRole(null); toast('success', 'Роль удалена'); }} />
    </div>
  );
}

function EmployeeModal({ emp, team, onClose, onSave }: { emp: Employee | null; team: TeamT; onClose: () => void; onSave: (e: Employee, password: string) => void }) {
  return (
    <Modal open={!!emp} onClose={onClose} title={emp?.id ? 'Изменить сотрудника' : 'Новый сотрудник'} width={480}>
      {emp && <EmployeeForm key={emp.id || 'new'} emp={emp} team={team} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

export const genPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  return Array.from({ length: 10 }, (_, i) => pick(i === 3 ? '23456789' : i === 6 ? '!@#$%' : chars)).join('');
};

function EmployeeForm({ emp, team, onClose, onSave }: { emp: Employee; team: TeamT; onClose: () => void; onSave: (e: Employee, password: string) => void }) {
  const editing = !!emp.id;
  const [f, setF] = useState(emp);
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<Record<string, string>>({});
  const submit = () => {
    const e: Record<string, string> = {};
    if (f.name.trim().split(/\s+/).length < 2) e.name = 'Введите имя и фамилию';
    if (f.phone.length < 9) e.phone = 'Введите номер телефона';
    if (!/^[a-z0-9._-]{4,}$/i.test(f.login)) e.login = 'Минимум 4 символа: латиница, цифры, . _ -';
    else if (team.employees.some((x) => x.id !== f.id && x.login.toLowerCase() === f.login.toLowerCase())) e.login = 'Такой логин уже есть';
    if (!editing && pw.length < 8) e.pw = 'Минимум 8 символов';
    if (editing && pw && pw.length < 8) e.pw = 'Минимум 8 символов';
    setErr(e);
    if (!Object.keys(e).length) onSave(f, pw);
  };
  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      <Field label="ФИО" error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Имя и фамилия" error={!!err.name} /></Field>
      <Field label="Телефон" error={err.phone}><PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} error={!!err.phone} /></Field>
      <Field label="Логин" error={err.login}><Input value={f.login} onChange={(e) => setF({ ...f, login: e.target.value.trim() })} placeholder="Например: dilnoza.h" error={!!err.login} autoComplete="off" /></Field>
      <Field label={editing ? 'Новый пароль' : 'Пароль'} error={err.pw} hint={editing && !err.pw ? 'Оставьте пустым, чтобы не менять' : undefined}>
        <div className="row gap-8">
          <Input className="grow" type={show ? 'text' : 'password'} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={editing ? '••••••••' : 'Минимум 8 символов'} error={!!err.pw} autoComplete="new-password"
            right={<button type="button" className="tm-eye" onClick={() => setShow((v) => !v)} aria-label="show">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>} />
          <button type="button" className="btn btn-secondary" onClick={() => { setPw(genPassword()); setShow(true); }}><Wand2 size={16} /> Сгенерировать</button>
        </div>
      </Field>
      <div className="row gap-12 tm-two">
        <Field label="Роль"><Select value={f.roleId} onChange={(v) => setF({ ...f, roleId: v })} options={team.roles.filter((r) => !r.system).map((r) => ({ value: r.id, label: r.name }))} /></Field>
        <Field label="Статус">
          <Select value={f.status} onChange={(v) => setF({ ...f, status: v as Employee['status'] })} options={[{ value: 'active', label: 'Активен' }, { value: 'blocked', label: 'Заблокирован' }]} />
        </Field>
      </div>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
        <button className="btn btn-primary grow" onClick={submit}>{editing ? 'Сохранить' : 'Добавить'}</button>
      </div>
    </div>
  );
}

function RoleModal({ role, pages, onClose, onSave }: { role: Role | null; pages: { id: string; label: string }[]; onClose: () => void; onSave: (r: Role) => void }) {
  return (
    <Modal open={!!role} onClose={onClose} title={role?.system ? `Роль «${role.name}»` : role?.id ? `Права роли «${role.name}»` : 'Новая роль'} width={760}>
      {role && <RoleForm key={role.id || 'new'} role={role} pages={pages} onClose={onClose} onSave={onSave} />}
    </Modal>
  );
}

function RoleForm({ role, pages, onClose, onSave }: { role: Role; pages: { id: string; label: string }[]; onClose: () => void; onSave: (r: Role) => void }) {
  const [f, setF] = useState<Role>(role);
  const [err, setErr] = useState('');
  const ro = !!role.system;
  const get = (p: string): Perm => f.perms[p] ?? [false, false, false, false];
  const set = (p: string, next: Perm) => {
    // create / update / delete imply view
    if (next[0] || next[2] || next[3]) next[1] = true;
    setF({ ...f, perms: { ...f.perms, [p]: next } });
  };
  const toggle = (p: string, i: number) => { const n = [...get(p)] as Perm; n[i] = !n[i]; if (i === 1 && !n[1]) { n[0] = n[2] = n[3] = false; } set(p, n); };
  const rowAll = (p: string) => { const all = get(p).every(Boolean); set(p, (all ? [false, false, false, false] : [true, true, true, true]) as Perm); };
  const colAll = (i: number) => {
    const all = pages.every((p) => get(p.id)[i]);
    const perms = { ...f.perms };
    pages.forEach((p) => {
      const n = [...get(p.id)] as Perm; n[i] = !all;
      if (i === 1 && all) { n[0] = n[2] = n[3] = false; }
      if (n[0] || n[2] || n[3]) n[1] = true;
      perms[p.id] = n;
    });
    setF({ ...f, perms });
  };

  return (
    <div className="col gap-16" style={{ padding: 24 }}>
      {ro
        ? <p className="t-sm muted row gap-6"><Lock size={14} /> Системная роль: полный доступ ко всем разделам, изменить нельзя.</p>
        : <Field label="Название роли" error={err}><Input value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErr(''); }} placeholder="Например: Бухгалтер" error={!!err} /></Field>}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-wrap">
          <table className="table tm-matrix">
            <thead>
              <tr>
                <th>Раздел</th>
                {ACTIONS.map((a, i) => (
                  <th key={a} style={{ textAlign: 'center' }}>
                    <label className="tm-colhead">
                      <input type="checkbox" disabled={ro} checked={pages.every((p) => get(p.id)[i])} onChange={() => colAll(i)} /> {a}
                    </label>
                  </th>
                ))}
                <th style={{ textAlign: 'center' }}>Все</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id}>
                  <td className="strong">{p.label}</td>
                  {ACTIONS.map((a, i) => (
                    <td key={a} style={{ textAlign: 'center' }}>
                      <input type="checkbox" className="tm-cb" disabled={ro} checked={get(p.id)[i]} onChange={() => toggle(p.id, i)} aria-label={`${p.label}: ${a}`} />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center' }}><input type="checkbox" className="tm-cb" disabled={ro} checked={get(p.id).every(Boolean)} onChange={() => rowAll(p.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="t-xs muted">Создание, изменение и удаление автоматически включают просмотр.</p>
      <div className="row gap-12">
        <button className="btn btn-secondary grow" onClick={onClose}>{ro ? 'Закрыть' : 'Отмена'}</button>
        {!ro && <button className="btn btn-primary grow" onClick={() => { if (!f.name.trim()) { setErr('Введите название'); return; } onSave(f); }}>Сохранить роль</button>}
      </div>
    </div>
  );
}
