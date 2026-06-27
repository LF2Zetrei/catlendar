// components/cards/Blockpad.tsx
"use client"
import { CSSProperties, KeyboardEvent, useRef, useState } from "react"
import { useTheme } from "@/context/ThemeContext"
import { toCSS, toTextCSS, withAlpha, SolidColor } from "@/lib/colors"
import { NotepadTask, UseNotepadReturn } from "@/hooks/useNotepad"

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockpadFoldVariant = 'triangle' | 'clip'
// triangle → coin CSS triangle qui grandit + la page recto se soulève
// clip     → vrai pli géométrique via clip-path CSS animé

export type BlockpadProps = {
  notepad: UseNotepadReturn
  variant?: BlockpadFoldVariant
  width?: number | string
  emptyLines?: number
  // false → le champ d'ajout n'est pas rendu dans le pad,
  // utilisez <BlockpadAddInput> où vous voulez dans la page
  showAddInput?: boolean
  className?: string
  style?: CSSProperties
}


// ─── Sous-composants internes ─────────────────────────────────────────────────

function TaskItem({
  task,
  onToggle,
  onDelete,
  theme,
}: {
  task: NotepadTask
  onToggle: () => void
  onDelete: () => void
  theme: ReturnType<typeof useTheme>['theme']
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '5px 0',
        borderBottom: `1px solid ${withAlpha(theme.border as SolidColor, 0.5)}`,
      }}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: `1.5px solid ${task.completed ? toCSS(theme.success) : toCSS(theme.border)}`,
          background: task.completed ? toCSS(theme.success) : 'transparent',
          flexShrink: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'all 0.15s ease',
        }}
      >
        {task.completed && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: "'Caveat', cursive, system-ui",
          lineHeight: 1.4,
          textDecoration: task.completed ? 'line-through' : 'none',
          ...toTextCSS(task.completed ? theme.textMuted : theme.text),
          transition: 'all 0.2s ease',
        }}
      >
        {task.label}
      </span>

      {/* Supprimer */}
      <button
        type="button"
        onClick={onDelete}
        style={{
          opacity: 0.3,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 14,
          padding: '0 2px',
          ...toTextCSS(theme.textMuted),
        }}
      >
        ×
      </button>
    </div>
  )
}

// Exporté : peut être placé n'importe où dans la page.
// Reçoit notepad.addTask en prop et récupère le thème lui-même.
export function BlockpadAddInput({
  onAdd,
  className,
  style,
}: {
  onAdd: (label: string) => void
  className?: string
  style?: CSSProperties
}) {
  const { theme } = useTheme()
  const [value, setValue] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  const submit = () => {
    if (value.trim()) {
      onAdd(value)
      setValue('')
      ref.current?.focus()
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') submit()
  }

  return (
    <div className={className} style={{ display: 'flex', gap: 6, ...style }}>
      <input
        ref={ref}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={onKey}
        placeholder="Ajouter une tâche…"
        style={{
          flex: 1,
          border: 'none',
          borderBottom: `1.5px solid ${toCSS(theme.primary)}`,
          background: 'transparent',
          fontSize: 13,
          fontFamily: "'Caveat', cursive, system-ui",
          padding: '4px 2px',
          outline: 'none',
          ...toTextCSS(theme.text),
        }}
      />
      <button
        type="button"
        onClick={submit}
        style={{
          border: 'none',
          background: toCSS(theme.primary),
          color: '#fff',
          borderRadius: 6,
          width: 24,
          height: 24,
          cursor: 'pointer',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: 0,
        }}
      >
        +
      </button>
    </div>
  )
}

// ─── Page recto/verso ─────────────────────────────────────────────────────────

function PageContent({
  tasks,
  emptyLines,
  isCompleted,
  notepad,
  theme,
  showAddInput,
}: {
  tasks: NotepadTask[]
  emptyLines: number
  isCompleted: boolean
  notepad: UseNotepadReturn
  theme: ReturnType<typeof useTheme>['theme']
  showAddInput: boolean
}) {
  const paperBg = toCSS(theme.blockpad.paper)

  return (
    <div style={{ padding: '18px 16px 14px', background: paperBg, height: '100%', boxSizing: 'border-box' }}>
      {/* Titre */}
      <p style={{
        margin: '0 0 12px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: isCompleted ? toCSS(theme.success) : toCSS(theme.primary),
      }}>
        {isCompleted ? '✓ Complétées' : '📋 Tâches'}
      </p>

      {/* Liste */}
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => notepad.toggleTask(task.id)}
          onDelete={() => notepad.deleteTask(task.id)}
          theme={theme}
        />
      ))}

      {/* Message vide */}
      {tasks.length === 0 && (
        <p style={{ fontSize: 12, ...toTextCSS(theme.textMuted), fontStyle: 'italic', margin: '8px 0' }}>
          {isCompleted ? 'Aucune tâche complétée' : 'Aucune tâche — ajoutez-en une !'}
        </p>
      )}

      {/* Lignes vides */}
      {!isCompleted && Array.from({ length: emptyLines }).map((_, i) => (
        <div key={i} style={{
          height: 24,
          borderBottom: `1px solid ${withAlpha(theme.border as SolidColor, 0.35)}`,
        }} />
      ))}

      {!isCompleted && showAddInput && (
        <BlockpadAddInput onAdd={notepad.addTask} style={{ marginTop: 10 }} />
      )}
    </div>
  )
}

// ─── Triangle de coin réutilisable ───────────────────────────────────────────

function CornerTriangle({
  onFlip,
  color,
  size = 32,
  title,
}: {
  onFlip: () => void
  color: string
  size?: number
  title: string
}) {
  return (
    <>
      <div
        onClick={onFlip}
        title={title}
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: `0 0 ${size}px ${size}px`,
          borderColor: `transparent transparent ${color} transparent`,
          cursor: 'pointer',
          zIndex: 2,
          filter: 'drop-shadow(-2px -2px 4px rgba(0,0,0,0.2))',
        }}
      />
      <span style={{
        position: 'absolute',
        bottom: 4,
        right: 4,
        fontSize: 10,
        color: '#fff',
        pointerEvents: 'none',
        zIndex: 3,
      }}>
        ↩
      </span>
    </>
  )
}

// ─── Variante A : triangle CSS ────────────────────────────────────────────────
// Structure : verso = position relative (fixe la hauteur du conteneur),
//             recto = position absolute (par-dessus, s'anime vers le haut).
// Le recto pivote autour de son bord supérieur (rotateX) avec perspective
// et backfaceVisibility: hidden → il disparaît dès qu'il dépasse 90°,
// révélant le verso en dessous.

function BlockpadTriangle({
  notepad, width, emptyLines, theme, showAddInput,
}: {
  notepad: UseNotepadReturn
  width: number | string
  emptyLines: number
  theme: ReturnType<typeof useTheme>['theme']
  showAddInput: boolean
}) {

  return (
    <div style={{
      position: 'relative',
      width,
      display: 'inline-block',
      perspective: '900px',
      perspectiveOrigin: '50% 0%',
    }}>
      {/* ─── Verso (position relative → fixe la hauteur du conteneur) ─── */}
      <div style={{
        position: 'relative',
        borderRadius: 4,
        overflow: 'hidden',
        border: `1.5px solid ${toCSS(theme.border)}`,
        boxSizing: 'border-box',
      }}>
        <PageContent
          tasks={notepad.completedTasks}
          emptyLines={0}
          isCompleted
          notepad={notepad}
          theme={theme}
          showAddInput={false}
        />
        <CornerTriangle onFlip={notepad.flip} color={toCSS(theme.primary)} title="Revenir aux tâches" />
      </div>

      {/* ─── Recto (position absolute → par-dessus le verso, se replie) ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 4,
          overflow: 'visible',
          border: `1.5px solid ${toCSS(theme.border)}`,
          boxSizing: 'border-box',
          zIndex: 1,
          transformOrigin: 'top center',
          transform: notepad.isFlipped ? 'rotateX(-135deg)' : 'rotateX(0deg)',
          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.6, 1), box-shadow 0.55s ease',
          boxShadow: notepad.isFlipped
            ? 'none'
            : '2px 4px 12px rgba(0,0,0,0.2)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        <div style={{ borderRadius: 4, overflow: 'hidden', height: '100%' }}>
          <PageContent
            tasks={notepad.tasks}
            emptyLines={emptyLines}
            isCompleted={false}
            notepad={notepad}
            theme={theme}
            showAddInput={showAddInput}
          />
        </div>
        <CornerTriangle onFlip={notepad.flip} color={toCSS(theme.primary)} title="Voir les complétées" />
      </div>
    </div>
  )
}

// ─── Variante B : clip-path sweep horizontal ─────────────────────────────────
// Structure : verso = position relative (fixe la hauteur),
//             recto = position absolute (par-dessus, sweep de droite à gauche).
// Le clip-path réduit progressivement la largeur visible du recto jusqu'à 0,
// révélant le verso en dessous. Le bouton est toujours au-dessus (zIndex 3).

function BlockpadClip({
  notepad, width, emptyLines, theme, showAddInput,
}: {
  notepad: UseNotepadReturn
  width: number | string
  emptyLines: number
  theme: ReturnType<typeof useTheme>['theme']
  showAddInput: boolean
}) {
  const clip = notepad.isFlipped
    ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)'    // recto invisible
    : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' // recto pleine page

  return (
    <div style={{ position: 'relative', width, display: 'inline-block' }}>
      {/* ─── Verso (position relative → fixe la hauteur du conteneur) ─── */}
      <div style={{
        borderRadius: 4,
        overflow: 'hidden',
        border: `1.5px solid ${toCSS(theme.border)}`,
        boxSizing: 'border-box',
      }}>
        <PageContent
          tasks={notepad.completedTasks}
          emptyLines={0}
          isCompleted
          notepad={notepad}
          theme={theme}
          showAddInput={false}
        />
      </div>

      {/* ─── Recto (position absolute → sweep vers la gauche quand isFlipped) ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 4,
          overflow: 'hidden',
          border: `1.5px solid ${toCSS(theme.border)}`,
          boxSizing: 'border-box',
          clipPath: clip,
          transition: 'clip-path 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1,
          boxShadow: notepad.isFlipped ? 'none' : '2px 2px 8px rgba(0,0,0,0.12)',
        }}
      >
        <PageContent
          tasks={notepad.tasks}
          emptyLines={emptyLines}
          isCompleted={false}
          notepad={notepad}
          theme={theme}
          showAddInput={showAddInput}
        />
      </div>

      {/* Bouton toujours visible au-dessus du recto (zIndex 3 > recto zIndex 1) */}
      <div
        onClick={notepad.flip}
        title={notepad.isFlipped ? 'Revenir aux tâches' : 'Voir les complétées'}
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          zIndex: 3,
          cursor: 'pointer',
          background: notepad.isFlipped ? toCSS(theme.success) : toCSS(theme.primary),
          color: '#fff',
          borderRadius: 6,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 500,
          userSelect: 'none',
          transition: 'background 0.3s ease',
        }}
      >
        {notepad.isFlipped ? '↩ retour' : '↪ voir'}
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export const Blockpad = ({
  notepad,
  variant = 'triangle',
  width = 280,
  emptyLines = 4,
  showAddInput = true,
  className,
  style,
}: BlockpadProps) => {
  const { theme } = useTheme()

  return (
    <>
    <BlockpadAddInput onAdd={notepad.addTask}/>
    <div
      className={className}
      style={{
        display: 'inline-block',
        borderLeft: `6px solid ${toCSS(theme.primary)}`,
        borderRadius: '0 4px 4px 0',
        ...style,
      }}
    >
      {variant === 'triangle' ? (
        <BlockpadTriangle notepad={notepad} width={width} emptyLines={emptyLines} theme={theme} showAddInput={showAddInput} />
      ) : (
        <BlockpadClip notepad={notepad} width={width} emptyLines={emptyLines} theme={theme} showAddInput={showAddInput} />
      )}
    </div>
    </>
  )
}
