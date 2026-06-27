"use client"

import { createContext, useContext, useEffect, useSyncExternalStore, ReactNode } from "react"
import { Theme, ThemeName } from "@/types/themes"
import { themes } from "@/shared/themes"

type ThemeContextValue = {
  theme: Theme
  themeName: ThemeName
  setThemeName: (name: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// useSyncExternalStore: correct API for subscribing to an external store (localStorage).
// getServerSnapshot always returns 'light' → SSR and first client render match → no hydration error.
// After hydration, getSnapshot reads the real saved value.

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb)
  return () => window.removeEventListener('storage', cb)
}

function getSnapshot(): ThemeName {
  return 'normal'
}

function getServerSnapshot(): ThemeName {
  return 'normal'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const savedTheme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Local override: lets the toggle button change the theme without waiting for a storage event.
  // We write to localStorage and dispatch a 'storage' event to keep useSyncExternalStore in sync.
  function setThemeName(name: ThemeName) {
    localStorage.setItem('catbut-theme', name)
    // Dispatch synthetic storage event so the subscriber in the same tab re-reads
    window.dispatchEvent(new StorageEvent('storage', { key: 'catbut-theme', newValue: name }))
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [savedTheme])

  const theme = themes[savedTheme]

  return (
    <ThemeContext.Provider value={{ theme, themeName: savedTheme, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
