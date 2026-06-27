// components/ui/DecoBorder.tsx
"use client"
import { CSSProperties, ReactNode, useMemo } from "react"
import { Color, toCSS } from "@/lib/colors"
import { useTheme } from "@/context/ThemeContext"

export type DecoBorderMode = 'regular' | 'random'

export type DecoBorderProps = {
  children?: ReactNode
  mode?: DecoBorderMode
  // Rayon de base de chaque feston en px (dans l'espace normalisé)
  bumpRadius?: number
  // Nombre de festons par côté
  bumpsPerSide?: number
  // true = forme remplie, false = contour seul
  filled?: boolean
  // Couleur de remplissage (filled=true) ou de contour (filled=false)
  color?: Color
  // Couleur du contour quand filled=true (optionnel)
  strokeColor?: Color
  strokeWidth?: number
  // Seed reproductible pour le mode random — même seed = même forme
  // côté SSR et client (pas de mismatch d'hydratation)
  seed?: number
  // Espace entre le bord intérieur du SVG et le contenu enfant
  padding?: number
  className?: string
  style?: CSSProperties
}

// ─── PRNG mulberry32 ─────────────────────────────────────────────────────────
// Même algorithme que NeonSigns et DecoBorder demo — déterministe,
// pas de Math.random() qui causerait un mismatch SSR/client.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── Générateur de chemin SVG ─────────────────────────────────────────────────
// Trace le périmètre dans le sens horaire (haut → droite → bas → gauche).
// Chaque feston = un arc SVG avec sweep=1 (sens horaire), ce qui fait
// bomber la bosse vers l'EXTÉRIEUR du rectangle sur les quatre côtés.
// Validé visuellement dans DecoBorderDemo.html avant d'être porté ici.
function buildPath(
  W: number,
  H: number,
  r: number,
  n: number,
  mode: DecoBorderMode,
  seed: number
): string {
  const rand = mulberry32(seed)
  const R = () => mode === 'random' ? r * (0.4 + rand() * 1.2) : r

  const segH = W / n  // largeur d'un feston horizontal
  const segV = H / n  // hauteur d'un feston vertical

  let d = 'M 0 0'

  // Côté haut : gauche → droite, y=0, sweep=1 → bombe vers y<0
  for (let i = 0; i < n; i++) {
    const fr = R()
    d += ` A ${fr} ${fr} 0 0 1 ${(i + 1) * segH} 0`
  }

  // Côté droit : haut → bas, x=W, sweep=1 → bombe vers x>W
  for (let i = 0; i < n; i++) {
    const fr = R()
    d += ` A ${fr} ${fr} 0 0 1 ${W} ${(i + 1) * segV}`
  }

  // Côté bas : droite → gauche, y=H, sweep=1 → bombe vers y>H
  for (let i = 0; i < n; i++) {
    const fr = R()
    d += ` A ${fr} ${fr} 0 0 1 ${W - (i + 1) * segH} ${H}`
  }

  // Côté gauche : bas → haut, x=0, sweep=1 → bombe vers x<0
  for (let i = 0; i < n; i++) {
    const fr = R()
    d += ` A ${fr} ${fr} 0 0 1 0 ${H - (i + 1) * segV}`
  }

  return d + ' Z'
}

// ─── Composant ────────────────────────────────────────────────────────────────

export const DecoBorder = ({
  children,
  mode = 'regular',
  bumpRadius = 10,
  bumpsPerSide = 6,
  filled = true,
  color,
  strokeColor,
  strokeWidth = 2,
  seed = 42,
  padding = 6,
  className,
  style,
}: DecoBorderProps) => {
  const { theme } = useTheme()

  const fillColor = color ? toCSS(color) : toCSS(theme.primary)
  const strokeCol = strokeColor ? toCSS(strokeColor) : fillColor

  // Espace total autour du contenu = festons + padding demandé.
  // Les festons dépassent de bumpRadius vers l'extérieur, donc le
  // contenu doit être décalé d'autant pour ne pas chevaucher les festons.
  const totalPad = bumpRadius + padding

  // Espace de travail normalisé du SVG. Le composant scale via CSS
  // (width/height 100%) — les valeurs absolues n'ont d'importance que
  // pour le ratio bumpRadius/dimensions qui détermine l'apparence.
  const NW = 200
  const NH = 140

  // Rayon normalisé : proportion du rayon par rapport à la taille
  // d'un segment, pour qu'il soit cohérent quel que soit bumpsPerSide.
  const normalizedR = (NW / bumpsPerSide) * (bumpRadius / (bumpRadius * 2 + 4))

  const path = useMemo(
    () => buildPath(NW, NH, normalizedR, bumpsPerSide, mode, seed),
    [normalizedR, bumpsPerSide, mode, seed]
  )

  // display est 'inline-block' par défaut (usage standalone),
  // mais peut être écrasé via style (ex: display:'block', height:'100%')
  // pour que DecoBorder s'étire dans un conteneur flex/grid.
  const displayMode = (style as CSSProperties & { display?: string })?.display ?? 'inline-block'

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: displayMode,
        padding: totalPad,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        viewBox={`0 0 ${NW} ${NH}`}
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill={filled ? fillColor : 'none'}
          stroke={
            !filled ? strokeCol
            : strokeColor ? strokeCol
            : 'none'
          }
          strokeWidth={strokeWidth}
        />
      </svg>

      {/* height:100% pour que le contenu occupe tout l'espace disponible
          quand DecoBorder est en mode block/flex rather qu'inline */}
      <div style={{ position: 'relative', zIndex: 1, height: '100%', boxSizing: 'border-box' }}>
        {children}
      </div>
    </div>
  )
}