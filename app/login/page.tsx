"use client"
import { CSSProperties, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Nunito, Baloo_2 } from "next/font/google"
import { DecoBorder } from "@/components/decoration/DecorBorder"
import { hex } from "@/lib/colors"

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-nunito' })
const baloo  = Baloo_2({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-baloo' })

const PAGE_BG    = '#f8f2ed'
const DECO_COLOR = '#dbcde9'
const BORDER     = '#c5b0d9'
const TEXT       = '#3d2f4a'
const MUTED      = '#9b8aaa'
const PURPLE     = '#9B6DFF'
const WHITE      = '#ffffff'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (res.ok) {
        router.push(params?.get('from') ?? '/')
      } else {
        setError('Incorrect code, please try again.')
        setCode('')
      }
    } catch {
      setError('Connection error, please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp: CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: `1.5px solid ${BORDER}`,
    borderRadius: 10, background: WHITE,
    fontSize: 18, textAlign: 'center', letterSpacing: 6,
    boxSizing: 'border-box', outline: 'none', color: TEXT,
    fontFamily: 'var(--font-baloo)',
  }

  return (
    <div
      className={`${nunito.variable} ${baloo.variable}`}
      style={{
        minHeight: '100vh', background: PAGE_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-nunito)',
      }}
    >
      <DecoBorder
        filled color={hex(DECO_COLOR)} strokeWidth={0}
        bumpRadius={14} bumpsPerSide={12} mode="random" seed={3} padding={12}
        style={{ width: 360, boxSizing: 'border-box' }}
      >
        <div style={{
          background: WHITE, borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: '28px 24px', gap: 20,
        }}>
          {/* Logo / title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>🐱</div>
            <h1 style={{
              margin: 0, fontSize: 26, fontWeight: 700, color: PURPLE,
              fontFamily: 'var(--font-baloo)',
            }}>CatLendar</h1>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: MUTED }}>
              Enter your access code
            </p>
          </div>

          {/* Code input */}
          <div style={{ width: '100%' }}>
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="••••••"
              autoFocus
              style={inp}
            />
            {error && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#e74c3c', textAlign: 'center' }}>
                {error}
              </p>
            )}
          </div>

          {/* Submit button */}
          <button
            type="button"
            onClick={submit}
            disabled={loading}
            style={{
              width: '100%', padding: '10px 0',
              background: PURPLE, color: WHITE, border: 'none',
              borderRadius: 10, fontSize: 15, fontWeight: 700,
              fontFamily: 'var(--font-baloo)', cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Checking…' : 'Access calendar →'}
          </button>
        </div>
      </DecoBorder>
    </div>
  )
}
