"use client"
import { useCallback, useEffect, useState } from "react"
import { supabase, CategoryRow } from "@/lib/supabase"

export function useCategories() {
  const [categories, setCategories] = useState<CategoryRow[]>([])

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) return
        setCategories(data as CategoryRow[])
      })
  }, [])

  const addCategory = useCallback(async (name: string, color: string) => {
    const id = `${Date.now()}-${Math.random()}`
    const created_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('categories')
      .insert({ id, name: name.trim(), color, created_at })
      .select()
      .single()
    if (!error && data) {
      const row = data as CategoryRow
      setCategories(prev => [...prev, row])
      return row
    }
    return null
  }, [])

  return { categories, addCategory }
}
