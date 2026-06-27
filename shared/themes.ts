import { hex, linearGradient, radialGradient } from "@/lib/colors"
import { Theme, ThemeName } from "@/types/themes"

export const normal: Theme = {
  primary:         hex('#9B6DFF'),
  primaryGradient: linearGradient(120, ['#9B6DFF', '#FF6EC7']),
  surface:         hex('#1A1232'),
  surfaceAlt:      hex('#130E28'),
  text:            hex('#F0EBFF'),
  textMuted:       hex('#8A7FA8'),
  border:          hex('#9B6DFF'),
  shadow:          hex('#9B6DFF'),
  danger:          hex('#FF4D5A'),
  success:         hex('#22c55e'),
  glassBg:         hex('#ffffff'),
  glassBorder:     hex('#FFD2F5'),
  glassText:       hex('#ffffff'),
  blockpad: {
    paper:         hex('#1E1A2E'),  // papier sombre pour le thème normal (dark)
  },
  linktree: {
    cardBackground: radialGradient('circle', 'center', ['#de84cb', '#b166c0', '#8b51b7']),
    avatarRing:     linearGradient(135, ['#FFD6F0', '#C9A2FF']),
    avatarShadow:   hex('#D896FF'),
    text:           hex('#ffffff'),
    heartAccent:    hex('#FFB3DE'),
    pageBg:         hex('#1A1130'),
  },
}

export const themes: Record<ThemeName, Theme> = {normal}
