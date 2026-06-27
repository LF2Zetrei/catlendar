// components/ui/CalendarNav.tsx
"use client"
import { CSSProperties } from "react"
import { useTheme } from "@/context/ThemeContext"
import { toCSS, toTextCSS } from "@/lib/colors"
import { CalendarMode } from "@/lib/calendar"
import { Button } from "@/components/buttons/Button"

const MODE_LABELS: Record<CalendarMode, string> = {
  'day':        'Day',
  'week-hours': 'Week / hours',
  'week-days':  'Week / days',
  'month':      'Month',
  'year':       'Year',
}

export type CalendarNavProps = {
  label: string
  mode: CalendarMode
  availableModes?: CalendarMode[]
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onModeChange?: (mode: CalendarMode) => void
  className?: string
  style?: CSSProperties
}

// Barre de navigation autonome — séparée du Calendar pour que le
// parent puisse la positionner où il veut (au-dessus du calendrier,
// dans un header de page, dans une sidebar...) sans être forcé d'un
// layout particulier.
export const CalendarNav = ({
  label,
  mode,
  availableModes = ['day', 'week-hours', 'week-days', 'year'],
  onPrev,
  onNext,
  onToday,
  onModeChange,
  className,
  style,
}: CalendarNavProps) => {
  const { theme } = useTheme()

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {/* Navigation prev/next/today */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Button variant="ghost" size="sm" icon="ChevronLeft" onClick={onPrev} aria-label="Précédent" />
        <Button variant="outline" size="sm" onClick={onToday}>Aujourd'hui</Button>
        <Button variant="ghost" size="sm" icon="ChevronRight" onClick={onNext} aria-label="Suivant" />
      </div>

      {/* Label de la période courante */}
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          flex: 1,
          textAlign: 'center',
          ...toTextCSS(theme.text),
        }}
      >
        {label}
      </span>

      {/* Sélecteur de mode */}
      {onModeChange && (
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: toCSS(theme.surfaceAlt),
            borderRadius: 8,
            padding: 3,
          }}
        >
          {availableModes.map(m => (
            <button
              key={m}
              onClick={() => onModeChange(m)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                border: 'none',
                fontSize: 11,
                fontWeight: 500,
                cursor: 'pointer',
                background: mode === m ? toCSS(theme.surface) : 'transparent',
                ...toTextCSS(mode === m ? theme.primary : theme.textMuted),
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.15)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}