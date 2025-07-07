import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Remove X-Frame-Options entirely, only set CSP
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.office.com https://*.office365.com https://*.microsoft.com https://ms-world-add-in.vercel.app;"
  );
  return response;
}

// Restrict middleware to only /login_popup route
export const config = { matcher: ['/login_popup'] };
