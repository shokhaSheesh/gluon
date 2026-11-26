import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CalendarDays, ChevronDown, FileSpreadsheet, FileText, Search, Upload, Wallet, X, CircleCheck, Pencil, Plus, Info } from 'lucide-react';
import { BrandMark, Field, Input, Modal, Select, useClickOutside } from '../../components/ui';
import { ACCOUNTS, CATEGORIES, OPERATIONS, accountLabel, maskAccount, type Operation, type OpType } from '../../data/operations';
import { BANKS, fmt } from '../../data/mock';
import { useApp } from '../../lib/store';
import './operations.css';

const TYPE: Record<OpType, { label: string; plural: string; icon: React.ReactNode; cls: string; sign: string }> = {
  income: { label: 'Приход', plural: 'Приход', icon: <ArrowDownLeft size={16} />, cls: 'in', sign: '+' },
  expense: { label: 'Расход', plural: 'Расход', icon: <ArrowUpRight size={16} />, cls: 'out', sign: '−' },
  transfer: { label: 'Перевод', plural: 'Переводы', icon: <ArrowLeftRight size={16} />, cls: 'tr', sign: '' },
};
type Format = 'pdf' | 'excel';
const bankOf = (accountId: string) => BANKS.find((b) => b.id === ACCOUNTS.find((a) => a.id === accountId)?.bank)!;
const ACCOUNT_OPTIONS = ACCOUNTS.map((a) => ({ value: a.id, label: accountLabel(a, BANKS.find((b) => b.id === a.bank)!.name) }));

export default function Operations() {
  const [ops, setOps] = useState<Operation[]>(OPERATIONS);
  const [tab, setTab] = useState<'all' | OpType>('all');
  const [account, setAccount] = useState('all');
  const [period, setPeriod] = useState('month');
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const [importFmt, setImportFmt] = useState<Format | null>(null);
  const [open, setOpen] = useState<Operation | null>(null);
  const menuRef = useClickOutside<HTMLDivElement>(() => setMenu(false));

  const byAccount = ops.filter((o) => account === 'all' || o.account === account);
  const sum = (t: OpType) => byAccount.filter((o) => o.type === t).reduce((a, o) => a + o.amount, 0);
  const list = byAccount.filter((o) => (tab === 'all' || o.type === tab) && [o.title, o.counterparty, o.purpose, o.inn, o.category].join(' ').toLowerCase().includes(q.toLowerCase()));
  const counts = { all: byAccount.length, income: byAccount.filter((o) => o.type === 'income').length, expense: byAccount.filter((o) => o.type === 'expense').length, transfer: byAccount.filter((o) => o.type === 'transfer').length };
  const uncategorized = byAccount.filter((o) => !o.category).length;

  return (
    <div className="col gap-16">
      <section className="section">
        <div className="row between wrap gap-12">
          <div>
            <h1 className="h4">Банковские операции</h1>
            <p className="muted t-sm">Операции из загруженных выписок по вашим расчётным счетам. Категории и названия вы можете указать сами.</p>
          </div>
          <div className="select" ref={menuRef}>
            <button className="btn btn-primary" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
              <Upload size={16} /> Загрузить выписку <ChevronDown size={16} style={{ transform: menu ? 'rotate(180deg)' : undefined, transition: '.15s' }} />
            </button>
            {menu && (
              <div className="menu right op-menu">
                <button className="menu-item" onClick={() => { setImportFmt('pdf'); setMenu(false); }}>
                  <span className="op-fmt pdf"><FileText size={18} /></span>
                  <span><b className="medium">PDF-выписка</b><br /><span className="t-xs muted">Выписка из интернет-банка в PDF</span></span>
                </button>
                <button className="menu-item" onClick={() => { setImportFmt('excel'); setMenu(false); }}>
                  <span className="op-fmt xls"><FileSpreadsheet size={18} /></span>
                  <span><b className="medium">Excel-файл</b><br /><span className="t-xs muted">Форматы .xlsx и .xls</span></span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="op-stats">
          <Stat icon={<ArrowDownLeft size={20} />} cls="in" label="Приход" value={sum('income')} count={counts.income} />
          <Stat icon={<ArrowUpRight size={20} />} cls="out" label="Расход" value={sum('expense')} count={counts.expense} />
          <Stat icon={<ArrowLeftRight size={20} />} cls="tr" label="Переводы" value={sum('transfer')} count={counts.transfer} />
          <Stat icon={<Wallet size={20} />} cls="net" label="Чистый поток" value={sum('income') - sum('expense')} signed />
        </div>
        {uncategorized > 0 && (
          <p className="op-hint"><Info size={15} /> {uncategorized} операций без категории — нажмите на операцию, чтобы указать категорию или своё название.</p>
        )}
      </section>

      <section className="section" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="row between wrap gap-12" style={{ padding: '14px 20px' }}>
          <div className="tabs-seg">
            {(['all', 'income', 'expense', 'transfer'] as const).map((k) => (
              <button key={k} className={clsx(tab === k && 'active')} onClick={() => setTab(k)}>
                {k === 'all' ? 'Все' : TYPE[k].plural} <span className="op-tabcount">{counts[k]}</span>
              </button>
            ))}
          </div>
          <div className="row gap-12 wrap">
            <label className="u-search" style={{ display: 'flex', width: 260 }}><Search size={16} /><input placeholder="Контрагент, ИНН, назначение" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <div style={{ width: 290 }}><Select value={account} onChange={setAccount} options={[{ value: 'all', label: 'Все счета' }, ...ACCOUNT_OPTIONS]} /></div>
            <div style={{ width: 170 }}><Select value={period} onChange={setPeriod} options={[{ value: 'week', label: 'Эта неделя' }, { value: 'month', label: 'Ноябрь 2026' }, { value: 'q', label: 'Квартал' }]} /></div>
          </div>
        </div>
        <div className="op-cards">
          {list.map((o) => {
            const t = TYPE[o.type];
            return (
              <button key={o.id} className="op-card" onClick={() => setOpen(o)}>
                <span className={`op-ic ${t.cls}`}>{t.icon}</span>
                <span className="grow col" style={{ minWidth: 0, textAlign: 'left' }}>
                  <span className="row between gap-8">
                    <b className="t-sm medium op-ellipsis">{o.title ?? o.counterparty}</b>
                    <b className={`t-sm op-amount ${t.cls}`}>{t.sign}{t.sign && ' '}{fmt(o.amount)}</b>
                  </span>
                  <span className="t-xs muted op-ellipsis">{o.purpose}</span>
                  <span className="row gap-6 t-xs muted" style={{ marginTop: 4 }}>{o.date} · {o.category ? <span className="badge badge-neutral">{o.category}</span> : <span className="op-addcat"><Plus size={10} /> Категория</span>}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="table-wrap op-table">
          <table className="table">
            <thead><tr><th>Дата</th><th>Контрагент и назначение платежа</th><th>Счёт</th><th>Категория</th><th>Тип</th><th style={{ textAlign: 'right' }}>Сумма</th></tr></thead>
            <tbody>
              {list.map((o) => {
                const t = TYPE[o.type];
                const bank = bankOf(o.account);
                return (
                  <tr key={o.id} className="clickable" onClick={() => setOpen(o)}>
                    <td><span className="col"><span className="strong" style={{ color: 'var(--text)' }}>{o.date}</span><span className="t-xs muted">{o.time}</span></span></td>
                    <td style={{ whiteSpace: 'normal', minWidth: 340 }}>
                      <span className="row gap-12" style={{ alignItems: 'flex-start' }}>
                        <span className={`op-ic ${t.cls}`}>{t.icon}</span>
                        <span className="col" style={{ minWidth: 0 }}>
                          <span className="row gap-8 wrap">
                            <span className="strong" style={{ color: 'var(--text)' }}>{o.title ?? o.counterparty}</span>
                            {o.title && <span className="t-xs muted">· {o.counterparty}</span>}
                            {o.comment && <span className="badge badge-neutral" title={o.comment}>💬</span>}
                          </span>
                          <span className="t-xs muted op-purpose">{o.purpose}</span>
                        </span>
                      </span>
                    </td>
                    <td><span className="row gap-8"><BrandMark name={bank.name} color={bank.color} text={bank.mark} size={20} /><span className="t-sm">•••• {ACCOUNTS.find((a) => a.id === o.account)!.number.slice(-4)}</span></span></td>
                    <td>{o.category ? <span className="badge badge-neutral">{o.category}</span> : <span className="op-addcat"><Plus size={12} /> Указать</span>}</td>
                    <td><span className={`op-type ${t.cls}`}>{t.label}</span></td>
                    <td style={{ textAlign: 'right' }} className={`op-amount ${t.cls}`}>{t.sign}{t.sign && ' '}{fmt(o.amount)} сум</td>
                  </tr>
                );
              })}
              {!list.length && <tr><td colSpan={6}><div className="empty-state">Операции не найдены</div></td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ImportModal format={importFmt} onClose={() => setImportFmt(null)} />
      <OperationModal op={open} onClose={() => setOpen(null)} onSave={(o) => { setOps((l) => l.map((x) => (x.id === o.id ? o : x))); setOpen(null); }} />
    </div>
  );
}

/** Statement fields are read-only; name, category and comment are entered by the user. */
function OperationModal({ op, onClose, onSave }: { op: Operation | null; onClose: () => void; onSave: (o: Operation) => void }) {
  const { toast } = useApp();
  const [f, setF] = useState({ title: '', category: '', comment: '' });
  useEffect(() => { if (op) setF({ title: op.title ?? '', category: op.category ?? '', comment: op.comment ?? '' }); }, [op]);
  if (!op) return null;
  const t = TYPE[op.type];
  const acc = ACCOUNTS.find((a) => a.id === op.account)!;
  return (
    <Modal open onClose={onClose} title="Операция" width={560}>
      <div className="col gap-16" style={{ padding: 24 }}>
        <div className="row between">
          <span className="row gap-12"><span className={`op-ic ${t.cls}`}>{t.icon}</span><span className={`op-type ${t.cls}`}>{t.label}</span></span>
          <b className={`op-amount ${t.cls}`} style={{ fontSize: 22 }}>{t.sign}{t.sign && ' '}{fmt(op.amount)} сум</b>
        </div>
        <div className="op-statement">
          <p className="t-xs muted row gap-6" style={{ marginBottom: 8 }}><FileText size={13} /> Данные из выписки · {op.file}</p>
          <dl className="kv">
            <dt>Дата</dt><dd>{op.date}, {op.time}</dd>
            <dt>Контрагент</dt><dd>{op.counterparty}</dd>
            <dt>ИНН контрагента</dt><dd>{op.inn}</dd>
            <dt>Счёт контрагента</dt><dd>{maskAccount(op.counterAccount)}</dd>
            <dt>Наш счёт</dt><dd>{accountLabel(acc, bankOf(op.account).name)}</dd>
            <dt>Назначение платежа</dt><dd style={{ fontWeight: 400 }}>{op.purpose}</dd>
          </dl>
        </div>
        <p className="medium row gap-6"><Pencil size={14} /> Ваши заметки</p>
        <Field label="Своё название" hint="Если указано, показывается вместо контрагента">
          <Input placeholder="Например: Аренда офиса" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <Field label="Категория">
          <Select value={f.category} onChange={(v) => setF({ ...f, category: v })} placeholder="Без категории" options={[{ value: '', label: 'Без категории' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        </Field>
        <Field label="Комментарий">
          <textarea className="textarea" style={{ minHeight: 70 }} placeholder="Например: оплата за партию №3" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} />
        </Field>
        <div className="row gap-12">
          <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary grow" onClick={() => {
            onSave({ ...op, title: f.title.trim() || undefined, category: f.category || undefined, comment: f.comment.trim() || undefined });
            toast('success', 'Операция сохранена');
          }}>Сохранить</button>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ icon, cls, label, value, count, signed }: { icon: React.ReactNode; cls: string; label: string; value: number; count?: number; signed?: boolean }) {
  return (
    <div className="op-stat">
      <span className={`op-stat-ic ${cls}`}>{icon}</span>
      <div>
        <p className="t-sm muted">{label}</p>
        <p className="h5">{signed && value > 0 ? '+' : ''}{fmt(value)} сум</p>
        <p className="t-xs muted">{count !== undefined ? `${count} операций · ноябрь` : 'приход − расход'}</p>
      </div>
    </div>
  );
}

/** Statement import: design only — parsing is done by the Gluon "Detail" OCR service later. */
function ImportModal({ format, onClose }: { format: Format | null; onClose: () => void }) {
  const { toast } = useApp();
  const [account, setAccount] = useState(ACCOUNTS[0].id);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const isPdf = format === 'pdf';

  useEffect(() => { if (format) { setFile(null); setProgress(0); } }, [format]);
  useEffect(() => {
    if (!file || progress >= 100) return;
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 9)), 120);
    return () => clearTimeout(id);
  }, [file, progress]);

  const pick = (f?: File | null) => { if (f) { setFile(f); setProgress(0); } };
  const done = progress >= 100;

  return (
    <Modal open={!!format} onClose={onClose} width={560} title={isPdf ? 'Импорт PDF-выписки' : 'Импорт Excel-файла'}>
      <div className="col gap-16" style={{ padding: 24 }}>
        <div className="field">
          <span className="label">Счёт, к которому относится выписка</span>
          <Select value={account} onChange={setAccount} options={ACCOUNT_OPTIONS} />
        </div>

        {!file ? (
          <div
            className={clsx('op-drop', drag && 'drag')}
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
          >
            <span className={`op-fmt big ${isPdf ? 'pdf' : 'xls'}`}>{isPdf ? <FileText size={28} /> : <FileSpreadsheet size={28} />}</span>
            <p className="medium">Перетащите файл сюда или <span style={{ color: 'var(--primary)' }}>выберите на компьютере</span></p>
            <p className="t-sm muted">{isPdf ? 'PDF до 20 МБ · выписка из интернет-банка' : '.xlsx, .xls до 20 МБ · столбцы: дата, сумма, назначение'}</p>
            <input ref={input} type="file" hidden accept={isPdf ? 'application/pdf,.pdf' : '.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'} onChange={(e) => pick(e.target.files?.[0])} />
          </div>
        ) : (
          <div className="op-file">
            <span className={`op-fmt ${isPdf ? 'pdf' : 'xls'}`}>{isPdf ? <FileText size={18} /> : <FileSpreadsheet size={18} />}</span>
            <div className="grow col gap-6">
              <div className="row between"><b className="t-sm medium">{file.name}</b><span className="t-xs muted">{(file.size / 1024).toFixed(0)} KB</span></div>
              <div className="progress"><span style={{ width: `${progress}%`, background: done ? 'var(--success)' : 'var(--primary)' }} /></div>
              <span className="t-xs muted">{done ? 'Распознавание завершено' : `Распознаём операции… ${progress}%`}</span>
            </div>
            <button className="icon-btn sm" onClick={() => setFile(null)} aria-label="remove"><X size={14} /></button>
          </div>
        )}

        {done && (
          <div className="op-result">
            <p className="row gap-8 medium"><CircleCheck size={18} color="var(--success)" /> Найдено 24 операции</p>
            <div className="row gap-8 wrap">
              <span className="op-type in">12 приход</span>
              <span className="op-type out">9 расход</span>
              <span className="op-type tr">3 перевода</span>
              <span className="badge badge-neutral"><CalendarDays size={12} /> 01.11 – 24.11.2026</span>
            </div>
          </div>
        )}

        <div className="row gap-12">
          <button className="btn btn-secondary grow" onClick={onClose}>Отмена</button>
          <button className="btn btn-primary grow" disabled={!done} onClick={() => { toast('success', '24 операции импортированы'); onClose(); }}>Импортировать операции</button>
        </div>
      </div>
    </Modal>
  );
}
