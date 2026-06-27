// components/ui/Modal.tsx
"use client"
import { CSSProperties, ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"
import { useTheme } from "@/context/ThemeContext"
import { toCSS, toBorderCSS, toTextCSS } from "@/lib/colors"

export type ModalSize = 'sm' | 'md' | 'lg' | 'full'

export type ModalProps = {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  size?: ModalSize
  // Ferme au clic sur l'overlay — désactive pour les modals d'action
  // critique (suppression) où un clic accidentel ne doit pas fermer.
  closeOnOverlayClick?: boolean
  className?: string
  style?: CSSProperties
}

const SIZE_WIDTH: Record<ModalSize, number | string> = {
  sm: 360,
  md: 480,
  lg: 680,
  full: '92vw',
}

export const Modal = ({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className,
  style,
}: ModalProps) => {
  const { theme } = useTheme()

  // Échap pour fermer + verrouillage du scroll de fond pendant que le
  // modal est ouvert — deux comportements standard qu'on n'a pas le
  // droit d'oublier pour un composant aussi visible qu'un modal.
  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,10,26,.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000,
      }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={className}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: SIZE_WIDTH[size],
          maxWidth: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: toCSS(theme.surface),
          ...toBorderCSS(theme.border),
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,.4)',
          ...style,
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 22px',
              borderBottom: `1px solid ${toCSS(theme.border)}`,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 500, ...toTextCSS(theme.text) }}>
              {title}
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...toTextCSS(theme.textMuted),
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3L13 13M13 3L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div style={{ padding: 22, overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '16px 22px',
              borderTop: `1px solid ${toCSS(theme.border)}`,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}