import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth middleware stub — uncomment and configure when adding authentication
export function middleware(request: NextRequest) {
  // TODO: Add auth check here (e.g. Supabase Auth, NextAuth)
  // const session = await getSession(request)
  // if (!session) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
