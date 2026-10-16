import { Hono } from "hono";
import type { Auth } from "./auth";

/**
 * Build the Hono app that hosts Better Auth's handler at `/api/auth/*`.
 * Every HTTP method is forwarded to the handler with the raw `Request`, so
 * Better Auth performs its own method validation and path routing.
 */
export const createApp = (auth: Auth) => {
  const app = new Hono();

  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

  return app;
};
