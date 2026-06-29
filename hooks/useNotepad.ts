// hooks/useNotepad.ts
"use client"
import { useCallback, useMemo, useState } from "react"

export type NotepadTask = {
  id: string
  label: string
  colors: string[]
  completed: boolean
  createdAt: Date
}

export type UseNotepadReturn = {
  tasks: NotepadTask[]
  completedTasks: NotepadTask[]
  addTask: (label: string, colors?: string[]) => void
  updateTask: (id: string, label: string) => void
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

  const addTask = useCallback((label: string, colors = ['#c9b8e8']) => {
    if (!label.trim()) return
    setAllTasks(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      label: label.trim(),
      colors,
      completed: false,
      createdAt: new Date(),
    }])
  }, [])

  const updateTask = useCallback((id: string, label: string) => {
    if (!label.trim()) return
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, label: label.trim() } : t))
  }, [])

  const toggleTask = useCallback((id: string) => {
    setAllTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
  }, [])

  const deleteTask = useCallback((id: string) => {
    setAllTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const flip = useCallback(() => setIsFlipped(f => !f), [])

  return { tasks, completedTasks, addTask, updateTask, toggleTask, deleteTask, isFlipped, flip }
}
