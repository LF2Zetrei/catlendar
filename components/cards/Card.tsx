'use client'

import { useTheme } from "@/context/ThemeContext"
import { SolidColor, toBorderCSS, toCSS, withAlpha } from "@/lib/colors"
import { Theme } from "@/types/themes"
import { CSSProperties, HTMLAttributes, ReactNode } from "react"

type BaseCardProps = {
  children?: ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  header?: ReactNode
  footer?: ReactNode
  padding?: number | string
  radius?: number | string
  className?: string
  style?: CSSProperties
}

type CSSPropertiesWithVars = CSSProperties & {
  [key: `--${string}`]: string | number
}

function getVariantStyle(variant: NonNullable<CardProps['variant']>, theme: Theme): CSSPropertiesWithVars {
  switch (variant) {
    case 'default':
      return {
        background: toCSS(theme.surface),
        '--card-bg-hover': withAlpha(theme.primary as SolidColor, 0.06),
        ...toBorderCSS(theme.border),
        borderWidth: 1,
        borderStyle: 'solid',
      }
    case 'elevated':
      return {
        background: toCSS(theme.surface),
        '--card-bg-hover': withAlpha(theme.primary as SolidColor, 0.06),
        border: 'none',
        boxShadow: `0 4px 16px ${withAlpha(theme.shadow as SolidColor, 0.2)}, 
                    0 8px 32px ${withAlpha(theme.shadow as SolidColor, 0.1)}`,
      }
    case 'outlined':
      return {
        background: 'transparent',
        '--card-bg-hover': withAlpha(theme.primary as SolidColor, 0.04),
        ...toBorderCSS(theme.primary),
        borderWidth: 1.5,
        borderStyle: 'solid',
      }
    case 'ghost':
      return {
        background: 'transparent',
        '--card-bg-hover': withAlpha(theme.primary as SolidColor, 0.04),
        border: 'none',
      }
  }
}

export type CardProps = BaseCardProps & HTMLAttributes<HTMLElement> & {
  href?: string
  target?: string
  rel?: string
}

export const Card = ({
  children,
  variant = 'default',
  header,
  footer,
  padding,
  radius,
  href,
  className,
  style,
  ...rest
}: CardProps) => {
    const Tag = href ? 'a' as const : 'div' as const
    const { onClick } = rest
    const { theme } = useTheme()
    const combinedStyle: CSSPropertiesWithVars = {
        // styles de base
        padding: padding ?? 20,
        borderRadius: radius ?? 12,
        boxSizing: 'border-box',
        
        // variant
        ...getVariantStyle(variant, theme),
        
        // clickable ?
        cursor: (onClick || href) ? 'pointer' : 'default',
        textDecoration: 'none',  // pour le cas <a>
        display: 'block',
        
        // override utilisateur
        ...style,
    }
    const combinedClassName = [
        'catbut-card',
        (onClick || href) && 'catbut-card-clickable',
        className,
    ].filter(Boolean).join(' ')
    return (
        <Tag
            href={href}
            className={combinedClassName}
            style={combinedStyle as CSSProperties}
            {...rest}
        >
            {header && <div>{header}</div>}
            {children}
            {footer && <div>{footer}</div>}
        </Tag>
    ) 
}