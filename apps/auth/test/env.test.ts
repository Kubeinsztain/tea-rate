import { afterEach, describe, expect, it, vi } from "vitest";

const VALID_ENV: Record<string, string> = {
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:4000",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/tea_rate_auth",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_USER: "user",
  SMTP_PASS: "pass",
  SMTP_FROM: "no-reply@example.com",
};

async function loadEnvModule() {
  vi.resetModules();
  return import("../src/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth environment validation", () => {
  it("loads when every required variable is present", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    const { env } = await loadEnvModule();
    expect(env.BETTER_AUTH_URL).toBe(VALID_ENV.BETTER_AUTH_URL);
    expect(env.PORT).toBe(4000);
    // WEB_ORIGIN is optional and defaults to the local web app origin.
    expect(env.WEB_ORIGIN).toBe("http://localhost:3000");
    // MAIL_MODE defaults to "console" so a self-hosted deploy needs no SMTP.
    expect(env.MAIL_MODE).toBe("console");
  });

  it("loads without SMTP settings when MAIL_MODE is console (the default)", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      if (!key.startsWith("SMTP_")) {
        vi.stubEnv(key, value);
      }
    }
    const { env } = await loadEnvModule();
    expect(env.MAIL_MODE).toBe("console");
    expect(env.SMTP_HOST).toBeUndefined();
  });

  it("fails fast when MAIL_MODE is neither console nor smtp", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("MAIL_MODE", "carrier-pigeon");
    await expect(loadEnvModule()).rejects.toThrow(/MAIL_MODE/);
  });

  it("fails fast when BETTER_AUTH_SECRET is missing", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BETTER_AUTH_SECRET", "");
    await expect(loadEnvModule()).rejects.toThrow(/BETTER_AUTH_SECRET/);
  });

  it("fails fast when BETTER_AUTH_URL is not a valid URL", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("BETTER_AUTH_URL", "not-a-url");
    await expect(loadEnvModule()).rejects.toThrow(/BETTER_AUTH_URL/);
  });

  it("fails fast when WEB_ORIGIN is not a valid URL", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("WEB_ORIGIN", "not-a-url");
    await expect(loadEnvModule()).rejects.toThrow(/WEB_ORIGIN/);
  });
});
