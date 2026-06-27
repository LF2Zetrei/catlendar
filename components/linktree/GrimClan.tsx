// components/linktree/GrimClan.tsx
"use client"
import { CSSProperties, useEffect, useRef, useState } from "react"

export type GrimMember = {
  pseudo: string
  href: string
}

// Membres mockés — à remplacer par les vrais pseudos et URLs Twitch
// quand disponibles.
export const GRIM_MEMBERS: GrimMember[] = [
  { pseudo: 'xDracolichx',    href: 'https://www.twitch.tv/xdracolichx' },
  { pseudo: 'ArleyDino',    href: 'https://twitch.tv/arleydino' },
  { pseudo: 'Pluggatron',  href: 'https://twitch.tv/pluggatron' },
  { pseudo: 'LittleeLemonn',   href: 'https://twitch.tv/littleeLemonn' },
]

export type GrimMemberCardProps = {
  member: GrimMember
  side: 'left' | 'right'
  index: number       // pour décaler verticalement chaque membre
  visible: boolean    // contrôle l'apparition progressive
}

// Un membre du clan — grand texte vertical dans le fond, centré entre
// le bord de l'écran et la carte. Apparition progressive (slide +
// fade depuis le bord) avec un délai qui augmente selon l'index pour
// que les membres arrivent un par un, pas tous en même temps.
export const GrimMemberCard = ({ member, side, index, visible }: GrimMemberCardProps) => {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!visible) { setShow(false); return }
    const t = setTimeout(() => setShow(true), index * 350)
    return () => clearTimeout(t)
  }, [visible, index])

  return (
    <a
      href={member.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        [side]: 0,
        top: `${22 + index * 20}vh`,
        width: 'calc((100vw - min(640px, 100vw)) / 2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textDecoration: 'none',
        zIndex: 6,
        pointerEvents: show ? 'auto' : 'none',
        // Slide depuis le bord + fade in — transition pilotée par show
        opacity: show ? 1 : 0,
        transform: show
          ? 'translateX(0)'
          : side === 'left' ? 'translateX(-40px)' : 'translateX(40px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-grim), cursive',
          fontSize: 'clamp(18px, 2.5vw, 32px)',
          fontWeight: 400,
          color: '#E0E0E0',
          textShadow: '0 0 12px rgba(180,0,0,.7), 0 2px 4px rgba(0,0,0,.9)',
          letterSpacing: 2,
          padding: '12px 0',
          display: 'block',
          textAlign: 'center',
        }}
      >
        {member.pseudo}
      </span>
    </a>
  )
}

export type GrimClanButtonProps = {
  grimMode: boolean
  onToggle: () => void
  src?: string
  style?: CSSProperties
  className?: string
}

// Bouton déclencheur du mode Grim Clan — affiche le logo du clan,
// change d'apparence selon l'état actif/inactif.
export const GrimClanButton = ({ grimMode, onToggle, src, style, className }: GrimClanButtonProps) => {
  return (
    <button
      onClick={onToggle}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '18px 24px',
        borderRadius: 16,
        borderWidth: 1.5,
        borderStyle: 'solid',
        border: `1.5px solid ${grimMode ? 'rgba(180,0,0,.6)' : 'rgba(255,215,245,.35)'}`,
        background: grimMode
          ? 'rgba(40,0,0,.55)'
          : 'rgba(255,255,255,.12)',
        justifyContent: 'flex-start',
        textAlign: 'left',
        backdropFilter: 'blur(6px)',
        cursor: 'pointer',
        color: grimMode ? '#CC3333' : '#ffffff',
        fontFamily: grimMode ? 'var(--font-grim), cursive' : 'inherit',
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: grimMode ? 2 : 0,
        transition: 'all 0.4s ease',
        boxShadow: grimMode ? '0 0 18px rgba(180,0,0,.35)' : 'none',
        ...style,
      }}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Grim Clan"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            objectFit: 'cover',
            filter: grimMode ? 'grayscale(1) brightness(0.6) sepia(1) hue-rotate(-10deg) saturate(3)' : 'none',
            flexShrink: 0,
          }}
        />
      )}
      <span style={{ flex: 1, textAlign: 'left' }}>
        {grimMode ? 'My team' : 'My team'}
      </span>
      <svg width="13" height="13" viewBox="0 0 24 24" fill={grimMode ? '#CC3333' : '#FFB3DE'} style={{ flexShrink: 0 }} aria-hidden="true">
        <path d="M12 21s-7.5-4.6-10.2-9.3C.3 8.8 1.6 5 5.2 4.1c2-.5 4 .3 5.3 2 1.3-1.7 3.3-2.5 5.3-2 3.6.9 4.9 4.7 3.4 7.6C19.5 16.4 12 21 12 21z" />
      </svg>
    </button>
  )
}