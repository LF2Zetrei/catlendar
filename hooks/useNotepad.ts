// hooks/useNotepad.ts
"use client"
import { useCallback, useMemo, useState } from "react"

export type NotepadTask = {
  id: string
  label: string
  color: string
  completed: boolean
  createdAt: Date
}

export type UseNotepadReturn = {
  tasks: NotepadTask[]
  completedTasks: NotepadTask[]
  addTask: (label: string, color?: string) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  isFlipped: boolean
  flip: () => void
}

export function useNotepad(initialTasks: NotepadTask[] = []): UseNotepadReturn {
  const [allTasks, setAllTasks] = useState<NotepadTask[]>(initialTasks)
  const [isFlipped, setIsFlipped] = useState(false)

  const tasks = useMemo(() => allTasks.filter(t => !t.completed), [allTasks])
  const completedTasks = useMemo(() => allTasks.filter(t => t.completed), [allTasks])

  const addTask = useCallback((label: string, color = '#c9b8e8') => {
    if (!label.trim()) return
    setAllTasks(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      label: label.trim(),
      color,
      completed: false,
      createdAt: new Date(),
    }])
  }, [])

  const toggleTask = useCallback((id: string) => {
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const flip = useCallback(() => setIsFlipped(f => !f), [])

  return { tasks, completedTasks, addTask, toggleTask, deleteTask, isFlipped, flip }
}