import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'ALLOWALL');
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.office.com https://*.office365.com https://*.microsoft.com https://ms-world-add-in.vercel.app;"
  );
  return response;
}

// Uncomment below to restrict to only certain routes:
// export const config = { matcher: ['/login_popup', '/(your-other-routes)'] };
