import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import type { Auth } from "../src/auth";

/**
 * A stand-in for Better Auth that must never be reached by the health route.
 * It answers `500` so a test that wrongly forwards `/api/health` to the auth
 * handler fails loudly instead of silently returning a plausible response.
 */
const fakeAuth = {
  handler: () => new Response("should not be called", { status: 500 }),
} as unknown as Auth;

describe("GET /api/health", () => {
  it("returns 200 with { status: 'ok' } without touching Better Auth", async () => {
    const app = createApp(fakeAuth);

    const res = await app.request("/api/health");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
