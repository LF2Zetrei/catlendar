// components/ui/Avatar.tsx
"use client"
import { CSSProperties } from "react"
import { useTheme } from "@/context/ThemeContext"
import { toCSS } from "@/lib/colors"

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl'

export type AvatarProps = {
  src?: string
  // Repli textuel si pas d'image (ou si l'image échoue à charger) —
  // typiquement les 1-2 premières lettres du pseudo, comme dans les
  // maquettes du profil CatBut ("PS" sur fond dégradé violet/rose).
  fallback?: string
  size?: AvatarSize
  className?: string
  style?: CSSProperties
}

const SIZE_PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 46, xl: 96 }

export const Avatar = ({ src, fallback, size = 'md', className, style }: AvatarProps) => {
  const { theme } = useTheme()
  const px = SIZE_PX[size]

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: toCSS(theme.primaryGradient),
        color: '#fff',
        fontSize: px * 0.4,
        fontWeight: 500,
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={fallback ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        fallback?.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}