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

  it("fails fast when a required SMTP setting is missing", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("SMTP_HOST", "");
    await expect(loadEnvModule()).rejects.toThrow(/SMTP_HOST/);
  });
});
