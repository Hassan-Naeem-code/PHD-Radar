"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Radar, Loader2, CheckCircle, AlertCircle } from "lucide-react";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(json.error?.message ?? "Reset failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
        <span>Missing reset token. Request a new link.</span>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
        <span>Password updated. Redirecting to login…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="newPassword">New password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Update password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
              <h1 className="text-2xl font-bold">Choose a new password</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pick something you don&rsquo;t use anywhere else.
              </p>
            </div>
            <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin" />}>
              <ResetForm />
            </Suspense>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
