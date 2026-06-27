// app/dashboard/page.tsx
"use client"
import { CSSProperties, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Nunito, Baloo_2 } from "next/font/google"
import { useNotepad } from "@/hooks/useNotepad"
import { useTasksDB } from "@/hooks/useTasksDB"
import { useEvents } from "@/hooks/useEvents"
import { useCalendar } from "@/hooks/useCalendar"
import { DecoBorder } from "@/components/decoration/DecorBorder"
import { hex } from "@/lib/colors"
import {
  CalendarEvent,
  formatMonth,
  getMonthGrid,
  isSameDay,
  isToday,
  prepareEvents,
  startOfDay,
} from "@/lib/calendar"

// ─── Polices ──────────────────────────────────────────────────────────────────

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-nunito',
})

const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-baloo',
})

// ─── Palette ──────────────────────────────────────────────────────────────────

const PAGE_BG    = '#f8f2ed'
const DECO_COLOR = '#dbcde9'
const BORDER     = '#c5b0d9'
const TEXT       = '#3d2f4a'
const MUTED      = '#9b8aaa'
const PURPLE     = '#9B6DFF'
const WHITE      = '#ffffff'

// Marges de la page — doivent correspondre au padding du wrapper
const PAGE_PAD_V = 100 // haut + bas (chaque côté)
const PAGE_PAD_H = 75  // gauche + droite (chaque côté)
const COL_GAP    = 150

// Base pastel color per month (Jan → Dec)
const MONTH_COLORS = [
  '#fdd5d5', // Jan  — winter rose
  '#fdd5e8', // Feb  — soft pink
  '#d5f0d5', // Mar  — spring green
  '#e2f5d5', // Apr  — light green
  '#e8d5fd', // May  — lavender
  '#fde2cc', // Jun  — peach
  '#fdf5cc', // Jul  — sunshine yellow
  '#fde8cc', // Aug  — golden
  '#fddec7', // Sep  — amber
  '#fdd5c7', // Oct  — autumn orange
  '#ead5cc', // Nov  — warm brown
  '#cce5fd', // Dec  — winter blue
]

// ─── Utilitaires ──────────────────────────────────────────────────────────────

function lightenHex(color: string, amount: number): string {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16)
  const b = parseInt(color.slice(5, 7), 16)
  const lr = Math.round(r + (255 - r) * amount)
  const lg = Math.round(g + (255 - g) * amount)
  const lb = Math.round(b + (255 - b) * amount)
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`
}

function cellColor(date: Date): string {
  const base = MONTH_COLORS[date.getMonth()]
  return date.getDate() % 2 === 0 ? lightenHex(base, 0.45) : base
}

function fmtTime(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes()
  if (h === 0 && m === 0) return ''
  return `${h}:${m.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - y.getTime()) / 86400000) + 1) / 7)
}

// ─── Vue mensuelle ────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function MonthWeekView({ currentDate, events, onCellClick, onCellDoubleClick }: {
  currentDate: Date
  events: CalendarEvent[]
  onCellClick: (d: Date) => void
  onCellDoubleClick: (d: Date) => void
}) {
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCellClick = (day: Date) => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onCellDoubleClick(day)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onCellClick(day)
      }, 220)
    }
  }

  const days = getMonthGrid(currentDate)
  const currentMonth = currentDate.getMonth()
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%' }}>
      {/* Numéros de semaine dans la zone colorée */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        paddingTop: 30, width: 26, flexShrink: 0,
      }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 700, color: "#fff",
            fontFamily: 'var(--font-baloo)',
          }}>
            S{getWeekNumber(week[0])}
          </div>
        ))}
      </div>

      {/* Grille blanche */}
      <div style={{
        flex: 1, background: 'transparent', borderRadius: 10,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          borderBottom: `1px solid ${BORDER}33`, flexShrink: 0,
        }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{
              padding: '7px 4px', textAlign: 'center',
              fontSize: 24, fontWeight: 700, color: '#fff',
              fontFamily: 'var(--font-baloo)',
              textTransform: 'uppercase', letterSpacing: 0.5,
            }}>{d}</div>
          ))}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{
              flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
              borderBottom: wi < weeks.length - 1 ? `1px solid ${BORDER}33` : 'none',
            }}>
              {week.map((day, di) => {
                const isOut = day.getMonth() !== currentMonth
                const dayEvents = events.filter(e => isSameDay(e.start, day))
                return (
                  <div key={di} onClick={() => handleCellClick(day)} style={{
                    background: isOut ? '#faf7f4' : cellColor(day),
                    borderLeft: di > 0 ? `1px solid ${BORDER}33` : 'none',
                    padding: '6px 5px', boxSizing: 'border-box',
                    cursor: 'pointer', overflow: 'hidden', transition: 'filter 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.97)')}
                    onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                  >
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%',
                      fontSize: 17, fontWeight: isToday(day) ? 700 : 500,
                      fontFamily: 'var(--font-baloo)',
                      background: isToday(day) ? PURPLE : 'transparent',
                      color: isToday(day) ? WHITE : isOut ? MUTED : TEXT,
                      marginBottom: 2,
                    }}>{day.getDate()}</div>
                    {dayEvents.map(ev => (
                      <div key={ev.id} style={{
                        fontSize: 15, fontWeight: 600, color: '#000',
                        background: ev.color ? `${ev.color}55` : '#c9b8e855',
                        borderLeft: `3px solid ${ev.color ?? PURPLE}`,
                        borderRadius: 3, padding: '1px 4px', marginBottom: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-nunito)',
                      }}>
                        {ev._isContinuation ? `↳ ${ev.title}` : (
                          <>
                            {fmtTime(ev.start) && (
                              <span style={{ opacity: 0.65, marginRight: 4, fontWeight: 500 }}>
                                {fmtTime(ev.start)}–{fmtTime(ev.end)}
                              </span>
                            )}
                            {ev.title}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Modal wrapper with DecoBorder ───────────────────────────────────────────

const PASTEL_SWATCHES = ['#c9b8e8','#f9c6d0','#b8e0d4','#fde8c8','#b8d4f9','#f9e0b8']

function DecoModal({ isOpen, onClose, title, children, footer }: {
  isOpen: boolean; onClose: () => void
  title: string; children: React.ReactNode; footer: React.ReactNode
}) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [isOpen, onClose])

  if (!isOpen || typeof window === 'undefined') return null

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(61,47,74,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <div onClick={e => e.stopPropagation()}>
        <DecoBorder
          filled color={hex(DECO_COLOR)} strokeWidth={0}
          bumpRadius={12} bumpsPerSide={10} mode="random" seed={7} padding={10}
          style={{ width: 420, maxWidth: '100%', boxSizing: 'border-box' }}
        >
          <div style={{
            background: WHITE, borderRadius: 10, overflow: 'hidden',
            display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-nunito)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: `1px solid ${BORDER}33`, flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: PURPLE, fontFamily: 'var(--font-baloo)' }}>
                {title}
              </span>
              <button type="button" onClick={onClose} style={{
                width: 26, height: 26, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer', color: MUTED,
                fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
            <div style={{ padding: '16px 18px', overflowY: 'auto' }}>{children}</div>
            <div style={{
              display: 'flex', justifyContent: 'flex-end', gap: 8,
              padding: '12px 18px', borderTop: `1px solid ${BORDER}33`, flexShrink: 0,
            }}>{footer}</div>
          </div>
        </DecoBorder>
      </div>
    </div>,
    document.body
  )
}

// Inline buttons for modals
function ModalBtn({ onClick, primary, children }: {
  onClick: () => void; primary?: boolean; children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '7px 18px', borderRadius: 8, border: `1.5px solid ${primary ? PURPLE : BORDER}`,
      background: primary ? PURPLE : 'transparent', color: primary ? WHITE : MUTED,
      cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-nunito)',
      transition: 'opacity 0.15s',
    }}>{children}</button>
  )
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function EventModal({ isOpen, onClose, selectedDate, onAdd }: {
  isOpen: boolean; onClose: () => void
  selectedDate: Date | null; onAdd: (ev: CalendarEvent) => void
}) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState('#c9b8e8')
  const [showTime, setShowTime] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')

  const inp: CSSProperties = {
    width: '100%', padding: '8px 12px', border: `1.5px solid ${BORDER}`,
    borderRadius: 10, background: PAGE_BG, fontSize: 13, boxSizing: 'border-box',
    outline: 'none', color: TEXT, fontFamily: 'var(--font-nunito)',
  }
  const lbl: CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
    color: MUTED, fontFamily: 'var(--font-baloo)',
  }

  const submit = () => {
    if (!title.trim() || !selectedDate) return
    const base = startOfDay(selectedDate)
    const t = (s: string) => { const [h,m] = s.split(':').map(Number); const d = new Date(base); d.setHours(h,m,0,0); return d }
    onAdd({ id: `${Date.now()}`, title: title.trim(),
      start: showTime ? t(startTime) : base,
      end: showTime ? t(endTime) : new Date(base.getTime() + 3600000), color })
    setTitle(''); setShowTime(false); setStartTime('09:00'); setEndTime('10:00')
    onClose()
  }

  return (
    <DecoModal isOpen={isOpen} onClose={onClose} title="✨ New event"
      footer={<><ModalBtn onClick={onClose}>Cancel</ModalBtn><ModalBtn primary onClick={submit}>Add</ModalBtn></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {selectedDate && <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
          📅 {selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>}
        <div><label style={lbl}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Event name" autoFocus style={inp} />
        </div>
        <div><label style={lbl}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PASTEL_SWATCHES.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, padding: 0,
                border: color === c ? `3px solid ${TEXT}` : `3px solid transparent`, cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
        <div>
          <button type="button" onClick={() => setShowTime(v => !v)} style={{
            display: 'flex', alignItems: 'center', gap: 8, border: 'none',
            background: 'transparent', cursor: 'pointer', padding: 0,
            fontSize: 12, fontWeight: 600, color: showTime ? PURPLE : MUTED,
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${showTime ? PURPLE : BORDER}`,
              background: showTime ? PURPLE : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {showTime && <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>}
            </span>
            Add a specific time
          </button>
          {showTime && <div style={{ display: 'flex', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}><label style={lbl}>Start</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} /></div>
            <span style={{ paddingTop: 22, color: MUTED }}>→</span>
            <div style={{ flex: 1 }}><label style={lbl}>End</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} /></div>
          </div>}
        </div>
      </div>
    </DecoModal>
  )
}

function NoteModal({ isOpen, onClose, onAdd }: {
  isOpen: boolean; onClose: () => void; onAdd: (label: string, color: string) => void
}) {
  const [value, setValue] = useState('')
  const [color, setColor] = useState('#c9b8e8')
  const lbl: CSSProperties = {
    fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    textTransform: 'uppercase', marginBottom: 6, display: 'block',
    color: MUTED, fontFamily: 'var(--font-baloo)',
  }
  const submit = () => {
    if (value.trim()) { onAdd(value.trim(), color); setValue(''); setColor('#c9b8e8'); onClose() }
  }
  return (
    <DecoModal isOpen={isOpen} onClose={onClose} title="📝 New task"
      footer={<><ModalBtn onClick={onClose}>Cancel</ModalBtn><ModalBtn primary onClick={submit}>Add</ModalBtn></>}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={lbl}>Task</label>
          <input value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Task description…" autoFocus
            style={{
              width: '100%', padding: '8px 12px', border: `1.5px solid ${BORDER}`,
              borderRadius: 10, background: PAGE_BG, fontSize: 13, boxSizing: 'border-box',
              outline: 'none', color: TEXT, fontFamily: 'var(--font-nunito)',
            }} />
        </div>
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PASTEL_SWATCHES.map(c => (
              <button key={c} type="button" onClick={() => setColor(c)} style={{
                width: 28, height: 28, borderRadius: '50%', background: c, padding: 0,
                border: color === c ? `3px solid ${TEXT}` : `3px solid transparent`, cursor: 'pointer',
              }} />
            ))}
          </div>
        </div>
      </div>
    </DecoModal>
  )
}

// ─── Day detail modal ─────────────────────────────────────────────────────────

function DayDetailModal({ isOpen, onClose, date, events, onAddEvent }: {
  isOpen: boolean; onClose: () => void
  date: Date | null; events: CalendarEvent[]; onAddEvent: () => void
}) {
  if (!date) return null
  const dayEvents = events.filter(e => isSameDay(e.start, date))
  const dateLabel = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <DecoModal
      isOpen={isOpen} onClose={onClose}
      title={`📅 ${date.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}`}
      footer={
        <ModalBtn primary onClick={() => { onClose(); onAddEvent() }}>
          + Add event
        </ModalBtn>
      }
    >
      <p style={{ margin: '0 0 14px', fontSize: 12, color: MUTED }}>{dateLabel}</p>
      {dayEvents.length === 0 ? (
        <p style={{ fontSize: 14, color: MUTED, fontStyle: 'italic', margin: 0 }}>
          No events for this day.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dayEvents.map(ev => {
            const start = fmtTime(ev.start)
            const end   = fmtTime(ev.end)
            return (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8,
                background: ev.color ? `${ev.color}33` : `${DECO_COLOR}55`,
                borderLeft: `4px solid ${ev.color ?? PURPLE}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{ev.title}</div>
                  {start && (
                    <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                      {start}{end ? ` – ${end}` : ''}
                    </div>
                  )}
                </div>
                <span style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  background: ev.color ?? PURPLE,
                }} />
              </div>
            )
          })}
        </div>
      )}
    </DecoModal>
  )
}

// ─── Bloc-notes ───────────────────────────────────────────────────────────────

function FolderNotepad({ notepad }: {
  notepad: ReturnType<typeof useNotepad>
}) {
  const [tab, setTab] = useState<'tasks'|'done'>('tasks')
  const [open, setOpen] = useState(false)
  const items = tab === 'tasks' ? notepad.tasks : notepad.completedTasks

  return (
    <>
      <NoteModal isOpen={open} onClose={() => setOpen(false)} onAdd={notepad.addTask} />
      <div style={{
        display: 'flex', flexDirection: 'column',
        height: '100%',
        background: WHITE, borderRadius: 10, overflow: 'hidden',
        fontFamily: 'var(--font-nunito)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: 4,
          padding: '8px 10px 0', background: `transparent`,
          borderBottom: `1px solid ${BORDER}33`, flexShrink: 0,
        }}>
          {([
            { key: 'tasks', label: '📋 Tasks', count: notepad.tasks.length },
            { key: 'done',  label: '✓ Completed', count: notepad.completedTasks.length },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '5px 12px',
              border: `1.5px solid ${BORDER}55`,
              borderBottom: tab === t.key ? `1.5px solid ${WHITE}` : `1.5px solid ${BORDER}55`,
              borderRadius: '8px 8px 0 0',
              background: tab === t.key ? WHITE : 'transparent',
              cursor: 'pointer',
              fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? PURPLE : MUTED,
              fontFamily: 'var(--font-baloo)',
              transition: 'all 0.15s',
              marginBottom: tab === t.key ? -1.5 : 0,
              fontSize: 17,
              whiteSpace: 'nowrap',
            }}>
              {t.label}
              <span style={{
                marginLeft: 5, borderRadius: 10, padding: '1px 6px',
                fontSize: 17, fontWeight: 700,
                background: tab === t.key ? '#f3edfb' : `${BORDER}55`,
                color: tab === t.key ? PURPLE : MUTED,
              }}>{t.count}</span>
            </button>
          ))}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingBottom: 5 }}>
            <button type="button" onClick={() => setOpen(true)} style={{
              width: 24, height: 24, borderRadius: 7,
              border: `1.5px solid ${BORDER}55`, background: WHITE,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: PURPLE, fontSize: 17, fontWeight: 300,
            }}>+</button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 17, fontStyle: 'italic', margin: '6px 0', color: MUTED }}>
              {tab === 'tasks' ? 'No task yet — click on + to add a new task' : 'No task completed'}
            </p>
          ) : items.map(task => (
            <div key={task.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 0', borderBottom: `1px solid ${BORDER}44`,
            }}>
              {/* Color dot */}
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: task.completed ? MUTED : (task.color ?? PURPLE),
                opacity: task.completed ? 0.4 : 1,
                transition: 'all 0.15s',
              }} />
              {/* Checkbox */}
              <button type="button" onClick={() => notepad.toggleTask(task.id)} style={{
                width: 16, height: 16, borderRadius: 4,
                border: `1.5px solid ${task.completed ? (task.color ?? PURPLE) : BORDER}`,
                background: task.completed ? (task.color ?? PURPLE) : 'transparent',
                flexShrink: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, transition: 'all 0.15s',
              }}>
                {task.completed && <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>}
              </button>
              <span style={{
                flex: 1, fontSize: 20, lineHeight: 1.4,
                textDecoration: task.completed ? 'line-through' : 'none',
                color: task.completed ? MUTED : TEXT,
              }}>{task.label}</span>
              <button type="button" onClick={() => notepad.deleteTask(task.id)} style={{
                opacity: 0.2, border: 'none', background: 'transparent',
                cursor: 'pointer', fontSize: 16, padding: '0 2px', color: TEXT,
              }}>×</button>
            </div>
          ))}
          {tab === 'tasks' && Array.from({ length: Math.max(0, 12 - items.length) }).map((_, i) => (
            <div key={i} style={{ height: 30, borderBottom: `1px solid ${BORDER}44` }} />
          ))}
        </div>
      </div>
    </>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const notepad = useTasksDB()
  const { currentDate, range, next, prev, goToToday } = useCalendar('month')
  const { events, addEvent } = useEvents(range)
  const [eventOpen, setEventOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const preparedEvents = prepareEvents(events, range)
  const monthLabel = formatMonth(currentDate, 'en-US')
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)

  // Hauteur des deux colonnes = 100vh - marges haut - marges bas
  const colHeight = `calc(100vh - ${PAGE_PAD_V * 2}px)`

  // Padding interne du DecoBorder (festons + espace)
  const DECO_BUMP   = 14
  const DECO_PAD    = 14
  const DECO_TOTAL  = DECO_BUMP + DECO_PAD

  // Hauteur du contenu intérieur = hauteur colonne - padding haut - padding bas du DecoBorder
  const innerHeight = `calc(${colHeight} - ${DECO_TOTAL * 2}px)`

  const navBtn: CSSProperties = {
    height: 28, borderRadius: 100,
    border: `1.5px solid #fff`,
    background: '#fff', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: "BLACK", transition: 'background 0.15s',
  }

  return (
    <div
      className={`${nunito.variable} ${baloo.variable}`}
      style={{
        height: '100vh',
        overflow: 'hidden',
        background: PAGE_BG,
        padding: `${PAGE_PAD_V}px ${PAGE_PAD_H}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'flex-start',
        gap: COL_GAP,
        fontFamily: 'var(--font-nunito)',
      }}
    >
      <DayDetailModal
        isOpen={detailOpen} onClose={() => setDetailOpen(false)}
        date={selectedDate} events={preparedEvents}
        onAddEvent={() => setEventOpen(true)}
      />
      <EventModal isOpen={eventOpen} onClose={() => setEventOpen(false)}
        selectedDate={selectedDate} onAdd={addEvent} />

      {/* ── Colonne gauche : calendrier ── */}
      <DecoBorder
        filled
        color={hex(DECO_COLOR)}
        strokeWidth={0}
        bumpRadius={DECO_BUMP}
        bumpsPerSide={15}
        padding={DECO_PAD}
        style={{
          // Hauteur explicite — la seule façon fiable de dimensionner
          // DecoBorder qui a un SVG en position:absolute (ne contribue
          // pas au layout naturel).
          height: colHeight,
          width: '67%',
          boxSizing: 'border-box',
          overflow: 'visible',
          flexShrink: 0,
        }}
      >
        {/* Tout le contenu du calendrier dans un flex-column de hauteur fixe */}
        <div style={{
          height: innerHeight,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          {/* Titre + bouton + */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
          }}>
            <h2 style={{
              margin: 0, fontSize: 40, fontWeight: 700,
              color: WHITE, fontFamily: 'var(--font-baloo)',
            }}>
              {monthTitle} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => { setSelectedDate(new Date()); setEventOpen(true) }}
              title="Ajouter un événement"
              style={{
                ...navBtn,
                width: 40, height: 40,
                borderRadius: 9, fontSize: 20, fontWeight: 300,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >+</button>
          </div>

          {/* Grille calendrier — prend tout l'espace disponible */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <MonthWeekView
              currentDate={currentDate}
              events={preparedEvents}
              onCellClick={date => { setSelectedDate(date); setDetailOpen(true) }}
              onCellDoubleClick={date => { setSelectedDate(date); setEventOpen(true) }}
            />
          </div>

          {/* Navigation bas */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, flexShrink: 0,
          }}>
            <button onClick={prev} style={{ ...navBtn, width: 30, fontSize: 26 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >‹</button>
            <button onClick={goToToday} style={{
              ...navBtn, padding: '0 14px', fontSize: 26,
              fontFamily: 'var(--font-baloo)',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >Today</button>
            <button onClick={next} style={{ ...navBtn, width: 30, fontSize: 26 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
            >›</button>
          </div>
        </div>
      </DecoBorder>

      {/* ── Colonne droite : bloc-notes ── */}
      <DecoBorder
        filled
        color={hex(DECO_COLOR)}
        strokeWidth={0}
        bumpRadius={DECO_BUMP}
        bumpsPerSide={11}
        padding={DECO_PAD}
        style={{
          height: colHeight,
          flex: 1,
          boxSizing: 'border-box',
          overflow: 'visible',
        }}
      >
        <div style={{ height: innerHeight }}>
          <FolderNotepad notepad={notepad} />
        </div>
      </DecoBorder>
    </div>
  )
}