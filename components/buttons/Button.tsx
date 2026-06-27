"use client"

import { useTheme } from "@/context/ThemeContext"
import { toBorderCSS, toCSS, toTextCSS, SolidColor, withAlpha } from "@/lib/colors"
import { getIcon, IconName } from "@/lib/icons"
import { Theme } from "@/types/themes"
import { CSSProperties, HTMLAttributes, ReactNode, createElement } from "react"

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'icon' | 'glass'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

type BaseButtonProps = {
    children?: ReactNode
    variant?: ButtonVariant
    size?: ButtonSize
    icon?: IconName
    iconPosition?: 'left' | 'right'
    isLoading?: boolean
    className?: string
    style?: CSSProperties
}

export type ButtonProps = BaseButtonProps & HTMLAttributes<HTMLElement> & {
    href?: string
    target?: string
    rel?: string
    disabled?: boolean
}

type CSSPropertiesWithVars = CSSProperties & {
  [key: `--${string}`]: string | number
}

const sizeStyles: Record<ButtonSize, CSSProperties> = {
    sm: { padding: '6px 14px', fontSize: 11 },
    md: { padding: '9px 18px', fontSize: 13 },
    lg: { padding: '11px 24px', fontSize: 14 },
    xl: { padding: '13px 30px', fontSize: 16 },
}

const iconSizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { width: 28, height: 28 },
  md: { width: 36, height: 36 },
  lg: { width: 44, height: 44 },
  xl: { width: 52, height: 52 },
}

function getVariantStyle(variant: ButtonVariant, theme: Theme): CSSPropertiesWithVars {
    switch (variant) {
        case 'primary':
        return {
            backgroundImage: toCSS(theme.primaryGradient),
            backgroundSize: '200% 200%',
            backgroundPosition: '0% 50%',
            color: '#ffffff',
            border: 'none',
        }
        case 'secondary':
        return {
            '--btn-bg': toCSS(theme.surfaceAlt),
            '--btn-bg-hover': withAlpha(theme.surfaceAlt as SolidColor, 0.45),
            ...toTextCSS(theme.text),
            border: 'none',
        }
        case 'ghost':
        return {
            '--btn-bg': 'transparent',
            '--btn-bg-hover': withAlpha(theme.textMuted as SolidColor, 0.08),
            ...toTextCSS(theme.textMuted),
            border: 'none',
        }
        case 'outline':
        return {
            '--btn-bg': 'transparent',
            '--btn-bg-hover': withAlpha(theme.primary as SolidColor, 0.1),
            ...toTextCSS(theme.primary),
            ...toBorderCSS(theme.primary),
            borderWidth: 1.5,
            borderStyle: 'solid',
        }
        case 'danger':
        return {
            '--btn-bg': 'transparent',
            '--btn-bg-hover': withAlpha(theme.danger as SolidColor, 0.1),
            ...toTextCSS(theme.danger),
            ...toBorderCSS(theme.danger),
            borderWidth: 1.5,
            borderStyle: 'solid',
        }
        case 'icon':
        return {
            '--btn-bg': toCSS(theme.surfaceAlt),
            '--btn-bg-hover': withAlpha(theme.surfaceAlt as SolidColor, 0.12),
            ...toTextCSS(theme.text),
            border: 'none',
        }
        case 'glass':
          return {
            '--btn-bg':       withAlpha(theme.glassBg as SolidColor, 0.12),
            '--btn-bg-hover': withAlpha(theme.glassBg as SolidColor, 0.22),
            color:            toCSS(theme.glassText),
            borderColor:      withAlpha(theme.glassBorder as SolidColor, 0.35),
            borderWidth:      1.5,
            borderStyle:      'solid',
          }
    }
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className,
  disabled,
  style,
  href,
  ...rest
}: ButtonProps) => {
  const { theme } = useTheme()
  const Icon = icon ? getIcon(icon) : null
  const Tag = href ? 'a' as const : 'button' as const

  const combinedClassName = [
    'catbut-btn',
    variant === 'primary' && 'catbut-btn-primary',
    variant === 'glass' && 'catbut-btn-glass',
    className,
  ].filter(Boolean).join(' ')

  const combinedStyle: CSSPropertiesWithVars = {
    ...(variant === 'icon' ? iconSizeStyles[size] : sizeStyles[size]),
    ...getVariantStyle(variant, theme),
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: variant === 'icon' ? 0 : 8,
    borderRadius: variant === 'icon' ? '50%' : variant === 'glass' ? 18 : 8,
    fontWeight: variant === 'glass' ? 600 : 500,
    textDecoration: 'none',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    ...style,
  }

  const isDisabled = disabled || isLoading

  return (
    <Tag
      href={href}
      disabled={!href ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      onClick={href && isDisabled ? (e: React.MouseEvent) => e.preventDefault() : undefined}
      className={combinedClassName}
      style={combinedStyle}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
      ) : (
        <>
          {Icon && iconPosition === 'left' && createElement(Icon, { size: size === 'sm' ? 14 : 16 })}
          {children}
          {Icon && iconPosition === 'right' && createElement(Icon, { size: size === 'sm' ? 14 : 16 })}
        </>
      )}
    </Tag>
  )
}