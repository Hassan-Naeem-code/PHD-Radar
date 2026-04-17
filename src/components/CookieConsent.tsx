"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const CONSENT_KEY = "phdradar-cookie-consent";

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function readConsent() {
  if (typeof window === "undefined") return "pending";
  return localStorage.getItem(CONSENT_KEY) ?? "pending";
}

export function CookieConsent() {
  const consent = useSyncExternalStore(
    subscribeToStorage,
    readConsent,
    () => "pending"
  );
  const [dismissed, setDismissed] = useState(false);
  const visible = consent === "pending" && !dismissed;

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setDismissed(true);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t shadow-lg p-4 sm:p-6" role="dialog" aria-label="Cookie consent">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium">We use cookies</p>
          <p className="text-xs text-muted-foreground mt-1">
            We use essential cookies for authentication and optional analytics cookies (PostHog) to improve our service.
            See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>
            Decline
          </Button>
          <Button size="sm" onClick={accept}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
