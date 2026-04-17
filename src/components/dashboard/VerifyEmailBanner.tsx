"use client";

import { useEffect, useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";

export function VerifyEmailBanner() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sentMsg, setSentMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedUntil = localStorage.getItem("verify_banner_dismissed_until");
    if (dismissedUntil && parseInt(dismissedUntil) > Date.now()) {
      setDismissed(true);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (json.success && json.data && !json.data.emailVerified) {
          setShow(true);
          setEmail(json.data.email);
        }
      } catch {
        // silent — banner stays hidden
      }
    })();
  }, []);

  async function resend() {
    setSending(true);
    setSentMsg(null);
    try {
      const res = await fetch("/api/auth/verify-email/send", { method: "POST" });
      const json = await res.json();
      setSentMsg(
        json.success
          ? "Verification email sent. Check your inbox."
          : json.error?.message ?? "Send failed"
      );
    } finally {
      setSending(false);
    }
  }

  function dismiss() {
    const until = Date.now() + 24 * 60 * 60 * 1000;
    localStorage.setItem("verify_banner_dismissed_until", String(until));
    setDismissed(true);
  }

  if (!show || dismissed) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <Mail className="h-4 w-4 text-yellow-700 shrink-0" />
        <span className="text-yellow-800 flex-1">
          {sentMsg ?? (
            <>Please verify your email ({email}) to unlock all features.</>
          )}
        </span>
        {!sentMsg && (
          <button
            onClick={resend}
            disabled={sending}
            className="text-yellow-900 font-medium hover:underline inline-flex items-center gap-1"
          >
            {sending && <Loader2 className="h-3 w-3 animate-spin" />}
            Resend email
          </button>
        )}
        <button
          onClick={dismiss}
          className="text-yellow-700 hover:text-yellow-900"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
