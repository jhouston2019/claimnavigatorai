import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const referralCode = request.cookies.get('referral_code')?.value

  // Track referral for new signups
  if (referralCode && request.nextUrl.pathname === '/api/auth/signup') {
    const response = NextResponse.next()
    response.headers.set('x-referral-code', referralCode)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
