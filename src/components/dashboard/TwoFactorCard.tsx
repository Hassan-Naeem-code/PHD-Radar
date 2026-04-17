"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";

interface SetupPayload {
  secret: string;
  otpauth: string;
  qrCodeUrl: string;
}

export function TwoFactorCard() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (json.success) {
        setEnabled(Boolean((json.data as { twoFactorEnabled?: boolean }).twoFactorEnabled));
      }
    } catch {
      setEnabled(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/setup", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setSetup(json.data);
      } else {
        setError(json.error?.message ?? "Setup failed");
      }
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnable() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: code }),
      });
      const json = await res.json();
      if (json.success) {
        setBackupCodes(json.data.backupCodes);
        setEnabled(true);
        setSetup(null);
        setCode("");
      } else {
        setError(json.error?.message ?? "Invalid code");
      }
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    if (!confirm("Disable 2FA on your account?")) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, token: disableCode }),
      });
      const json = await res.json();
      if (json.success) {
        setEnabled(false);
        setBackupCodes(null);
        setDisableCode("");
        setDisablePassword("");
      } else {
        setError(json.error?.message ?? "Disable failed");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" /> Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {enabled === null ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : enabled ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-sm">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-800">2FA is active</p>
                <p className="text-green-700 text-xs mt-0.5">
                  You&rsquo;ll be asked for a 6-digit code from your authenticator app at
                  every login.
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                type="password"
                placeholder="Current password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
              <Input
                placeholder="6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={disable}
              disabled={loading || disablePassword.length < 1 || disableCode.length !== 6}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Disable 2FA
            </Button>
          </div>
        ) : setup ? (
          <div className="space-y-3">
            <p className="text-sm">
              Scan the QR code with your authenticator app (Google Authenticator, 1Password, Authy),
              then enter the 6-digit code below to finish.
            </p>
            <div className="flex items-center justify-center">
              <Image
                src={setup.qrCodeUrl}
                alt="2FA QR code"
                width={200}
                height={200}
                unoptimized
                className="rounded-md border"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Can&rsquo;t scan? Enter this secret manually:
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                  {setup.secret}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(setup.secret)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label>6-digit code</Label>
              <Input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={confirmEnable}
                disabled={loading || code.length !== 6}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Enable 2FA
              </Button>
              <Button variant="ghost" onClick={() => { setSetup(null); setCode(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add a second layer of security to your account with a time-based code from an authenticator app.
            </p>
            <Button onClick={startSetup} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enable 2FA
            </Button>
          </div>
        )}

        {backupCodes && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              Save these backup codes somewhere safe
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Each code can be used once if you lose access to your authenticator.
              You won&rsquo;t see them again.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs">
              {backupCodes.map((c) => (
                <code key={c} className="bg-white px-2 py-1 rounded border">{c}</code>
              ))}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => {
                navigator.clipboard.writeText(backupCodes.join("\n"));
              }}
            >
              <Copy className="h-3 w-3 mr-1" /> Copy all
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-2 rounded-md bg-red-50 border border-red-200 text-sm">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
