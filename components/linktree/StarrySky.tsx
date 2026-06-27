// components/linktree/StarrySky.tsx
"use client"
import { CSSProperties, useEffect, useRef } from "react"

export type StarrySkyProps = {
  count?: number
  className?: string
  style?: CSSProperties
}

export const StarrySky = ({ count = 60, className, style }: StarrySkyProps) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const container = ref.current
    container.innerHTML = ''

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div')
      const size = Math.random() * 2.2 + 1
      const duration = Math.random() * 2.5 + 1.8
      const delay = Math.random() * 2.5

      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        background: #fff;
        border-radius: 50%;
        box-shadow: 0 0 6px 1px rgba(255,255,255,.8);
        animation: catbut-twinkle ${duration}s ease-in-out ${delay}s infinite;
      `
      container.appendChild(star)
    }
  }, [count])

  return (
    <div
      ref={ref}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', ...style }}
      aria-hidden="true"
    />
  )
}