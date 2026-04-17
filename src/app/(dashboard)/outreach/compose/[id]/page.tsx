"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles, Copy, Mail, AlertTriangle, CheckCircle, Loader2, Save, Send,
} from "lucide-react";

type EmailType = "COLD_OUTREACH" | "FOLLOW_UP" | "THANK_YOU" | "MEETING_REQUEST";

interface Professor {
  id: string;
  name: string;
  email: string | null;
  university: { name: string; shortName: string | null };
}

export default function ComposeEmailPage() {
  const params = useParams();
  const professorId = params.id as string;

  const [prof, setProf] = useState<Professor | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailType, setEmailType] = useState<EmailType>("COLD_OUTREACH");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProfessor = useCallback(async () => {
    try {
      const res = await fetch(`/api/professors/${professorId}`);
      const json = await res.json();
      if (json.success) setProf(json.data);
    } finally {
      setLoading(false);
    }
  }, [professorId]);

  useEffect(() => { loadProfessor(); }, [loadProfessor]);

  async function generate() {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/outreach/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professorId, emailType }),
      });
      const json = await res.json();
      if (json.success) {
        setSubject(json.data.subject);
        setBody(json.data.body);
        setTalkingPoints(json.data.talkingPoints ?? []);
      } else {
        setMessage(json.error?.message ?? "Generate failed");
      }
    } catch {
      setMessage("Generate failed");
    } finally {
      setGenerating(false);
    }
  }

  async function saveDraft() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professorId,
          subject,
          body,
          type: emailType,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDraftId(json.data.id);
        setMessage("Draft saved");
      } else {
        setMessage(json.error?.message ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendNow() {
    if (!draftId) {
      setMessage("Save draft first");
      return;
    }
    if (!prof?.email) {
      setMessage("No professor email on file — use Copy or Open in Email Client");
      return;
    }
    if (!confirm(`Send this email to ${prof.email}?`)) return;
    setSending(true);
    try {
      const res = await fetch(`/api/outreach/${draftId}/send`, { method: "POST" });
      const json = await res.json();
      if (json.success) setMessage("Email sent");
      else setMessage(json.error?.message ?? "Send failed");
    } finally {
      setSending(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!prof) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Professor not found.</p>
        </CardContent>
      </Card>
    );
  }

  const mailtoHref = prof.email
    ? `mailto:${prof.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Compose Outreach Email</h1>
        <p className="text-muted-foreground">
          For {prof.name} — {prof.university.name}
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-yellow-800">Add your own voice before sending</p>
          <p className="text-sm text-yellow-700 mt-1">
            AI-generated emails are a starting point. Personalize the content to sound like you.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Email Draft</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={emailType} onValueChange={(v) => v && setEmailType(v as EmailType)}>
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COLD_OUTREACH">Cold Outreach</SelectItem>
                <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                <SelectItem value="THANK_YOU">Thank You</SelectItem>
                <SelectItem value="MEETING_REQUEST">Meeting Request</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={generating} variant="outline" size="sm">
              {generating
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : <Sparkles className="h-4 w-4 mr-2" />}
              AI Generate
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Click AI Generate to start, or write your own..."
            />
          </div>
          <div>
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={16}
              className="font-mono text-sm"
              placeholder="Email content..."
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{body.trim().split(/\s+/).filter(Boolean).length} words</span>
            <Separator orientation="vertical" className="h-4" />
            <span>{body.length} characters</span>
          </div>
        </CardContent>
      </Card>

      {talkingPoints.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Key Talking Points</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {talkingPoints.map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span className="text-sm">{t}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {message && (
        <p className={`text-sm ${message === "Email sent" || message === "Draft saved" ? "text-green-600" : "text-destructive"}`}>
          {message}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={saveDraft}
          disabled={saving || !subject || body.length < 10}
          variant="secondary"
          className="flex-1"
        >
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Draft
        </Button>
        <Button onClick={copy} variant="outline" className="flex-1">
          {copied
            ? <><CheckCircle className="h-4 w-4 mr-2" /> Copied!</>
            : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
        </Button>
        {mailtoHref && (
          <a href={mailtoHref} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full" variant="outline">
              <Mail className="h-4 w-4 mr-2" /> Email Client
            </Button>
          </a>
        )}
        {prof.email && (
          <Button
            onClick={sendNow}
            disabled={sending || !draftId}
            className="flex-1"
          >
            {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Send via PhDRadar
          </Button>
        )}
      </div>
    </div>
  );
}
