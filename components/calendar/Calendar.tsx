// components/ui/Calendar.tsx
"use client"
import { CSSProperties, Fragment, ReactNode, useMemo } from "react"
import { useTheme } from "@/context/ThemeContext"
import { toCSS, toTextCSS, withAlpha, SolidColor } from "@/lib/colors"
import { CalendarCell } from "./CalendarCell"
import {
  CalendarEvent,
  CalendarMode,
  CalendarRange,
  formatHour,
  formatMonth,
  formatWeekday,
  getDayHourSlots,
  getEventPosition,
  getMonthGrid,
  getWeekDays,
  getYearMonths,
  isSameDay,
  isToday,
  prepareEvents,
  startOfDay,
} from "@/lib/calendar"

// ─── Props ────────────────────────────────────────────────────────────────────

export type CalendarProps<T = Record<string, unknown>> = {
  mode: CalendarMode
  currentDate: Date
  range: CalendarRange
  events?: CalendarEvent<T>[]

  // render-prop optionnel : personnalise le contenu d'une case
  // sans avoir à recoder CalendarCell. Reçoit la date de la case
  // et les événements qui lui appartiennent.
  renderCell?: (args: {
    date: Date
    events: CalendarEvent<T>[]
    isToday: boolean
  }) => ReactNode

  // Hauteur en pixels d'une heure dans les vues qui utilisent
  // le positionnement Option B (day, week-hours). 60px = 1px/min.
  hourHeight?: number

  onCellClick?: (date: Date) => void

  className?: string
  style?: CSSProperties
}

// ─── Sous-vue : Jour (Option B — positionnement pixel) ───────────────────────

function DayView<T>({
  currentDate, events, hourHeight = 60, renderCell, onCellClick, theme,
}: {
  currentDate: Date
  events: CalendarEvent<T>[]
  hourHeight: number
  renderCell?: CalendarProps<T>['renderCell']
  onCellClick?: (date: Date) => void
  theme: ReturnType<typeof useTheme>['theme']
}) {
  const slots = getDayHourSlots(currentDate, 60)
  const dayStart = startOfDay(currentDate)
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const totalMinutes = 24 * 60

  return (
    <div style={{ position: 'relative', height: hourHeight * 24, overflowY: 'auto' }}>
      {slots.map((slot, i) => {
        const slotMinutes = i * 60
        const isCurrent = isSameDay(currentDate, now) && Math.abs(slotMinutes - currentMinutes) < 60
        return (
          <CalendarCell
            key={i}
            type="hour"
            label={formatHour(slot)}
            height={hourHeight}
            isCurrent={isCurrent}
            onClick={() => onCellClick?.(slot)}
          >
            {renderCell?.({ date: slot, events: [], isToday: isCurrent })}
          </CalendarCell>
        )
      })}

      {/* Événements positionnés Option B — par-dessus la grille */}
      {events.map(event => {
        const { topPercent, heightPercent } = getEventPosition(event, dayStart, totalMinutes)
        return (
          <div
            key={event.id}
            style={{
              position: 'absolute',
              left: 56,
              right: 4,
              top: `${topPercent}%`,
              height: `${Math.max(heightPercent, 2)}%`,
              background: event.color
                ? `${event.color}CC`
                : withAlpha(theme.primary as SolidColor, 0.8),
              borderLeft: `3px solid ${event.color ?? toCSS(theme.primary)}`,
              borderRadius: 4,
              padding: '2px 6px',
              zIndex: 2,
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
          >
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 500 }}>
              {event._isContinuation ? `↳ ${event.title}` : event.title}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Sous-vue : Semaine/heures (Option B) ────────────────────────────────────

function WeekHoursView<T>({
  currentDate, events, hourHeight = 48, onCellClick, theme,
}: {
  currentDate: Date
  events: CalendarEvent<T>[]
  hourHeight: number
  onCellClick?: (date: Date) => void
  theme: ReturnType<typeof useTheme>['theme']
}) {
  const days = getWeekDays(currentDate)
  const slots = getDayHourSlots(days[0], 60)
  const totalMinutes = 24 * 60
  const now = new Date()

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(7, 1fr)`, overflow: 'auto' }}>
      {/* Header jours */}
      <div />
      {days.map((day, i) => (
        <div
          key={i}
          style={{
            padding: '8px 4px',
            textAlign: 'center',
            fontSize: 11,
            fontWeight: 500,
            borderBottom: `1px solid ${toCSS(theme.border)}`,
            ...toTextCSS(isToday(day) ? theme.primary : theme.textMuted),
          }}
        >
          {formatWeekday(day).toUpperCase()}<br />
          <span style={{ fontSize: 16, fontWeight: isToday(day) ? 700 : 400, ...toTextCSS(isToday(day) ? theme.primary : theme.text) }}>
            {day.getDate()}
          </span>
        </div>
      ))}

      {/* Grille heures × jours */}
      {slots.map((slot, hi) => (
        <>
          {/* Label heure */}
          <div
            key={`h-${hi}`}
            style={{
              height: hourHeight,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              paddingRight: 6,
              paddingTop: 2,
              fontSize: 10,
              boxSizing: 'border-box',
              ...toTextCSS(theme.textMuted),
            }}
          >
            {hi > 0 ? formatHour(slot) : ''}
          </div>

          {/* Cases par jour */}
          {days.map((day, di) => {
            const dayStart = startOfDay(day)
            const slotStart = new Date(dayStart)
            slotStart.setHours(hi, 0, 0, 0)
            const dayEvents = events.filter(e => isSameDay(e.start, day))
            const currentMinutes = now.getHours() * 60 + now.getMinutes()
            const isCurrent = isSameDay(day, now) && Math.abs(hi * 60 - currentMinutes) < 60

            return (
              <div
                key={`d-${di}-h-${hi}`}
                onClick={() => onCellClick?.(slotStart)}
                style={{
                  height: hourHeight,
                  position: 'relative',
                  borderTop: `1px solid ${toCSS(theme.border)}`,
                  borderLeft: `1px solid ${toCSS(theme.border)}`,
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  background: isCurrent ? withAlpha(theme.primary as SolidColor, 0.04) : 'transparent',
                }}
              >
                {/* Événements de ce jour positionnés Option B */}
                {hi === 0 && dayEvents.map(event => {
                  const { topPercent, heightPercent } = getEventPosition(event, dayStart, totalMinutes)
                  return (
                    <div
                      key={event.id}
                      style={{
                        position: 'absolute',
                        top: `${topPercent * (hourHeight * 24 / 100)}px`,
                        height: `${Math.max(heightPercent * (hourHeight * 24 / 100), 14)}px`,
                        left: 2,
                        right: 2,
                        background: event.color
                          ? `${event.color}CC`
                          : withAlpha(theme.primary as SolidColor, 0.8),
                        borderLeft: `3px solid ${event.color ?? toCSS(theme.primary)}`,
                        borderRadius: 3,
                        padding: '1px 4px',
                        zIndex: 2,
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        pointerEvents: 'none',
                      }}
                    >
                      <span style={{ fontSize: 10, color: '#fff', fontWeight: 500 }}>
                        {event._isContinuation ? `↳ ${event.title}` : event.title}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </>
      ))}
    </div>
  )
}

// ─── Sous-vue : Semaine/jours (vue mensuelle avec semaines) ──────────────────

function WeekDaysView<T>({
  currentDate, events, onCellClick, theme,
}: {
  currentDate: Date
  events: CalendarEvent<T>[]
  onCellClick?: (date: Date) => void
  theme: ReturnType<typeof useTheme>['theme']
}) {
  const days = getMonthGrid(currentDate)
  const weekdays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const currentMonth = currentDate.getMonth()

  return (
    <div>
      {/* Header jours de la semaine */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {weekdays.map(d => (
          <div
            key={d}
            style={{
              padding: '6px 4px',
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 500,
              ...toTextCSS(theme.textMuted),
            }}
          >
            {d.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {days.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(e.start, day))
          return (
            <CalendarCell
              key={i}
              type="day"
              label={day.getDate().toString()}
              isToday={isToday(day)}
              isOutOfRange={day.getMonth() !== currentMonth}
              events={dayEvents}
              onClick={() => onCellClick?.(day)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ─── Sous-vue : Année ────────────────────────────────────────────────────────

function YearView<T>({
  currentDate, events, onCellClick, theme,
}: {
  currentDate: Date
  events: CalendarEvent<T>[]
  onCellClick?: (date: Date) => void
  theme: ReturnType<typeof useTheme>['theme']
}) {
  const months = getYearMonths(currentDate)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {months.map((month, i) => {
        const monthEvents = events.filter(
          e => e.start.getMonth() === i && e.start.getFullYear() === currentDate.getFullYear()
        )
        const now = new Date()
        const isCurrent = month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear()

        return (
          <CalendarCell
            key={i}
            type="month"
            label={formatMonth(month)}
            isToday={isCurrent}
            events={monthEvents}
            onClick={() => onCellClick?.(month)}
          />
        )
      })}
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function Calendar<T = Record<string, unknown>>({
  mode,
  currentDate,
  range,
  events = [],
  renderCell,
  hourHeight = 60,
  onCellClick,
  className,
  style,
}: CalendarProps<T>) {
  const { theme } = useTheme()

  // Prépare les événements : split minuit + filtre sur la plage visible
  const preparedEvents = useMemo(
    () => prepareEvents(events, range),
    [events, range]
  )

  return (
    <div
      className={className}
      style={{
        background: toCSS(theme.surface),
        borderRadius: 12,
        overflow: 'hidden',
        ...style,
      }}
    >
      {mode === 'day' && (
        <DayView
          currentDate={currentDate}
          events={preparedEvents}
          hourHeight={hourHeight}
          renderCell={renderCell}
          onCellClick={onCellClick}
          theme={theme}
        />
      )}

      {mode === 'week-hours' && (
        <WeekHoursView
          currentDate={currentDate}
          events={preparedEvents}
          hourHeight={hourHeight}
          onCellClick={onCellClick}
          theme={theme}
        />
      )}

      {mode === 'week-days' && (
        <WeekDaysView
          currentDate={currentDate}
          events={preparedEvents}
          onCellClick={onCellClick}
          theme={theme}
        />
      )}

      {mode === 'year' && (
        <YearView
          currentDate={currentDate}
          events={preparedEvents}
          onCellClick={onCellClick}
          theme={theme}
        />
      )}
    </div>
  )
}