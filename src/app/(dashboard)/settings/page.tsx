"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Bell, CreditCard, Shield, Trash2, Loader2, CheckCircle, Download,
} from "lucide-react";
import { TwoFactorCard } from "@/components/dashboard/TwoFactorCard";

interface EmailPrefs {
  emailReminders: boolean;
  emailAlerts: boolean;
  emailDigest: boolean;
}

interface ProfileSummary {
  plan: string;
  planExpiresAt: string | null;
  email: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>({
    emailReminders: true,
    emailAlerts: true,
    emailDigest: true,
  });

  useEffect(() => {
    (async () => {
      const [profileRes, prefsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/account/email-preferences"),
      ]);
      const profileJson = await profileRes.json();
      if (profileJson.success && profileJson.data) {
        setProfile({
          plan: profileJson.data.plan,
          planExpiresAt: profileJson.data.planExpiresAt,
          email: profileJson.data.email,
        });
      }
      const prefsJson = await prefsRes.json();
      if (prefsJson.success && prefsJson.data) {
        setEmailPrefs(prefsJson.data);
      }
    })();
  }, []);

  async function updateEmailPref(field: keyof EmailPrefs, value: boolean) {
    setEmailPrefs((prev) => ({ ...prev, [field]: value }));
    await fetch("/api/account/email-preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function changePassword() {
    if (!current || !next) return;
    setPwLoading(true);
    setPwMessage(null);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const json = await res.json();
      if (json.success) {
        setPwMessage("Password updated");
        setCurrent("");
        setNext("");
      } else {
        setPwMessage(json.error?.message ?? "Update failed");
      }
    } finally {
      setPwLoading(false);
    }
  }

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const json = await res.json();
      if (json.success && json.data?.url) {
        window.location.assign(json.data.url);
      } else {
        alert(json.error?.message ?? "No Stripe customer on file");
      }
    } finally {
      setPortalLoading(false);
    }
  }

  async function exportData() {
    setExportLoading(true);
    try {
      const res = await fetch("/api/export?format=json");
      if (!res.ok) {
        alert("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `phdradar-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("This will permanently delete your account and all data. Continue?")) return;
    if (!confirm("Type DELETE to confirm")) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/account/delete", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await signOut({ callbackUrl: "/" });
      } else {
        alert(json.error?.message ?? "Delete failed");
        setDeleteLoading(false);
      }
    } catch {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            title="Follow-up Reminders"
            description="Get reminded to follow up after 14 days"
            checked={emailPrefs.emailReminders}
            onChange={(v) => updateEmailPref("emailReminders", v)}
          />
          <Separator />
          <ToggleRow
            title="Deadline Alerts"
            description="7 days, 3 days, and 1 day before deadline"
            checked={emailPrefs.emailAlerts}
            onChange={(v) => updateEmailPref("emailAlerts", v)}
          />
          <Separator />
          <ToggleRow
            title="Weekly Digest"
            description="Weekly digest of new matching professors"
            checked={emailPrefs.emailDigest}
            onChange={(v) => updateEmailPref("emailDigest", v)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium flex items-center gap-2">
                Current Plan: <Badge>{profile?.plan ?? "FREE"}</Badge>
              </p>
              {profile?.planExpiresAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews {new Date(profile.planExpiresAt).toLocaleDateString()}
                </p>
              )}
              {(!profile || profile.plan === "FREE") && (
                <p className="text-sm text-muted-foreground mt-1">
                  Unlock unlimited searches, AI emails, and paper analysis.
                </p>
              )}
            </div>
            {profile?.plan === "FREE" ? (
              <a href="/pricing">
                <Button>Upgrade</Button>
              </a>
            ) : (
              <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                {portalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Manage Billing
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Change Password</Label>
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <Input
                type="password"
                placeholder="Current password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
              <Input
                type="password"
                placeholder="New password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={changePassword}
              disabled={pwLoading || !current || !next}
            >
              {pwLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Password
            </Button>
            {pwMessage && (
              <p className={`mt-2 text-sm flex items-center gap-1 ${
                pwMessage === "Password updated" ? "text-green-600" : "text-destructive"
              }`}>
                {pwMessage === "Password updated" && <CheckCircle className="h-4 w-4" />}
                {pwMessage}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <TwoFactorCard />

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Export or permanently delete your account and all associated data.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={exportData} disabled={exportLoading}>
              {exportLoading
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Download className="h-4 w-4 mr-2" />}
              Export All Data
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
