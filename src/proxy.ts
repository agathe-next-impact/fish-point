import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decode } from 'next-auth/jwt';

const MOBILE_JWT_SALT = 'mobile-session-token';

const jwtCache = new Map<string, { payload: { sub: string; email?: string; name?: string }; expiry: number }>();
const JWT_CACHE_TTL = 60 * 1000;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const protectedRoutes = ['/spots/new', '/catches', '/profile', '/my-spots', '/dashboard', '/alerts', '/community/groups'];
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value ||
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/cron/') &&
    !pathname.startsWith('/api/auth/')
  ) {
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const secret = process.env.AUTH_SECRET;

      if (secret) {
        try {
          const cached = jwtCache.get(token);
          let payload: { sub: string; email?: string; name?: string } | null = null;

          if (cached && cached.expiry > Date.now()) {
            payload = cached.payload;
          } else {
            const decoded = await decode({ token, secret, salt: MOBILE_JWT_SALT });
            if (decoded?.sub) {
              payload = { sub: decoded.sub, email: decoded.email ?? undefined, name: decoded.name ?? undefined };
              jwtCache.set(token, { payload, expiry: Date.now() + JWT_CACHE_TTL });
              if (jwtCache.size > 1000) {
                const now = Date.now();
                for (const [key, val] of jwtCache) {
                  if (val.expiry < now) jwtCache.delete(key);
                }
              }
            }
          }

          if (payload?.sub) {
            const requestHeaders = new Headers(request.headers);
            requestHeaders.set('x-mobile-user-id', payload.sub);
            requestHeaders.set('x-mobile-user-email', payload.email || '');
            requestHeaders.set('x-mobile-user-name', payload.name || '');

            return withSecurityHeaders(NextResponse.next({
              request: { headers: requestHeaders },
            }));
          }
        } catch {
          // Route handlers will reject unauthenticated requests via session check.
        }
      }
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

function withSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(self)');
  return response;
}

export const config = {
  matcher: [
    '/spots/new/:path*',
    '/catches/:path*',
    '/profile/:path*',
    '/my-spots/:path*',
    '/dashboard/:path*',
    '/alerts/:path*',
    '/community/groups/:path*',
    '/api/:path*',
  ],
};

