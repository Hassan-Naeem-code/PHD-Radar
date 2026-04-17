export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Validate env vars early — throws with clear message on misconfiguration
    await import("./lib/env");
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
