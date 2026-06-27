// hooks/useCalendar.ts
"use client"
import { useCallback, useMemo, useState } from "react"
import {
  CalendarMode,
  CalendarRange,
  addDays,
  addMonths,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "@/lib/calendar"

const MONTH_NAMES_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

export type UseCalendarReturn = {
  // Date de référence courante (le "pivot" de la vue)
  currentDate: Date

  // Plage visible selon le mode — utilise range.start et range.end
  // pour déclencher ton fetch BDD
  range: CalendarRange

  // Navigation
  next: () => void
  prev: () => void
  goTo: (date: Date) => void
  goToToday: () => void

  // Mode courant — peut être changé dynamiquement depuis le parent
  mode: CalendarMode
  setMode: (mode: CalendarMode) => void

  // Infos dérivées pratiques pour les titres de navigation
  // ("Juin 2026", "Semaine 23", "Lundi 23 juin"...)
  label: string
}

// Calcule la plage visible selon le mode et la date courante
function computeRange(mode: CalendarMode, date: Date): CalendarRange {
  switch (mode) {
    case 'day':
      return { start: startOfDay(date), end: endOfDay(date) }
    case 'week-hours':
    case 'week-days':
      return { start: startOfWeek(date), end: endOfWeek(date) }
    case 'month':
      return { start: startOfMonth(date), end: endOfMonth(date) }
    case 'year':
      return { start: startOfYear(date), end: endOfYear(date) }
  }
}

// Avance d'une unité selon le mode
function computeNext(mode: CalendarMode, date: Date): Date {
  switch (mode) {
    case 'day':       return addDays(date, 1)
    case 'week-hours':
    case 'week-days': return addDays(date, 7)
    case 'month':     return addMonths(date, 1)
    case 'year':      return addYears(date, 1)
  }
}

// Recule d'une unité selon le mode
function computePrev(mode: CalendarMode, date: Date): Date {
  switch (mode) {
    case 'day':       return addDays(date, -1)
    case 'week-hours':
    case 'week-days': return addDays(date, -7)
    case 'month':     return addMonths(date, -1)
    case 'year':      return addYears(date, -1)
  }
}

// Génère le label de navigation
function computeLabel(mode: CalendarMode, date: Date): string {
  switch (mode) {
    case 'day':
      return date.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    case 'week-hours':
    case 'week-days': {
      const start = startOfWeek(date)
      const end = addDays(start, 6)
      const sameMonth = start.getMonth() === end.getMonth()
      if (sameMonth) {
        return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      }
      return (
        `${start.getDate()} ${start.toLocaleDateString('en-US', { month: 'short' })} – ` +
        `${end.getDate()} ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
      )
    }
    case 'month':
      return `${MONTH_NAMES_EN[date.getMonth()]} ${date.getFullYear()}`
    case 'year':
      return date.getFullYear().toString()
  }
}

export function useCalendar(
  initialMode: CalendarMode = 'month' as CalendarMode,
  initialDate?: Date
): UseCalendarReturn {
  const [mode, setMode] = useState<CalendarMode>(initialMode)
  const [currentDate, setCurrentDate] = useState<Date>(
    initialDate ?? new Date()
  )

  const range = useMemo(() => computeRange(mode, currentDate), [mode, currentDate])
  const label = useMemo(() => computeLabel(mode, currentDate), [mode, currentDate])

  const next      = useCallback(() => setCurrentDate(d => computeNext(mode, d)), [mode])
  const prev      = useCallback(() => setCurrentDate(d => computePrev(mode, d)), [mode])
  const goTo      = useCallback((date: Date) => setCurrentDate(date), [])
  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  return { currentDate, range, next, prev, goTo, goToToday, mode, setMode, label }
}