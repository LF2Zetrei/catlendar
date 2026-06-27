import { Color } from "@/lib/colors"

export type ThemeName = 'normal'

export type Theme = {
  primary:         Color
  primaryGradient: Color
  surface:         Color
  surfaceAlt:      Color
  text:            Color
  textMuted:       Color
  border:          Color
  shadow:          Color
  danger:          Color
  success:         Color
  glassBg:         Color
  glassBorder:     Color
  glassText:       Color
  blockpad: {
    paper: Color   // couleur du papier (adapté au thème clair/sombre)
  }
  linktree: {
    cardBackground: Color
    avatarRing:     Color
    avatarShadow:   Color
    text:           Color
    heartAccent:    Color
    pageBg:         Color
  }
}
