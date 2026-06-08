import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If accessing super-admin pages, user MUST have super-admin role
    if (path.startsWith('/super-admin') && token?.role !== 'super-admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // If accessing admin pages, user MUST have admin or super-admin role
    if (path.startsWith('/admin') && token?.role !== 'admin' && token?.role !== 'super-admin') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/super-admin/:path*'],
};
