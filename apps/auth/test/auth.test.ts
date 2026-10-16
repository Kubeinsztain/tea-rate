import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { createAuth } from "../src/auth";
import { account as accountTable, user as userTable } from "../src/db/schema";
import {
  cookieHeaderFrom,
  jsonHeaders,
  prepareTestDatabase,
  spyMailSender,
} from "./helpers";

let db: Awaited<ReturnType<typeof prepareTestDatabase>>["db"];
let pool: Awaited<ReturnType<typeof prepareTestDatabase>>["pool"];

beforeAll(async () => {
  const prepared = await prepareTestDatabase();
  db = prepared.db;
  pool = prepared.pool;
}, 30_000);

afterAll(async () => {
  await pool.end();
});

const BASE_URL = "http://localhost:4000";
const WEB_ORIGIN = "http://localhost:3000";
const SECRET = "test-secret-that-is-at-least-32-characters";

/**
 * Better Auth's built-in rate limiting keys buckets by client IP, and sign-in /
 * sign-up are limited to 3 attempts per 10s per IP. Each test issues requests
 * from its own synthetic IP so the buckets never collide across tests.
 */
let ipCounter = 0;
function nextIp() {
  ipCounter += 1;
  return `10.0.0.${ipCounter}`;
}

function withIp(ip: string, extra: Record<string, string> = {}) {
  return { "x-forwarded-for": ip, ...extra };
}

/** Build a fresh auth service (fresh rate limiter + spy sender) per test. */
function makeApp() {
  const spy = spyMailSender();
  const auth = createAuth({
    db,
    baseURL: BASE_URL,
    secret: SECRET,
    mailSender: spy.sender,
    webOrigin: WEB_ORIGIN,
  });
  return { app: createApp(auth), sent: spy.sent, ip: nextIp() };
}

function uniqueEmail(prefix = "user") {
  return `${prefix}-${crypto.randomUUID()}@example.com`;
}

describe("auth service HTTP boundary", () => {
  it("boots and serves Better Auth's handler over HTTP", async () => {
    const { app, ip } = makeApp();
    const res = await app.request("/api/auth/get-session", {
      headers: withIp(ip),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it("signs up a user with a valid email and password", async () => {
    const { app, sent, ip } = makeApp();
    const email = uniqueEmail();
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({
        email,
        password: "correct-horse-battery",
        name: "Ada",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTypeOf("string");
    expect(body.user.email).toBe(email);

    // Sign-up triggers the verification email through the spied sender.
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe(email);
    expect(sent[0]?.subject).toMatch(/verify/i);
  });

  it("rejects a duplicate-email sign-up with a clear error", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    const payload = { email, password: "correct-horse-battery", name: "Ada" };

    const first = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify(payload),
    });
    expect(first.status).toBe(200);

    const second = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify(payload),
    });
    expect(second.status).toBe(422);
    const body = await second.json();
    expect(body.message).toMatch(/already exists/i);
  });

  it("rejects a malformed email", async () => {
    const { app, ip } = makeApp();
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({
        email: "not-an-email",
        password: "correct-horse-battery",
        name: "Ada",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body.message).toMatch(/invalid email/i);
  });

  it("rejects a weak password", async () => {
    const { app, ip } = makeApp();
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({
        email: uniqueEmail(),
        password: "short",
        name: "Ada",
      }),
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(body.message).toMatch(/password/i);
  });

  it("stores passwords hashed, never plaintext", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    const password = "correct-horse-battery";
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password, name: "Ada" }),
    });
    const { user } = await res.json();

    const rows = await db
      .select()
      .from(accountTable)
      .where(eq(accountTable.userId, user.id));

    expect(rows).toHaveLength(1);
    const stored = rows[0]?.password;
    expect(stored).toBeTypeOf("string");
    expect(stored).not.toBe(password);
    expect(stored?.includes(password)).toBe(false);
  });

  it("signs in with correct credentials and sets a cookie", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    const password = "correct-horse-battery";

    await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password, name: "Ada" }),
    });

    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password }),
    });

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("better-auth.session_token");

    const body = await res.json();
    expect(body.token).toBeTypeOf("string");
    expect(body.user.email).toBe(email);
  });

  it("rejects wrong password and unknown email without revealing which field", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({
        email,
        password: "correct-horse-battery",
        name: "Ada",
      }),
    });

    const wrongPassword = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password: "wrong-password-123" }),
    });
    const unknownEmail = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({
        email: uniqueEmail(),
        password: "correct-horse-battery",
      }),
    });

    expect(wrongPassword.status).toBeGreaterThanOrEqual(400);
    expect(unknownEmail.status).toBeGreaterThanOrEqual(400);

    const wrongPasswordBody = await wrongPassword.json();
    const unknownEmailBody = await unknownEmail.json();
    expect(wrongPasswordBody.message).toBe("Invalid email or password");
    expect(unknownEmailBody.message).toBe("Invalid email or password");
  });

  it("returns the session for a valid cookie and none otherwise", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    const password = "correct-horse-battery";

    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password, name: "Ada" }),
    });
    const cookie = cookieHeaderFrom(signUp);

    const withCookie = await app.request("/api/auth/get-session", {
      headers: withIp(ip, { cookie }),
    });
    expect(withCookie.status).toBe(200);
    const sessionBody = await withCookie.json();
    expect(sessionBody.user.email).toBe(email);
    expect(sessionBody.session.userId).toBe(sessionBody.user.id);

    const withoutCookie = await app.request("/api/auth/get-session", {
      headers: withIp(ip),
    });
    expect(withoutCookie.status).toBe(200);
    expect(await withoutCookie.json()).toBeNull();
  });

  it("signs out and ends the session", async () => {
    const { app, ip } = makeApp();
    const email = uniqueEmail();
    const password = "correct-horse-battery";

    const signUp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password, name: "Ada" }),
    });
    const cookie = cookieHeaderFrom(signUp);

    const signOut = await app.request("/api/auth/sign-out", {
      method: "POST",
      headers: withIp(ip, { cookie }),
    });
    expect(signOut.status).toBe(200);

    // The sign-out response clears the session cookie; presenting the cleared
    // cookie yields no session.
    const clearedCookie = cookieHeaderFrom(signOut);
    const after = await app.request("/api/auth/get-session", {
      headers: withIp(ip, { cookie: clearedCookie }),
    });
    expect(await after.json()).toBeNull();
  });

  it("rate-limits sign-in attempts", async () => {
    const { app, ip } = makeApp();
    const statuses: number[] = [];

    for (let i = 0; i < 5; i++) {
      const res = await app.request("/api/auth/sign-in/email", {
        method: "POST",
        headers: withIp(ip, jsonHeaders),
        body: JSON.stringify({
          email: uniqueEmail(),
          password: "correct-horse-battery",
        }),
      });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429);
  });

  it("emails a reset link on password-reset request and lets the user reset", async () => {
    const { app, sent, ip } = makeApp();
    const email = uniqueEmail();
    const oldPassword = "correct-horse-battery";
    const newPassword = "brand-new-password-9";

    await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password: oldPassword, name: "Ada" }),
    });

    // Requesting a reset emails the reset link through the spied transport.
    const request = await app.request("/api/auth/request-password-reset", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email }),
    });
    expect(request.status).toBe(200);

    const resetEmail = sent.find((message) => /reset/i.test(message.subject));
    expect(resetEmail?.to).toBe(email);
    expect(resetEmail?.subject).toMatch(/reset/i);
    expect(resetEmail?.body).toContain(
      `${WEB_ORIGIN}/api/auth/reset-password/`,
    );

    // The reset link carries the token the user needs to set a new password.
    const token = resetEmail?.body.match(/reset-password\/([^?]+)/)?.[1];
    expect(token).toBeTypeOf("string");

    const reset = await app.request("/api/auth/reset-password", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ newPassword, token }),
    });
    expect(reset.status).toBe(200);

    // The old password no longer works; the new one does.
    const oldSignIn = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password: oldPassword }),
    });
    expect(oldSignIn.status).toBeGreaterThanOrEqual(400);

    const newSignIn = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password: newPassword }),
    });
    expect(newSignIn.status).toBe(200);
  });

  it("allows sign-in before verification and verifies via the emailed link", async () => {
    const { app, sent, ip } = makeApp();
    const email = uniqueEmail();
    const password = "correct-horse-battery";

    await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password, name: "Ada" }),
    });

    // Verification is optional: sign-in succeeds before the email is verified.
    const signIn = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: withIp(ip, jsonHeaders),
      body: JSON.stringify({ email, password }),
    });
    expect(signIn.status).toBe(200);

    // The sign-up verification email carries a verify-email link.
    const verificationEmail = sent.find((message) =>
      /verify/i.test(message.subject),
    );
    expect(verificationEmail?.to).toBe(email);
    expect(verificationEmail?.body).toContain(
      `${WEB_ORIGIN}/api/auth/verify-email?token=`,
    );

    const token = new URL(verificationEmail?.body ?? "").searchParams.get(
      "token",
    );
    expect(token).toBeTypeOf("string");

    const verify = await app.request(
      `/api/auth/verify-email?token=${encodeURIComponent(token ?? "")}`,
      { headers: withIp(ip) },
    );
    expect(verify.status).toBe(200);

    // The account is now marked verified in the database.
    const rows = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email));
    expect(rows[0]?.emailVerified).toBe(true);
  });
});
