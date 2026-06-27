// components/ui/CalendarCell.tsx
"use client"
import { CSSProperties, ReactNode } from "react"
import { useTheme } from "@/context/ThemeContext"
import { toCSS, toTextCSS, withAlpha, SolidColor } from "@/lib/colors"
import { CalendarEvent, formatHour } from "@/lib/calendar"

export type CalendarCellType = 'hour' | 'day' | 'month' | 'year'

export type CalendarCellProps = {
  type: CalendarCellType

  // Le label affiché dans la case ("14:00", "23", "Juin", "2026"...)
  label?: string

  // États visuels
  isToday?: boolean
  isSelected?: boolean
  isOutOfRange?: boolean  // jour d'un autre mois dans vue mensuelle
  isCurrent?: boolean     // heure courante dans vue jour/semaine

  // Événements à afficher dans cette case (déjà filtrés et splittés)
  events?: CalendarEvent[]

  // Hauteur en pixels pour la case heure (vue Option B)
  // Si absent, la case prend sa hauteur naturelle (vues mois/année)
  height?: number

  onClick?: () => void
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

// CalendarCell change de forme selon son type :
// - hour → case avec barre colorée proportionnelle à l'événement
//          (vue Option B : position pixel dans la journée)
// - day  → case avec point indicateur d'événement
// - month→ case plus grande avec nom du mois
// - year → case avec le numéro de l'année
//
// Exportée séparément pour que le parent puisse la réutiliser dans
// d'autres contextes (ex: mini-calendrier de sélection de date dans
// un formulaire de création d'événement CatBut).
export const CalendarCell = ({
  type,
  label,
  isToday = false,
  isSelected = false,
  isOutOfRange = false,
  isCurrent = false,
  events = [],
  height,
  onClick,
  className,
  style,
  children,
}: CalendarCellProps) => {
  const { theme } = useTheme()

  const base: CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none',
    transition: 'background 0.1s ease',
    ...(height !== undefined ? { height } : {}),
  }

  const stateBackground = isSelected
    ? withAlpha(theme.primary as SolidColor, 0.18)
    : isToday
    ? withAlpha(theme.primary as SolidColor, 0.08)
    : 'transparent'

  // ── Vue heure (Option B) ──────────────────────────────────────────
  if (type === 'hour') {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          ...base,
          background: stateBackground,
          borderTop: `1px solid ${toCSS(theme.border)}`,
          ...style,
        }}
      >
        {/* Label de l'heure — affiché à gauche */}
        {label && (
          <span
            style={{
              position: 'absolute',
              top: -10,
              left: 6,
              fontSize: 10,
              ...toTextCSS(theme.textMuted),
              pointerEvents: 'none',
            }}
          >
            {label}
          </span>
        )}

        {/* Ligne "heure courante" */}
        {isCurrent && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: toCSS(theme.primary),
              zIndex: 3,
            }}
          />
        )}

        {/* Événements positionnés via Option B (top% + height%) —
            leur position est calculée par getEventPosition() dans le
            parent et passée via le champ `_top`/`_height` du style,
            ou via children si le parent veut les positionner lui-même */}
        {children}
      </div>
    )
  }

  // ── Vue jour ─────────────────────────────────────────────────────
  if (type === 'day') {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          ...base,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '6px 4px',
          borderRadius: 8,
          background: stateBackground,
          ...style,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: isToday ? 700 : 400,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: isToday ? toCSS(theme.primary) : 'transparent',
            color: isToday ? '#fff' : isOutOfRange ? toCSS(theme.textMuted) : toCSS(theme.text),
          }}
        >
          {label}
        </span>

        {/* Points indicateurs d'événements (max 3 affichés) */}
        {events.length > 0 && (
          <div style={{ display: 'flex', gap: 2 }}>
            {events.slice(0, 3).map((e, i) => (
              <span
                key={i}
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: e.color ?? toCSS(theme.primary),
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        )}

        {children}
      </div>
    )
  }

  // ── Vue mois ─────────────────────────────────────────────────────
  if (type === 'month') {
    return (
      <div
        className={className}
        onClick={onClick}
        style={{
          ...base,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '10px 12px',
          borderRadius: 10,
          background: stateBackground,
          border: isToday
            ? `1.5px solid ${toCSS(theme.primary)}`
            : `1px solid ${toCSS(theme.border)}`,
          ...style,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: isToday ? 700 : 500,
            ...toTextCSS(isOutOfRange ? theme.textMuted : isToday ? theme.primary : theme.text),
          }}
        >
          {label}
        </span>

        {events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {events.slice(0, 2).map((e) => (
              <div
                key={e.id}
                style={{
                  fontSize: 10,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: e.color
                    ? `${e.color}33`
                    : withAlpha(theme.primary as SolidColor, 0.2),
                  color: e.color ?? toCSS(theme.primary),
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {e._isContinuation ? `↳ ${e.title}` : e.title}
              </div>
            ))}
            {events.length > 2 && (
              <span style={{ fontSize: 10, ...toTextCSS(theme.textMuted) }}>
                +{events.length - 2}
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    )
  }

  // ── Vue année ────────────────────────────────────────────────────
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...base,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '14px 10px',
        borderRadius: 12,
        background: stateBackground,
        border: isToday
          ? `1.5px solid ${toCSS(theme.primary)}`
          : `1px solid ${toCSS(theme.border)}`,
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: isToday ? 700 : 500,
          ...toTextCSS(isToday ? theme.primary : theme.text),
        }}
      >
        {label}
      </span>

      {events.length > 0 && (
        <div style={{ display: 'flex', gap: 3 }}>
          {events.slice(0, 4).map((e, i) => (
            <span
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: e.color ?? toCSS(theme.primary),
              }}
            />
          ))}
        </div>
      )}

      {children}
    </div>
  )
}