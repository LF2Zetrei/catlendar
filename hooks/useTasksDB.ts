"use client"
import { useCallback, useEffect, useMemo, useState } from "react"
import { NotepadTask } from "@/hooks/useNotepad"
import { supabase, TaskRow } from "@/lib/supabase"

function rowToTask(row: TaskRow): NotepadTask {
  const raw = row.color || '#c9b8e8'
  const colors = raw.split(',').map(c => c.trim()).filter(Boolean)
  return {
    id: row.id,
    label: row.label,
    colors: colors.length > 0 ? colors : ['#c9b8e8'],
    completed: row.completed,
    createdAt: new Date(row.created_at),
  }
}

export function useTasksDB() {
  const [allTasks, setAllTasks] = useState<NotepadTask[]>([])
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) return
        setAllTasks((data as TaskRow[]).map(rowToTask))
      })
  }, [])

  const tasks          = useMemo(() => allTasks.filter(t => !t.completed), [allTasks])
  const completedTasks = useMemo(() => allTasks.filter(t => t.completed),  [allTasks])

  const addTask = useCallback(async (label: string, colors = ['#c9b8e8']) => {
    if (!label.trim()) return
    const id = `${Date.now()}-${Math.random()}`
    const created_at = new Date().toISOString()
    const color = colors.join(',')

    const { data, error } = await supabase
      .from('tasks')
      .insert({ id, label: label.trim(), color, completed: false, created_at })
      .select()
      .single()

    if (!error && data) {
      setAllTasks(prev => [...prev, rowToTask(data as TaskRow)])
    }
  }, [])

  const updateTask = useCallback(async (id: string, label: string) => {
    if (!label.trim()) return
    await supabase.from('tasks').update({ label: label.trim() }).eq('id', id)
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, label: label.trim() } : t))
  }, [])

  const toggleTask = useCallback(async (id: string) => {
    const task = allTasks.find(t => t.id === id)
    if (!task) return
    const completed = !task.completed

    await supabase.from('tasks').update({ completed }).eq('id', id)
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
  }, [allTasks])

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setAllTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const flip = useCallback(() => setIsFlipped(f => !f), [])

  return { tasks, completedTasks, addTask, updateTask, toggleTask, deleteTask, isFlipped, flip }
}
