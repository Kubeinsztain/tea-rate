/**
 * Liveness probe. Returns 200 immediately with no database access, so an
 * orchestrator can tell "the process is up" apart from "the app is healthy".
 * Always executes the handler rather than serving a prerendered artifact.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" });
}
