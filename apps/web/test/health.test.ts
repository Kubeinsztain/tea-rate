import { describe, expect, it } from "vitest";

describe("GET /api/health", () => {
  it("returns 200 with { status: 'ok' }", async () => {
    const route = await import("../app/api/health/route");

    const response = await route.GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
