import { forwardAuthRequest } from "../../../../lib/auth/forward";
import { env } from "../../../../lib/env";

/**
 * Proxy every method and path under `/api/auth/*` to the internal auth service.
 * The response (status, body, and `Set-Cookie`) is returned unchanged, so the
 * browser sees auth at the web app's origin and the web app owns the httpOnly
 * session cookie.
 */
export const dynamic = "force-dynamic";

type AuthRouteContext = {
  params: Promise<{ all: string[] }>;
};

async function forward(
  request: Request,
  context: AuthRouteContext,
): Promise<Response> {
  const { all } = await context.params;
  return forwardAuthRequest(env.AUTH_SERVICE_URL, request, all);
}

export function GET(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function POST(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function PUT(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function PATCH(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function DELETE(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function HEAD(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}

export function OPTIONS(request: Request, context: AuthRouteContext) {
  return forward(request, context);
}
