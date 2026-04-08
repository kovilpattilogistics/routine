import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Extract the custom authorization cookie
  const isAuth = request.cookies.has('auth_session');
  
  const { pathname } = request.nextUrl;

  // Root landing page logic
  if (pathname === '/') {
    if (isAuth) {
      // Instantly push logged-in users to planner without any client rendering flash
      return NextResponse.redirect(new URL('/planner', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  // Only execute middleware on the root path
  matcher: ['/'],
};
