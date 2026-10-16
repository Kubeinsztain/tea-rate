import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { forwardAuthRequest } from "../lib/auth/forward";

interface RecordedRequest {
  method: string;
  url: string;
  cookie: string | undefined;
}

interface AuthStubOptions {
  body?: unknown;
  status?: number;
  setCookie?: string | undefined;
}

interface AuthStub {
  url: string;
  requests: RecordedRequest[];
  close: () => Promise<void>;
}

const SESSION_BODY = {
  session: { userId: "user-1" },
  user: { id: "user-1", email: "ada@example.com" },
};

/**
 * A minimal stand-in for the auth service. It records every request and echoes
 * a fixed session response (with a `Set-Cookie`) so tests can assert that the
 * proxy forwards the request and passes the cookie through.
 */
function createAuthStub(options: AuthStubOptions = {}): Promise<AuthStub> {
  const requests: RecordedRequest[] = [];
  const server = createServer((req, res) => {
    requests.push({
      method: req.method ?? "",
      url: req.url ?? "",
      cookie: req.headers.cookie,
    });

    const status = options.status ?? 200;
    const body = "body" in options ? options.body : SESSION_BODY;
    const setCookie =
      options.setCookie ??
      "better-auth.session_token=stub-token; HttpOnly; Path=/; SameSite=Lax";

    res.writeHead(status, {
      "content-type": "application/json",
      ...(setCookie ? { "set-cookie": setCookie } : {}),
    });
    res.end(JSON.stringify(body));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        close: () =>
          new Promise((res, rej) =>
            server.close((error) => (error ? rej(error) : res())),
          ),
      });
    });
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("forwardAuthRequest", () => {
  it("forwards the method, path, query, and Cookie header, and returns the auth service's status, body, and Set-Cookie", async () => {
    const stub = await createAuthStub();

    try {
      const request = new Request(
        "http://localhost:3000/api/auth/sign-in/email?redirect=/",
        {
          method: "POST",
          headers: {
            cookie: "better-auth.session_token=abc123",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            email: "ada@example.com",
            password: "correct-horse-battery",
          }),
        },
      );

      const response = await forwardAuthRequest(stub.url, request, [
        "sign-in",
        "email",
      ]);

      expect(stub.requests).toHaveLength(1);
      expect(stub.requests[0]?.method).toBe("POST");
      expect(stub.requests[0]?.url).toBe("/api/auth/sign-in/email?redirect=/");
      expect(stub.requests[0]?.cookie).toContain(
        "better-auth.session_token=abc123",
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain(
        "better-auth.session_token=stub-token",
      );
      const body = (await response.json()) as { user: { email: string } };
      expect(body.user.email).toBe("ada@example.com");
    } finally {
      await stub.close();
    }
  });
});

describe("/api/auth/* proxy route", () => {
  it("forwards a request to the auth service and returns its Set-Cookie", async () => {
    const stub = await createAuthStub();
    vi.stubEnv("AUTH_SERVICE_URL", stub.url);
    vi.resetModules();

    const route = await import("../app/api/auth/[...all]/route");
    const request = new Request(
      "http://localhost:3000/api/auth/sign-in/email",
      {
        method: "POST",
        headers: {
          cookie: "better-auth.session_token=abc123",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "ada@example.com",
          password: "correct-horse-battery",
        }),
      },
    );

    const response = await route.POST(request, {
      params: Promise.resolve({ all: ["sign-in", "email"] }),
    });

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]?.url).toBe("/api/auth/sign-in/email");
    expect(stub.requests[0]?.cookie).toContain(
      "better-auth.session_token=abc123",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "better-auth.session_token=stub-token",
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");

    await stub.close();
  });
});

describe("getCurrentSession", () => {
  it("forwards the cookie to get-session and resolves the current session", async () => {
    const stub = await createAuthStub();
    vi.stubEnv("AUTH_SERVICE_URL", stub.url);
    vi.resetModules();

    const { getCurrentSession } = await import("../lib/auth/get-session");
    const session = await getCurrentSession("better-auth.session_token=abc123");

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]?.url).toBe("/api/auth/get-session");
    expect(stub.requests[0]?.cookie).toContain(
      "better-auth.session_token=abc123",
    );
    expect(session?.user.email).toBe("ada@example.com");

    await stub.close();
  });

  it("resolves null when the auth service reports no active session", async () => {
    const stub = await createAuthStub({ body: null });
    vi.stubEnv("AUTH_SERVICE_URL", stub.url);
    vi.resetModules();

    const { getCurrentSession } = await import("../lib/auth/get-session");
    const session = await getCurrentSession(null);

    expect(stub.requests).toHaveLength(1);
    expect(stub.requests[0]?.cookie).toBeUndefined();
    expect(session).toBeNull();

    await stub.close();
  });
});
