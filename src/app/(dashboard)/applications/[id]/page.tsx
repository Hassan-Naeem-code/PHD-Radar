"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Circle, ExternalLink, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Application {
  id: string;
  universityName: string;
  program: string;
  term: string;
  status: string;
  deadline: string | null;
  portalUrl: string | null;
  notes: string | null;
  sopUploaded: boolean;
  cvUploaded: boolean;
  transcriptsUploaded: boolean;
  recsRequested: number;
  recsReceived: number;
  toeflSent: boolean;
}

const ALL_STATUSES = [
  "RESEARCHING", "IN_PROGRESS", "SUBMITTED", "UNDER_REVIEW",
  "ADMITTED_FUNDED", "ADMITTED_UNFUNDED", "WAITLISTED",
  "REJECTED", "WITHDRAWN", "ACCEPTED_OFFER",
] as const;

const STATUS_LABELS: Record<string, string> = {
  RESEARCHING: "Researching",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  ADMITTED_FUNDED: "Admitted (Funded)",
  ADMITTED_UNFUNDED: "Admitted (Unfunded)",
  WAITLISTED: "Waitlisted",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  ACCEPTED_OFFER: "Accepted Offer",
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/applications/${id}`);
        const json = await res.json();
        if (json.success) {
          setApp(json.data);
          setNotes(json.data.notes ?? "");
        } else {
          setError(json.error?.message ?? "Application not found");
        }
      } catch {
        setError("Failed to load application");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function patch(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) setApp(json.data);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <p className="text-muted-foreground">{error ?? "Application not found"}</p>
        <Link href="/applications">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Applications
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{app.universityName}</h1>
          <p className="text-muted-foreground">{app.program} — {app.term}</p>
        </div>
        <Link href="/applications">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <Label>Status</Label>
            <Select
              value={app.status}
              onValueChange={(v) => v && patch({ status: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={app.deadline ? app.deadline.slice(0, 10) : ""}
              onChange={(e) => patch({ deadline: e.target.value || null })}
              className="mt-1"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Document Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <ChecklistItem
            label="Statement of Purpose"
            done={app.sopUploaded}
            onToggle={() => patch({ sopUploaded: !app.sopUploaded })}
          />
          <ChecklistItem
            label="CV / Resume"
            done={app.cvUploaded}
            onToggle={() => patch({ cvUploaded: !app.cvUploaded })}
          />
          <ChecklistItem
            label="Transcripts"
            done={app.transcriptsUploaded}
            onToggle={() => patch({ transcriptsUploaded: !app.transcriptsUploaded })}
          />
          <ChecklistItem
            label="TOEFL Score Sent"
            done={app.toeflSent}
            onToggle={() => patch({ toeflSent: !app.toeflSent })}
          />
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Recommendation Letters</span>
            <Badge variant="secondary">{app.recsReceived} of {app.recsRequested || 3} received</Badge>
          </div>
          <div className="flex gap-2 ml-4">
            <div>
              <Label className="text-xs">Requested</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={app.recsRequested}
                onChange={(e) => patch({ recsRequested: parseInt(e.target.value) || 0 })}
                className="w-20 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Received</Label>
              <Input
                type="number"
                min={0}
                max={10}
                value={app.recsReceived}
                onChange={(e) => patch({ recsReceived: parseInt(e.target.value) || 0 })}
                className="w-20 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {app.portalUrl && (
        <Card>
          <CardHeader><CardTitle>Application Portal</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={app.portalUrl} readOnly className="flex-1" />
              <a href={app.portalUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this application..."
          />
          <Button
            size="sm"
            className="mt-3"
            onClick={() => patch({ notes })}
            disabled={saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Notes
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        size="sm"
        onClick={async () => {
          if (!confirm("Delete this application?")) return;
          await fetch(`/api/applications/${id}`, { method: "DELETE" });
          router.push("/applications");
        }}
      >
        Delete Application
      </Button>
    </div>
  );
}

function ChecklistItem({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} className="flex items-center gap-2 w-full text-left">
      {done ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={`text-sm ${done ? "" : "text-muted-foreground"}`}>{label}</span>
    </button>
  );
}
