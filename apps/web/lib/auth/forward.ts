/**
 * Hop-by-hop headers that must not be forwarded to the auth service. `fetch`
 * recomputes `content-length` and the connection-scoped headers itself.
 */
const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

/**
 * Forward an incoming `/api/auth/*` request to the auth service and return its
 * response unchanged — status, body, and `Set-Cookie` — so the browser talks
 * to the auth service at the web app's origin and the web app owns the httpOnly
 * session cookie.
 */
export async function forwardAuthRequest(
  baseUrl: string,
  request: Request,
  authPath: string[],
): Promise<Response> {
  const target = new URL(
    `/api/auth/${authPath.map(encodeURIComponent).join("/")}`,
    baseUrl,
  );
  target.search = new URL(request.url).search;

  const headers = new Headers();
  for (const [name, value] of request.headers) {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      headers.append(name, value);
    }
  }

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
    // Node's fetch requires `duplex: "half"` when streaming a request body.
    init.body = request.body;
    init.duplex = "half";
  }

  return fetch(target, init);
}
