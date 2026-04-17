import posthog from "posthog-js";

let initialized = false;

export function initPostHog() {
  if (
    typeof window !== "undefined" &&
    !initialized &&
    process.env.NEXT_PUBLIC_POSTHOG_KEY
  ) {
    const consent = localStorage.getItem("phdradar-cookie-consent");
    if (consent !== "accepted") return;

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "https://app.posthog.com",
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.opt_out_capturing();
      },
    });
    initialized = true;
  }
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && initialized) {
    posthog.capture(event, properties);
  }
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window !== "undefined" && initialized) {
    posthog.identify(userId, traits);
  }
}

// Pre-defined event names
export const EVENTS = {
  USER_SIGNED_UP: "user_signed_up",
  ONBOARDING_COMPLETED: "onboarding_completed",
  PROFESSOR_SEARCHED: "professor_searched",
  PROFESSOR_SAVED: "professor_saved",
  EMAIL_GENERATED: "email_generated",
  EMAIL_COPIED: "email_copied",
  APPLICATION_CREATED: "application_created",
  APPLICATION_STATUS_CHANGED: "application_status_changed",
  SUBSCRIPTION_UPGRADED: "subscription_upgraded",
  SUBSCRIPTION_CANCELLED: "subscription_cancelled",
} as const;
