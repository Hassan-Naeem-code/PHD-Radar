"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, Loader2, CheckCircle, AlertCircle } from "lucide-react";

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const hasParams = Boolean(token && email);

  const [state, setState] = useState<"loading" | "success" | "error">(
    hasParams ? "loading" : "error"
  );
  const [message, setMessage] = useState<string>(
    hasParams ? "" : "Missing verification parameters"
  );

  useEffect(() => {
    if (!hasParams) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/verify-email/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (json.success) {
          setState("success");
          setTimeout(() => router.push("/dashboard"), 2000);
        } else {
          setState("error");
          setMessage(json.error?.message ?? "Verification failed");
        }
      } catch {
        if (cancelled) return;
        setState("error");
        setMessage("Network error");
      }
    })();
    return () => { cancelled = true; };
  }, [hasParams, token, email, router]);

  if (state === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verifying your email…
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <span>Email verified! Redirecting to dashboard…</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
      <Link href="/login">
        <Button variant="outline" className="w-full">Back to login</Button>
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Radar className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">PhDRadar</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold">Verify your email</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Confirming your email address…
              </p>
            </div>
            <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
              <VerifyInner />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
