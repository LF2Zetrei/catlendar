import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: Request) {
  const { code } = await req.json().catch(() => ({ code: '' }))

  const expected = process.env.PASSCODE
  if (!expected || typeof code !== 'string') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const a = Buffer.from(code)
  const b = Buffer.from(expected)
  const match = a.length === b.length && timingSafeEqual(a, b)

  if (!match) {
    return NextResponse.json({ error: 'Wrong code' }, { status: 401 })
  }

  const token = hashCode(expected + (process.env.AUTH_SECRET ?? 'catlendar'))

  const res = NextResponse.json({ ok: true })
  res.cookies.set('catlendar-auth', token, {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('catlendar-auth')
  return res
}
