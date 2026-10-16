import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import type { Database } from "./db/client";
import * as schema from "./db/schema";
import type { MailSender } from "./mail/sender";

export interface AuthConfig {
  db: Database;
  baseURL: string;
  secret: string;
  mailSender: MailSender;
  /**
   * Public origin of the web app that proxies `/api/auth/*` to this service.
   * User-facing email links (reset, verify) are rewritten to this origin, and
   * it is added to Better Auth's `trustedOrigins` so the proxied `Origin`
   * header (the browser's origin) is accepted during sign-in. Defaults to none.
   */
  webOrigin?: string;
  /**
   * Rate limit rule applied to all auth endpoints. `max` requests per `window`
   * seconds per client IP. Defaults to a permissive 100/minute; tests pass a
   * tighter limit.
   */
  rateLimit?: { window: number; max: number };
}

const WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

/**
 * Rewrite a Better Auth-generated absolute link so it points at the public web
 * origin instead of the internal auth-service origin. Better Auth builds these
 * links from `baseURL` (the internal origin); the web app is the only public
 * surface and proxies `/api/auth/*`, so user-facing links must go through it.
 * Falls back to the original URL when no public origin is configured.
 */
const toPublicUrl = (url: string, webOrigin: string | undefined): string => {
  if (!webOrigin) return url;
  const parsed = new URL(url, webOrigin);
  const publicOrigin = new URL(webOrigin);
  parsed.protocol = publicOrigin.protocol;
  parsed.host = publicOrigin.host;
  return parsed.toString();
};

/**
 * Build a Better Auth instance wired to the auth service's Drizzle database.
 *
 * Email+password only; database-backed sessions (the session cookie is a
 * JWT-signed cache token, but the session of record lives in the database);
 * email verification optional (sign-in works before verification); verification
 * and reset emails flow through the injected `mailSender`, with their links
 * rewritten to the public web origin.
 */
export const createAuth = ({
  db,
  baseURL,
  secret,
  mailSender,
  webOrigin,
  rateLimit,
}: AuthConfig) =>
  betterAuth({
    appName: "tea-rate",
    baseURL,
    secret,
    trustedOrigins: [baseURL, ...(webOrigin ? [webOrigin] : [])],
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      // Verification is optional: an unverified user may still sign in.
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await mailSender.send({
          to: user.email,
          subject: "Reset your password",
          body: toPublicUrl(url, webOrigin),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }) => {
        await mailSender.send({
          to: user.email,
          subject: "Verify your email",
          body: toPublicUrl(url, webOrigin),
        });
      },
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: WEEK_IN_SECONDS,
        strategy: "jwt",
      },
    },
    rateLimit: {
      enabled: true,
      window: rateLimit?.window ?? 60,
      max: rateLimit?.max ?? 100,
    },
  });

export type Auth = ReturnType<typeof createAuth>;
