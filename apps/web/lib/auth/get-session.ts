import { env } from "../env";

/** The authenticated user, as reported by the auth service. */
export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name?: string | null;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** A database-backed session resolved by the auth service. */
export interface AuthSession {
  session: {
    id: string;
    userId: string;
    expiresAt: string;
    token?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  user: AuthUser;
}

/**
 * Resolve the current session by forwarding the browser's `Cookie` header to
 * the auth service's `get-session` endpoint. The auth service is the single
 * source of truth for session validity; the web app never verifies sessions
 * itself. Returns `null` when there is no active session.
 *
 * In a server component or server action, pass the whole cookie header:
 *
 * ```ts
 * import { cookies } from "next/headers";
 * const session = await getCurrentSession((await cookies()).toString());
 * ```
 */
export async function getCurrentSession(
  cookieHeader: string | null | undefined,
): Promise<AuthSession | null> {
  const response = await fetch(`${env.AUTH_SERVICE_URL}/api/auth/get-session`, {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as AuthSession | null;
}
