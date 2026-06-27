"use client"
import { useCallback, useEffect, useState } from "react"
import { CalendarEvent, CalendarRange } from "@/lib/calendar"
import { supabase, EventRow } from "@/lib/supabase"

function rowToEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    start: new Date(row.start_at),
    end: new Date(row.end_at),
    color: row.color ?? undefined,
  }
}

export function useEvents(range: CalendarRange) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch when the visible range changes (month navigation)
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    supabase
      .from('events')
      .select('*')
      .gte('start_at', range.start.toISOString())
      .lte('start_at', range.end.toISOString())
      .order('start_at')
      .then(({ data, error }) => {
        if (cancelled || error) return
        setEvents((data as EventRow[]).map(rowToEvent))
        setLoading(false)
      })

    return () => { cancelled = true }
  // Compare by time value to avoid re-fetching on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.start.getTime(), range.end.getTime()])

  const addEvent = useCallback(async (event: CalendarEvent) => {
    const { data, error } = await supabase
      .from('events')
      .insert({
        id: event.id,
        title: event.title,
        start_at: event.start.toISOString(),
        end_at: event.end.toISOString(),
        color: event.color ?? null,
      })
      .select()
      .single()

    if (!error && data) {
      setEvents(prev => [...prev, rowToEvent(data as EventRow)])
    }
  }, [])

  const deleteEvent = useCallback(async (id: string) => {
    await supabase.from('events').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }, [])

  return { events, loading, addEvent, deleteEvent }
}
