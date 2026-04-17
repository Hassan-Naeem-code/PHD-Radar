"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function OnboardingGate() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/onboarding")) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json.success && json.data && !json.data.onboardingCompleted) {
          router.replace("/onboarding");
        }
      } catch {
        // silent
      }
    })();
    return () => { cancelled = true; };
  }, [pathname, router]);

  return null;
}
