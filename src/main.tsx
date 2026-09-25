import React, { FormEvent, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import './styles.css'

type FuelType = 'АИ-92' | 'АИ-95' | 'АИ-98' | 'АИ-100' | 'ДТ' | 'Газ'
type Refueling = { id: string; amount: number; liters: number; fuelType: FuelType; station: string; pricePerLiter: number; mileage?: number; fuelLevel?: number; date: string }
type Draft = Omit<Refueling, 'id'>
const DB_KEY = 'fuel-tracker.refuelings.v1'
const fuels: FuelType[] = ['АИ-92', 'АИ-95', 'АИ-98', 'АИ-100', 'ДТ', 'Газ']
const money = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 })
const todayLocal = () => new Date().toISOString().slice(0, 16)
const emptyDraft = (): Draft => ({ amount: 0, liters: 0, fuelType: 'АИ-95', station: '', pricePerLiter: 0, mileage: undefined, fuelLevel: undefined, date: todayLocal() })
const read = (): Refueling[] => { try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]') } catch { return [] } }
const dateTime = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const dayKey = (value: string) => new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(new Date(value))

function consumption(items: Refueling[]) {
  const ordered = [...items].filter(x => x.mileage !== undefined).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (ordered.length < 2) return undefined
  let liters = 0, distance = 0
  for (let i = 1; i < ordered.length; i++) { const delta = ordered[i].mileage! - ordered[i - 1].mileage!; if (delta > 0) { distance += delta; liters += ordered[i].liters } }
  return distance > 0 ? liters / distance * 100 : undefined
}
function App() {
  const [items, setItems] = useState<Refueling[]>(read)
  const [screen, setScreen] = useState<'home'|'history'|'stats'>('home')
  const [editor, setEditor] = useState<{ id?: string; draft: Draft } | null>(null)
  const [toast, setToast] = useState('')
  const [period, setPeriod] = useState<'week'|'month'|'year'|'custom'>('month')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  useEffect(() => localStorage.setItem(DB_KEY, JSON.stringify(items)), [items])
  const sorted = useMemo(() => [...items].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [items])
  const visible = useMemo(() => {
    const now = new Date(); let from: Date
    if (period === 'custom') { const low = start ? new Date(start + 'T00:00:00') : new Date(0); const high = end ? new Date(end + 'T23:59:59') : new Date(8640000000000000); return sorted.filter(x => new Date(x.date) >= low && new Date(x.date) <= high) }
    from = new Date(now); if (period === 'week') from.setDate(now.getDate() - 6); if (period === 'month') from.setDate(1); if (period === 'year') from.setMonth(0, 1); from.setHours(0,0,0,0)
    return sorted.filter(x => new Date(x.date) >= from && new Date(x.date) <= now)
  }, [sorted, period, start, end])
  const currentMonth = useMemo(() => { const now = new Date(); return sorted.filter(x => { const d = new Date(x.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() }) }, [sorted])
  const sums = (list: Refueling[]) => ({ amount: list.reduce((s,x)=>s+x.amount,0), liters: list.reduce((s,x)=>s+x.liters,0), usage: consumption(list) })
  const close = () => setEditor(null)
  const submit = (event: FormEvent) => { event.preventDefault(); if (!editor) return; const { draft, id } = editor; if (draft.amount <= 0 || draft.liters <= 0) { setToast('Введите сумму и количество литров'); return } const record: Refueling = { ...draft, id: id || crypto.randomUUID() }; setItems(all => id ? all.map(x => x.id === id ? record : x) : [...all, record]); close(); setToast(id ? 'Заправка изменена' : 'Заправка добавлена'); setTimeout(() => setToast(''), 2600) }
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => setEditor(old => old ? { ...old, draft: { ...old.draft, [key]: value } } : old)
  const month = sums(currentMonth); const selected = sums(visible)
  return <main>
    <header><div><p className="eyebrow">Личный учёт</p><h1>{screen === 'home' ? 'Топливный учёт' : screen === 'history' ? 'История' : 'Статистика'}</h1></div><button className="icon-button" onClick={() => setScreen('home')} aria-label="Главный экран">⌂</button></header>
    {screen === 'home' && <><section className="summary"><p>Текущий месяц</p><strong>{money.format(month.amount)}</strong><div><span>{number.format(month.liters)} л</span><span>{month.usage ? `${number.format(month.usage)} л/100 км` : 'Расход: —'}</span></div></section><section className="section-title"><h2>Последние заправки</h2><button className="text-button" onClick={()=>setScreen('history')}>Все</button></section>{sorted.length ? <div className="list">{sorted.slice(0,5).map(x=><FuelCard key={x.id} item={x} onClick={()=>setEditor({id:x.id,draft:{...x}})}/>)}</div> : <Empty onAdd={()=>setEditor({draft:emptyDraft()})}/>}</>}
    {screen === 'history' && <><p className="subtext">Всего записей: {sorted.length}</p>{sorted.length ? <div className="list">{sorted.map(x=><FuelCard key={x.id} item={x} onClick={()=>setEditor({id:x.id,draft:{...x}})}/>)}</div> : <Empty onAdd={()=>setEditor({draft:emptyDraft()})}/>}</>}
    {screen === 'stats' && <><div className="filters"><button className={period==='week'?'active':''} onClick={()=>setPeriod('week')}>Неделя</button><button className={period==='month'?'active':''} onClick={()=>setPeriod('month')}>Месяц</button><button className={period==='year'?'active':''} onClick={()=>setPeriod('year')}>Год</button><button className={period==='custom'?'active':''} onClick={()=>setPeriod('custom')}>Период</button></div>{period==='custom' && <div className="dates"><label>С<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>По<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label></div>}{end && start && end < start && <p className="error">Дата окончания не может быть раньше даты начала.</p>}<section className="metric-grid"><Metric label="Расходы" value={money.format(selected.amount)}/><Metric label="Топливо" value={`${number.format(selected.liters)} л`}/><Metric label="Цена за литр" value={selected.liters ? `${number.format(selected.amount / selected.liters)} ₽` : '—'}/><Metric label="Расход" value={selected.usage ? `${number.format(selected.usage)} л/100 км` : '—'}/><Metric label="Заправок" value={String(visible.length)}/></section><section className="chart"><h2>Расходы по дням</h2>{visible.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={Object.values(visible.reduce<Record<string,{day:string; amount:number}>>((a,x)=>{ const day=dayKey(x.date); a[day] ||= {day,amount:0}; a[day].amount += x.amount; return a },{}))}><XAxis dataKey="day"/><YAxis hide/><Tooltip formatter={(v:number)=>money.format(v)}/><Bar dataKey="amount" fill="#0d8a68" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer> : <p className="subtext">Нет заправок за выбранный период.</p>}</section></>}
    <nav><button className={screen==='home'?'selected':''} onClick={()=>setScreen('home')}>Главная</button><button className={screen==='history'?'selected':''} onClick={()=>setScreen('history')}>История</button><button className={screen==='stats'?'selected':''} onClick={()=>setScreen('stats')}>Статистика</button></nav>
    <button className="add" onClick={()=>setEditor({draft:emptyDraft()})}>＋ Добавить заправку</button>
    {editor && <div className="backdrop"><form className="modal" onSubmit={submit}><div className="modal-title"><h2>{editor.id ? 'Изменить заправку' : 'Новая заправка'}</h2><button type="button" className="icon-button" onClick={close}>×</button></div><div className="form-grid"><Field label="Сумма, ₽" value={editor.draft.amount || ''} type="number" onChange={v=>{ const amount=Number(v); const price=editor.draft.liters ? amount/editor.draft.liters : 0; setEditor(o=>o?{...o,draft:{...o.draft,amount,pricePerLiter:price}}:o)}} required/><Field label="Литры" value={editor.draft.liters || ''} type="number" step="0.01" onChange={v=>{ const liters=Number(v); const price=liters ? editor.draft.amount/liters : 0; setEditor(o=>o?{...o,draft:{...o.draft,liters,pricePerLiter:price}}:o)}} required/><label>Тип топлива<select value={editor.draft.fuelType} onChange={e=>change('fuelType',e.target.value as FuelType)}>{fuels.map(x=><option key={x}>{x}</option>)}</select></label><Field label="АЗС" value={editor.draft.station} onChange={v=>change('station',v)}/><Field label="Цена за литр, ₽" value={editor.draft.pricePerLiter ? editor.draft.pricePerLiter.toFixed(2) : ''} type="number" step="0.01" onChange={v=>change('pricePerLiter',Number(v))}/><Field label="Пробег, км" value={editor.draft.mileage ?? ''} type="number" onChange={v=>change('mileage',v===''?undefined:Number(v))}/><Field label="Остаток в баке, %" value={editor.draft.fuelLevel ?? ''} type="number" min="0" max="100" onChange={v=>change('fuelLevel',v===''?undefined:Number(v))}/><label>Дата и время<input type="datetime-local" value={editor.draft.date} onChange={e=>change('date',e.target.value)} required/></label></div>{editor.id && <button type="button" className="delete" onClick={()=>{ if(confirm('Удалить эту заправку?')) { setItems(xs=>xs.filter(x=>x.id!==editor.id)); close(); setToast('Заправка удалена') }}}>Удалить заправку</button>}<div className="actions"><button type="button" className="secondary" onClick={close}>Отмена</button><button type="submit">Сохранить</button></div></form></div>}{toast && <div className="toast">{toast}</div>}
  </main>
}
function Field({label,value,onChange,...props}:{label:string;value:string|number;onChange:(value:string)=>void;type?:string;step?:string;required?:boolean;min?:string;max?:string}) { return <label>{label}<input value={value} onChange={e=>onChange(e.target.value)} {...props}/></label> }
function FuelCard({item,onClick}:{item:Refueling;onClick:()=>void}) { return <button className="fuel-card" onClick={onClick}><span className="fuel-icon">⛽</span><span className="card-main"><b>{item.station || 'Заправка'}</b><small>{dateTime(item.date)} · {item.fuelType}</small></span><span className="card-value"><b>{money.format(item.amount)}</b><small>{number.format(item.liters)} л{item.mileage ? ` · ${number.format(item.mileage)} км` : ''}</small></span></button> }
function Empty({onAdd}:{onAdd:()=>void}) { return <section className="empty"><div>⛽</div><h2>Заправок пока нет</h2><p>Добавьте первую запись, чтобы видеть расходы и расход топлива.</p><button onClick={onAdd}>Добавить заправку</button></section> }
function Metric({label,value}:{label:string;value:string}) { return <div className="metric"><span>{label}</span><strong>{value}</strong></div> }
createRoot(document.getElementById('root')!).render(<App />)
