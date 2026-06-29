// lib/calendar.ts

// ─── Types ────────────────────────────────────────────────────────────────────

export type CalendarMode = 'day' | 'week-hours' | 'week-days' | 'month' | 'year'

// T = type des données custom de ta BDD, passé via le générique
// pour avoir l'autocomplétion sans que le calendrier connaisse
// ta structure de données.
// Ex: CalendarEvent<{ streamerId: string; game: string }>
export type CalendarEvent<T = Record<string, unknown>> = {
  id: string
  title: string
  start: Date
  end: Date
  color?: string
  categoryId?: string
  // Marqueur interne — positionné par splitEventAtMidnight(),
  // jamais fourni manuellement par l'appelant.
  _isContinuation?: boolean
  meta?: T
}

// La plage de dates visible actuellement dans le calendrier.
// Utilisée pour déclencher un fetch BDD quand l'utilisateur navigue.
export type CalendarRange = {
  start: Date
  end: Date
}

// ─── Utilitaires de date ──────────────────────────────────────────────────────

// Début de journée (00:00:00.000)
export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

// Fin de journée (23:59:59.999)
export function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

// Début de semaine (lundi)
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=dim, 1=lun, ...
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

// Fin de semaine (dimanche 23:59:59)
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date)
  const d = new Date(start)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

// Début de mois
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

// Fin de mois
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

// Début d'année
export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)
}

// Fin d'année
export function endOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

// Ajoute N jours à une date
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

// Ajoute N mois à une date
export function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

// Ajoute N années à une date
export function addYears(date: Date, n: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + n)
  return d
}

// Retourne les 7 jours de la semaine contenant date (lundi→dimanche)
export function getWeekDays(date: Date): Date[] {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

// Retourne tous les jours visibles dans une vue mensuelle (inclut les
// jours d'encadrement des semaines partielles en début/fin de mois)
export function getMonthGrid(date: Date): Date[] {
  const firstDay = startOfMonth(date)
  const lastDay = endOfMonth(date)
  const gridStart = startOfWeek(firstDay)
  const gridEnd = endOfWeek(lastDay)

  const days: Date[] = []
  let current = new Date(gridStart)
  while (current <= gridEnd) {
    days.push(new Date(current))
    current = addDays(current, 1)
  }
  return days
}

// Retourne les 12 mois d'une année
export function getYearMonths(date: Date): Date[] {
  return Array.from(
    { length: 12 },
    (_, i) => new Date(date.getFullYear(), i, 1)
  )
}

// Retourne les créneaux horaires d'une journée (par défaut : 1h, 0h→23h)
export function getDayHourSlots(
  date: Date,
  stepMinutes = 60
): Date[] {
  const slots: Date[] = []
  const start = startOfDay(date)
  const totalSlots = (24 * 60) / stepMinutes
  for (let i = 0; i < totalSlots; i++) {
    const d = new Date(start)
    d.setMinutes(i * stepMinutes)
    slots.push(d)
  }
  return slots
}

// Formate une heure en "HH:MM"
export function formatHour(date: Date): string {
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

// Formate un nom de jour abrégé selon la locale (lun. mar. ...)
export function formatWeekday(date: Date, locale = 'fr-FR', short = true): string {
  return date.toLocaleDateString(locale, { weekday: short ? 'short' : 'long' })
}

// Formate un nom de mois
export function formatMonth(date: Date, locale = 'fr-FR', short = false): string {
  return date.toLocaleDateString(locale, { month: short ? 'short' : 'long' })
}

// Vérifie si deux dates sont le même jour calendaire
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Vérifie si une date est aujourd'hui
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

// ─── Split minuit ─────────────────────────────────────────────────────────────

// Si un événement chevauche minuit, le coupe en deux créneaux :
// - Un créneau qui se termine à 23:59:59 le jour de départ
// - Un créneau qui commence à 00:00:00 le jour suivant
// Le second créneau est marqué _isContinuation: true pour que
// CalendarCell puisse l'afficher différemment (ex: "↳ Suite de …").
// Si l'événement ne chevauche pas minuit, retourne [event] tel quel.
export function splitEventAtMidnight<T>(
  event: CalendarEvent<T>
): CalendarEvent<T>[] {
  const startDay = startOfDay(event.start)
  const endDay = startOfDay(event.end)

  // Même jour calendaire → pas de découpe nécessaire
  if (isSameDay(event.start, event.end)) return [event]

  // Découpe récursive pour les événements qui chevauchent
  // plusieurs minuits (ex: event de 3 jours)
  const result: CalendarEvent<T>[] = []
  let current = event.start
  let dayCount = 0
  const maxDays = 365 // garde-fou contre une boucle infinie

  while (!isSameDay(current, event.end) && dayCount < maxDays) {
    const midnight = endOfDay(current)
    result.push({
      ...event,
      id: dayCount === 0 ? event.id : `${event.id}_cont_${dayCount}`,
      start: current,
      end: midnight,
      _isContinuation: dayCount > 0,
    })
    current = startOfDay(addDays(current, 1))
    dayCount++
  }

  // Dernier créneau (le jour de fin)
  result.push({
    ...event,
    id: `${event.id}_cont_${dayCount}`,
    start: current,
    end: event.end,
    _isContinuation: true,
  })

  return result
}

// Filtre et split les événements pour ne garder que ceux qui tombent
// dans une plage donnée — à appeler une fois après le fetch BDD.
export function prepareEvents<T>(
  events: CalendarEvent<T>[],
  range: CalendarRange
): CalendarEvent<T>[] {
  return events
    .flatMap(splitEventAtMidnight)
    .filter(e => e.start <= range.end && e.end >= range.start)
}

// Pour la vue Option B (positionnement pixel) :
// retourne top% et height% d'un événement dans une journée de
// hauteur totale `totalHeight` (en px ou en %)
export function getEventPosition<T = Record<string, unknown>>(
  event: CalendarEvent<T>,
  dayStart: Date,
  totalMinutes = 1440  // 24h × 60
): { topPercent: number; heightPercent: number } {
  const dayStartMs = dayStart.getTime()
  const dayEndMs = dayStartMs + totalMinutes * 60 * 1000

  const startMs = Math.max(event.start.getTime(), dayStartMs)
  const endMs = Math.min(event.end.getTime(), dayEndMs)

  const topPercent = ((startMs - dayStartMs) / (totalMinutes * 60 * 1000)) * 100
  const heightPercent = ((endMs - startMs) / (totalMinutes * 60 * 1000)) * 100

  return { topPercent, heightPercent }
}

// À ajouter dans lib/calendar.ts

// Retourne le numéro de semaine ISO (lundi = début de semaine)
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}