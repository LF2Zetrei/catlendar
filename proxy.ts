import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Recompute the expected token the same way the API route does:
// SHA-256(passcode + auth_secret), encoded as hex via Web Crypto (Edge-compatible).
async function expectedToken(): Promise<string> {
  const passcode   = process.env.PASSCODE    ?? ''
  const secret     = process.env.AUTH_SECRET ?? 'catlendar'
  const data       = new TextEncoder().encode(passcode + secret)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token    = request.cookies.get('catlendar-auth')?.value
  const expected = await expectedToken()

  if (!token || token !== expected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
