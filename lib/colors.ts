import { CSSProperties } from "react"

//include hexadecimal, string and gradient
type GradientType = LinearType | RadialType | ConicType

type LinearType = {
    type: 'linear'
    direction: number | 'to right' | 'to left' | 'to top' | 'to bottom' | 'to top right' | 'to bottom left' | 'to top left' | 'to bottom right'
}

type RadialType = {
    type: 'radial'
    shape: "circle" | "ellipse"
    size?: string
    position: string
}

type ConicType = {
    type: 'conic'
    angle?: number
    position: string
}

type ColorStop = {
    color: string
    position?: number // %
    positionEnd?: number
}

export type SolidColor = {
    type: 'hex' | 'named'
    value: string
}

type GradientColor = {
    type: 'gradient'
    gradient: GradientType
    stops: ColorStop[]
    repeating?: boolean
}

function stopToCSS(stop: ColorStop): string {
    
    let result = stop.color
    if (stop.position !== undefined) {
        result += ` ${stop.position}%`
    }
    if (stop.positionEnd !== undefined) {
        result += ` ${stop.positionEnd}%`
    }
    return result
}

export function hex(value: string): SolidColor {
  return { type: 'hex', value }
}

export function named(value: string): SolidColor {
  return { type: 'named', value }
}

export function linearGradient(
    direction: LinearType['direction'],
    stops: (string | ColorStop)[],  // accepte strings simples ou ColorStop complets
    repeating?: boolean
    ): GradientColor {
    return {
        type: 'gradient',
        gradient: { type: 'linear', direction },
        stops: stops.map(s => typeof s === 'string' ? { color: s } : s),
        repeating
    }
}

export function radialGradient(
    shape: RadialType['shape'],
    position: string,
    stops: (string | ColorStop)[],
    size?: string,
    repeating?: boolean
    ): GradientColor {
    return {
        type: 'gradient',
        gradient: { type: 'radial', shape, position, size },
        stops: stops.map(s => typeof s === 'string' ? { color: s } : s),
        repeating
    }
}

export function conicGradient(
    position: string,
    stops: (string | ColorStop)[],
    angle?: number,
    repeating?: boolean
    ): GradientColor {
    return {
        type: 'gradient',
        gradient: {type: 'conic', position, angle},
        stops: stops.map(s => typeof s === 'string' ? {color: s} : s),
        repeating
    }
}

export function gradientTextStyle(color: GradientColor): CSSProperties {
  return {
    background: toCSS(color),
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  }
}

export function withAlpha(color: SolidColor, alpha: number): string {
  if (color.type === 'named') {
    // pas de conversion possible sans table → fallback color-mix
    return `color-mix(in srgb, ${color.value} ${Math.round(alpha * 100)}%, transparent)`
  }
  
  const hex = color.value.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export type Color = SolidColor | GradientColor

// Retourne les propriétés CSS pour coloriser du texte.
// Solid → color. Gradient → background-clip: text (ne pas oublier de mettre une font-size).
export function toTextCSS(color: Color): CSSProperties {
    if (color.type === 'hex' || color.type === 'named') {
        return { color: color.value }
    }
    return {
        background: toCSS(color),
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
    }
}

// Retourne les propriétés CSS pour coloriser une bordure.
// Solid → borderColor. Gradient → borderImage (attention : border-radius ignoré avec border-image).
export function toBorderCSS(color: Color): CSSProperties {
    if (color.type === 'hex' || color.type === 'named') {
        return { borderColor: color.value }
    }
    return {
        borderImage: `${toCSS(color)} 1`,
    }
}

export function toCSS(color: Color): string {
    if (color.type === 'hex' || color.type === 'named') {
        return `${color.value}`
    }

    if (color.type === 'gradient') {
        const type = color.gradient.type
        const stopsCSS = color.stops.map(stopToCSS).join(', ')
        const prefix = color.repeating 
            ? `repeating-${type}-gradient`
            : `${type}-gradient`
        let params = ''
        switch (type) {
            case 'linear': {
                const g = color.gradient as LinearType
                // direction peut être un number (120) ou un string ("to right")
                const dir = typeof g.direction === 'number' 
                    ? `${g.direction}deg` 
                    : g.direction
                params = `${dir}, ${stopsCSS}`
                break
            }
            case 'conic': {
                const g = color.gradient as ConicType
                // "from Xdeg at position, stops"
                // angle est optionnel — que mets-tu si undefined ?
                const from = g.angle !== undefined ? `from ${g.angle}deg` : ''
                const at = `at ${g.position}`
                params = `${from} ${at}, ${stopsCSS}`
                break
            }
            case 'radial': {
                const g = color.gradient as RadialType
                // "circle farthest-corner at center, stops"
                // shape est requis, size est optionnel, position est requis
                const size = g.size ? ` ${g.size}` : ''
                params = `${g.shape}${size} at ${g.position}, ${stopsCSS}`
                break
            }
        }
        return `${prefix}(${params})`
    }
    return ''
}