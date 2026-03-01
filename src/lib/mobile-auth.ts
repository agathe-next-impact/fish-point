import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/**
 * Unified auth helper that works for both web (cookie) and mobile (Bearer token) sessions.
 *
 * The middleware decodes the mobile JWT and forwards user identity via request headers:
 *   - x-mobile-user-id
 *   - x-mobile-user-email
 *   - x-mobile-user-name
 *
 * This function first tries NextAuth's `auth()` (cookie-based).
 * If no session is found, it falls back to the mobile headers set by the middleware.
 *
 * Usage in route handlers:
 *   const session = await getServerSession();
 *   if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 */
export async function getServerSession() {
  // Try cookie-based auth first (web app)
  const session = await auth();

  if (session?.user?.id) {
    return session;
  }

  // Fall back to mobile Bearer token auth (headers set by middleware)
  const headersList = await headers();
  const mobileUserId = headersList.get('x-mobile-user-id');

  if (mobileUserId) {
    return {
      user: {
        id: mobileUserId,
        email: headersList.get('x-mobile-user-email') ?? undefined,
        name: headersList.get('x-mobile-user-name') ?? undefined,
      },
      expires: '', // Not applicable for mobile tokens (handled at JWT level)
    };
  }

  return null;
}
